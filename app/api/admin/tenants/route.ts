import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(request: Request) {
  try {
    const rawTenants = await prisma.tenant.findMany({
      orderBy: { name: 'asc' }
    });

    const tenants = rawTenants.map(tenant => ({
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      adminUsername: tenant.adminUsername,
      adminPassword: '••••••••', // Enmascarar contraseña
      hasTwoPrinters: tenant.hasTwoPrinters,
      drinksCategoryId: tenant.drinksCategoryId,
      barPrinterIp: tenant.barPrinterIp,
      barPrinterPort: tenant.barPrinterPort,
      kitchenPrinterIp: tenant.kitchenPrinterIp,
      kitchenPrinterPort: tenant.kitchenPrinterPort,
    }));

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

    let hashedPassword = undefined;
    if (adminPassword !== undefined && adminPassword !== '••••••••' && adminPassword !== '') {
      hashedPassword = await bcrypt.hash(adminPassword, 10);
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: {
        adminUsername: adminUsername !== undefined ? adminUsername : undefined,
        adminPassword: hashedPassword !== undefined ? hashedPassword : undefined,
        hasTwoPrinters: hasTwoPrinters !== undefined ? hasTwoPrinters : undefined,
        drinksCategoryId: drinksCategoryId !== undefined ? drinksCategoryId : undefined,
        barPrinterIp: barPrinterIp !== undefined ? barPrinterIp : undefined,
        barPrinterPort: barPrinterPort !== undefined ? parseInt(barPrinterPort) || undefined : undefined,
        kitchenPrinterIp: kitchenPrinterIp !== undefined ? kitchenPrinterIp : undefined,
        kitchenPrinterPort: kitchenPrinterPort !== undefined ? parseInt(kitchenPrinterPort) || undefined : undefined,
      }
    });

    // Devolver el tenant con la contraseña enmascarada
    const safeTenant = {
      ...updatedTenant,
      adminPassword: '••••••••'
    };

    return NextResponse.json({ success: true, tenant: safeTenant }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating tenant credentials/settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
