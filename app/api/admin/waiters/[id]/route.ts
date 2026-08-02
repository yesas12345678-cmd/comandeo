import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ELIMINAR UN CAMARERO (DELETE)
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

    // Verificar seguridad: que el camarero pertenezca al bar antes de eliminarlo
    const waiter = await prisma.waiter.findFirst({
      where: { id, tenantId: tenant.id }
    });

    if (!waiter) {
      return NextResponse.json({ success: false, error: 'Camarero no encontrado.' }, { status: 404 });
    }

    await prisma.waiter.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Camarero eliminado correctamente.' }, { status: 200 });
  } catch (error: any) {
    console.error('Error al eliminar camarero:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// EDITAR UN CAMARERO (PUT)
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

    // Verificar seguridad: que el camarero pertenezca al bar
    const waiter = await prisma.waiter.findFirst({
      where: { id, tenantId: tenant.id }
    });

    if (!waiter) {
      return NextResponse.json({ success: false, error: 'Camarero no encontrado.' }, { status: 404 });
    }

    const body = await request.json();
    const { name, pin, allowedDays, startHour, endHour } = body;

    let hashedPin = waiter.pin;
    if (pin) {
      const isSamePin = waiter.pin.startsWith('$2a$') || waiter.pin.startsWith('$2b$')
        ? await bcrypt.compare(pin, waiter.pin)
        : pin === waiter.pin;
        
      if (!isSamePin) {
        if (pin.length !== 4 || isNaN(Number(pin))) {
          return NextResponse.json({ success: false, error: 'El PIN debe ser de 4 números.' }, { status: 400 });
        }
        const otherWaiters = await prisma.waiter.findMany({
          where: { tenantId: tenant.id, NOT: { id } }
        });
        for (const w of otherWaiters) {
          const pinMatches = w.pin.startsWith('$2a$') || w.pin.startsWith('$2b$')
            ? await bcrypt.compare(pin, w.pin)
            : w.pin === pin;
          if (pinMatches) {
            return NextResponse.json({ success: false, error: 'Este PIN ya está asignado a otro camarero.' }, { status: 400 });
          }
        }
        hashedPin = await bcrypt.hash(pin, 10);
      }
    }

    const updatedWaiter = await prisma.waiter.update({
      where: { id },
      data: {
        name: name !== undefined ? name : waiter.name,
        pin: hashedPin,
        allowedDays: allowedDays !== undefined ? allowedDays : waiter.allowedDays,
        startHour: startHour !== undefined ? startHour : waiter.startHour,
        endHour: endHour !== undefined ? endHour : waiter.endHour,
      }
    });

    return NextResponse.json({ success: true, waiter: updatedWaiter }, { status: 200 });
  } catch (error: any) {
    console.error('Error al editar camarero:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
