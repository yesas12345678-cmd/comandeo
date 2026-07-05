import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(request: Request) {
  try {
    // 1. Obtener el subdominio del bar desde la cabecera del middleware
    const tenantSlug = request.headers.get('x-tenant-slug') || 'barpaco';

    // 2. Buscar el bar en la base de datos
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: `El bar/restaurante '${tenantSlug}' no existe en la plataforma.` },
        { status: 404 }
      );
    }

    // 3. Obtener únicamente los productos y mesas que pertenecen a este bar
    const products = await prisma.product.findMany({
      where: { tenantId: tenant.id },
      orderBy: { name: 'asc' },
    });
    const tables = await prisma.table.findMany({
      where: { tenantId: tenant.id },
      orderBy: { number: 'asc' },
    });

    return NextResponse.json({
      success: true,
      tenantName: tenant.name,
      products,
      tables
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error inicializando datos:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener datos iniciales.' },
      { status: 500 }
    );
  }
}
