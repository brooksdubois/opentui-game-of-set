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
