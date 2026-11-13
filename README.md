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
npm run dev
```

Luego abrí **manualmente** [http://localhost:3000](http://localhost:3000) (Safari, Chrome, etc.).

En macOS, para que intente abrir el navegador cuando el servidor esté listo:

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
3. Iniciá la sesión desde el celular y abrí **Vista TV** (`/tv`) en la pantalla del gimnasio; el tiempo y la fase se mantienen al cambiar de ruta sin recargar.
4. En TV usá **Pantalla completa**. Sonidos de inicio/fin de ronda se silencian con **Sonido on/off** (la pausa no reproduce el inicio otra vez).

## Rutas

| Ruta | Uso |
|------|-----|
| `/` | Presets, configuración táctil, controles |
| `/tv` | Display grande 16:9 para TV |

### Ejemplo de prueba manual

Tres rondas de 10 segundos con descanso de 5 segundos → tiempo total **00:40**.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript (modo estricto)
- Tailwind CSS 4

## Licencia

Uso libre para academias y entrenadores.
