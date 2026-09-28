// Quién está en sesión. El portal lo consulta al arrancar para etiquetar los
// analíticos con el cliente y para saber si la puerta está abierta o cerrada.
import { COOKIE, verificar, catalogoCodigos } from '../lib/sesion.js';

export default async function handler(req, res) {
  const abierto = catalogoCodigos().size === 0;
  const raw = (req.headers.cookie || '').split(';').map(c => c.trim())
    .find(c => c.startsWith(COOKIE + '='));
  const cliente = await verificar(raw && raw.slice(COOKIE.length + 1), process.env.ACCESO_SECRETO);
  res.setHeader('Cache-Control', 'private, no-store');
  return res.status(200).json({ ok: true, abierto, cliente });
}
