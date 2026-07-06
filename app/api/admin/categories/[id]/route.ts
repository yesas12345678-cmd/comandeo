import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ELIMINAR UNA CATEGORÍA (DELETE)
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

    // Verificar seguridad: que la categoría pertenezca al bar antes de eliminarla
    const category = await prisma.category.findFirst({
      where: { id, tenantId: tenant.id }
    });

    if (!category) {
      return NextResponse.json({ success: false, error: 'Categoría no encontrada.' }, { status: 404 });
    }

    await prisma.category.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Categoría eliminada correctamente.' }, { status: 200 });
  } catch (error: any) {
    console.error('Error al eliminar categoría:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
