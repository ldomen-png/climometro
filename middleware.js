// Puerta de acceso del Climómetro (Vercel Routing Middleware).
//
// Sin ACCESO_CODIGOS configurado la puerta está ABIERTA: el portal sigue
// funcionando igual que siempre. Se cierra en el momento en que se define esa
// variable, y no antes — así activar el login es una decisión explícita y no
// un despliegue que deja a todos fuera.
//
//   vercel env add ACCESO_SECRETO   production   # cadena larga al azar
//   vercel env add ACCESO_CODIGOS   production   # "acme26:Acme,pmi26:PMI México"

import { COOKIE, verificar, catalogoCodigos } from './lib/sesion.js';

// Lo único que se sirve sin sesión: la propia pantalla de acceso, el endpoint
// que la valida y los recursos de Vercel (analíticos).
const ABIERTO = [/^\/acceso(\.html)?$/, /^\/api\/entrar$/, /^\/_vercel\//, /^\/favicon\./];

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};

export default async function middleware(request) {
  const url = new URL(request.url);
  const codigos = catalogoCodigos();
  if (codigos.size === 0) return; // puerta abierta: nada que validar

  if (ABIERTO.some(re => re.test(url.pathname))) return;

  const cookie = (request.headers.get('cookie') || '')
    .split(';').map(c => c.trim())
    .find(c => c.startsWith(COOKIE + '='));
  const cliente = await verificar(cookie && cookie.slice(COOKIE.length + 1),
    process.env.ACCESO_SECRETO);
  if (cliente) return;

  // Las peticiones de datos reciben 401 (para que el portal sepa que la sesión
  // venció); la navegación se manda a la pantalla de acceso.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/data/')) {
    return new Response(JSON.stringify({ ok: false, error: 'Sesión requerida' }), {
      status: 401, headers: { 'content-type': 'application/json' },
    });
  }
  return Response.redirect(new URL('/acceso.html', url), 307);
}
