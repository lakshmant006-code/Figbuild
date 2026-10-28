// Renders the HUSH logo sting: node render.cjs  →  frames/ then hush-logo-motion.mp4
// Needs: playwright (global), ffmpeg. The shader is read straight from the app component so they never drift.
const { chromium } = require("playwright")
const fs = require("fs"), path = require("path"), { execSync } = require("child_process")

const FPS = 30, SECONDS = 6
const here = __dirname
const src = fs.readFileSync(path.join(here, "../../app/src/components/ui/waves-shaders-homlu-ui.tsx"), "utf8")
const frag = src.match(/const FRAG = `([\s\S]*?)`\n\nconst UNIFORMS/)[1]
const uniforms = src.match(/const UNIFORMS = (\{[\s\S]*?\n\})/)[1].replace(/ as \[number, number, number\]\[\]/, "")
const html = fs.readFileSync(path.join(here, "template.html"), "utf8")
  .replace("/*FRAG*/", () => frag.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${"))
  .replace("/*UNIFORMS*/", () => uniforms)
fs.mkdirSync(path.join(here, "build"), { recursive: true })
fs.writeFileSync(path.join(here, "build/index.html"), html)
for (const f of ["Bricolage-ExtraBold.ttf", "logo.png"]) fs.copyFileSync(path.join(here, f), path.join(here, "build", f))
const frames = path.join(here, "build/frames"); fs.rmSync(frames, { recursive: true, force: true }); fs.mkdirSync(frames)

;(async () => {
  const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--allow-file-access-from-files"] })
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } })
  p.on("pageerror", e => { console.error("pageerror", e.message); process.exit(1) })
  await p.goto("file://" + path.join(here, "build/index.html"))
  await p.evaluate(() => window.ready)
  const n = FPS * SECONDS
  for (let i = 0; i < n; i++) {
    const data = await p.evaluate(t => window.draw(t), i / FPS)
    fs.writeFileSync(path.join(frames, `f${String(i).padStart(4, "0")}.jpg`), Buffer.from(data.split(",")[1], "base64"))
    if (i % 30 === 0) console.log("frame", i, "/", n)
  }
  await b.close()
  console.log("frames done")
})().catch(e => { console.error(e); process.exit(1) })
