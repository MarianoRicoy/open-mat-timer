# Open Mat Timer

Cronómetro por rondas para academias de jiujitsu y MMA: el coach configura en el **celular**; la **TV** muestra solo el reloj, la fase, el número de ronda y el logo del equipo.

---

## Visión (producto final)

| Qué | Dónde |
|-----|--------|
| Configuración, presets, logo, controles (iniciar / pausar / reiniciar) | **App iPhone y Android** (App Store / Play Store) |
| Pantalla grande de entrenamiento | **TV** (reloj + `RONDA` o `DESCANSO` + `n / total` + logo) |
| Entrenamiento sin TV | **Solo el celular**, sin internet |

El uso normal en el tatami **no** debe depender de una Mac o PC encendida.

**Este repositorio no es esa app todavía.** Incluye:

1. **Prototipo web** (Next.js) — panel + TV en LAN. Ver abajo.
2. **App móvil v0.1** (`mobile/`) — Capacitor + Vite, cronómetro **local offline** (sin salas ni servidor). Instalación: [`docs/mobile-install.md`](docs/mobile-install.md). Verificación: [`docs/mobile-verification.md`](docs/mobile-verification.md).

La hoja de ruta hacia tiendas y Chromecast: [`docs/product-roadmap.md`](docs/product-roadmap.md).

---

## Qué es hoy (realidad del repo)

- Aplicación **Next.js** que corrés con Node en un equipo (`npm run dev` o `npm run start`).
- **Motor de tiempo** en `src/lib/timer/`: basado en timestamps reales (sin deriva por `setInterval`).
- **Panel** en `/` y **vista TV** en `/tv` (marco 16:9, logo con zoom, sonidos).
- Dos modos:
  - **Local:** un solo navegador, sin servidor (ideal para probar el cronómetro en el celular **sin** vincular TV).
  - **Remoto LAN:** el celular y la TV se vinculan con un código de 6 letras; la **sesión vive en la memoria del servidor Node** en el equipo donde corre Next (hoy, en la práctica, la Mac).

```text
Hoy (prototipo)          Objetivo (apps)
─────────────────        ─────────────────
Mac/PC + Node ───────►   Celular = “servidor” de la sesión
    ▲                    TV = display (Cast / receiver)
    │                    Sin PC en el tatami
Celular + TV (browser)
```

> **Estado: en desarrollo (pre‑v1).** Funciona para demos en Wi‑Fi local; **no** es la versión de tiendas ni el flujo definitivo sin computadora.

---

## Internet, sesión y celular bloqueado

| Escenario | ¿Internet? | ¿Dónde vive el cronómetro? | Celular bloqueado / Wi‑Fi cae |
|-----------|------------|-----------------------------|-------------------------------|
| **Modo local** (sin `?room=`) | No | Solo en ese navegador | Puede pausarse según el navegador; no hay TV |
| **Modo remoto web actual** | No (solo Wi‑Fi local) | En el **servidor Node** (memoria); TV y celular consultan/actualizan vía API | Si **Mac/servidor** sigue y la TV hace poll, la TV sigue; el celular al volver puede reconectar. Si **reiniciás el servidor**, la sala muere |
| **Producto final (app nativa)** | No para el timer; Cast puede usar internet solo para emparejar | En el **teléfono**; TV solo dibuja estado | App en segundo plano + receptor TV con reloj derivado del mismo motor (ver roadmap) |
| **Duplicar pantalla / AirPlay espejo** | No | En el celular | TV congela si el SO pausa la app o el enlace |

Detalle de **Chromecast vs AirPlay vs duplicar** y primera prueba con Cast: [`docs/product-roadmap.md`](docs/product-roadmap.md).

---

## Camino más corto a apps en tiendas (resumen)

1. Reutilizar **`src/lib/timer`**, presets, logo y componentes de control (extraerlos de Next a un paquete o SPA).
2. Envolver la UI móvil con **Capacitor** (menos reescritura que React Native puro).
3. Sesión y comandos **en el dispositivo del coach**, no en una Mac.
4. TV: **Chromecast Custom Web Receiver** (vista tipo `/tv`) alimentado por mensajes desde la app; alternativa transitoria = navegador de la TV apuntando a una URL (sigue haciendo falta un servidor hasta tener app).
5. Mantener **este repo web** para desarrollo, tests y capturas de referencia (`docs/verification/`).

