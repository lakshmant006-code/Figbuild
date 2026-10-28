import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

// One line. It starts as a loud, drifting sound wave and, as the case moves along, calms and reshapes
// itself into the New York skyline (Chrysler, Empire State, One World Trade). No extra art, no extra space.
const W = 340
const H = 72
const N = 420

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

function resample(pts: [number, number][], n: number) {
  const seg: number[] = [0]
  for (let i = 1; i < pts.length; i++) seg.push(seg[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  const total = seg[seg.length - 1]
  const out: [number, number][] = []
  let j = 1
  for (let i = 0; i < n; i++) {
    const s = (i / (n - 1)) * total
    while (j < seg.length - 1 && seg[j] < s) j++
    const k = (s - seg[j - 1]) / Math.max(1e-6, seg[j] - seg[j - 1])
    out.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * k, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * k])
  }
  return out
}

const SKY = resample(
  RAW.map(([x, y]) => [x * (W / 320), 66 - (88 - y) * 0.7] as [number, number]),
  N,
)

// How far along the wave → skyline change each stage is, and how loud the wave still is.
const MORPH = [0, 0.2, 0.5, 0.8, 1]
const LOUD = [1, 0.8, 0.55, 0.3, 0.1]
const SPEED = [5, 6.5, 8.5, 11, 16] // seconds per drift across the width

export function SkylineWave({ stage, seed = 1, className }: { stage: number; seed?: number; className?: string }) {
  const path = useRef<SVGPathElement>(null)
  const state = useRef({ m: MORPH[Math.min(4, stage)], loud: LOUD[Math.min(4, stage)], phase: 0 })

  useEffect(() => {
    const target = MORPH[Math.min(4, stage)]
    const loudT = LOUD[Math.min(4, stage)]
    const speed = SPEED[Math.min(4, stage)]
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    let raf = 0
    let last = performance.now()

    const draw = () => {
      const s = state.current
      let d = ""
      for (let i = 0; i < N; i++) {
        const x0 = (i / (N - 1)) * W
        const k = (2 * Math.PI * (x0 + s.phase)) / W
        const wy = 36 + 26 * s.loud * (Math.sin(3 * k + seed) * 0.55 + Math.sin(5 * k + seed * 2.3) * 0.3 + Math.sin(8 * k + seed * 0.7) * 0.15)
        const sx = SKY[i][0]
        const sy = SKY[i][1]
        const x = x0 + (sx - x0) * s.m
        const y = wy + (sy - wy) * s.m
        d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1)
      }
      path.current?.setAttribute("d", d)
    }

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = state.current
      const ease = 1 - Math.exp(-dt * 1.5)
      s.m += (target - s.m) * ease
      s.loud += (loudT - s.loud) * ease
      s.phase = (s.phase + (W / speed) * dt) % W
      const settled = Math.abs(target - s.m) < 0.0008 && target === 1
      if (settled) {
        s.m = 1
        draw()
        return // the skyline holds still
      }
      draw()
      raf = requestAnimationFrame(tick)
    }

    if (reduce) {
      state.current.m = target
      state.current.loud = loudT
      draw()
    } else {
      raf = requestAnimationFrame(tick)
    }
    return () => cancelAnimationFrame(raf)
  }, [stage, seed])

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("block h-[72px] w-full", className)} role="img" aria-label="Your complaint as a sound wave that settles into the New York skyline" style={{ maskImage: "linear-gradient(90deg, transparent 0%, #000 4%, #000 96%, transparent 100%)", WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 4%, #000 96%, transparent 100%)" }}>
      <defs>
        <linearGradient id="sky-g" gradientUnits="userSpaceOnUse" x1="0" x2={W} y1="0" y2="0">
          <stop offset="0" stopColor="#9cc2ff" />
          <stop offset="0.5" stopColor="#0866ff" />
          <stop offset="1" style={{ stopColor: "var(--foreground)" }} />
        </linearGradient>
      </defs>
      <path ref={path} fill="none" stroke="url(#sky-g)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
