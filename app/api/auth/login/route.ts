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

    // Verificar restricciones de horario y días de acceso
    const now = new Date();
    let currentDay = now.getDay();
    if (currentDay === 0) currentDay = 7; // Lunes = 1, ..., Domingo = 7

    const allowedDaysList = waiter.allowedDays ? waiter.allowedDays.split(',') : ['1','2','3','4','5','6','7'];
    if (!allowedDaysList.includes(currentDay.toString())) {
      return NextResponse.json({ success: false, error: 'Acceso denegado: Hoy no tienes asignado acceso al sistema.' }, { status: 403 });
    }

    // Obtener hora local en formato HH:MM
    const currentHourStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
    const startHour = waiter.startHour || '00:00';
    const endHour = waiter.endHour || '23:59';

    if (currentHourStr < startHour || currentHourStr > endHour) {
      return NextResponse.json({ success: false, error: `Acceso denegado: Tu horario permitido es de ${startHour} a ${endHour}.` }, { status: 403 });
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
