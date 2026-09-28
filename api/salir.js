// Cierre de sesión: caduca la cookie.
import { COOKIE } from '../lib/sesion.js';

export default function handler(req, res) {
  res.setHeader('Set-Cookie', COOKIE + '=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  return res.status(200).json({ ok: true });
}
