import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/utils/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-12345';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Falta parámetro slug.' }, { status: 400 });
    }

    const cookieStore = await cookies();
    
    // 1. Verificar si hay sesión de superadmin
    const superadminToken = cookieStore.get('superadmin_session')?.value;
    if (superadminToken) {
      const superPayload = await verifyJWT(superadminToken, JWT_SECRET);
      if (superPayload && superPayload.role === 'superadmin') {
        return NextResponse.json({ success: true, isSuperadmin: true }, { status: 200 });
      }
    }

    // 2. Verificar si hay sesión de administrador del restaurante
    const tenantToken = cookieStore.get(`tenant_auth_${slug.toLowerCase()}`)?.value;
    if (!tenantToken) {
      return NextResponse.json({ success: false, error: 'No hay sesión activa para este bar.' }, { status: 401 });
    }

    const payload = await verifyJWT(tenantToken, JWT_SECRET);
    if (!payload || payload.slug !== slug.toLowerCase() || payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Sesión no válida o expirada para este bar.' }, { status: 401 });
    }

    return NextResponse.json({ success: true, isSuperadmin: false }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
