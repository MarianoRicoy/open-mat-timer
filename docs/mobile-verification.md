# Verificación app móvil v0.1

Fecha de esta entrega: entorno de desarrollo del agente (sin dispositivo físico del usuario conectado).

## Qué se verificó automáticamente (CLI)

| Prueba | Resultado |
|--------|-----------|
| `npm run test` (motor + sesión web) | OK (10 tests) |
| `npm run build` (Next.js web) | OK |
| `npm run mobile:build` (Vite + `tsc`) | OK |
| `npx cap add android` + `cap sync` | OK en entorno del agente |
| `npx cap add ios` | **Atascó: CocoaPods no instalado** en la Mac del agente — ver paso abajo |

### Si iOS no genera la carpeta `mobile/ios`

1. Instalá CocoaPods: `brew install cocoapods` o [guía Capacitor](https://capacitorjs.com/docs/getting-started/environment-setup)
2. `cd mobile && npx cap add ios && npx cap sync`
3. Abrí con `npx cap open ios`

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

**Resultado en simulador/dispositivo real del agente:** no ejecutado en hardware del usuario. Documentá acá tu resultado:

- [ ] iPhone físico: tiempo tras bloqueo — OK / falló
- [ ] iPhone: beep en background — sonó / no sonó
- [ ] Android físico: (igual)
- [ ] Simulador iOS: build Xcode — OK / atascó en ___

## Pendiente

- Chromecast y vista TV independiente
- App Store / Play Store (cuentas, assets, review)
- Prueba física obligatoria del coach en el tatami
