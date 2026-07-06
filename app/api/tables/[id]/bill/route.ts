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

export async function GET(
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

    // Obtener todas las comandas pendientes (sin pagar) de esta mesa
    const pendingOrders = await prisma.order.findMany({
      where: {
        tableId: id,
        tenantId: tenant.id,
        status: 'PENDING',
      },
    });

    // Agrupar productos duplicados para el desglose de la cuenta
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

    return NextResponse.json({
      success: true,
      items: itemsList,
      total,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error al obtener cuenta de la mesa:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
