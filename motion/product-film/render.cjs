// node render.cjs [fromSec] [toSec]  → build/frames/f00000.jpg … (1920×1080, 30 fps). FRAMES="0,5.5,…" renders single seconds to build/test/.
const { chromium } = require("playwright")
const fs = require("fs"), path = require("path"), http = require("http")
const FPS = 30, END = 72.7
const here = __dirname
;(async () => {
  const srv = http.createServer((q, s) => { const f = path.join(here, decodeURIComponent(q.url.split("?")[0])); if (!fs.existsSync(f) || !fs.statSync(f).isFile()) { s.writeHead(404); return s.end() } const ext = path.extname(f); s.writeHead(200, { "content-type": { ".html": "text/html", ".jpg": "image/jpeg", ".png": "image/png", ".json": "application/json" }[ext] || "application/octet-stream" }); fs.createReadStream(f).pipe(s) })
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port
  const b = await chromium.launch({ args: ["--allow-file-access-from-files", "--disable-web-security"] })
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } })
  p.on("pageerror", e => console.error("pageerror", e.message))
  p.on("console", m => { if (m.type() === "error") console.error("console", m.text()) })
  await p.goto(`http://localhost:${port}/compose.html`); await p.evaluate(() => window.ready)
  const shot = async (t, file) => { await p.evaluate(t => window.draw(t), t); await p.screenshot({ path: file, type: "jpeg", quality: 92 }) }
  if (process.env.FRAMES) {
    fs.mkdirSync(path.join(here, "build/test"), { recursive: true })
    for (const s of process.env.FRAMES.split(",")) { await shot(Number(s), path.join(here, `build/test/t${s}.jpg`)); console.log("t", s) }
  } else {
    const from = Math.floor(Number(process.argv[2] || 0) * FPS), to = Math.min(Math.floor(Number(process.argv[3] || END) * FPS), Math.floor(END * FPS))
    const dir = path.join(here, "build/frames"); fs.mkdirSync(dir, { recursive: true })
    for (let i = from; i < to; i++) { await shot(i / FPS, path.join(dir, `f${String(i).padStart(5, "0")}.jpg`)); if (i % 60 === 0) console.log("frame", i, "/", Math.floor(END * FPS)) }
  }
  await b.close(); srv.close(); console.log("done"); process.exit(0)
})().catch(e => { console.error(e); process.exit(1) })
