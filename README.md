# Chime

Give every complaint a heartbeat. Chime is a mobile prototype for reporting NYC noise complaints by voice and following each one until the city answers, on a live 3D map built from the official NYC 3D Building Model.

Everything shown is a concept. Case progress, agency replies and the live feed are simulated, not live 311 data.

## Try it

- Prototype (private artifact): https://claude.ai/artifact/RFmPjkXxW9VoUkY4z7apNH
- Run it yourself: `cd app && npm install && npm run dev`

## What's in the app

- **Onboarding:** neighborhood, the noises you hear, a voice demo.
- **Report:** type it, say it, or pick the kind of noise.
- **Track:** a delivery-style tracker. One line starts as a sound wave and settles into the New York skyline as the case moves along.
- **City:** a live 3D map with complaint clusters and recent reports.
- **Closure:** confirm it got better and keep an outcome record.
- **Notifications and widgets:** calm by default, with Home Screen widget designs in three sizes.

## Repo layout

- `app/` Vite, React, TypeScript, Tailwind (shadcn layout, components in `src/components/ui`).
- `app/public/map.html` the 3D map engine, generated from `copy-that.html` by `app/scripts/make-map.py`.
- `areas/` building-model tiles read by the map.
- `motion/logo-sting/` the logo motion video (source and render scripts).
- `copy-that.html` the earlier single-file web prototype (previous name and visuals).

## Notes

- Single-file build for sharing: `cd app && npm run build && node scripts/build-artifact.mjs out.html`.
- The Figma file's first page still carries the earlier brand and has not been updated to Chime.