---

## Prueba punta a punta (hardware) — pendiente

Objetivo: **iniciar en el celular**, ver **reloj + logo en la TV**, **pausar y reanudar** desde el celular.

**Pasos con el prototipo actual** (requiere **un equipo con Node** en la misma Wi‑Fi, usualmente la Mac):

1. `npm run build && npm run start -- --hostname 0.0.0.0` en la Mac; anotar IP (`ipconfig getifaddr en0`).
2. TV (navegador o Google TV): abrir `http://<IP>:3000/tv` → código / QR.
3. Celular: `http://<IP>:3000/?room=CODIGO` → cargar logo y zoom → **Iniciar**.
4. Comprobar `RONDA n / total`, pausa y reanudación en la TV en menos de ~3 s.

**Chromecast solo con “Cast tab”** no permite controlar y mostrar a la vez con una sola pestaña; sirve como prueba visual, no como flujo final. Pasos y límites: [`docs/product-roadmap.md`](docs/product-roadmap.md).

---

## Qué falta para la versión definitiva

- Apps **iOS / Android** distribuibles; arquitectura **sin PC** en el tatami.
- TV como **display dedicado** (Cast receiver o equivalente), no espejo del celular.
- Prueba física documentada (TV + celular real).
- Persistencia de sesión en el **móvil** (no memoria volátil del `next start` en una Mac).
- Guía operativa del día de entrenamiento.

---

## Requisitos (prototipo web)

- Node.js 20+
- npm

## Instalación y desarrollo

```bash
npm install
npm run dev -- --hostname 0.0.0.0
```

- Panel: **http://localhost:3000**
- TV: **http://localhost:3000/tv** (misma red: `http://<IP-de-tu-Mac>:3000`)

Usá `--hostname 0.0.0.0` para que el celular y la TV en la misma Wi‑Fi entren al servidor de desarrollo.

En macOS: `npm run dev:open`

Producción del prototipo: `npm run build` y luego `npm run start -- --hostname 0.0.0.0`.

## Comprobaciones

```bash
npm run lint
npm run test
npm run build          # web
npm run mobile:install # primera vez
npm run mobile:build   # app móvil
npm run build:all      # ambos
```

## App móvil (v0.1 local)

```bash
npm run mobile:install
./scripts/prepare-ios.sh   # iPhone: build + cap sync + pods (requiere Xcode)
cd mobile && npx cap open ios
```

Guías: [docs/ios-xcode-signing.md](docs/ios-xcode-signing.md) · [docs/android-apk.md](docs/android-apk.md) · [docs/mobile-install.md](docs/mobile-install.md)

Sin red: tras instalar, la app **no llama a internet** para el cronómetro. Motor y presets en `src/lib/` (compartidos con la web).

## Uso del prototipo web

1. **/** — presets, rondas/minutos/descanso, logo, control remoto.
2. **/tv** — display 16:9, código y QR para vincular.
3. Sin `?room=` — cronómetro **solo en ese dispositivo** (sin API).
4. Con `?room=CODIGO` — panel y TV sincronizados vía API en el servidor Node.

### Logo en TV

Subí imagen en el panel; ajustá **Zoom en TV** si el archivo tiene márgenes negros o transparentes. En la TV: logo arriba, línea `RONDA n / total` o `DESCANSO n / total` sobre el reloj.

### Ejemplo rápido de tiempos

3 rondas × 10 s + 5 s descanso → total **00:40**.

## Rutas

| Ruta | Uso |
|------|-----|
| `/` | Panel de control |
| `/tv` | Vista TV + sala / QR |
| `POST /api/sessions` | Crear sala |
| `GET/PATCH /api/sessions/:code` | Estado y comandos |

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Vitest

## Licencia

Uso libre para academias y entrenadores.

## Repositorio

Código en GitHub: [github.com/MarianoRicoy/open-mat-timer](https://github.com/MarianoRicoy/open-mat-timer) (el README en remoto puede ir detrás de commits locales hasta que hagas `git push`).
