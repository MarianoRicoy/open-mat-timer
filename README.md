# Open Mat Timer

Cronómetro web gratuito para academias de jiujitsu y MMA: configurá cantidad de rondas, duración de cada ronda y descanso entre ellas. El tiempo restante se calcula a partir del tiempo transcurrido real, sin acumular error por los intervalos del navegador.

## Requisitos

- Node.js 20 o superior
- npm

## Instalación

```bash
npm install
```

## Desarrollo

Esta app es **web**: no se abre sola al hacer doble clic en una carpeta. Tenés que levantar el servidor y entrar con el navegador.

```bash
cd "/Users/marianoricoy/Desktop/PROYECTOS/Open Mat Timer"
npm install
npm run dev -- --hostname 0.0.0.0
```

Luego abrí **http://localhost:3000** en el celular o **http://&lt;IP-de-tu-Mac&gt;:3000** desde la TV (misma Wi‑Fi).

> Usá `--hostname 0.0.0.0` para que otros dispositivos en la red local puedan conectar. **No hace falta internet**: el cronómetro local funciona sin vincular; el control remoto solo usa tu red y este servidor.

En macOS:

```bash
npm run dev:open
```

> **Nota:** `npm start` es solo para producción; antes hay que correr `npm run build`. Para probar en tu Mac usá `npm run dev`.

## Comprobaciones

```bash
npm run lint
npm run test
npm run build
```

## Uso

1. En **/** (panel de control): elegí un **preset** Guetho-style o editá rondas, duración y descanso.
2. Antes de iniciar se muestra la **duración total** de la sesión.
3. En la TV, abrí **Vista TV** (`/tv`). Se crea una **sala** con código de 6 letras y un **QR**.
4. En el celular, escaneá el QR o ingresá el mismo código en **Control remoto** (misma red Wi‑Fi).
5. Desde el celular podés **iniciar, pausar, reanudar y reiniciar**; la TV refleja el mismo estado (fuente de verdad en el servidor, motor de tiempo existente).
6. Si **recargás la TV**, al volver con `?room=CODIGO` (o el código guardado en la sesión del navegador) se **recupera** la sesión en curso.

### Vincular TV y celular (control remoto)

| Paso | TV / proyector | Celular |
|------|----------------|---------|
| 1 | Abrí `http://<IP>:3000/tv` | — |
| 2 | Copiá el código o mostrá el QR | Escaneá QR o abrí el enlace `/?room=CODIGO` |
| 3 | Solo muestra el cronómetro (opcional: pantalla completa) | Configurá presets y usá los botones de control |
| 4 | Recargá la página si hace falta: misma sala en la URL | Mantené la misma sala vinculada |

**Sin vincular:** el panel funciona como cronómetro **local** en un solo dispositivo (sin llamadas al servidor).

**Con vincular:** hace falta que ambos dispositivos alcancen el mismo `npm run dev` / servidor en la red local. No usamos servicios en la nube.

### Verificación del control remoto

- Verificado manualmente con **dos pestañas** del mismo navegador (vista TV + panel vinculado): inicio, pausa, recarga de la TV con `?room=CODIGO`, y logo (cargar / reemplazar / quitar) sin pausar ni reiniciar el cronómetro.
- **Pendiente:** prueba con **TV física** y **celular real** en la misma red Wi‑Fi (incluido el flujo de logo).

### Logo en TV

Desde el panel, sección **Logo en TV**: subí PNG/JPG/WebP (hasta 400 KB). En la vista TV el logo va **centrado arriba del reloj** (zona ~25 % alto × ~55 % ancho del marco 16:9, `object-contain`). Con sala vinculada, la TV actualiza al instante y conserva al recargar. Cambiar el logo **no** afecta el reloj.

**Verificación vista TV (navegador Mac):** composición revisada a **1280×720** y **1920×1080** (listo, ronda, descanso) con logo cuadrado y horizontal de prueba; sincronización del logo con dos pestañas. **Pendiente:** validación en **TV física** y celular real.

### Ejemplo de prueba manual

Tres rondas de 10 segundos con descanso de 5 segundos → tiempo total **00:40**.

## Rutas

| Ruta | Uso |
|------|-----|
| `/` | Presets, configuración táctil, control remoto |
| `/tv` | Display grande 16:9 para TV + código / QR |
| `GET/PATCH /api/sessions/:code` | Estado y comandos sincronizados |

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript (modo estricto)
- Tailwind CSS 4

## Licencia

Uso libre para academias y entrenadores.
