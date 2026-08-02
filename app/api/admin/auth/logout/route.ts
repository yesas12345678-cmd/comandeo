import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    const cookieStore = await cookies();
    
    // Eliminar sesión de superadmin
    cookieStore.set({
      name: 'superadmin_session',
      value: '',
      maxAge: 0,
      path: '/'
    });

    // Eliminar sesión del restaurante si se especifica el slug
    if (slug) {
      cookieStore.set({
        name: `tenant_auth_${slug.toLowerCase()}`,
        value: '',
        maxAge: 0,
        path: '/'
      });
    }

    return NextResponse.json({ success: true, message: 'Sesión cerrada con éxito.' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export async function GET(request: Request) {
  return POST(request);
}
