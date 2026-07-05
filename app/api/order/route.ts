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
    const { tableId, items, total } = body as {
      tableId: string;
      items: OrderItem[];
      total: number;
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

    // 3. Guardar el Pedido, actualizar la Mesa y encolar el Trabajo de Impresión vinculados a este Tenant
    const [order, table, printJob] = await prisma.$transaction([
      prisma.order.create({
        data: {
          tableId,
          items: items as any,
          total,
          tenantId: tenant.id,
        },
        include: {
          table: true,
        },
      }),
      prisma.table.update({
        where: { id: tableId },
        data: { status: 'BUSY' },
      }),
      prisma.printJob.create({
        data: {
          tableNum: parseInt(tableId.replace(/\D/g, '')) || 1,
          items: items as any,
          total,
          tenantId: tenant.id,
        },
      }),
    ]);

    return NextResponse.json({ success: true, orderId: order.id, printJobId: printJob.id }, { status: 200 });
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
