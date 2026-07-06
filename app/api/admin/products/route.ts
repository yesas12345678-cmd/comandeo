import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// 1. OBTENER PRODUCTOS Y CATEGORÍAS DEL BAR
export async function GET(request: Request) {
  try {
    const tenantSlug = request.headers.get('x-tenant-slug') || 'barpaco';
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Restaurante no encontrado.' }, { status: 404 });
    }

    const products = await prisma.product.findMany({
      where: { tenantId: tenant.id },
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    const categories = await prisma.category.findMany({
      where: { tenantId: tenant.id },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, products, categories }, { status: 200 });
  } catch (error: any) {
    console.error('Error en admin GET products:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. CREAR UN NUEVO PRODUCTO EN EL BAR
export async function POST(request: Request) {
  try {
    const tenantSlug = request.headers.get('x-tenant-slug') || 'barpaco';
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Restaurante no encontrado.' }, { status: 404 });
    }

    const body = await request.json();
    const { name, price, categoryId } = body;

    if (!name || price === undefined || !categoryId) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios.' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        categoryId,
        tenantId: tenant.id,
      },
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    console.error('Error en admin POST product:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
