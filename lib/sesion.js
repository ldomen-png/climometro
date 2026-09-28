// Firma y verificación de la cookie de sesión del Climómetro.
//
// Sin base de datos: la cookie lleva el cliente y su vencimiento firmados con
// HMAC-SHA256 sobre ACCESO_SECRETO. Web Crypto (no node:crypto) para que el
// mismo módulo sirva en la middleware y en las funciones.

const enc = new TextEncoder();

const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const deB64url = str => {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '='.repeat((4 - s.length % 4) % 4));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
};

async function clave(secreto) {
  return crypto.subtle.importKey('raw', enc.encode(secreto),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export const COOKIE = 'cl_ses';
export const DIAS_SESION = 30;

export async function firmar(cliente, secreto) {
  const payload = b64url(enc.encode(JSON.stringify({
    c: cliente,
    e: Date.now() + DIAS_SESION * 86400_000,
  })));
  const sig = b64url(await crypto.subtle.sign('HMAC', await clave(secreto), enc.encode(payload)));
  return payload + '.' + sig;
}

// Devuelve el nombre del cliente si la cookie es válida y no venció, o null.
// Nunca lanza: una cookie corrupta es simplemente una sesión inexistente.
export async function verificar(cookie, secreto) {
  if (!cookie || !secreto) return null;
  const [payload, sig] = String(cookie).split('.');
  if (!payload || !sig) return null;
  try {
    const ok = await crypto.subtle.verify('HMAC', await clave(secreto),
      deB64url(sig), enc.encode(payload));
    if (!ok) return null;
    const dato = JSON.parse(new TextDecoder().decode(deB64url(payload)));
    if (!dato || !dato.e || dato.e < Date.now()) return null;
    return dato.c || null;
  } catch (e) { return null; }
}

// ACCESO_CODIGOS = "acme2026:Acme Logística,pmi26:PMI México"
// El código es el secreto compartido con cada cliente; el nombre es lo que
// viaja a los analíticos para saber quién está usando qué.
export function catalogoCodigos() {
  const raw = process.env.ACCESO_CODIGOS || '';
  const mapa = new Map();
  raw.split(',').forEach(par => {
    const i = par.indexOf(':');
    if (i < 1) return;
    const cod = par.slice(0, i).trim();
    const cli = par.slice(i + 1).trim();
    if (cod && cli) mapa.set(cod, cli);
  });
  return mapa;
}
