# Instalar Open Mat Timer (app móvil v0.1)

App **local offline** (Capacitor + Vite). Comparte el motor de `src/lib/timer` y presets (`src/lib/presets.ts`) con la web; **no** usa salas LAN ni Next.js.

## Requisitos

| Plataforma | Herramientas |
|------------|----------------|
| **Común** | Node 20+, npm, `npm run mobile:install` |
| **iPhone** | macOS, **Xcode** (App Store), **CocoaPods**, cuenta Apple (gratuita o Developer) |
| **Android** | **Android Studio** + SDK, **JDK 17** |

## Preparar el proyecto (una vez)

```bash
cd "/Users/marianoricoy/Desktop/PROYECTOS/Open Mat Timer"
npm run mobile:install
```

**iOS:** guía paso a paso con firma → **[ios-xcode-signing.md](./ios-xcode-signing.md)** (recomendado en iPhone).

Atajo:

```bash
./scripts/prepare-ios.sh
```

**Android:**

```bash
npm run mobile:build
cd mobile
npx cap add android   # primera vez
npx cap sync android
```

APK debug → **[android-apk.md](./android-apk.md)**.

## iPhone (dispositivo físico)

Resumen (detalle en [ios-xcode-signing.md](./ios-xcode-signing.md)):

1. `cd mobile && npx cap open ios`
2. **Signing & Capabilities** → Automatically manage signing → tu **Team**
3. Elegí el iPhone como destino → **Run** (▶)
4. Confiá el certificado en el iPhone si es la primera vez

## Android (dispositivo físico)

1. Depuración USB activada en el teléfono
2. `cd mobile && npx cap open android` → **Run**

O APK: ver [android-apk.md](./android-apk.md).

## Probar en navegador (sin instalar)

```bash
cd mobile
npm run dev
```

`http://localhost:5173` — sin backend.

## Prueba de 25 segundos en modo avión

1. Instalá la app en el iPhone (o Android)
2. Modo avión ON
3. Preset **Prueba 25s** → **Iniciar**
4. Bloqueá la pantalla a mitad de ronda → al desbloquear el tiempo debe coincidir con el transcurrido real

Checklist completo: [mobile-verification.md](./mobile-verification.md).

## Qué hace falta en la tienda (futuro)

Ícono, splash, política de privacidad, Chromecast sender/receiver — fuera del alcance de esta v0.1 local.
