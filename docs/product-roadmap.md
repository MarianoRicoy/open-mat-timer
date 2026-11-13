# Open Mat Timer — producto final y camino técnico

Documento de referencia (no sustituye el README). La web en este repo es un **prototipo**; el producto objetivo son apps nativas en tiendas.

## Producto final

| Rol | Dispositivo | Qué hace |
|-----|-------------|----------|
| **Control** | iPhone / Android (app) | Presets, config, logo, zoom, iniciar / pausar / reiniciar |
| **Display** | TV | Solo reloj, fase (RONDA/DESCANSO), `n / total`, logo |
| **Modo solo** | Celular | Cronómetro completo **sin TV y sin internet** |

**No** debe depender de una Mac o PC encendida en el tatami.

## Qué hay hoy en el repo

- **Next.js** con panel (`/`) y vista TV (`/tv`).
- Motor de tiempo puro en `src/lib/timer/` (reutilizable).
- Modo **local** en un solo navegador: sin servidor.
- Modo **remoto LAN**: sesión en **memoria del servidor Node** (`src/lib/remote/session-store.ts`), API `GET/PATCH /api/sessions/:code`.
- Requiere un proceso `next dev` / `next start` en **algún equipo** en la red (hoy suele ser la Mac).

Eso sirve para validar UX y motor; **no** es la arquitectura de producción móvil.

## Camino más corto a App Store + Play Store

Reutilizar al máximo lo que ya está escrito:

1. **Extraer paquete compartido** (sin Next):
   - `lib/timer`, `lib/presets`, `lib/logo`, `lib/logo-trim`, `lib/logo-zoom`
   - Tipos de estado y snapshots
2. **App móvil con Capacitor** (recomendado por tiempo):
   - UI = adaptar `ControlTimerView`, `AcademyLogoControl`, `RemotePairingPanel` a una SPA Vite + React (mismo Tailwind).
   - Estado = `TimerProvider` **sin** dependencia de API remota: la **sesión vive en el celular** (memoria + persistencia local al cerrar app).
3. **TV = pantalla esclava** conectada al celular:
   - **Opción A (Chromecast):** receptor web personalizado + mensajes Cast desde la app (ver abajo).
   - **Opción B:** TV abre URL servida por el celular en hotspot (WebSocket o polling ligero) — más fricción en tiendas sin browser.
4. **Mantener este repo Next** como laboratorio web y regresiones del motor (tests Vitest).

**React Native / Expo** es viable si más adelante querés UX 100 % nativa; el cuello de botella no es el motor sino **sincronizar TV sin PC** (Cast o similar). Capacitor reutiliza el JSX actual con menos reescritura.

**No reutilizable tal cual:** rutas API Next, `session-store` en servidor, polling pensado para dos pestañas con Mac en el medio.

## Primera prueba con Chromecast (lo que tenés hoy)

### Qué necesita la TV para una vista **independiente**

| Método | ¿Vista independiente en TV? | Qué muestra |
|--------|---------------------------|-------------|
| **Duplicar pantalla / espejo** | No (clon del celular) | La misma pantalla del teléfono |
| **AirPlay espejo (iOS)** | No | Clon; a veces el reloj sigue si el SO no mata la app |
| **AirPlay video (app nativa con segunda salida)** | Sí (con desarrollo) | Stream de vídeo o vista dedicada; la web **no** lo expone bien |
| **Cast de pestaña (Chrome)** | Parcial | Una URL casteadas; el celular no puede controlar fácil otra URL sin cambiar pestaña |
| **Chromecast receptor personalizado (Web Receiver)** | **Sí** | HTML/JS en el Chromecast que solo dibuja `TvTimerView`; el celular envía estado por Cast SDK |

Para el producto final, el camino coherente es **Cast Custom Receiver** + app móvil como **única fuente de verdad**.

### Con el prototipo web actual (sin app nativa aún)

Chromecast **no** ejecuta tu `npm run dev` solo. Opciones realistas:

**A — TV con navegador integrado (si tu TV/Chromecast con Google TV tiene Chrome):**

1. Mac o PC en la red solo para **esta prueba** (hasta existir app móvil): `npm run dev -- --hostname 0.0.0.0`.
2. TV: abrir `http://<IP-de-la-Mac>:3000/tv` → anotar código / QR.
3. Celular: mismo Wi‑Fi → `http://<IP>:3000/?room=CODIGO`.
4. Subir logo y zoom desde el celular; iniciar, pausar, reanudar.

**B — Chromecast “Cast tab” desde el celular (limitado):**

