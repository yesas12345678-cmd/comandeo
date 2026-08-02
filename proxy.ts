import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/utils/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-12345';

// Limpiador en memoria para Rate Limiting (10 intentos por minuto por IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  const path = url.pathname;

  // 1. RATE LIMITING EN ENDPOINTS DE AUTENTICACIÓN
  if (path === '/api/admin/auth/login' || path === '/api/admin/auth/super-login') {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();
    const limitRecord = rateLimitMap.get(ip);

    if (limitRecord) {
      if (now > limitRecord.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
      } else {
        limitRecord.count++;
        if (limitRecord.count > 10) {
          return NextResponse.json(
            { success: false, error: 'Demasiados intentos. Por favor, inténtalo de nuevo más tarde.' },
            { status: 429 }
          );
        }
      }
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    }
  }

  // 2. EXIMIR RUTA DE AUTENTICACIÓN DE VERIFICACIONES POSTERIORES
  const isAuthOrPublicApi = 
    path.startsWith('/api/admin/auth/login') ||
    path.startsWith('/api/admin/auth/super-login') ||
    path.startsWith('/api/admin/auth/logout') ||
    path.startsWith('/api/admin/auth/check-tenant') ||
    path.startsWith('/api/admin/auth/check-super');

  if (path.startsWith('/api/admin/') && !isAuthOrPublicApi) {
    // 3. SEGURIDAD PARA ENDPOINTS DE ADMINISTRACIÓN GENERAL (SUPERADMIN)
    if (path.startsWith('/api/admin/tenants')) {
      const token = request.cookies.get('superadmin_session')?.value;

      if (!token) {
        return NextResponse.json({ success: false, error: 'No autorizado. Se requiere sesión de superadministrador.' }, { status: 401 });
      }

      const payload = await verifyJWT(token, JWT_SECRET);
      if (!payload || payload.role !== 'superadmin') {
        return NextResponse.json({ success: false, error: 'Sesión inválida o expirada.' }, { status: 401 });
      }
    } else {
      // 4. SEGURIDAD PARA ENDPOINTS DE ADMINISTRACIÓN DE BARS (TENANT ADMIN)
      const tenantSlug = request.headers.get('x-tenant-slug');

      if (!tenantSlug) {
        return NextResponse.json({ success: false, error: 'No autorizado. Falta cabecera x-tenant-slug.' }, { status: 400 });
      }

      // Verificar si hay sesión de Superadmin (que tiene bypass total)
      let authorized = false;
      const superToken = request.cookies.get('superadmin_session')?.value;
      if (superToken) {
        const superPayload = await verifyJWT(superToken, JWT_SECRET);
        if (superPayload && superPayload.role === 'superadmin') {
          authorized = true;
        }
      }

      if (!authorized) {
        // Verificar sesión específica del bar
        const token = request.cookies.get(`tenant_auth_${tenantSlug.toLowerCase()}`)?.value;
        if (!token) {
          return NextResponse.json({ success: false, error: 'No autorizado. Inicie sesión en el bar.' }, { status: 401 });
        }

        const payload = await verifyJWT(token, JWT_SECRET);
        if (!payload || payload.slug !== tenantSlug.toLowerCase() || payload.role !== 'admin') {
          return NextResponse.json({ success: false, error: 'Sesión inválida o expirada.' }, { status: 401 });
        }
      }
    }
  }

  // Exclude internal Next.js requests and API routes from rewriting
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 1. Limpiar el puerto si existe (ej. "barpaco.localhost:3000" -> "barpaco.localhost")
  const host = hostname.split(':')[0];

  // 2. Separar por puntos
  const parts = host.split('.');

  // 3. Detectar si hay subdominio
  let slug = '';
  const isLocalhost = host.endsWith('localhost') || host.endsWith('127.0.0.1');
  const isLvhMe = host.endsWith('lvh.me');

  if (isLocalhost) {
    if (parts.length > 1 && parts[parts.length - 1] === 'localhost' && parts[0] !== 'localhost') {
      slug = parts[0];
    }
  } else if (isLvhMe) {
    if (parts.length > 2 && parts[0] !== 'www') {
      slug = parts[0];
    }
  } else {
    if (parts.length > 2 && parts[0] !== 'www') {
      slug = parts[0];
    }
  }

  // 4. Si hay subdominio, reescribir la ruta hacia /tenant/[slug]/...
  if (slug) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-slug', slug.toLowerCase());

    url.pathname = `/tenant/${slug.toLowerCase()}${url.pathname}`;
    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Si no hay subdominio, no reescribimos nada (carga / o /admin por defecto)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|next.svg|vercel.svg|favicon.ico).*)'],
};
