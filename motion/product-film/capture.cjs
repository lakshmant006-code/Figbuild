// Deterministic capture of the real Chime app: fake clock + manual animation time → frames at 30 fps.
// node capture.cjs <clip>   (needs playwright global, app/dist built)
const { chromium } = require("playwright")
const http = require("http"), fs = require("fs"), path = require("path")
const ROOT = path.join(__dirname, "../../app/dist")
const OUT = path.join(__dirname, "build/clips")
const FPS = Number(process.env.CAPFPS || 30), DT = 1000 / FPS
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".txt": "text/plain", ".json": "application/json" }
const server = http.createServer((q, s) => { const u = decodeURIComponent(q.url.split("?")[0]); const f = path.join(ROOT, u === "/" ? "index.html" : u); if (!fs.existsSync(f) || !fs.statSync(f).isFile()) { s.writeHead(404); return s.end() } s.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(s) })

const T0 = new Date("2026-10-28T23:41:00").getTime()
const mk = (ref, type, stage, extra = {}) => { const t = T0 - 54e5; return { ref, type, area: "williamsburg", stage, createdAt: t, times: Array.from({ length: stage + 1 }, (_, k) => t + k * 10e5), ...(stage === 4 ? { outcome: "Warning issued to the source." } : {}), ...extra } }
const SEED = mk("CHM-48213", "Music or party", 2, { note: "Example case" })
const PROFILE = { area: "williamsburg", hears: ["Music or party", "Neighbors"], notify: true }

// ---- clip definitions: steps are {t:ms} wait · {tap:text} · {ff:ms} fast-forward timers · {scroll:{to,ms}} · {mark:name}
const CLIPS = {
  report: { profile: PROFILE, cases: [SEED], steps: [
    { t: 900 }, { tap: "Can't sleep" }, { t: 600 }, { tap: "Speak your report" }, { t: 6400 },
    { mark: "send" }, { tap: "Send my voice" }, { t: 4600 }, { mark: "follow" }, { tap: "Follow your signal" }, { t: 2200 },
    { mark: "s1" }, { ff: 20000 }, { t: 4200 },
    { mark: "s2" }, { ff: 20000 }, { t: 3200 },
    { mark: "heard" }, { ff: 20000 }, { t: 6200 },
    { mark: "see" }, { tap: "See what happens next" }, { t: 2200 },
    { mark: "s4" }, { ff: 20000 }, { t: 3600 },
    { mark: "closure" }, { tap: "Did it get better?" }, { t: 2600 },
    { tap: "Yes, it's quiet" }, { t: 3800 },
  ] },
  onboarding: { profile: null, cases: null, steps: [
    { t: 2600 }, { tap: "Get started" }, { t: 1700 }, { tap: "Continue" }, { t: 1700 },
    { tap: "Continue" }, { t: 1500 }, { tap: "Start listening" }, { t: 5200 }, { tap: "Continue" }, { t: 2600 }, { tap: "Start reporting" }, { t: 1500 },
  ] },
  notices: { profile: PROFILE, cases: [mk("CHM-24057", "Neighbors", 4), mk("CHM-50346", "Construction", 3), SEED], seen: "0", steps: [
    { t: 900 }, { tap: "Notifications" }, { t: 2600 }, { scroll: { to: 520, ms: 1400 } }, { t: 900 }, { scroll: { to: 0, ms: 800 } }, { t: 400 }, { tap: "See it on your Home Screen" }, { t: 5200 },
  ] },
  widgets: { profile: PROFILE, cases: [SEED], steps: [
    { t: 600 }, { tap: "Track" }, { t: 1000 }, { tap: "Widgets" }, { t: 2000 }, { scroll: { to: 520, ms: 1500 } }, { t: 1200 }, { scroll: { to: 0, ms: 700 } }, { tap: "Home Screen" }, { t: 2600 },
  ] },
  insights: { profile: PROFILE, cases: [mk("CHM-24057", "Neighbors", 4), mk("CHM-50346", "Construction", 3), SEED], steps: [
    { t: 700 }, { tap: "Insights" }, { t: 2000 }, { scroll: { to: 560, ms: 1500 } }, { t: 1300 }, { scroll: { to: 1500, ms: 1700 } }, { t: 1500 }, { scroll: { to: 0, ms: 900 } }, { t: 400 }, { tap: "7 days" }, { t: 1600 }, { tap: "90 days" }, { t: 1800 },
  ] },
}

