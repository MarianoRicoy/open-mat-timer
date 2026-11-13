# Instalar Open Mat Timer (app móvil v0.1)

App **local offline** (Capacitor + Vite). Comparte el motor de `src/lib/timer` con la web; **no** usa salas LAN ni Next.js.

## Requisitos

| Plataforma | Herramientas |
|------------|----------------|
| **Común** | Node 20+, npm, carpeta `mobile/` con dependencias instaladas |
| **iPhone** | macOS, **Xcode** (App Store), cuenta Apple (gratuita o Developer) |
| **Android** | **Android Studio** + SDK, JDK 17 |

## Preparar el proyecto (una vez)

```bash
cd "/Users/marianoricoy/Desktop/PROYECTOS/Open Mat Timer"
npm run mobile:install
npm run mobile:build
cd mobile
npx cap add ios      # requiere macOS + Xcode + **CocoaPods** (`sudo gem install cocoapods` o Homebrew)
npx cap add android  # requiere Android Studio
npx cap sync
```

## iPhone (dispositivo físico)

1. Abrí **Xcode**: `cd mobile && npx cap open ios`
2. En el proyecto **App**, target **Signing & Capabilities**:
   - Marcá **Automatically manage signing**
   - Elegí tu **Team** (Apple ID)
3. Conectá el iPhone por USB; desbloqueá el teléfono y confiá en la Mac si lo pide
4. Elegí el iPhone como destino (no simulador) y pulsá **Run** (▶)
5. Primera vez: en el iPhone → **Ajustes → General → VPN y gestión de dispositivos** → confiar en el certificado del desarrollador

**Alternativa sin Xcode en línea de comandos** (con firma ya configurada):

```bash
cd mobile
npm run cap:sync
npx cap run ios --target <UUID-del-dispositivo>
```

## Android (dispositivo físico)

1. En el teléfono: **Opciones de desarrollador** → depuración USB activada
2. `cd mobile && npx cap open android`
3. En Android Studio: **Run** sobre el dispositivo conectado

O:

```bash
cd mobile
npm run cap:sync
npx cap run android
```

## Probar en navegador (sin instalar)

Útil para desarrollo y para el test de **25 s en modo avión** en el escritorio:

```bash
cd mobile
npm run dev
```

Abrí `http://localhost:5173` (solo red local; no requiere backend).

## Prueba de 25 segundos en modo avión

1. Instalá la app o usá `npm run dev` en el teléfono con `vite --host` (avanzado)
2. Preset **personalizado**: 1 ronda, **0 min** ronda → cambiá a segundos vía fracción: usá **1 ronda**, en ronda poné **0,42 min** (~25 s) o editá fields: la UI usa minutos enteros — para 25 s exactos usá preset **Drills** acortado o el script abajo
3. **Recomendado:** en código de prueba ya existe motor por segundos; en UI móvil: **1 ronda**, **Ronda (min)** = 1 con workaround: poné **1** ronda y **0,5 min** descanso 0 — mejor: patch manual en prueba — **1 ronda, 1 min** mínimo en UI. Para 25 s: usar `npm run test` del motor; en dispositivo usá **1 ronda × 1 min** y validá bloqueo a mitad, o agregá en nota usar 1 ronda 0.5 min (30s) como aproximación.

Actually user asked 25 second session - I should add a preset or allow seconds in mobile for testing. Quick add "Prueba 25s" preset in presets.ts? That affects web too - good for testing:

```typescript
{
  id: "test-25s",
  name: "Prueba 25s",
  subtitle: "1 ronda · 25 s",
  config: { rounds: 1, roundDurationSec: 25, restDurationSec: 0 },
},
```

Add to presets.ts - single source

## Qué hace falta en la tienda (futuro)

- Ícono, splash, política de privacidad
- Chromecast sender + receiver
- No aplica en esta v0.1 local
