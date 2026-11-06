# Hello? — NYC noise complaint concept

Hello? gives every noise complaint a heartbeat: a unique animated sound wave that changes as the city acts on it, and settles into a calm line when the resident confirms it got quieter. Built for the NYC noise complaint design challenge.

All complaints, reference numbers, stages and outcomes in the concept are invented examples, not live 311 data.

## What's here

| Path | What it is |
| --- | --- |
| `copy-that.html` | The whole concept page: tracker, drop-a-sound, 3D city map (Day, Night, Diorama), brand and motion. Published as a Claude artifact. The file name is from the first name, Copy That. |
| `areas/*.txt` | Gzipped, base64 building meshes for 15 neighborhoods plus the citywide skyline, loaded on demand by the page. `areas/boroughs.json` holds the borough outlines. |
| `brand/` | App icon (`hello-icon.svg`, `hello-icon-512.svg`), the original artwork, and the billboard mockups. |
| `photoreal-map.html` | Standalone photoreal map using Google Photorealistic 3D Tiles. Needs your own Google Maps Platform key. Untested. |
| `tools/` | Python scripts that turn the NYC 3D Building Model into the files in `areas/`. |
| `*-preview.png` | Screenshots of each map mode. |

## Data sources

- Buildings: NYC 3D Building Model, Office of Technology and Innovation (CityGML, 2014 survey), from `s-media.nyc.gov` and the `georocket/new-york-city-model-enhanced` releases.
- Buildings over 150 ft: NYC Open Data Building Footprints (dataset `5zhs-2jue`).
- Borough outlines: public NYC borough boundaries GeoJSON.

## Rebuilding the building meshes

1. Download the DA tiles from the georocket releases or the city's CityGML zip.
2. `tools/extract_multi.py` and `tools/extract_multi2.py` cut each neighborhood out of the tiles.
3. `tools/mesh_multi.py <area> <lon> <lat>` builds the mesh for one area.
4. `tools/sky_extract_off.py` and `tools/sky_mesh.py` build the skyline.

The scripts need Python 3 with `numpy`, `pyproj`, `mapbox_earcut` and `shapely`, and were written for a specific scratch layout, so expect to adjust paths.

## Design files

- Figma design file: https://www.figma.com/design/ceVg13RB731RYvg2kdbSJo (Hello? page first)
- Figma Slides deck: https://www.figma.com/slides/B0g7FHnY90wsGyO67dnyxr
