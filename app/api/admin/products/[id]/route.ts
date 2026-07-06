import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// 1. MODIFICAR UN PRODUCTO (PUT)
export async function PUT(
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

    const body = await request.json();
    const { name, price, categoryId } = body;

    // Asegurar seguridad: verificar que el producto pertenece al bar solicitante antes de editarlo
    const product = await prisma.product.findFirst({
      where: { id, tenantId: tenant.id }
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Producto no encontrado en tu bar.' }, { status: 404 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name : product.name,
        price: price !== undefined ? parseFloat(price) : product.price,
        categoryId: categoryId !== undefined ? categoryId : product.categoryId,
      }
    });

    return NextResponse.json({ success: true, product: updatedProduct }, { status: 200 });
  } catch (error: any) {
    console.error('Error al editar producto:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. ELIMINAR UN PRODUCTO (DELETE)
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

    // Asegurar seguridad: verificar que el producto pertenece al bar antes de eliminarlo
    const product = await prisma.product.findFirst({
      where: { id, tenantId: tenant.id }
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Producto no encontrado.' }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Producto eliminado correctamente.' }, { status: 200 });
  } catch (error: any) {
    console.error('Error al eliminar producto:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
