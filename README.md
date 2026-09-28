# Climómetro MX

**Producción: [climometro.vercel.app](https://climometro.vercel.app)**

Sistema de riesgo climático-operativo para empresas en México, desarrollado por [Aleph](https://alephri.com). Pronóstico a 7 días para las principales zonas urbanas, corredores carreteros e instalaciones propias del usuario, con ciclones, sismos y crecidas en vivo.

> El modo **Protestas** (Protestómetro) está desactivado temporalmente (`PRODUCT = 'clima'` en `index.html`); su código sigue intacto y se reactiva cambiando esa constante a `'dual'`.

## Qué hace

- **Escala de Protección Civil, evolutiva y acumulativa**: sin alerta → 🟢 verde (informarse) → 🟡 amarillo (preparación) → 🟠 naranja (coordinación) → 🔴 rojo (emergencia). Cada nivel hereda las acciones del anterior; el color describe el **estado del fenómeno** (puede sostenerse días) y el aviso se dispara por transición a naranja/rojo. El pronóstico topa en naranja: solo el impacto de ciclón o la afectación observada llegan a rojo.
- **Semáforo con atribución y acción**: cada zona/corredor/sitio indica su nivel, *qué variable lo disparó* (lluvia, viento, ráfagas, calor, visibilidad) y la acción que corresponde.
- **Geocercas de afectación**: cada zona en amarillo o peor genera un área de 25–60 km según nivel — para el personal que anda disperso por territorio, no sobre una carretera — y el portal y el mensaje dicen qué activos quedaron dentro.
- **Mis sitios**: el usuario agrega sus plantas/CEDIS con clic en el mapa (localStorage); cada sitio recibe pronóstico propio a 7 días, exposición histórica (CENAPRED + HURDAT2) y alerta si cae dentro del cono de un ciclón activo del NHC. Como viven solo en el navegador, el panel ofrece **respaldar y restaurar** un archivo JSON: restaurar fusiona sin duplicar y valida cada coordenada.
- **Ficha PDF de una página** (MVP de entrega): botón "Descargar ficha PDF" en el Resumen — documento vectorial A4 con cabecera Aleph, veredicto nacional, las cuatro banderas regionales, mapa estático de Mapbox con pines de zonas en alerta e instalaciones, tabla de zonas con motivo y geocerca, corredores, riesgos activos y pie con fuentes y el descargo del SIAT-CT. Se genera en el navegador con jsPDF (sin backend) y descarga directa sin diálogo de impresión: un clic → archivo → adjuntar en Teams o WhatsApp. La lista de zonas se ajusta al espacio para que la ficha quepa en una hoja.
- **Parte operativo en texto**: copia al portapapeles o abre WhatsApp con el resumen del día, para quien prefiera texto plano.
- **Frescura y revalidación**: hora de descarga visible junto al headline; el semáforo se revalida cada 30 min y al volver a la pestaña.
- **Exposición histórica por zona**: cada ZM muestra su índice de peligro de inundación (CENAPRED 2016) y cuántos ciclones cat. 3+ pasaron a <100 km desde 1980 (precomputado, embebido).

## Capas y señales

Umbrales centralizados en `CLIMA_THRESHOLDS` (tres tramos por variable) y escala en `NIVELES`.

- **Malla nacional de lluvia** — 660 celdas a 1°, raster interpolado en GPU (Mapbox canvas source).
- **Partículas de viento** — campo u/v advectado en tiempo real (hasta 1,400 partículas).
- **Corredores con pronóstico propio** — los 30 corredores federales se evalúan punto a punto (196 waypoints); el nivel toma el peor tramo. Se dibujan con **geometría real de carretera** (OSRM/OSM precomputado en `data/corredores.json`).
- **Ciclones tropicales** — cono de incertidumbre, trayectoria y puntos de pronóstico del NHC/NOAA (ArcGIS REST con CORS), sondeando los slots AT1–AT5 y EP1–EP5.
- **Sismos** — M4.5+ de las últimas 48 h vía USGS (GeoJSON con CORS).
- **Crecidas fluviales** — descarga GloFAS (Open-Meteo Flood API); señal cuando el pronóstico supera 2× la mediana de los últimos 31 días.
- **Puntos críticos de inundación** — 953 sitios con inundaciones recurrentes (CONAGUA-CENAPRED 2018), con cuerpo de agua y localidad; alimentan el detalle de zonas y sitios ("N puntos a <15 km"). `data/puntos_inundacion.json`.
- **Agua observada por satélite** — ocurrencia de agua superficial 1984–2021 (JRC Global Surface Water, tiles públicos), visible a zoom ≥6.
- **Peligro municipal de inundación** — índice CENAPRED 2016 (quintiles relativos); solo se pinta el quintil "Muy alto" como referencia. `data/inundacion.json` (~1.1 MB).
- **Huracanes históricos** — 830 trayectorias 1980–2025 que tocan México (HURDAT2, ambas cuencas), coloreadas por categoría Saffir-Simpson, en `data/huracanes.json` (~0.4 MB). Ambas capas históricas cargan bajo demanda al activarlas.

## Fuentes de datos

| Fuente | Uso | Endpoint |
|---|---|---|
| Open-Meteo Forecast | Pronóstico ZMs, corredores y malla | `api.open-meteo.com/v1/forecast` |
| Open-Meteo Flood (GloFAS) | Señal de crecida fluvial | `flood-api.open-meteo.com/v1/flood` |
| NHC / NOAA | Ciclones tropicales (cono, track, puntos) | `mapservices.weather.noaa.gov/tropical/.../NHC_tropical_weather/MapServer` |
| USGS | Sismos M4.5+ (48 h) | `earthquake.usgs.gov/fdsnws/event/1/query` |
| CENAPRED (estático) | Peligro por inundación municipal | Atlas Nacional de Riesgos, capa 52 → `data/inundacion.json` |
| NOAA HURDAT2 (estático) | Trayectorias históricas de ciclones | `nhc.noaa.gov/data/hurdat/` → `data/huracanes.json` |

Las fuentes en vivo tienen CORS abierto — el cliente estático las consume sin backend ni API keys (salvo el token público de Mapbox). Las capas CENAPRED y HURDAT2 se pre-procesan offline (el ArcGIS del Atlas es demasiado lento para consultas en vivo) y viajan como GeoJSON estático del propio repo.

## Cuando una fuente falla

El portal nunca inventa. Si Open-Meteo no responde, no quedan datos viejos en
pantalla ni se pinta verde: el semáforo entra en estado **sin dato** (gris),
el titular lo dice, las cuatro regiones muestran "— sin dato" y una franja roja
persistente avisa *"Sin pronóstico. No podemos calcular el semáforo: lo que ves
no es una evaluación de riesgo"*, con botón de reintento. Si lo que falla es una
fuente secundaria (NHC, USGS, GloFAS), la franja es ámbar, nombra la fuente y
advierte que el semáforo **puede estar subestimando** el riesgo. Cada caída se
registra también como evento `fuente_caida`.

`FUENTES` marca cuáles son críticas; `marcarFuente()` las actualiza y
`renderAvisoFuentes()` pinta la franja.

## Stack

Single-file HTML (`index.html`), sin build, sin dependencias de Node. Carga:
- [Mapbox GL JS 3.8](https://www.mapbox.com/mapbox-gljs) (estilo `light-v11`)
- [Inter](https://fonts.google.com/specimen/Inter) desde Google Fonts

Caches del cliente: malla de lluvia en `localStorage` (por día calendario), ciclones NHC en `sessionStorage` (30 min).

## Deploy

Drop-in en cualquier static host. Para Vercel: importar el repo y ya. No hay build step. Todas las variables de entorno son opcionales y el portal funciona sin ninguna:

| Variable | Si no está |
|---|---|
| `ACCESO_CODIGOS` | Puerta abierta: el portal es público |
| `ACCESO_SECRETO` | Solo obligatoria si defines `ACCESO_CODIGOS` |
| `SUSCRIPCIONES_WEBHOOK` | Los registros de alertas quedan en estado `portal` |

`middleware.js` y `api/*` corren en Vercel Functions; en otro static host el
portal sigue funcionando pero sin puerta ni registro de alertas.

```bash
# Local preview (cualquier static server funciona)
python3 -m http.server 8000
# Abrir http://localhost:8000
```

## Datos

- **ZMs**: catálogo INEGI (75 zonas, 418 municipios; el Valle de México se desagrega en 5 sub-zonas)
- **Semáforo de protestas**: actualización semanal por equipo Aleph
- **Clima y riesgo**: fuentes en vivo listadas arriba

## Motor integral (prototipo) — `motor/`

Motor de fusión multi-señal que produce el **Nivel Operativo Integral** por objetivo (zona o sitio) en la escala de Protección Civil (sin alerta / verde / amarillo / naranja / rojo), con evidencia y acción:

```bash
python3 motor/corte.py                           # EL PRODUCTO: mensaje del corte (3×/día)
python3 motor/corte.py --simulacro huracan       # ensayo de ficha extraordinaria
python3 motor/ejercicio.py --hoy                 # snapshot técnico con evidencia completa
python3 motor/ejercicio.py --simulacro observado # + respuesta institucional (piso)
```

`corte.py` implementa el caso de uso del cliente: agrega por sus 4 regiones (`motor/regiones.json`), corre la máquina de estados NORMAL → SEGUIMIENTO → ALERTA → CIERRE y emite el mensaje de WhatsApp según las plantillas canónicas de `motor/PLANTILLAS.md` — tres cortes al día en condición normal (09:00, 14:00, 16:00), escalera de cadencia con alerta activa, ficha extraordinaria solo al cruzar a naranja/rojo, cierre explícito, y el silencio está prohibido. La memoria de estado y la bitácora de modo sombra viven en `motor/out/`.

Reglas de fusión: la peor señal creíble manda; lluvia sobre terreno vulnerable (puntos críticos CONAGUA / CENAPRED alto) escala un nivel; la respuesta institucional observada solo escala, nunca des-escala. Señales: física (Open-Meteo), ciclón (SIAT-CT estimado desde NHC), hidrología (GloFAS), observado (`motor/observados.json`, después Sonar). Salidas en `motor/out/` (evidencia completa + `sombra.jsonl` para medir precisión y anticipación). Solo stdlib de Python.

## Acceso por código y analíticos

### La puerta

El portal se puede compartir abierto o cerrado, y lo decide una variable de
entorno: **sin `ACCESO_CODIGOS` la puerta está abierta** y el sitio funciona
como siempre. En cuanto se define, `middleware.js` exige sesión para todo
salvo `/acceso.html`, `/api/entrar` y `/_vercel/*`; la navegación sin sesión se
redirige a la pantalla de acceso y las peticiones a `/api/*` y `/data/*`
reciben 401.

```bash
vercel env add ACCESO_SECRETO production   # cadena larga al azar: openssl rand -base64 48
vercel env add ACCESO_CODIGOS production   # "53fa…:PMI México,1cfa…:Aleph interno"
vercel --prod                              # la puerta se cierra con el despliegue
```

`ACCESO_CODIGOS` es una lista `codigo:Cliente` separada por comas. El código es
el secreto que se comparte con cada organización; el nombre es lo que viaja a
los analíticos, así que **un código por cliente** — es lo que permite responder
"¿lo está usando el cliente o solo nosotros?".

Al canjear el código, `/api/entrar` firma una cookie `cl_ses` (HMAC-SHA256
sobre `ACCESO_SECRETO`, HttpOnly, Secure, SameSite=Lax, 30 días). No hay base
de datos: la sesión es el propio token. `/api/salir` la caduca.

Límites conocidos, para no confiarse:

- Es **un secreto compartido por organización**, no usuarios individuales: quien
  reenvíe el código da acceso. Para identidad real por persona hace falta Clerk
  (Vercel Marketplace, pendiente de aceptar términos).
- El rate limit de `/api/entrar` es en memoria: frena a quien caiga en la misma
  instancia, no a un atacante en paralelo. La defensa que sí aguanta son códigos
  largos al azar (`openssl rand -hex 10`) más el retardo de 700 ms por fallo.
- Rotar un código es editar `ACCESO_CODIGOS` y volver a desplegar. Las sesiones
  ya firmadas siguen vivas hasta vencer; para invalidarlas todas, cambia
  `ACCESO_SECRETO`.

### Los analíticos

**Vercel Web Analytics** — sin cookies, sin huella de navegador. Hay que
activarlo una vez en Vercel → Project → Analytics; mientras no esté activo,
`/_vercel/insights/script.js` da 404 y no pasa nada más.

Cada evento lleva `cliente` (la organización de la sesión, o `anónimo` con la
puerta abierta) y `movil`. Los eventos del arranque se encolan hasta que
`/api/quien` responde, para que no se pierdan sin atribución.

| Evento | Responde a |
|---|---|
| `portal_abierto` | ¿Quién entra y desde qué dispositivo? |
| `panel_abierto` | ¿Qué parte del producto se usa? |
| `dia_cambiado` | ¿Miran solo hoy o planean la semana? |
| `pdf_descargado` / `pdf_fallo` | ¿Se usa el entregable, y en qué nivel? |
| `parte_whatsapp` | ¿Reenvían por su canal real? |
| `sitio_alta_iniciada` | ¿Cargan sus instalaciones? |
| `sitios_respaldo` / `sitios_restaurados` | ¿Pierden datos al cambiar de equipo? |
| `alerta_registro` | ¿Se apuntan a la lista de alertas? |
| `fuente_caida` | ¿Qué fuente falla y cuánto? (nos avisa antes que el cliente) |

Nunca viajan nombres de sitios, coordenadas, teléfonos ni el nombre de la
persona. La única etiqueta de identidad es la organización.

## Alertas por WhatsApp

El protocolo define qué llega — cortes de 09:00, 14:00 y 16:00, y fichas inmediatas solo en naranja/rojo — así que el registro pide únicamente nombre, número y regiones (Norte/Occidente/Centro/Sureste). El registro va a `api/suscribir.js` (Vercel Function), que valida, normaliza (+52) y reenvía al webhook central si `SUSCRIPCIONES_WEBHOOK` está configurado — el punto de integración con Hamilton/Sonar, donde correrá el envío real por WhatsApp.

**El estado del registro se dice con precisión**, porque "el servidor respondió" no es "quedaste dado de alta":

| Estado | Qué pasó | Qué ve el usuario |
|---|---|---|
| `central` | La central aceptó el alta | Alta confirmada · botón **Darme de baja** (que sí llama a la central) |
| `portal` | Llegó al endpoint, pero no hay `SUSCRIPCIONES_WEBHOOK` | Anotado, sin central conectada · se le pide escribir a hola@alephri.com |
| `local` | Ni siquiera hubo red | Guardado solo en este equipo |

Hoy en producción `SUSCRIPCIONES_WEBHOOK` **no está configurado**, así que todo
registro cae en `portal`. El endpoint nunca escribe teléfonos ni nombres en los
logs (solo una huella tipo `+52···78`) y limita a 5 peticiones por minuto por IP.

## Plan de entregas

Ver [`TIMELINE.md`](TIMELINE.md) — hitos acordables con el cliente y pendientes de cada lado.

## Roadmap

- Proxy ligero en Vercel Functions: cachear Open-Meteo (plan comercial), parsear avisos SMN/CONAGUA
- Incendios forestales (NASA FIRMS vía pipeline cron)
- Semáforo probabilístico (Open-Meteo Ensemble API)

## Licencia

© 2026 Aleph. Todos los derechos reservados. Datos: Open-Meteo (CC BY 4.0), NOAA/USGS (dominio público), GloFAS (Copernicus).
