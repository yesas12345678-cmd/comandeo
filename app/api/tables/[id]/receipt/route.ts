import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function POST(
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

    if (pendingOrders.length === 0) {
      return NextResponse.json({ success: false, error: 'No hay comandas activas en esta mesa para imprimir.' }, { status: 400 });
    }

    // Agrupar productos duplicados (por id y nota) para el ticket de cuenta
    const itemsMap: { [key: string]: { id: string; name: string; price: number; quantity: number; note?: string } } = {};
    let total = 0;

    pendingOrders.forEach((order) => {
      const items = (order.items as any) as any[];
      if (Array.isArray(items)) {
        items.forEach((item) => {
          const key = `${item.id}-${item.note || ''}`;
          if (itemsMap[key]) {
            itemsMap[key].quantity += item.quantity;
          } else {
            itemsMap[key] = {
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              note: item.note || undefined,
            };
          }
          total += item.price * item.quantity;
        });
      }
    });

    const itemsList = Object.values(itemsMap);
    const tableNum = parseInt(id.replace(/\D/g, '')) || 1;

    // Crear trabajo de impresión para la factura simplificada total (RECEIPT)
    // Se envía siempre a la impresora de Barra
    const printJob = await prisma.printJob.create({
      data: {
        tableNum,
        items: itemsList as any,
        total,
        type: 'RECEIPT',
        printerIp: tenant.barPrinterIp,
        printerPort: tenant.barPrinterPort,
        tenantId: tenant.id,
      },
    });

    return NextResponse.json({ success: true, printJobId: printJob.id }, { status: 200 });
  } catch (error: any) {
    console.error('Error al generar ticket de cuenta:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
