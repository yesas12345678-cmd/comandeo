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
    const { id, adminUsername, adminPassword } = body;

    if (!id || !adminUsername || !adminPassword) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios.' }, { status: 400 });
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: {
        adminUsername,
        adminPassword,
      }
    });

    return NextResponse.json({ success: true, tenant: updatedTenant }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating tenant credentials:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
