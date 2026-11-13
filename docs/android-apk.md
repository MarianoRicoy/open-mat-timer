# Android: APK de prueba (debug)

El producto sigue siendo **multiplataforma**; Android comparte el mismo bundle web y motor que iOS (`npm run mobile:build` → `mobile/dist`).

## Qué hace falta (una vez)

| Herramienta | Uso |
|-------------|-----|
| **JDK 17** | Gradle / Android Studio |
| **Android Studio** | SDK, platform-tools, emulador opcional |

Comprobá Java:

```bash
/usr/libexec/java_home -V
```

Si no hay JDK, instalá [Android Studio](https://developer.android.com/studio) (incluye JDK) o `brew install --cask temurin@17`.

## Generar el proyecto nativo

```bash
npm run mobile:build
cd mobile
npx cap add android   # solo la primera vez
npx cap sync android
```

## APK debug (sin Play Store)

```bash
cd mobile/android
./gradlew assembleDebug
```

El APK queda en:

`mobile/android/app/build/outputs/apk/debug/app-debug.apk`

Instalación en dispositivo con USB y depuración activada:

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

O abrí el proyecto en Android Studio: `cd mobile && npx cap open android` → **Run**.

## Estado en este entorno

Si `java_home` no encuentra runtime o no hay Android SDK, **no se puede generar el APK aquí**; seguí los pasos de arriba en tu Mac cuando tengas JDK + Studio. El scaffold `mobile/android` se crea con `npx cap add android` (carpeta ignorada por git; regenerable).

Guía general: [mobile-install.md](./mobile-install.md).
