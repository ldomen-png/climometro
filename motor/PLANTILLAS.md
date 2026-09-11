# Plantillas del servicio — spec canónica

El producto es el mensaje. Estas cinco plantillas son la interfaz del Climómetro
para el cliente; `corte.py` las implementa y este archivo manda. Cualquier cambio
de copy se decide aquí primero.

## La escala (lo que el cliente corrigió el 10-sep)

Es **evolutiva y acumulativa**: cada nivel hereda las acciones del anterior, y
el color describe el **estado del fenómeno**, no la urgencia del aviso — puede
sostenerse días (el Popocatépetl vive en amarillo). **Verde no es "libre"**:
es "hay algo que vigilar".

| Nivel | Significa | Acción que se suma |
|---|---|---|
| **Sin alerta** | No hay fenómeno que amerite atención | Monitoreo de rutina |
| 🟢 **Verde** | El fenómeno existe y puede escalar | Informarse, seguimiento |
| 🟡 **Amarillo** | Preparación | + revisar planes y directorios, preparar recursos, comunicación con cuerpos de socorro |
| 🟠 **Naranja** | Coordinación ante impacto | + comité, planeación, reprogramar operación, resguardar personal |
| 🔴 **Rojo** | La emergencia ya nos alcanzó | + refugios, evacuación, rescate; suspender operación |

El **pronóstico topa en naranja**. Solo el impacto de ciclón (SIAT-CT rojo) o
la afectación observada (refugios abiertos, evacuación, declaratoria) llegan a
rojo. GloFAS por sí solo topa en amarillo: su píxel de ~5 km puede no caer
sobre el río correcto.

**Geocerca de afectación**: cada zona en amarillo o peor genera un área
(25 / 40 / 60 km según nivel) para el personal que anda disperso por
territorio — no todos operan sobre una carretera. El mensaje dice quién de los
activos del cliente quedó dentro.

## Cadencia (la definió el cliente)

| Situación | Cortes |
|---|---|
| Normal | **3/día**: 09:00, 14:00, 16:00 (inicio de mañana, mitad del día, final del día) |
| Alerta activa (naranja) | **5/día**: + mitad de mañana y mitad de tarde |
| Alerta alta (rojo) | **+ noche y madrugada** |
| Ciclón en impacto | cadencia SIAT (cada 3 h) y extraordinarios en el momento |

## Reglas duras (aplican a todo mensaje)

1. **Segundo lector.** El mensaje se diseña para quien lo recibe *reenviado*
   (gerente regional que no conoce la herramienta): autocontenido, sin links
   obligatorios, sin jerga. Si el remitente tiene que editarlo antes de
   reenviar, la plantilla está mal.
2. **Una pantalla.** Presupuesto: 12 líneas máximo (ficha), 5 líneas (corte verde).
3. **Estructura fija.** Siempre el mismo orden: veredicto → alcance → detalle →
   acción → próxima revisión → fuentes. La escaneabilidad viene de la repetición.
4. **Verde y amarillo no interrumpen pero sí aparecen** en el corte (líneas de
   vigilancia y preparación). Nunca generan mensaje extraordinario: el aviso se
   dispara por transición a naranja/rojo, no por el color en sí.
5. **El silencio está prohibido.** Sin datos → sale la plantilla de falla. Un
   corte que no llega destruye más confianza que cualquier falsa alarma.
6. **Siempre hay "próxima revisión".** Convierte incertidumbre en cadencia; el
   horario sale de la escalera de cortes y en alerta pasa a cada 3 h.
7. **Agregación por las regiones del cliente** (`regiones.json`), nunca por
   nuestras 79 zonas. El cliente piensa en sus 4 regiones y sus canales de Teams.
8. **Confirmación solo cuando hay acción**: la ficha extraordinaria pide
   "Responde RECIBIDO"; el corte verde jamás pide nada.

