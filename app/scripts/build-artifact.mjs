// Packs the Vite build into one self-contained HTML fragment (inline CSS + JS, logo as a data URI)
// for hosts that only accept a single page. Usage: node scripts/build-artifact.mjs <out.html>
import { readFileSync, readdirSync, writeFileSync } from "node:fs"
import path from "node:path"

const dist = path.resolve("dist")
const out = process.argv[2] ?? "dist/hush-artifact.html"
const assets = readdirSync(path.join(dist, "assets"))
const css = readFileSync(path.join(dist, "assets", assets.find(f => f.endsWith(".css"))), "utf8")
let js = readFileSync(path.join(dist, "assets", assets.find(f => f.endsWith(".js"))), "utf8")
const logo = "data:image/png;base64," + readFileSync(path.join(dist, "logo.png")).toString("base64")
const mapHtml = readFileSync(path.join(dist, "map.html"), "utf8")

// the bundler may write the path with ", ' or ` quotes, so match all three
js = js
  .replace(/(["'`])(?:\/)?logo\.png\1/g, "window.__HUSH_LOGO__")
  .replaceAll("/copy-that.html", "https://github.com/lakshmant006-code/Figbuild")
  .replace(/<\/script/gi, "<\\/script")
if (/logo\.png/.test(js)) throw new Error("logo.png reference left in the bundle")

const html = `<title>Chime</title>
<style>
${css}
</style>
<div id="root"></div>
<script>window.__HUSH_LOGO__ = ${JSON.stringify(logo)}</script>
<script>window.__HUSH_MAP_SRCDOC__ = ${JSON.stringify(mapHtml).replace(/<\/script/gi, "<\\/script")}</script>
<script type="module">
${js}
</script>
`
writeFileSync(out, html)
console.log(out, (html.length / 1024).toFixed(0) + " KB")
