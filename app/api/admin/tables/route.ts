import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// 1. OBTENER LISTA DE MESAS (SOLO PARA ADMIN)
export async function GET(request: Request) {
  try {
    const tenantSlug = request.headers.get('x-tenant-slug') || 'barpaco';
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Restaurante no encontrado.' }, { status: 404 });
    }

    const tables = await prisma.table.findMany({
      where: { tenantId: tenant.id },
      orderBy: { number: 'asc' },
    });

    return NextResponse.json({ success: true, tables }, { status: 200 });
  } catch (error: any) {
    console.error('Error en admin GET tables:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. CREAR UNA NUEVA MESA
export async function POST(request: Request) {
  try {
    const tenantSlug = request.headers.get('x-tenant-slug') || 'barpaco';
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Restaurante no encontrado.' }, { status: 404 });
    }

    const body = await request.json();
    const { number } = body;

    const tableNumber = parseInt(number, 10);

    if (isNaN(tableNumber) || tableNumber <= 0) {
      return NextResponse.json({ success: false, error: 'El número de mesa debe ser un entero positivo.' }, { status: 400 });
    }

    // Verificar si el número de mesa ya está ocupado en este restaurante
    const existing = await prisma.table.findFirst({
      where: { tenantId: tenant.id, number: tableNumber }
    });

    if (existing) {
      return NextResponse.json({ success: false, error: `La Mesa #${tableNumber} ya existe en tu local.` }, { status: 400 });
    }

    const table = await prisma.table.create({
      data: {
        number: tableNumber,
        status: 'FREE',
        tenantId: tenant.id,
      },
    });

    return NextResponse.json({ success: true, table }, { status: 201 });
  } catch (error: any) {
    console.error('Error en admin POST table:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
