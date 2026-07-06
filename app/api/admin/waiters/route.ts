import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// 1. OBTENER LISTA DE CAMAREROS CON SU PIN (SOLO PARA ADMIN)
export async function GET(request: Request) {
  try {
    const tenantSlug = request.headers.get('x-tenant-slug') || 'barpaco';
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Restaurante no encontrado.' }, { status: 404 });
    }

    const waiters = await prisma.waiter.findMany({
      where: { tenantId: tenant.id },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, waiters }, { status: 200 });
  } catch (error: any) {
    console.error('Error en admin GET waiters:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. CREAR UN NUEVO CAMARERO CON PIN
export async function POST(request: Request) {
  try {
    const tenantSlug = request.headers.get('x-tenant-slug') || 'barpaco';
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Restaurante no encontrado.' }, { status: 404 });
    }

    const body = await request.json();
    const { name, pin } = body;

    if (!name || !pin) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios.' }, { status: 400 });
    }

    if (pin.length !== 4 || isNaN(Number(pin))) {
      return NextResponse.json({ success: false, error: 'El PIN debe ser de 4 números.' }, { status: 400 });
    }

    // Verificar que el PIN no esté duplicado en este restaurante
    const existing = await prisma.waiter.findFirst({
      where: { tenantId: tenant.id, pin }
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'Este código PIN ya está asignado a otro camarero.' }, { status: 400 });
    }

    const waiter = await prisma.waiter.create({
      data: {
        name,
        pin,
        tenantId: tenant.id,
      },
    });

    return NextResponse.json({ success: true, waiter }, { status: 201 });
  } catch (error: any) {
    console.error('Error en admin POST waiter:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
