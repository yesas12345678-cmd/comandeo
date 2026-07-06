import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// 1. OBTENER LISTA DE CATEGORÍAS (SOLO PARA ADMIN)
export async function GET(request: Request) {
  try {
    const tenantSlug = request.headers.get('x-tenant-slug') || 'barpaco';
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Restaurante no encontrado.' }, { status: 404 });
    }

    const categories = await prisma.category.findMany({
      where: { tenantId: tenant.id },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, categories }, { status: 200 });
  } catch (error: any) {
    console.error('Error en admin GET categories:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. CREAR UNA NUEVA CATEGORÍA
export async function POST(request: Request) {
  try {
    const tenantSlug = request.headers.get('x-tenant-slug') || 'barpaco';
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Restaurante no encontrado.' }, { status: 404 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'El nombre de la categoría es requerido.' }, { status: 400 });
    }

    // Verificar si el nombre de la categoría ya está ocupado en este restaurante
    const existing = await prisma.category.findFirst({
      where: { tenantId: tenant.id, name }
    });

    if (existing) {
      return NextResponse.json({ success: false, error: `La Categoría "${name}" ya existe.` }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        tenantId: tenant.id,
      },
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: any) {
    console.error('Error en admin POST category:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
