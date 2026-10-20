#!/bin/zsh
# Rebuild every deliverable from the live app.
#   1. static server must be running:  python3 -m http.server 8443 --bind 127.0.0.1
#   2. run from the project root:      ./scripts/make-deliverables.sh
set -e
cd "$(dirname "$0")/.."
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
URL="http://127.0.0.1:8443"
ITER=iteration-009
mkdir -p "output/$ITER" output/showcase/cards output/showcase/app

shot() { # shot <file> <query>
  "$CH" --headless --screenshot="$1" --window-size=916,1316 --hide-scrollbars \
    --virtual-time-budget=12000 "$URL/?shot=1&$2" 2>/dev/null
  echo "  → $1"
}

echo "[1/6] four views + face + webgpu"
shot "output/$ITER/front.png" "bf=webgl2&az=0&noblink=1"
shot "output/$ITER/left.png"  "bf=webgl2&az=90&noblink=1"
shot "output/$ITER/back.png"  "bf=webgl2&az=180&noblink=1"
shot "output/$ITER/right.png" "bf=webgl2&az=270&noblink=1"
shot "output/$ITER/face.png"  "bf=webgl2&az=0&d=1.30&ty=1.60&tx=0&noblink=1"
shot "output/$ITER/webgpu.png" "bf=webgpu&az=0&noblink=1"

echo "[2/6] UI captures"
"$CH" --headless --screenshot="output/$ITER/ui-desktop.png" --window-size=1440,1000 \
  --hide-scrollbars --virtual-time-budget=25000 "$URL/?bf=webgl2" 2>/dev/null
"$CH" --headless --screenshot="output/$ITER/ui-webgpu.png" --window-size=900,1200 \
  --hide-scrollbars --virtual-time-budget=30000 "$URL/?bf=webgpu" 2>/dev/null
"$CH" --headless --screenshot="output/$ITER/ui-mobile.png" --window-size=500,900 \
  --hide-scrollbars --virtual-time-budget=25000 "$URL/?bf=webgl2" 2>/dev/null

echo "[3/6] title + credit cards"
"$CH" --headless --screenshot=output/title-card.png --window-size=736,976 --hide-scrollbars \
  --virtual-time-budget=5000 "$URL/tools/__card.html?c=title" 2>/dev/null
"$CH" --headless --screenshot=output/credit-card.png --window-size=736,976 --hide-scrollbars \
  --virtual-time-budget=5000 "$URL/tools/__card.html?c=credit" 2>/dev/null
"$CH" --headless --screenshot=output/credit-bar.png --window-size=736,58 --hide-scrollbars \
  --virtual-time-budget=5000 "$URL/tools/__bar.html" 2>/dev/null

echo "[4/6] credited showcase cards"
for v in front left back right face; do
  cap="Yuu-Kapa — front view"
  case $v in
    left)  cap="Yuu-Kapa — her left, holding the pillow";;
    back)  cap="Yuu-Kapa — the mane from behind";;
    right) cap="Yuu-Kapa — her right, hand at the band";;
    face)  cap="Yuu-Kapa — face close-up";;
  esac
  q=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$cap")
  "$CH" --headless --screenshot="output/showcase/cards/card-$v.png" --window-size=900,1200 \
    --hide-scrollbars --virtual-time-budget=6000 "$URL/tools/__creditcard.html?img=/output/$ITER/$v.png&cap=$q" 2>/dev/null
done
cp "output/$ITER/front.png" "output/$ITER/face.png" output/showcase/cards/

echo "[5/6] showcase site copy"
rm -rf output/showcase/app/src output/showcase/app/vendor
cp -R src vendor output/showcase/app/
cp index.html output/showcase/app/

echo "[6/6] 60 s video"
./scripts/capture-turntable.sh
cd output
ffmpeg -y -loglevel error -loop 1 -i title-card.png -t 3 -r 10 -vf format=yuv420p title.mp4
ffmpeg -y -loglevel error -loop 1 -i credit-card.png -t 3 -r 10 -vf format=yuv420p credit.mp4
ffmpeg -y -loglevel error -stream_loop 2 -framerate 10 -i frames/f%03d.png -loop 1 -i credit-bar.png \
  -filter_complex "[0:v][1:v]overlay=0:H-58[v]" -map "[v]" -t 54 -c:v libx264 -pix_fmt yuv420p -r 10 orbit_credit.mp4
printf "file title.mp4\nfile orbit_credit.mp4\nfile credit.mp4\n" > list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i list.txt -c copy yuukapa_glm53flash_opencode_60s.mp4
rm -f orbit.mp4 orbit_credit.mp4 title.mp4 credit.mp4 list.txt
cd ..
ffprobe -v error -show_entries format=duration -of csv=p=0 output/yuukapa_glm53flash_opencode_60s.mp4
echo "done."
