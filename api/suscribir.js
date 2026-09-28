// Registro y baja de suscripciones de alertas del Climómetro (Vercel Function).
//
// El portal manda {accion, telefono, regiones[], sitios[], nombre}. Validamos,
// normalizamos a formato internacional (+52 por defecto) y reenviamos al
// webhook central si está configurado (SUSCRIPCIONES_WEBHOOK — el punto de
// integración con Hamilton/Sonar, donde vivirá el motor de alertamiento).
//
// Sin webhook el registro NO queda entregado: respondemos entregado:false y el
// portal tiene que decirlo con todas sus letras. Prometer alertas que nadie va
// a enviar es peor que no ofrecer el registro.

const REGIONES = ['Norte', 'Occidente', 'Centro', 'Sureste'];

// Rate limit best-effort en memoria. Fluid Compute reutiliza la instancia, así
// que frena el abuso desde una IP; no es una defensa dura (varias instancias
// tienen contadores separados) pero evita que el endpoint quede abierto de par
// en par. El límite duro real vive en la central cuando se conecte.
const VENTANA_MS = 60_000;
const MAX_POR_VENTANA = 5;
const golpes = new Map();

function limitado(ip) {
  const ahora = Date.now();
  const previos = (golpes.get(ip) || []).filter(t => ahora - t < VENTANA_MS);
  previos.push(ahora);
  golpes.set(ip, previos);
  if (golpes.size > 5000) golpes.clear(); // techo de memoria
  return previos.length > MAX_POR_VENTANA;
}

// Nunca escribimos el teléfono ni el nombre en los logs de Vercel: quedan
// retenidos y compartidos con todo el que tenga acceso al proyecto. Para
// depurar basta con saber que hubo un alta y de qué forma.
function huella(tel) {
  return tel.slice(0, 3) + '···' + tel.slice(-2);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Solo POST' });
  }
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'desconocida';
  if (limitado(ip)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ ok: false, error: 'Demasiados intentos. Espera un minuto.' });
  }

  const { accion, telefono, regiones, sitios, nombre } = req.body || {};
  const esBaja = accion === 'baja';

  const tel = String(telefono || '').replace(/[^\d+]/g, '');
  if (!/^\+?\d{10,15}$/.test(tel)) {
    return res.status(400).json({ ok: false, error: 'Número inválido: usa 10 dígitos (MX) o formato internacional con +.' });
  }
  const regs = Array.isArray(regiones) ? regiones.filter(r => REGIONES.includes(r)) : [];
  if (!esBaja && regs.length === 0) {
    return res.status(400).json({ ok: false, error: 'Selecciona al menos una región.' });
  }

  // El protocolo define qué llega: cortes 09:00/14:00/16:00 + fichas naranja/roja.
  const registro = {
    accion: esBaja ? 'baja' : 'alta',
    telefono: tel.startsWith('+') ? tel : '+52' + tel,
    regiones: regs,
    sitios: esBaja ? [] : (Array.isArray(sitios) ? sitios.slice(0, 30) : []),
    nombre: String(nombre || '').slice(0, 80),
    ts: new Date().toISOString(),
  };

  const hook = process.env.SUSCRIPCIONES_WEBHOOK;
  if (!hook) {
    console.log('suscripcion sin central', registro.accion, huella(registro.telefono));
    return res.status(200).json({
      ok: true,
      entregado: false,
      motivo: 'sin-central',
      telefono: registro.telefono,
    });
  }

  let entregado = false, error = null;
  try {
    const r = await fetch(hook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(registro),
    });
    entregado = r.ok;
    if (!r.ok) error = 'central-' + r.status;
  } catch (e) {
    error = 'central-inalcanzable';
  }
  console.log('suscripcion', registro.accion, huella(registro.telefono), 'entregado:', entregado);
  return res.status(200).json({
    ok: true,
    entregado,
    motivo: entregado ? null : error,
    telefono: registro.telefono,
  });
}
