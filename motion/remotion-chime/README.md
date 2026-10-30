# Chime launch film (Remotion)

A Remotion re-creation of the reference screen recording (`Screen Recording 2026-10-29 160317.mp4` on `master`): dark navy dot-grid scenes with kinetic type, a glass prompt composer that zooms in and types, a wordmark with a light streak, laptop / phone / tablet product shots, a lavender "Heard → Ready" section and a gradient end card. Content is Chime's: the app icon tile, the Chime mark, and the in-app Lucide icons (mic, map pin, arrow up, clipboard list, map, bar chart).

```bash
npm install
npm run studio          # preview
npm run render          # needs a Chromium: pass --browser-executable=<path> if auto-download is blocked
node check.mjs 40,130   # render stills of chosen frames to out/chk
```

Audio: `public/audio/score.wav` is built by `../product-film/audio_remotion.py` (supplied music bed + synthesised UI sounds).