;(async () => {
  const name = process.argv[2]; const def = CLIPS[name]; if (!def) throw new Error("clip? " + Object.keys(CLIPS))
  const START = Number(process.env.LIMIT || 0)
  await new Promise(r => server.listen(0, r)); const port = server.address().port
  const dir = path.join(OUT, name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true })
  const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] })
  const ctx = await b.newContext({ viewport: { width: 600, height: 1100 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(([profile, cases, seen]) => { if (profile) localStorage.setItem("hush.profile.v1", JSON.stringify(profile)); if (cases) localStorage.setItem("hush.cases.v2", JSON.stringify(cases)); localStorage.setItem("hush.seen.v1", seen ?? "1") }, [def.profile, def.cases, def.seen])
  const p = await ctx.newPage(); await p.route(/areas\/|deck\.gl|fonts\.g/, r => r.abort())
  p.on("pageerror", e => { if (!/deck is not defined/.test(e.message)) console.log("pageerror", e.message) })
  await p.clock.install({ time: T0 })
  await p.goto(`http://localhost:${port}/`, { waitUntil: "domcontentloaded" })
  await p.waitForTimeout(700)
  for (let m = 1500, ok = false; !ok && m < 60000; m *= 2) { try { const nowT = await p.evaluate(() => Date.now()); await p.clock.pauseAt(new Date(nowT + m)); ok = true } catch (e) { console.log('pauseAt retry', m) } }
  await p.addStyleTag({ content: ".tap-dot{position:fixed;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(8,102,255,.28);border:2px solid rgba(8,102,255,.7);pointer-events:none;z-index:99999;animation:tapdot .55s cubic-bezier(.2,.7,.2,1) forwards}@keyframes tapdot{0%{transform:scale(.4);opacity:0}25%{opacity:1}100%{transform:scale(1.5);opacity:0}}" })
  let vnow = 0, frame = 0; const marks = {}
  const sync = v => p.evaluate(v => {
    for (const a of document.getAnimations()) { if (a.__t0 === undefined) { a.__t0 = v; a.pause() } a.currentTime = v - a.__t0 }
    document.querySelectorAll("svg").forEach(s => { try { s.pauseAnimations(); s.setCurrentTime(v / 1000) } catch {} })
  }, v)
  const shot = async () => { await sync(vnow); const h = await p.$(".phone-screen"); await h.screenshot({ path: path.join(dir, `f${String(frame).padStart(5, "0")}.jpg`), type: "jpeg", quality: 90 }); frame++ }
  const step = async () => { await p.clock.runFor(DT); vnow += DT; await shot() }
  const tap = async text => p.evaluate(t => { const els = [...document.querySelectorAll("button,[role=button],[role=tab],li button")]; const b = els.find(x => x.textContent.trim().startsWith(t) || (x.getAttribute("aria-label") || "").startsWith(t)); if (!b) throw new Error("no " + t); const r = b.getBoundingClientRect(); const d = document.createElement("div"); d.className = "tap-dot"; d.style.left = r.left + r.width / 2 + "px"; d.style.top = r.top + r.height / 2 + "px"; document.body.appendChild(d); setTimeout(() => d.remove(), 700); b.click() }, text)
  await shot()
  for (const s of def.steps) {
    if (s.t) { const n = Math.round(s.t / DT); for (let i = 0; i < n; i++) await step() }
    else if (s.tap) { await tap(s.tap); await step() }
    else if (s.ff) { await p.clock.fastForward(s.ff); await step() }
    else if (s.mark) marks[s.mark] = frame
    else if (s.scroll) { const n = Math.round(s.scroll.ms / DT); const from = await p.evaluate(() => { const els = [...document.querySelectorAll(".phone-screen div")].filter(d => /overflow-y-auto/.test(d.className) && d.scrollHeight > d.clientHeight + 4); const el = els[els.length - 1]; window.__sc = el; return el ? el.scrollTop : 0 }); for (let i = 1; i <= n; i++) { const k = i / n, e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; await p.evaluate(y => { window.__sc && (window.__sc.scrollTop = y) }, from + (s.scroll.to - from) * e); await step() } }
    if (process.env.LIMIT && frame > Number(process.env.LIMIT)) break
  }
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify({ frames: frame, fps: FPS, marks }))
  console.log(name, "frames", frame, JSON.stringify(marks))
  await b.close(); server.close(); process.exit(0)
})().catch(e => { console.error(e); process.exit(1) })
