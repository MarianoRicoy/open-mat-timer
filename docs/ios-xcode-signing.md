# iPhone: Xcode, firma y primera instalación

La app móvil vive en `mobile/`. El cronómetro y presets son los mismos que en la web (`src/lib/timer`, `src/lib/presets.ts`), incluido **Prueba 25s**.

## Qué hace falta en la Mac (una vez)

| Herramienta | Estado típico | Cómo instalarlo |
|-------------|---------------|-----------------|
| **Xcode** (app completa, no solo CLI) | Obligatorio | App Store → **Xcode** |
| **CocoaPods** | Obligatorio para `pod install` | `brew install cocoapods` |
| **Node + dependencias del repo** | Obligatorio | `npm run mobile:install` |

Después de instalar Xcode:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
xcodebuild -version
```

Abrí Xcode al menos una vez y aceptá la licencia si lo pide (`sudo xcodebuild -license accept`).

## Generar / actualizar el proyecto iOS

Desde la raíz del repo:

```bash
./scripts/prepare-ios.sh
```

O manualmente:

```bash
npm run mobile:build
cd mobile
npx cap add ios    # solo la primera vez (si no existe mobile/ios)
npx cap sync ios   # copia el build web y ejecuta pod install
```

Si `npx cap sync ios` falla con *"xcodebuild requires Xcode"*, instalá Xcode y ejecutá `xcode-select` como arriba.

Las carpetas nativas `mobile/ios` y `mobile/android` están en `.gitignore`; se regeneran en tu máquina con Capacitor.

## Abrir en Xcode y firmar (Apple ID gratuito)

1. `cd mobile && npx cap open ios` — abre `App.xcworkspace` (usá siempre el **workspace**, no el `.xcodeproj` suelto).
2. En el navegador de proyecto, seleccioná el target **App**.
3. Pestaña **Signing & Capabilities**:
   - Marcá **Automatically manage signing**.
   - **Team**: tu Apple ID. Si no aparece: **Xcode → Settings → Accounts → +** → iniciá sesión.
   - Si el **Bundle Identifier** `com.openmattimer.app` choca con otro proyecto tuyo, cambiá el sufijo (ej. `com.openmattimer.app.mariano`) en Xcode y en `mobile/capacitor.config.ts` (`appId`), luego `npm run cap:sync` en `mobile/`.
4. Conectá el **iPhone por USB**, desbloquealo y tocá **Confiar** si la Mac lo pide.
5. Arriba, elegí tu **iPhone** como destino (no “Any iOS Simulator” si querés probar en hardware).
6. **Product → Run** (▶).

### Primera instalación en el iPhone

- **Ajustes → General → VPN y gestión de dispositivos** → confiar en tu certificado de desarrollador.
- Con cuenta gratuita, la app caduca ~7 días; volvé a **Run** desde Xcode para renovar.

## Checklist rápido en el teléfono

1. Modo avión ON.
2. Preset **Prueba 25s** → **Iniciar**.
3. Bloqueá la pantalla ~10 s a mitad de ronda → al desbloquear el tiempo debe estar **corregido** (motor por timestamps).
4. Logo y configuración: cerrá la app por completo y reabrí — deben persistir vía Capacitor Preferences.

Los beeps pueden **no sonar** justo al cambiar de fase con la pantalla bloqueada (Web Audio suspendido); el tiempo sí debe ser correcto.

## Problemas frecuentes

| Síntoma | Qué hacer |
|---------|-----------|
| `pod install` falla | Xcode instalado + `xcode-select` apuntando a Xcode + `pod --version` |
| “Failed to register bundle identifier” | Cambiá `appId` en `capacitor.config.ts` y el bundle en Xcode |
| No aparece el iPhone | Cable, confiar en el Mac, **Developer Mode** (iOS 16+) en Ajustes si Xcode lo pide |
| Solo Command Line Tools | `xcode-select -p` debe ser `/Applications/Xcode.app/Contents/Developer` |

Más contexto de instalación: [mobile-install.md](./mobile-install.md). Pruebas manuales: [mobile-verification.md](./mobile-verification.md).
