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
        name: true
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ success: true, tenants }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching tenants list:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
