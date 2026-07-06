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
    const { waiterId, pin } = body;

    if (!waiterId || !pin) {
      return NextResponse.json({ success: false, error: 'Campos requeridos incompletos.' }, { status: 400 });
    }

    // Buscar al camarero por ID y que pertenezca a este bar
    const waiter = await prisma.waiter.findFirst({
      where: {
        id: waiterId,
        tenantId: tenant.id
      }
    });

    if (!waiter) {
      return NextResponse.json({ success: false, error: 'Camarero no encontrado.' }, { status: 404 });
    }

    // Verificar si el PIN coincide
    if (waiter.pin !== pin) {
      return NextResponse.json({ success: false, error: 'Código PIN incorrecto.' }, { status: 401 });
    }

    // Retornar éxito y datos públicos del camarero
    return NextResponse.json({
      success: true,
      waiter: {
        id: waiter.id,
        name: waiter.name
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error en login de camarero:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
