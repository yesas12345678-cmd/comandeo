import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ELIMINAR UNA MESA (DELETE)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantSlug = request.headers.get('x-tenant-slug') || 'barpaco';

    // Validar el bar
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Restaurante no encontrado.' }, { status: 404 });
    }

    // Verificar seguridad: que la mesa pertenezca al bar antes de borrarla
    const table = await prisma.table.findFirst({
      where: { id, tenantId: tenant.id }
    });

    if (!table) {
      return NextResponse.json({ success: false, error: 'Mesa no encontrada.' }, { status: 404 });
    }

    // Opcional: No permitir eliminar la mesa si está ocupada (opcional, pero buena práctica)
    if (table.status === 'BUSY') {
      return NextResponse.json({ success: false, error: 'No puedes eliminar una mesa que está ocupada actualmente.' }, { status: 400 });
    }

    await prisma.table.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Mesa eliminada correctamente.' }, { status: 200 });
  } catch (error: any) {
    console.error('Error al eliminar mesa:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
