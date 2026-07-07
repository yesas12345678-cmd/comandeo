import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(request: Request) {
  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        adminUsername: true,
        adminPassword: true,
        hasTwoPrinters: true,
        drinksCategoryId: true,
        barPrinterIp: true,
        barPrinterPort: true,
        kitchenPrinterIp: true,
        kitchenPrinterPort: true,
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ success: true, tenants }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching tenants list:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      adminUsername,
      adminPassword,
      hasTwoPrinters,
      drinksCategoryId,
      barPrinterIp,
      barPrinterPort,
      kitchenPrinterIp,
      kitchenPrinterPort
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios.' }, { status: 400 });
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: {
        adminUsername: adminUsername !== undefined ? adminUsername : undefined,
        adminPassword: adminPassword !== undefined ? adminPassword : undefined,
        hasTwoPrinters: hasTwoPrinters !== undefined ? hasTwoPrinters : undefined,
        drinksCategoryId: drinksCategoryId !== undefined ? drinksCategoryId : undefined,
        barPrinterIp: barPrinterIp !== undefined ? barPrinterIp : undefined,
        barPrinterPort: barPrinterPort !== undefined ? parseInt(barPrinterPort) || undefined : undefined,
        kitchenPrinterIp: kitchenPrinterIp !== undefined ? kitchenPrinterIp : undefined,
        kitchenPrinterPort: kitchenPrinterPort !== undefined ? parseInt(kitchenPrinterPort) || undefined : undefined,
      }
    });

    return NextResponse.json({ success: true, tenant: updatedTenant }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating tenant credentials/settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
