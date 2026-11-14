# Verificación app móvil v0.1

Fecha de esta entrega: entorno de desarrollo del agente (sin dispositivo físico del usuario conectado).

## Qué se verificó automáticamente (CLI)

| Prueba | Resultado |
|--------|-----------|
| `npm run test` (motor + sesión web) | OK (10 tests) |
| `npm run build` (Next.js web) | OK |
| `npm run mobile:build` (Vite + `tsc`) | OK |
| `npx cap add android` + `cap sync` | OK (scaffold local; carpeta en `.gitignore`) |
| `npx cap add ios` | Scaffold **generado**; `pod install` requiere **Xcode.app** (`xcode-select` → Xcode, no solo CLI) |
| APK `assembleDebug` | **No generado aquí** — sin JDK en la Mac del agente; ver `docs/android-apk.md` |
| CocoaPods | Instalable con `brew install cocoapods` |

### Si iOS no abre en Xcode

1. Instalá **Xcode** (App Store) y `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
2. `./scripts/prepare-ios.sh` o `cd mobile && npx cap sync ios`
3. Firma: [ios-xcode-signing.md](./ios-xcode-signing.md)
4. `cd mobile && npx cap open ios`

## Qué verificar vos en dispositivo

### Modo avión · 25 s

1. Instalá la app (ver `docs/mobile-install.md`)
2. Activá **modo avión**
3. Elegí preset **Prueba 25s**
4. **Iniciar** → esperar fin de ronda
5. **Bloquear** el teléfono ~10 s a mitad de ronda → desbloquear → el tiempo debe **saltar** al valor correcto (motor por timestamps)
6. Cerrá la app (matar desde multitarea), reabrí → si estaba en curso, debe **reanudar estado** desde `Preferences` (sesión persistida)

### Logo y configuración

1. Cambiá rondas / logo / zoom
2. Matá la app y abrí de nuevo → mismos valores

### Audio en segundo plano (observado / esperado)

| Situación | Comportamiento esperado |
|-----------|-------------------------|
| App en primer plano | Beeps al cambiar de ronda/descanso (`Web Audio`) |
| Pantalla bloqueada durante ronda | **El reloj al desbloquear es correcto**; los beeps **pueden no sonar** en el momento del cambio porque `requestAnimationFrame` y la app están suspendidas |
| App vuelve a primer plano | Próximos cambios de fase vuelven a sonar si no está muteado |

**Comprobado en la Mac (entrega actual, post-`5faef24`):**

- [x] `npm run mobile:build` / web bundle en `mobile/dist` — OK
- [x] Scaffold `mobile/ios` + `App.xcworkspace` presente localmente
- [x] Xcode.app instalado — OK (Xcode 27.x, `xcode-select` → Xcode.app)
- [x] `pod install` / `./scripts/prepare-ios.sh` completo — OK
- [ ] `npx cap open ios` + Run en iPhone — **siguiente paso en Xcode (firma + dispositivo)**

**Resultado en iPhone del usuario:** pendiente hasta instalar Xcode. Documentá acá cuando pruebes:

- [ ] iPhone físico: tiempo tras bloqueo — OK / falló
- [ ] iPhone: beep en background — sonó / no sonó
- [ ] Android físico: (igual)
- [ ] Simulador iOS: build Xcode — OK / atascó en ___

## Pendiente

- Chromecast y vista TV independiente
- App Store / Play Store (cuentas, assets, review)
- Prueba física obligatoria del coach en el tatami
