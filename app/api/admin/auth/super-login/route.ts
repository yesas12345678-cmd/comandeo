import { NextResponse } from 'next/server';
import { signJWT } from '@/utils/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-12345';
const SUPERADMIN_USERNAME = process.env.SUPERADMIN_USERNAME || 'zVaito';
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'Manuel1214$';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Credenciales incompletas.' }, { status: 400 });
    }

    if (username === SUPERADMIN_USERNAME && password === SUPERADMIN_PASSWORD) {
      // Firmar token con expiración de 1 día (86400 segundos)
      const token = await signJWT(
        { role: 'superadmin', exp: Date.now() + 1000 * 60 * 60 * 24 },
        JWT_SECRET
      );

      const response = NextResponse.json({ success: true, message: 'Super Administrador autenticado con éxito' }, { status: 200 });
      
      response.cookies.set({
        name: 'superadmin_session',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 // 1 día
      });

      return response;
    } else {
      return NextResponse.json({ success: false, error: 'Usuario o contraseña de superadministrador incorrectos.' }, { status: 401 });
    }
  } catch (error: any) {
    console.error('Error en superadmin login:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
