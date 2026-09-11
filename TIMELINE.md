# Climómetro — plan de entregas

Borrador para acordar con el cliente. Hugo lo pidió el 10-sep: *"delimitar las
cosas en el tiempo es importante... para que cuando nos pregunten, poder decir
en qué momento podríamos estar presentando algo"*. Las fechas son de
compromiso interno de Aleph; se confirman con él antes de publicarse.

## Dónde estamos

**Ficha PDF descargable (11-sep 2026)** — el MVP de entrega: el cliente descarga el documento de una hoja y lo reenvía por su cuenta, sin esperar la infraestructura de correo. Con esto ya sustituyen los pantallazos que hoy pegan en Teams.

**Beta funcional (10-sep 2026)** — presentada y validada: *"con lo que están
diciendo de las posibilidades, nos cubre la necesidad que tenemos ahorita"*.
Semáforo por regiones, corredores, ciclones NHC, sismos, crecidas, capas
históricas y envío manual por WhatsApp desde el portal.

## Hitos

| Versión | Qué incluye | Fecha objetivo | Depende de |
|---|---|---|---|
| **0.9 — Calibración** | Escala de Protección Civil evolutiva y acumulativa (verde/amarillo/naranja/rojo con acciones que se suman); geocercas de afectación por zona y por activo; cadencia de 3 cortes diarios con escalera en alerta; sismos a 48 h | **18-sep** | — (hecho salvo validación con su tabla oficial de conceptos) |
| **1.0 — Acceso y activos** | Activos del cliente cargados (almacenes grandes/medianos/pequeños, oficinas de venta, tiendas); acceso al portal para Safety y los 4 responsables regionales | **2-oct** | Lista de ubicaciones y de champions por región |
| **1.5 — Alertamiento automático** | Cortes automáticos 09:00/14:00/16:00 por WhatsApp y correo (requiere subdominio remitente con SPF/DKIM/DMARC y allowlist de su TI); fichas extraordinarias en naranja/rojo con cadencia del protocolo; confirmación de recepción del champion; cierre de alerta | **30-oct** | Números/correos confirmados y visto bueno del formato de ficha |
| **2.0 — Integración y alcance** | Vista interactiva embebida en su canal de Teams; volcán Popocatépetl (ceniza); señal de respuesta institucional (refugios, declaratorias) como insumo del semáforo | **dic 2026** | Acceso de TI a Teams; definición de alcance comercial |
| **Exploración** | Centroamérica y el Caribe (incl. República Dominicana), a partir de las mismas fuentes — NHC, Open-Meteo, USGS y GloFAS ya son regionales | por definir | Interés confirmado y alcance por mercado |

## Pendientes del cliente

1. **Tabla oficial de categorías de alerta** — Hugo ofreció conseguirla; con
   ella cerramos la redacción de cada nivel (ya implementamos su descripción).
2. **Ubicaciones de la operación** — almacenes por tamaño, oficinas de venta y
   tiendas en centros comerciales. Es lo que convierte el semáforo nacional en
   "mis activos".
3. **Champion por región** — quién recibe y confirma en naranja/rojo.
4. **Marco de compromisos con proveedores** — revisarlo en paralelo para dejar
   claros los alcances del servicio de ambos lados.

## Pendientes de Aleph

- Reporte de exposición pre-temporada por activo (sale de los datos que ya
  tenemos: HURDAT2, CENAPRED, puntos críticos de CONAGUA).
- Modo sombra corriendo durante la temporada para medir anticipación y
  precisión contra los avisos oficiales.
- Propuesta de alcances y modelo de servicio.
