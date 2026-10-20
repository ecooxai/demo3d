#!/bin/zsh
# Capture a 180-frame turntable (2 deg per frame) of the character for the showcase video.
set -e
cd "$(dirname "$0")/.."
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT=output/frames
rm -rf "$OUT"; mkdir -p "$OUT"
N=180
for i in $(seq 0 $((N-1))); do
  az=$(( i * 2 ))
  printf -v f "%03d" $i
  echo "$OUT/f$f.png $az"
done | xargs -P 6 -n 2 sh -c '
  "$0" --headless --screenshot="$1" --window-size=736,976 --hide-scrollbars \
    --virtual-time-budget=9000 "http://127.0.0.1:8443/?shot=1&bf=webgl2&az=$2&d=3.55&ty=0.94&bare=1&noblink=1" >/dev/null 2>&1
' "$CH"
ls "$OUT" | wc -l
