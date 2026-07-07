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
  categoryId: string;
  note?: string;
}

export async function POST(request: Request) {
  try {
    // 1. Obtener el subdominio del bar desde la cabecera
    const tenantSlug = request.headers.get('x-tenant-slug') || 'barpaco';

    // 2. Buscar el bar en la base de datos
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Bar/Restaurante no registrado.' }, { status: 404 });
    }

    const body = await request.json();
    const { tableId, items, total, waiterId } = body as {
      tableId: string;
      items: OrderItem[];
      total: number;
      waiterId?: string;
    };

    if (!tableId || !items || items.length === 0 || total === undefined) {
      return NextResponse.json({ error: 'Datos de comanda incompletos.' }, { status: 400 });
    }

    // Asegurar que la mesa existe y está asociada al Tenant
    await prisma.table.upsert({
      where: { id: tableId },
      update: {},
      create: {
        id: tableId,
        number: parseInt(tableId.replace(/\D/g, '')) || 1,
        status: 'FREE',
        tenantId: tenant.id,
      },
    });

    // 3. Dividir comanda en bebidas y comida según la configuración
    const drinksCategoryId = tenant.drinksCategoryId;
    const drinksItems = items.filter(item => item.categoryId === drinksCategoryId);
    const otherItems = items.filter(item => item.categoryId !== drinksCategoryId);

    const drinksTotal = drinksItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const otherTotal = otherItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const tableNum = parseInt(tableId.replace(/\D/g, '')) || 1;

    // Operaciones de base de datos en transacción única
    const transactionOperations: any[] = [
      prisma.order.create({
        data: {
          tableId,
          items: items as any,
          total,
          tenantId: tenant.id,
          waiterId: waiterId || null,
        },
        include: {
          table: true,
        },
      }),
      prisma.table.update({
        where: { id: tableId },
        data: { status: 'BUSY' },
      }),
    ];

    // Lógica para crear trabajos de impresión (PrintJob)
    if (tenant.hasTwoPrinters) {
      // 2 Impresoras (Barra y Cocina)
      if (drinksItems.length > 0) {
        transactionOperations.push(
          prisma.printJob.create({
            data: {
              tableNum,
              items: drinksItems as any,
              total: drinksTotal,
              type: 'KITCHEN',
              printerIp: tenant.barPrinterIp,
              printerPort: tenant.barPrinterPort,
              tenantId: tenant.id,
            },
          })
        );
      }
      if (otherItems.length > 0) {
        transactionOperations.push(
          prisma.printJob.create({
            data: {
              tableNum,
              items: otherItems as any,
              total: otherTotal,
              type: 'KITCHEN',
              printerIp: tenant.kitchenPrinterIp,
              printerPort: tenant.kitchenPrinterPort,
              tenantId: tenant.id,
            },
          })
        );
      }
    } else {
      // 1 Impresora (Solo Barra) - Se divide en 2 tickets consecutivos para la misma impresora
      if (drinksItems.length > 0) {
        transactionOperations.push(
          prisma.printJob.create({
            data: {
              tableNum,
              items: drinksItems as any,
              total: drinksTotal,
              type: 'KITCHEN',
              printerIp: tenant.barPrinterIp,
              printerPort: tenant.barPrinterPort,
              tenantId: tenant.id,
            },
          })
        );
      }
      if (otherItems.length > 0) {
        transactionOperations.push(
          prisma.printJob.create({
            data: {
              tableNum,
              items: otherItems as any,
              total: otherTotal,
              type: 'KITCHEN',
              printerIp: tenant.barPrinterIp,
              printerPort: tenant.barPrinterPort,
              tenantId: tenant.id,
            },
          })
        );
      }
    }

    const results = await prisma.$transaction(transactionOperations);
    const order = results[0];

    return NextResponse.json({ success: true, orderId: order.id }, { status: 200 });
  } catch (error: any) {
    console.error('Error procesando pedido:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error interno del servidor al procesar el pedido.' 
      }, 
      { status: 500 }
    );
  }
}
