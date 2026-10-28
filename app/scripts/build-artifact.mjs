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

js = js.replaceAll("/logo.png", logo).replaceAll("/copy-that.html", "https://github.com/lakshmant006-code/Figbuild").replace(/<\/script/gi, "<\\/script")

const html = `<title>HUSH</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${css}
/* host skeleton already pads the safe-area top/bottom, so only the side gutter is set here */
#root > div { padding-top: 12px; padding-bottom: 24px; padding-left: max(20px, env(safe-area-inset-left, 0px)); padding-right: max(20px, env(safe-area-inset-right, 0px)); }
</style>
<div id="root"></div>
<script type="module">
${js}
</script>
`
writeFileSync(out, html)
console.log(out, (html.length / 1024).toFixed(0) + " KB")