1. En Chrome en Android, abrí `/tv?room=...` y usá **Transmitir** → Chromecast.
2. Para controlar, necesitás **otro dispositivo** con `/` o cambiar de pestaña (mala UX). Sirve solo para ver si el **layout** se lee bien en la TV.

**C — Próximo paso técnico (prototipo Cast):**

- Registrar en [Google Cast SDK](https://developers.google.com/cast) un **Custom Receiver** (URL HTTPS pública, ej. página estática con el UI de TV).
- App Capacitor con plugin Cast: al iniciar/pausar, enviar JSON `{ snapshot, logo, logoZoom }`.
- **Internet:** el framework Cast usa la nube de Google para emparejar; el **contenido del timer** puede ir solo por mensajes locales una vez enlazados (pero el primer pairing suele requerir internet).

## AirPlay y duplicación — contraste rápido

| | Internet | Sesión / reloj | Bloqueo del celular |
|--|----------|----------------|---------------------|
| **Cronómetro solo en app (objetivo)** | No | En el teléfono | Sigue si el OS permite audio/background timer (app nativa) |
| **Web actual modo local** | No | En el navegador del celular | Puede frenarse o ahorrar batería según navegador |
| **Web actual LAN + Mac servidor** | No (solo Wi‑Fi local) | En el **servidor Mac** (memoria); clientes espejan | TV sigue si el **servidor** sigue corriendo y la TV hace poll; el celular solo manda PATCH |
| **Duplicar pantalla** | No | En el celular | Si el SO pausa la app o el stream, la TV se congela |
| **AirPlay espejo** | No (Wi‑Fi local) | En el celular | Igual que duplicar |
| **Chromecast Custom Receiver** | Emparejado: sí; tick del reloj: en receiver o mensajes desde el teléfono | Ideal: **teléfono manda estado**; receiver solo pinta | Receiver sigue mostrando último frame si el teléfono se duerme, hasta que vuelva a enviar o el reloj corre en receiver con timestamp sincronizado |

**Recomendación:** en app nativa, el motor corre en el **teléfono** y envía `sessionStartMs` + config al receiver; el receiver calcula `getTimerSnapshot` localmente con su reloj (mismo código que `lib/timer`) para que la TV no dependa de poll cada segundo si el celular se bloquea brevemente.

## Prueba punta a punta (pendiente en hardware real)

### Objetivo

Iniciar en el celular → TV muestra reloj + logo → pausar y reanudar desde el celular.

### Pasos exactos (prototipo web + TV con navegador)

**Preparación**

1. Mac y celular y TV en la **misma Wi‑Fi** (anotá IP de la Mac: `ipconfig getifaddr en0`).
2. En el repo: `npm install && npm run build && npm run start -- --hostname 0.0.0.0`.
3. Comprobá desde el celular: `http://<IP-Mac>:3000` carga.

**TV**

4. Abrí `http://<IP-Mac>:3000/tv` (navegador de la TV o Google TV).
5. Pantalla completa si hay opción. Copiá el **código de 6 letras** o escaneá QR con el celular.

**Celular (control)**

6. Abrí `http://<IP-Mac>:3000/?room=CODIGO` (Safari o Chrome).
7. **Logo en TV:** cargar imagen; ajustar **Zoom en TV** hasta que en la miniatura 16:9 se vea bien.
8. Preset **Open mat** o uno corto para probar (ej. editar 2 rondas × 1 min).

**Ejecución**

9. En el celular: **Iniciar**. La TV debe pasar a `RONDA 1 / n` y countdown.
10. **Pausar** → TV muestra pausa / tiempo congelado según snapshot.
11. **Reanudar** → continúa.
12. Opcional: apagar pantalla del celular 30 s y mirar si la TV sigue (con servidor en Mac **debería** seguir; con solo Cast tab **no** es fiable).

**Criterio de éxito**

- Logo visible y legible a distancia.
- Sin scroll ni recortes en 16:9.
- Pausa/reanudar en &lt; 3 s de diferencia visual entre dispositivos.

### Si usás solo Chromecast (sin browser en TV)

Hasta tener receptor Cast, usá la prueba **B** solo para layout; la prueba de control **no** es válida con una sola pestaña casteadas.

## Orden de trabajo sugerido

1. Prueba física web (pasos arriba) y anotar fallos.
2. Extraer `lib/timer` a paquete importable.
3. Capacitor + Vite (panel móvil) + persistencia local.
4. PoC Cast Custom Receiver reutilizando estilos de `TvTimerView`.
5. TestFlight / Play Internal Testing.
6. Este repo Next queda como referencia y CI del motor.
