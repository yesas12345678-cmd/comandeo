import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export async function POST(request: Request) {
  try {
    const tenantSlug = request.headers.get('x-tenant-slug') || 'barpaco';

    // Validar el bar
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Restaurante no encontrado.' }, { status: 404 });
    }

    const body = await request.json();
    const { tableId, paymentMethod } = body;

    if (!tableId || !paymentMethod) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios (tableId, paymentMethod).' }, { status: 400 });
    }

    if (paymentMethod !== 'CASH' && paymentMethod !== 'CARD') {
      return NextResponse.json({ success: false, error: 'Método de pago inválido. Debe ser CASH o CARD.' }, { status: 400 });
    }

    // Validar propiedad de la mesa
    const table = await prisma.table.findFirst({
      where: { id: tableId, tenantId: tenant.id }
    });

    if (!table) {
      return NextResponse.json({ success: false, error: 'Mesa no encontrada.' }, { status: 404 });
    }

    // Obtener todas las comandas pendientes (sin pagar) de esta mesa
    const pendingOrders = await prisma.order.findMany({
      where: {
        tableId,
        tenantId: tenant.id,
        status: 'PENDING',
      },
    });

    if (pendingOrders.length === 0) {
      return NextResponse.json({ success: false, error: 'Esta mesa no tiene consumos pendientes para cobrar.' }, { status: 400 });
    }

    // Agrupar todos los consumos para crear el Ticket de Caja final
    const itemsMap: { [key: string]: { id: string; name: string; price: number; quantity: number } } = {};
    let total = 0;

    pendingOrders.forEach((order) => {
      const items = (order.items as any) as OrderItem[];
      if (Array.isArray(items)) {
        items.forEach((item) => {
          if (itemsMap[item.id]) {
            itemsMap[item.id].quantity += item.quantity;
          } else {
            itemsMap[item.id] = {
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            };
          }
          total += item.price * item.quantity;
        });
      }
    });

    const itemsList = Object.values(itemsMap);

    // EJECUTAR TRANSACCIÓN EN BASE DE DATOS
    await prisma.$transaction([
      // 1. Marcar todas las comandas de la mesa como cobradas (PAID) con su método de pago
      prisma.order.updateMany({
        where: {
          tableId,
          tenantId: tenant.id,
          status: 'PENDING',
        },
        data: {
          status: 'PAID',
          paymentMethod,
        },
      }),

      // 2. Liberar la mesa
      prisma.table.update({
        where: { id: tableId },
        data: { status: 'FREE' },
      }),

      // 3. Crear el ticket de caja en la cola de impresión
      prisma.printJob.create({
        data: {
          tableNum: table.number,
          items: itemsList as any,
          total,
          type: 'RECEIPT', // Ticket de caja/Factura simplificada
          tenantId: tenant.id,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Mesa cobrada y liberada con éxito. Ticket encolado.',
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error al cobrar mesa:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
