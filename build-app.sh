#!/usr/bin/env bash
set -euo pipefail

APP_NAME="Set"
ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="$ROOT/dist-macos"
APP="$OUT/$APP_NAME.app"
CONTENTS="$APP/Contents"
MACOS="$CONTENTS/MacOS"
RES="$CONTENTS/Resources"

ENGINE_SRC="$ROOT/SetKotlin/build/native/nativeCompile/set-engine"
TUI_SRC="$ROOT/SolidTUI/set-tui"
ICON_SRC="$ROOT/AppIcon.icns"

rm -rf "$OUT"
mkdir -p "$MACOS" "$RES"

cp "$ENGINE_SRC" "$MACOS/set-engine"
cp "$TUI_SRC" "$MACOS/set-tui"
chmod +x "$MACOS/set-engine" "$MACOS/set-tui"

cat > "$MACOS/run-set.command" <<'EOF'
#!/bin/sh
set -u
DIR="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"
cd "$DIR"
export SET_ENGINE_PATH="$DIR/set-engine"
export TERM="${TERM:-xterm-256color}"
export OTUI_USE_CONSOLE=false
clear

if [ ! -x "$DIR/set-engine" ]; then
  echo "Missing executable: $DIR/set-engine"
  printf "Press Enter to close... "
  read dummy
  exit 1
fi

if [ ! -x "$DIR/set-tui" ]; then
  echo "Missing executable: $DIR/set-tui"
  printf "Press Enter to close... "
  read dummy
  exit 1
fi

"$DIR/set-tui"
STATUS=$?

printf "\nPress Enter to close... "
read dummy
exit "$STATUS"
EOF
chmod +x "$MACOS/run-set.command"

cat > "$MACOS/SetLauncher" <<'EOF'
#!/bin/sh
set -eu
EXEC_DIR="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"

/usr/bin/osascript <<OSA
tell application "Terminal"
    activate
    do script quoted form of POSIX path of "${EXEC_DIR}/run-set.command"
    delay 0.2
    set bounds of front window to {120, 80, 1320, 870}
end tell
OSA
EOF
chmod +x "$MACOS/SetLauncher"

cat > "$CONTENTS/Info.plist" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>

  <key>CFBundleExecutable</key>
  <string>SetLauncher</string>

  <key>CFBundleIdentifier</key>
  <string>com.brooks.set</string>

  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>

  <key>CFBundleName</key>
  <string>Set</string>

  <key>CFBundleDisplayName</key>
  <string>Set</string>

  <key>CFBundlePackageType</key>
  <string>APPL</string>

  <key>CFBundleShortVersionString</key>
  <string>1.0</string>

  <key>CFBundleVersion</key>
  <string>1</string>

  <key>CFBundleIconFile</key>
  <string>AppIcon.icns</string>
</dict>
</plist>
EOF

cp "$ICON_SRC" "$RES/AppIcon.icns"
if command -v codesign >/dev/null 2>&1; then
  codesign --force --sign - "$MACOS/set-engine"
  codesign --force --sign - "$MACOS/set-tui"
fi

echo "Built: $APP"