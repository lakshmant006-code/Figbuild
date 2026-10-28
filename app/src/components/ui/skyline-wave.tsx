import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

// One line, straight at both ends. Only the middle moves: it starts as a loud, drifting sound wave and, as the
// case moves along, calms and reshapes itself into the New York skyline (Chrysler, Empire State, One World Trade).
const W = 340
const H = 72
const B = 64 // the straight baseline the line sits on
const ZONE = [0.13, 0.87] // where the middle of the line is allowed to move

// Skyline silhouette in a 320 x 88 design space, then mapped into the W x H box (baseline y = 66).
const RAW: [number, number][] = [
  [0, 88], [10, 88], [10, 66], [26, 66], [26, 58], [40, 58], [40, 88],
  [44, 88], [44, 48], [52, 48], [52, 40], [60, 40], [60, 88],
  // Chrysler Building
  [66, 88], [66, 44], [70, 44], [70, 36], [74, 30], [76, 22], [77, 12], [78, 22], [80, 30], [84, 36], [84, 44], [88, 44], [88, 88],
  // Empire State Building
  [96, 88], [96, 52], [104, 52], [104, 38], [110, 38], [110, 28], [113, 28], [113, 10], [114, 3], [115, 10], [115, 28], [118, 28], [118, 38], [124, 38], [124, 52], [130, 52], [130, 88],
  [134, 88], [134, 56], [150, 56], [150, 46], [160, 46], [160, 88],
  [166, 88], [166, 22], [174, 22], [174, 88],
  // One World Trade Center
  [186, 88], [186, 36], [198, 16], [200, 1], [202, 16], [214, 36], [214, 88],
  [220, 88], [220, 60], [236, 60], [236, 52], [250, 52], [250, 88],
  [258, 88], [258, 70], [290, 70], [290, 60], [304, 60], [304, 88], [320, 88],
]

// Subdivide every segment so corners stay sharp and points spread by horizontal distance (vertical edges need few).
function densify(pts: [number, number][], total: number) {
  const weight = (a: [number, number], b: [number, number]) => Math.abs(b[0] - a[0]) + 0.2 * Math.abs(b[1] - a[1])
  let sum = 0
  for (let i = 1; i < pts.length; i++) sum += weight(pts[i - 1], pts[i])
  const out: [number, number][] = [pts[0]]
  for (let i = 1; i < pts.length; i++) {
    const m = Math.max(1, Math.round((weight(pts[i - 1], pts[i]) / sum) * total))
    for (let k = 1; k <= m; k++) out.push([pts[i - 1][0] + ((pts[i][0] - pts[i - 1][0]) * k) / m, pts[i - 1][1] + ((pts[i][1] - pts[i - 1][1]) * k) / m])
  }
  return out
}

// The skyline fills only the middle of the line; both ends stay flat on the baseline.
const x0 = ZONE[0] * W
const x1 = ZONE[1] * W
const SKY = densify(
  [[0, B], ...RAW.map(([x, y]) => [x0 + (x / 320) * (x1 - x0), B - (88 - y) * 0.7] as [number, number]), [W, B]],
  380,
)
const N = SKY.length

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// How far along the wave → skyline change each stage is, and how loud the wave still is.
const MORPH = [0, 0.2, 0.5, 0.8, 1]
const LOUD = [1, 0.8, 0.55, 0.3, 0.1]

const SWEEP = 0.75 // how much of the move is spent travelling left to right (0 = everything at once)
const DURATION = 3200 // ms for one change of stage
const easeOutBack = (t: number) => {
  const c1 = 1.05
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
const U = Float32Array.from({ length: N }, (_, i) => i / (N - 1))

export function SkylineWave({ stage, seed = 1, className }: { stage: number; seed?: number; className?: string }) {
  const path = useRef<SVGPathElement>(null)
  const still = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  // per-point morph amount (0 = wave, 1 = skyline), so a wave-front can sweep across the line
  const cur = useRef(new Float32Array(N))
  const loud = useRef(1)

  useEffect(() => {
    const st = Math.min(4, stage)
    const target = MORPH[st]
    const loudT = LOUD[st]
    const from = Float32Array.from(cur.current)
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const t0 = performance.now()
    let last = t0
    let raf = 0

    const draw = (tt: number) => {
      let d = ""
      const m = cur.current
      for (let i = 0; i < N; i++) {
        const xw = U[i] * W
        const env = smooth(ZONE[0] * W - 4, ZONE[0] * W + 46, xw) * (1 - smooth(ZONE[1] * W - 46, ZONE[1] * W + 4, xw))
        const k = (2 * Math.PI * xw) / W
        const shape = Math.sin(3 * k + seed) * 0.55 + Math.sin(5 * k + seed * 2.3) * 0.3 + Math.sin(8 * k + seed * 0.7) * 0.15
        // the shape stays put; it only breathes a little
        const wy = B + env * (-20 + 22 * loud.current * (1 + 0.05 * Math.sin(tt * 0.8)) * shape)
        const x = xw + (SKY[i][0] - xw) * m[i]
        const y = wy + (SKY[i][1] - wy) * m[i] + env * 0.75 * Math.sin(tt * 1.2 + xw * 0.08)
        d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1)
      }
      path.current?.setAttribute("d", d)
    }

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const p = Math.min(1, (now - t0) / DURATION)
      for (let i = 0; i < N; i++) {
        // each point starts a little later than the one to its left: the change travels along the line
        const local = Math.min(1, Math.max(0, (p * (1 + SWEEP) - U[i] * SWEEP) / 1))
        cur.current[i] = from[i] + (target - from[i]) * easeOutBack(local)
      }
      loud.current += (loudT - loud.current) * (1 - Math.exp(-dt * 1.6))
      if (target === 1 && p >= 1) cur.current.fill(1)
      draw(now / 1000)
      raf = requestAnimationFrame(tick)
    }

    if (reduce) {
      cur.current.fill(target)
      loud.current = loudT
      draw(0)
    } else {
      raf = requestAnimationFrame(tick)
    }
    return () => cancelAnimationFrame(raf)
  }, [stage, seed])

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("block h-[72px] w-full", className)} role="img" aria-label="Your complaint as a sound wave that settles into the New York skyline">
      <defs>
        <linearGradient id="sky-g" gradientUnits="userSpaceOnUse" x1="0" x2={W} y1="0" y2="0" spreadMethod="repeat">
          <stop offset="0" stopColor="#a9ccff" />
          <stop offset="0.25" stopColor="#0866ff" />
          <stop offset="0.5" style={{ stopColor: "var(--foreground)" }} />
          <stop offset="0.75" stopColor="#0866ff" />
          <stop offset="1" stopColor="#a9ccff" />
          {!still && <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to={`${W} 0`} dur="5.5s" repeatCount="indefinite" />}
        </linearGradient>
      </defs>
      <path ref={path} fill="none" stroke="url(#sky-g)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
