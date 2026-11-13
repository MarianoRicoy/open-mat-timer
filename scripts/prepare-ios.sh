#!/usr/bin/env sh
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v pod >/dev/null 2>&1; then
  echo "CocoaPods no encontrado. Instalá con: brew install cocoapods"
  exit 1
fi

if [ ! -d /Applications/Xcode.app ]; then
  echo "ERROR: No está instalado /Applications/Xcode.app"
  echo "1. App Store → buscar «Xcode» → Obtener/Instalar (~12–15 GB, puede tardar)"
  echo "2. Abrí Xcode una vez y aceptá la licencia"
  echo "3. Terminal (pide contraseña de administrador de la Mac):"
  echo "   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
  echo "4. Volvé a ejecutar: ./scripts/prepare-ios.sh"
  exit 1
fi

if ! xcode-select -p 2>/dev/null | grep -q "Xcode.app"; then
  echo "ERROR: xcode-select no apunta a Xcode."
  echo "Ejecutá (pide contraseña de administrador):"
  echo "  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
  exit 1
fi

if ! xcodebuild -version >/dev/null 2>&1; then
  echo "ERROR: xcodebuild no responde. Abrí Xcode y aceptá la licencia, o ejecutá:"
  echo "  sudo xcodebuild -license accept"
  exit 1
fi

npm run mobile:build

cd mobile
if [ ! -d ios ]; then
  npx cap add ios
fi
npx cap sync ios

echo ""
echo "Listo. Abrí el proyecto con: cd mobile && npx cap open ios"
echo "Firma: docs/ios-xcode-signing.md"
