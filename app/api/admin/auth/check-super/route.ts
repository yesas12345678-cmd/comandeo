import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/utils/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-12345';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('superadmin_session')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'No hay sesión de superadministrador activa.' }, { status: 401 });
    }

    const payload = await verifyJWT(token, JWT_SECRET);

    if (!payload || payload.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Sesión no válida o expirada.' }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: { role: 'superadmin' } }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
