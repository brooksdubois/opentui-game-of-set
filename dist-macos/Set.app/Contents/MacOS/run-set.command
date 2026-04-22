#!/bin/sh
set -u
DIR="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"
LOG="$HOME/Library/Logs/SetLauncher.log"
mkdir -p "$(dirname "$LOG")"
cd "$DIR"
export SET_ENGINE_PATH="$DIR/set-engine"
export TERM="${TERM:-xterm-256color}"
export OTUI_USE_CONSOLE=false
clear

echo "Launching Set..." | tee "$LOG"
echo "DIR=$DIR" >> "$LOG"
echo "SET_ENGINE_PATH=$SET_ENGINE_PATH" >> "$LOG"
echo "OTUI_USE_CONSOLE=$OTUI_USE_CONSOLE" >> "$LOG"

if [ ! -x "$DIR/set-engine" ]; then
  echo "Missing executable: $DIR/set-engine" | tee -a "$LOG"
  printf "Press Enter to close... "
  read dummy
  exit 1
fi

if [ ! -x "$DIR/set-tui" ]; then
  echo "Missing executable: $DIR/set-tui" | tee -a "$LOG"
  printf "Press Enter to close... "
  read dummy
  exit 1
fi

echo "Starting set-tui attached to Terminal TTY" >> "$LOG"
"$DIR/set-tui"
STATUS=$?

echo >> "$LOG"
echo "set-tui exited with status $STATUS" | tee -a "$LOG"
printf "Press Enter to close... "
read dummy
exit "$STATUS"
