// node check.mjs 40,130,... → out/chk/f<frame>.png (bundles once, renders stills)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path"; import fs from "node:fs";
const browserExecutable = process.env.BROWSER || "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const frames = (process.argv[2] || "40").split(",").map(Number);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const comp = await selectComposition({ serveUrl, id: "ChimeLaunch", browserExecutable });
fs.mkdirSync("out/chk", { recursive: true });
for (const f of frames) { await renderStill({ composition: comp, serveUrl, frame: f, output: `out/chk/f${f}.png`, browserExecutable, imageFormat: "png", overwrite: true }); console.log("frame", f); }
