#!/usr/bin/env bash
# Builds a synthesized soundtrack (no external assets) and muxes it with the rendered frames.
set -euo pipefail
cd "$(dirname "$0")/build"
thump() { echo "aevalsrc='0.9*sin(2*PI*(52+30*exp(-t*40))*t)*exp(-t*9)':d=0.5:s=44100,adelay=$1|$1"; }
tick()  { echo "aevalsrc='0.35*sin(2*PI*1400*t)*exp(-t*60)':d=0.12:s=44100,adelay=$1|$1"; }
chime() { echo "aevalsrc='0.22*(sin(2*PI*880*t)+0.6*sin(2*PI*1320*t))*exp(-t*2.2)':d=1.8:s=44100,adelay=$1|$1"; }
ffmpeg -y -v error \
  -f lavfi -i "$(thump 1050)" -f lavfi -i "$(thump 1350)" -f lavfi -i "$(thump 1800)" -f lavfi -i "$(thump 2250)" \
  -f lavfi -i "$(tick 3000)" -f lavfi -i "$(tick 3090)" -f lavfi -i "$(tick 3180)" -f lavfi -i "$(tick 3270)" \
  -f lavfi -i "$(chime 3700)" \
  -f lavfi -i "anoisesrc=d=6:c=pink:a=0.5,lowpass=f=900,afade=t=in:st=0.25:d=0.9,afade=t=out:st=1.15:d=0.5,volume=0.35" \
  -filter_complex "amix=inputs=10:normalize=0,alimiter=limit=0.9,afade=t=out:st=5.5:d=0.5" -t 6 -ar 44100 audio.wav
ffmpeg -y -v error -framerate 30 -i frames/f%04d.jpg -i audio.wav \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 160k -shortest ../hush-logo-motion.mp4
echo "wrote $(cd .. && pwd)/hush-logo-motion.mp4"
