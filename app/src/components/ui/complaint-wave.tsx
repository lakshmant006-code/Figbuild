import { useMemo } from "react"

import { cn } from "@/lib/utils"

const W = 320
const H = 96

// A wave that repeats every W units, so sliding it left by W loops with no seam.
function flowPath(seed: number) {
  const mid = H / 2
  const steps = 200
  const pts: string[] = []
  for (let i = 0; i <= steps * 2; i++) {
    const x = (i / steps) * W
    const k = (2 * Math.PI * x) / W
    const y = mid + 40 * (Math.sin(3 * k + seed) * 0.55 + Math.sin(5 * k + seed * 2.3) * 0.3 + Math.sin(8 * k + seed * 0.7) * 0.15)
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return pts.join(" ")
}

// The HUSH "living wave": loud (1) to calm (~0). It can drift sideways forever (flow), and eases to a new height when the stage changes.
export function ComplaintWave({
  amplitude = 1,
  color,
  seed = 1,
  className,
  flow = false,
  speed = 7,
}: {
  amplitude?: number
  color?: string
  seed?: number
  className?: string
  flow?: boolean
  speed?: number
}) {
  const d = useMemo(() => flowPath(seed), [seed])
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("h-24 w-full", className)}
      aria-hidden="true"
      style={{ maskImage: "linear-gradient(90deg, transparent 0%, #000 16%, #000 84%, transparent 100%)", WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 16%, #000 84%, transparent 100%)" }}
    >
      <defs>
        <linearGradient id="voice-wave" gradientUnits="userSpaceOnUse" x1="0" x2={W} y1="0" y2="0">
          <stop offset="0" stopColor="#9cc2ff" />
          <stop offset="0.5" stopColor="#0866ff" />
          <stop offset="1" style={{ stopColor: "var(--foreground)" }} />
        </linearGradient>
      </defs>
      <g style={{ transform: `scaleY(${Math.max(0.04, amplitude)})`, transformOrigin: `0px ${H / 2}px`, transition: "transform 1.6s cubic-bezier(0.32,0.72,0,1)" }}>
        <g style={flow ? { animation: `wave-flow ${speed}s linear infinite` } : undefined}>
          <path d={d} fill="none" stroke={color ?? "url(#voice-wave)"} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: "stroke 400ms" }} />
        </g>
      </g>
    </svg>
  )
}
