// Canje del código de acceso por una sesión firmada.
import { COOKIE, DIAS_SESION, firmar, catalogoCodigos } from '../lib/sesion.js';

// Rate limit best-effort contra fuerza bruta. Cuenta SOLO los fallos: una
// oficina entera sale por la misma IP y si los aciertos sumaran, el primer
// lunes en que veinte personas entran a la vez se bloquearían entre ellas.
const VENTANA_MS = 60_000, MAX_FALLOS = 8;
const fallos = new Map();
function recientes(ip) {
  const ahora = Date.now();
  const prev = (fallos.get(ip) || []).filter(t => ahora - t < VENTANA_MS);
  if (prev.length) fallos.set(ip, prev); else fallos.delete(ip);
  return prev;
}
function bloqueado(ip) { return recientes(ip).length >= MAX_FALLOS; }
function anotarFallo(ip) {
  const prev = recientes(ip);
  prev.push(Date.now());
  fallos.set(ip, prev);
  if (fallos.size > 5000) fallos.clear(); // techo de memoria
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Solo POST' });
  }
  const codigos = catalogoCodigos();
  if (codigos.size === 0) {
    return res.status(200).json({ ok: true, cliente: null, abierto: true });
  }
  const secreto = process.env.ACCESO_SECRETO;
  if (!secreto) {
    console.error('ACCESO_CODIGOS definido sin ACCESO_SECRETO: no se puede firmar la sesión');
    return res.status(500).json({ ok: false, error: 'Acceso mal configurado. Avísanos.' });
  }
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'desconocida';
  if (bloqueado(ip)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ ok: false, error: 'Demasiados códigos incorrectos. Espera un minuto.' });
  }

  const codigo = String((req.body || {}).codigo || '').trim();
  const cliente = codigos.get(codigo);
  if (!cliente) {
    // El contador en memoria solo frena a quien cae en la misma instancia; un
    // atacante en paralelo se reparte entre varias. La defensa que no depende
    // del estado son códigos largos al azar (ver README) más este retardo, que
    // baja el techo de intentos por segundo aunque cada uno estrene instancia.
    anotarFallo(ip);
    await new Promise(r => setTimeout(r, 700));
    // Nunca el código en el log; solo que hubo un fallo y desde dónde.
    console.log('acceso rechazado', ip);
    return res.status(401).json({ ok: false, error: 'Código no reconocido.' });
  }
  const token = await firmar(cliente, secreto);
  res.setHeader('Set-Cookie', COOKIE + '=' + token
    + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + DIAS_SESION * 86400);
  console.log('acceso concedido', cliente);
  return res.status(200).json({ ok: true, cliente });
}
