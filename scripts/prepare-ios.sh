#!/usr/bin/env sh
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v pod >/dev/null 2>&1; then
  echo "CocoaPods no encontrado. Instalá con: brew install cocoapods"
  exit 1
fi

if ! xcode-select -p 2>/dev/null | grep -q "Xcode.app"; then
  echo "Atención: xcode-select no apunta a Xcode.app."
  echo "Instalá Xcode desde la App Store y ejecutá:"
  echo "  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
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
