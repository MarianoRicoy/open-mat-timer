# iPhone: Xcode, firma y primera instalación

La app móvil vive en `mobile/`. El cronómetro y presets son los mismos que en la web (`src/lib/timer`, `src/lib/presets.ts`), incluido **Prueba 25s**.

## Estado del entorno (Mac)

| Comprobación | Resultado |
|--------------|-----------|
| `/Applications/Xcode.app` | Instalado |
| `xcode-select -p` | Debe ser `/Applications/Xcode.app/Contents/Developer` |
| `npm run mobile:build` + `./scripts/prepare-ios.sh` | OK cuando Xcode está configurado |
| `pod install` | OK tras `prepare-ios` |

**Pasos que piden contraseña de administrador** (cuando Xcode ya esté en Aplicaciones):

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

Opcional si la licencia no se aceptó desde la app:

```bash
sudo xcodebuild -license accept
```

Abrir Xcode desde terminal después de instalar: `open -a Xcode`

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

## Después de instalar Xcode (orden exacto)

```bash
cd "/Users/marianoricoy/Desktop/PROYECTOS/Open Mat Timer"
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer   # contraseña admin
open -a Xcode   # primera vez: licencia + componentes si pide
./scripts/prepare-ios.sh
cd mobile && npx cap open ios
```

### En Xcode: Apple ID e iPhone

1. **Xcode → Settings…** (⌘,) → pestaña **Accounts** → **+** → **Apple ID** → iniciá sesión.
2. Barra superior: destino de ejecución → elegí tu **iPhone** (con cable USB, desbloqueado). Si no aparece: reconectá cable, tocá **Confiar** en el iPhone, en Xcode **Window → Devices and Simulators**.
3. Proyecto **App** (ícono azul) → target **App** → **Signing & Capabilities**:
   - **Automatically manage signing** ✓
   - **Team**: tu nombre (Personal Team).
4. **Product → Run** (⌘R). Primera vez en el iPhone: **Ajustes → General → VPN y gestión de dispositivos** → confiar.

### Pruebas en el iPhone (anotá resultados en [mobile-verification.md](./mobile-verification.md))

| Paso | Qué comprobar |
|------|----------------|
| Modo avión | Activalo antes de abrir la app (offline real). |
| Preset **Prueba 25s** | Iniciá; debe terminar la ronda ~25 s después. |
| Bloqueo | A mitad de ronda, bloqueá 10 s; al desbloquear el contador debe **recuperar** el tiempo correcto. |
| Campanas | Con app en primer plano deberían sonar al cambiar fase; con pantalla bloqueada **pueden no sonar** en el instante del cambio. |
| Persistencia | Matá la app, reabrí: logo/config deberían seguir (Preferences). |

**Comprobado en iPhone en esta entrega:** nada — Xcode no estaba instalado; la instalación física queda pendiente tras los pasos de arriba.

Más contexto: [mobile-install.md](./mobile-install.md).
