import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || '';

  // 1. Limpiar el puerto si existe (ej. "barpaco.localhost:3000" -> "barpaco.localhost")
  const host = hostname.split(':')[0];

  // 2. Separar por puntos
  const parts = host.split('.');

  // 3. Subdominio por defecto
  let slug = 'barpaco';

  const isLocalhost = host.endsWith('localhost') || host.endsWith('127.0.0.1');
  const isLvhMe = host.endsWith('lvh.me');

  // 4. Analizar la estructura según el entorno
  if (isLocalhost) {
    // Caso: barpaco.localhost -> ["barpaco", "localhost"] (2 partes)
    if (parts.length > 1 && parts[parts.length - 1] === 'localhost') {
      slug = parts[0];
    }
  } else if (isLvhMe) {
    // Caso: barpaco.lvh.me -> ["barpaco", "lvh", "me"] (3 partes)
    if (parts.length > 2) {
      slug = parts[0];
    }
  } else {
    // Caso Producción: barpaco.mi-tpv.com -> ["barpaco", "mi-tpv", "com"] (3 partes)
    if (parts.length > 2) {
      slug = parts[0];
    }
  }

  // 5. Inyectar el subdominio en la cabecera x-tenant-slug
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-slug', slug);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|next.svg|vercel.svg|favicon.ico).*)'],
};
