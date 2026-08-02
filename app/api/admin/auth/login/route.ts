import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { signJWT } from '@/utils/auth';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-12345';

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

    // Comprobar usuario
    if (tenant.adminUsername !== username) {
      return NextResponse.json({ success: false, error: 'Usuario o contraseña del restaurante incorrectos.' }, { status: 401 });
    }

    // Comprobar contraseña (soporta texto plano para retrocompatibilidad temporal, pero usa bcrypt principalmente)
    let isPasswordCorrect = false;
    if (tenant.adminPassword.startsWith('$2a$') || tenant.adminPassword.startsWith('$2b$')) {
      isPasswordCorrect = await bcrypt.compare(password, tenant.adminPassword);
    } else {
      isPasswordCorrect = tenant.adminPassword === password;
    }

    if (isPasswordCorrect) {
      // Firmar token con expiración de 1 día
      const token = await signJWT(
        { id: tenant.id, slug: tenant.slug.toLowerCase(), role: 'admin', exp: Date.now() + 1000 * 60 * 60 * 24 },
        JWT_SECRET
      );

      const response = NextResponse.json({ success: true, message: 'Autenticación correcta' }, { status: 200 });

      response.cookies.set({
        name: `tenant_auth_${tenant.slug.toLowerCase()}`,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 // 1 día
      });

      return response;
    } else {
      return NextResponse.json({ success: false, error: 'Usuario o contraseña del restaurante incorrectos.' }, { status: 401 });
    }
  } catch (error: any) {
    console.error('Error in tenant admin auth login:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
