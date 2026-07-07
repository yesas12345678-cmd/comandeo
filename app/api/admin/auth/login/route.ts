import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function POST(request: Request) {
  try {
    const tenantSlug = request.headers.get('x-tenant-slug');

    if (!tenantSlug) {
      return NextResponse.json({ success: false, error: 'Falta cabecera x-tenant-slug' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Restaurante no encontrado.' }, { status: 404 });
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Credenciales incompletas.' }, { status: 400 });
    }

    if (tenant.adminUsername === username && tenant.adminPassword === password) {
      return NextResponse.json({ success: true, message: 'Autenticación correcta' }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, error: 'Usuario o contraseña del restaurante incorrectos.' }, { status: 401 });
    }
  } catch (error: any) {
    console.error('Error in tenant admin auth login:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