## 1 · Corte NORMAL (09:00, 14:00 y 16:00)

Su trabajo no es informar: es demostrar diligencia ("estamos revisando").

```
🟡 *CLIMÓMETRO · mié 26 ago · corte 09:00*
Sin alertas naranja o roja en las 4 regiones.
_En preparación (amarillo)_: Norte: Hermosillo (descarga 4.4× la mediana 31d).
_En vigilancia (verde)_: Sureste: Tapachula, Coatzacoalcos +2 · Centro: VdM Centro.
Próxima revisión: 14:00.
Fuentes: SMN/Open-Meteo · NHC · USGS · GloFAS, revisadas 06:45.
```

## 2 · Corte con SEGUIMIENTO (ciclón relevante, aún sin naranja)

El caso "aún está lejos pero ya viene": anticipación sin costo de interrupción.
Sigue siendo el corte de siempre + un bloque; no es mensaje extraordinario.

```
🟢 *CLIMÓMETRO · jue 27 ago · corte 09:00*
Sin alertas naranja o roja; ciclón en seguimiento (abajo).
_Seguimiento_: Huracán *Lorena* cat. 1 — punto más cercano La Paz a ~450 km
(~60 h); etapa estimada VERDE. Si el vector se sostiene, probable AMARILLO
mañana.
Próxima revisión: 14:00.
Fuentes: SMN/Open-Meteo · NHC · USGS · GloFAS, revisadas 06:45.
```

## 3 · Ficha de ALERTA (extraordinaria — al cruzar a naranja/rojo)

Sale en el momento, no espera al corte. Pide confirmación. Cadencia 3 h.

```
🟠 *CLIMÓMETRO · jue 27 ago · ALERTA*
*Región Sureste — ALERTA NARANJA · Coordinación*
• Acapulco: SIAT-CT est. NARANJA·alarma — Lorena a 210 km (~20 h) · geocerca 40 km
• Chilpancingo: SIAT-CT est. NARANJA·alarma — Lorena (~20 h) · geocerca 40 km
→ Además: sesión de comité, planeación ante impacto, reprogramar operación y resguardar personal expuesto.
_Personal disperso en esas áreas: suspender actividad en calle._
⬤ Dentro de geocercas de afectación: CEDIS Acapulco, Oficina Chilpancingo.
Resto del país sin alerta: Norte, Occidente, Centro.
_Responde RECIBIDO para confirmar._
Próxima actualización: 13:00 (cadencia de alerta) o antes si cambia la situación.
Fuentes: SMN/Open-Meteo · NHC · USGS · GloFAS, revisadas 09:58.
```

## 4 · CIERRE de alerta

El mensaje que casi todos olvidan y el que más confianza construye. También es
la defensa ante falsas alarmas: una naranja que no pegó, *explicada*, suma.

```
🟢 *CLIMÓMETRO · vie 28 ago · corte 16:00*
*Cierre de alerta*: Sureste baja de alerta naranja/roja.
Lorena tocó tierra debilitada al sur de Puerto Escondido; sin daños reportados
en activos. Vigilar efectos residuales 24 h (encharcamientos, crecidas menores).
Próxima revisión: 09:00 de mañana.
Fuentes: SMN/Open-Meteo · NHC · USGS · GloFAS, revisadas 15:45.
```

## 5 · FALLA de verificación

```
⚪ *CLIMÓMETRO · corte 09:00*
No pudimos completar la verificación de este corte (falla técnica de fuentes).
Reintentamos a las 09:30 y avisamos.
```

## Métricas de la experiencia

1. **Cero días sin corte** (el SLA sagrado).
2. **Tiempo remitente→reenvío** — si se reenvía sin editar en <2 min, funciona.
3. **% de RECIBIDO en fichas naranja/roja.**
4. **Anticipación**: minutos entre nuestra ficha y el primer aviso oficial del
   mismo evento (se mide con `out/sombra.jsonl`).
