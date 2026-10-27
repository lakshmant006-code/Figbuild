# HUSH

"Give every complaint a heartbeat." A concept for tracking NYC noise complaints, where each complaint gets its own wave that calms as the case progresses.

Conceptual stages only. This is not live 311 data.

## Links

- Live page (artifact, version 12): https://claude.ai/artifact/YNj5idB5kJKqTjb3aH7z5i
- Figma file (first page is HUSH, old pages kept as "Archive · Copy That · …"): https://www.figma.com/design/ceVg13RB731RYvg2kdbSJo
- Source: [`copy-that.html`](copy-that.html), preview in [`hush-preview.png`](hush-preview.png)
- Rebrand commit: https://github.com/lakshmant006-code/Figbuild/commit/48344663ce3738d64eed4cf10a84d2c275d7ae1a

## What's in it

- **Hero:** a live wave for one complaint (HSH-48213), stages 1-5 from "The city received it." to "Official outcome posted."
- **01 Drop a sound:** tap the block, a ripple becomes a tracked reference number.
- **02 The city has ears:** 3D map with 15 neighborhoods, the citywide skyline and street level.
- **03 The silence moment:** "Did it actually get quieter?" Yes settles the wave, No reopens the case.
- **Brand:** wordmark, animated icon, palette (midnight navy, tangerine, butter, off-white), three posters.

## Skyline data

- Official NYC 3D Building Model from `s-media.nyc.gov` (916 MB, downloaded once).
- NYC Open Data: 5,206 buildings over 150 ft. 4,496 use real shapes from the 3D model; 710 (mostly built after the 2014 survey) are extruded from footprint and roof height.

## Not done

- Dark midnight-blue map with orange pulses (the cartoon map was kept).
- Mapbox (needs an API key; deck.gl is used instead).
- HUSH-branded phone screens and animation frames in Figma.
