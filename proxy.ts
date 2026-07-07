import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

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
