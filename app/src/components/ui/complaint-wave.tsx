import { useMemo } from "react"

import { cn } from "@/lib/utils"

// The HUSH "living wave": loud (1) to calm (0). Each stage calms it and shifts its colour.
function wavePath(width: number, height: number, amp: number, seed: number) {
  const mid = height / 2
  const steps = 120
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width
    const env = Math.sin((i / steps) * Math.PI)
    const y = mid + env * amp * (Math.sin(i * 0.8 + seed) * 0.6 + Math.sin(i * 1.9 + seed * 2.3) * 0.4)
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return pts.join(" ")
}

export function ComplaintWave({
  amplitude = 1,
  color,
  seed = 1,
  className,
}: {
  amplitude?: number
  color?: string
  seed?: number
  className?: string
}) {
  const d = useMemo(() => wavePath(320, 96, 40 * amplitude, seed), [amplitude, seed])
  return (
    <svg viewBox="0 0 320 96" className={cn("h-24 w-full", className)} aria-hidden="true">
      <defs>
        <linearGradient id="voice-wave" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#9cc2ff" />
          <stop offset="0.5" stopColor="#0866ff" />
          <stop offset="1" style={{ stopColor: "var(--foreground)" }} />
        </linearGradient>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={color ?? "url(#voice-wave)"}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: "stroke 300ms" }}
      />
    </svg>
  )
}
