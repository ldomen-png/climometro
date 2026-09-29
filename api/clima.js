// Proxy de Open-Meteo con caché en el edge de Vercel.
//
// El portal pedía el clima desde el navegador de cada usuario, así que el
// consumo se multiplicaba por persona y por recarga: una carga son 275
// ubicaciones (79 zonas + 196 waypoints de corredores) y con eso ~35 cargas
// agotan las 10,000 diarias del plan gratuito.
//
// Aquí la petición se hace UNA vez por ventana de caché y la sirve el CDN a
// todo el mundo. El costo deja de depender de cuánta gente entre: diez
// clientes o mil consumen lo mismo.
//
// Con OPEN_METEO_KEY definida usa el endpoint comercial (licencia de uso
// comercial + 1M llamadas/mes); sin ella cae al endpoint gratuito, así que el
// portal sigue funcionando hoy y mejora el día que se contrate el plan.

const UPSTREAM = {
  forecast: { host: 'api.open-meteo.com',       hostPago: 'customer-api.open-meteo.com',       ruta: '/v1/forecast', ttl: 1800,  swr: 3600  },
  malla:    { host: 'api.open-meteo.com',       hostPago: 'customer-api.open-meteo.com',       ruta: '/v1/forecast', ttl: 10800, swr: 21600 },
  flood:    { host: 'flood-api.open-meteo.com', hostPago: 'customer-flood-api.open-meteo.com', ruta: '/v1/flood',    ttl: 21600, swr: 43200 },
};

// Lista blanca: sin esto el proxy es un relay abierto con nuestra llave. Solo
// las variables que el semáforo realmente usa.
const VARS_OK = new Set([
  'precipitation_sum', 'precipitation_probability_max', 'weather_code',
  'wind_speed_10m_max', 'wind_gusts_10m_max', 'wind_direction_10m_dominant',
  'temperature_2m_max', 'river_discharge',
]);

// Área de interés: México y su entorno inmediato. Que nadie use nuestra cuota
// para servir el pronóstico de Europa.
const BBOX = { latMin: 5, latMax: 35, lngMin: -125, lngMax: -80 };
const MAX_PUNTOS = 300;

// Redondear a 2 decimales (~1.1 km, irrelevante para estos umbrales) hace que
// la URL sea idéntica entre recargas y el CDN acierte en caché.
const r2 = n => Math.round(n * 100) / 100;

function parsearPuntos(raw) {
  const partes = String(raw || '').split(';').filter(Boolean);
  if (!partes.length || partes.length > MAX_PUNTOS) return null;
  const lats = [], lngs = [];
  for (const par of partes) {
    const [a, b] = par.split(',');
    const lat = Number(a), lng = Number(b);
    if (!isFinite(lat) || !isFinite(lng)) return null;
    if (lat < BBOX.latMin || lat > BBOX.latMax || lng < BBOX.lngMin || lng > BBOX.lngMax) return null;
    lats.push(r2(lat)); lngs.push(r2(lng));
  }
  return { lats, lngs };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: true, reason: 'Solo GET' });
  }
  const q = req.query || {};
  const cfg = UPSTREAM[String(q.fuente || 'forecast')];
  if (!cfg) return res.status(400).json({ error: true, reason: 'Fuente desconocida' });

  const pts = parsearPuntos(q.pts);
  if (!pts) return res.status(400).json({ error: true, reason: 'Puntos inválidos o fuera del área de interés' });

  const vars = String(q.vars || '').split(',').filter(Boolean);
  if (!vars.length || vars.some(v => !VARS_OK.has(v))) {
    return res.status(400).json({ error: true, reason: 'Variables no permitidas' });
  }

  const dias = Math.min(16, Math.max(1, parseInt(q.dias, 10) || 7));
  const pasados = Math.min(92, Math.max(0, parseInt(q.pasados, 10) || 0));

  const llave = process.env.OPEN_METEO_KEY;
  const host = llave ? cfg.hostPago : cfg.host;
  const url = new URL('https://' + host + cfg.ruta);
  url.searchParams.set('latitude', pts.lats.join(','));
  url.searchParams.set('longitude', pts.lngs.join(','));
  url.searchParams.set('daily', vars.join(','));
  url.searchParams.set('timezone', 'America/Mexico_City');
  url.searchParams.set('forecast_days', String(dias));
  if (pasados) url.searchParams.set('past_days', String(pasados));
  if (llave) url.searchParams.set('apikey', llave);

  try {
    const r = await fetch(url, { headers: { accept: 'application/json' } });
    const cuerpo = await r.text();
    if (!r.ok) {
      // El error del upstream se pasa tal cual y NO se cachea: si Open-Meteo
      // devuelve 429, el portal debe entrar en su estado honesto de "sin
      // pronóstico", no quedarse media hora con un error congelado.
      res.setHeader('Cache-Control', 'no-store');
      return res.status(r.status).send(cuerpo);
    }
    // El CDN guarda la respuesta y la sirve a todos; stale-while-revalidate
    // evita que alguien espere mientras se renueva.
    res.setHeader('Cache-Control', `public, s-maxage=${cfg.ttl}, stale-while-revalidate=${cfg.swr}`);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).send(cuerpo);
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: true, reason: 'No se pudo consultar Open-Meteo' });
  }
}
