import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function POST(request: Request) {
  try {
    const tenantSlug = request.headers.get('x-tenant-slug') || 'barpaco';

    // Validar el bar
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Restaurante no encontrado.' }, { status: 404 });
    }

    const body = await request.json();
    const { tableId } = body;

    if (!tableId) {
      return NextResponse.json({ success: false, error: 'Falta el tableId.' }, { status: 400 });
    }

    // Asegurar que la mesa pertenece al bar antes de liberarla
    const table = await prisma.table.findFirst({
      where: { id: tableId, tenantId: tenant.id }
    });

    if (!table) {
      return NextResponse.json({ success: false, error: 'Mesa no encontrada.' }, { status: 404 });
    }

    // Actualizar el estado de la mesa a libre (FREE)
    await prisma.table.update({
      where: { id: tableId },
      data: { status: 'FREE' }
    });

    return NextResponse.json({ success: true, message: 'Mesa liberada con éxito.' }, { status: 200 });
  } catch (error: any) {
    console.error('Error al liberar mesa:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
