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

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en el navegador.

## Comprobaciones

```bash
npm run lint
npm run test
npm run build
```

## Uso

1. Definí **rondas**, duración de **ronda** (segundos) y **descanso** (segundos). Con descanso en `0` no hay pausas entre rondas.
2. Antes de iniciar se muestra el **tiempo total** de la sesión.
3. Usá **Iniciar**, **Pausar**, **Reanudar** y **Reiniciar**. La sesión termina automáticamente al finalizar la última ronda.

### Ejemplo de prueba manual

Tres rondas de 10 segundos con descanso de 5 segundos → tiempo total **00:40**.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript (modo estricto)
- Tailwind CSS 4

## Licencia

Uso libre para academias y entrenadores.
