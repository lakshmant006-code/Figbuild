import { useEffect, useMemo, useRef, useState } from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

// Chime's motion language: a resident's voice becomes a signal, the city responds to it, and the signal settles.

export const EASE_SIGNAL = "cubic-bezier(0.2, 0, 0, 1)"
export const EASE_ARRIVE = "cubic-bezier(0.16, 1, 0.3, 1)"

export function useReducedMotion() {
  const q = "(prefers-reduced-motion: reduce)"
  const [reduce, setReduce] = useState(() => typeof window !== "undefined" && window.matchMedia?.(q).matches)
  useEffect(() => {
    const m = window.matchMedia?.(q)
    if (!m) return
    const on = () => setReduce(m.matches)
    m.addEventListener("change", on)
    return () => m.removeEventListener("change", on)
  }, [])
  return reduce
}

// Turn the loudness samples taken while recording into a short, normalized signature. Nothing else from the recording is kept.
export function toSignature(samples: number[], bins = 12): number[] | undefined {
  const voiced = samples.filter(v => v > 0.02)
  if (voiced.length < bins) return undefined
  const out: number[] = []
  for (let b = 0; b < bins; b++) {
    const a = Math.floor((b / bins) * voiced.length)
    const z = Math.max(a + 1, Math.floor(((b + 1) / bins) * voiced.length))
    out.push(Math.max(...voiced.slice(a, z)))
  }
  const top = Math.max(...out)
  return out.map(v => Math.round((0.15 + 0.85 * (v / top)) * 100) / 100)
}

// Typed reports get a neutral, even shape so the slot never sits empty.
const NEUTRAL = [0.35, 0.5, 0.42, 0.5, 0.35, 0.5, 0.42, 0.5, 0.35, 0.5, 0.42, 0.35]

// The small "that's my report" mark. Static once it has appeared; decoration, not an identifier.
export function SignalSignature({
  samples,
  height = 14,
  contract = false,
  delay = 0,
  className,
}: {
  samples?: number[]
  height?: number
  contract?: boolean
  delay?: number
  className?: string
}) {
  const s = samples ?? NEUTRAL
  const bar = Math.max(2, Math.round(height / 7))
  const gap = Math.max(1.5, bar * 0.75)
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex shrink-0 items-center align-middle", className)}
      style={{
        height,
        gap,
        opacity: samples ? 1 : 0.55,
        transformOrigin: "50% 50%",
        animation: contract ? `sig-contract 240ms ${EASE_SIGNAL} ${delay}ms both` : undefined,
      }}
    >
      {s.map((v, i) => (
        <span key={i} className="rounded-full" style={{ width: bar, height: Math.max(bar, v * height), background: samples ? `color-mix(in srgb, var(--accent) ${100 - i * 4}%, var(--foreground))` : "var(--muted-foreground)" }} />
      ))}
    </span>
  )
}

// A city response arrives: one faint ring contracts onto the milestone, then the check resolves. Plays once per milestone.
const arrived = new Set<string>()
export function MilestoneDot({ id, done, now, step, fresh }: { id: string; done: boolean; now: boolean; step: number; fresh: boolean }) {
  const reduce = useReducedMotion()
  const [play] = useState(() => fresh && done && !arrived.has(id) && !reduce)
  useEffect(() => {
    if (done && fresh) arrived.add(id)
  }, [id, done, fresh])
  return (
    <span className="relative z-10 grid size-8 shrink-0 place-items-center">
      {play && (
        <span aria-hidden="true" className="absolute inset-0 rounded-full border-2 border-accent" style={{ animation: `arrive-in 260ms ${EASE_ARRIVE} both` }} />
      )}
      <span
        className={cn(
          "grid size-8 place-items-center rounded-full transition-colors duration-200",
          done ? "bg-accent text-white" : now ? "bg-card text-accent ring-2 ring-accent" : "bg-fill text-muted-foreground",
        )}
        style={now ? { animation: "beat 1.6s ease-in-out infinite" } : play ? { animation: `arrive-fill 260ms linear both` } : undefined}
      >
        {done ? (
          <Check className="size-4" strokeWidth={3} style={play ? { animation: `arrive-check 100ms ${EASE_ARRIVE} 160ms both` } : undefined} />
        ) : (
          <span className="text-[13px] font-semibold">{step}</span>
        )}
      </span>
    </span>
  )
}

const RW = 320
const RH = 64

// Quiet becomes a visible release: the wave loses its amplitude from left to right, like the last vibration leaving a string.
// "yes" settles to a straight rule, "partly" keeps a slight variation, "no" keeps the signal.
export function ReleaseWave({
  to,
  play,
  duration = 350,
  seed = 5,
  className,
  onSettled,
}: {
  to: "yes" | "partly" | "no"
  play: boolean
  duration?: number
  seed?: number
  className?: string
  onSettled?: () => void
}) {
  const reduce = useReducedMotion()
  const final = to === "yes" ? 0 : to === "partly" ? 0.22 : 1
  const animate = play && !reduce && to !== "no"
  const [p, setP] = useState(animate ? 0 : 1)
  const settled = useRef(onSettled)
  settled.current = onSettled

  useEffect(() => {
    if (!animate) {
      setP(1)
      settled.current?.()
      return
    }
    const t0 = performance.now()
    let raf = 0
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / duration)
      setP(1 - Math.pow(1 - k, 3)) // smooth ease-out, no bounce
      if (k < 1) raf = requestAnimationFrame(step)
      else settled.current?.()
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [animate, duration])

  const d = useMemo(() => {
    const mid = RH / 2
    const front = p * 1.3 // a soft front sweeps past the right edge
    const pts: string[] = []
    for (let i = 0; i <= 160; i++) {
      const u = i / 160
      const x = u * RW
      const left = Math.min(1, Math.max(0, (front - u) / 0.3)) // 0 = still vibrating, 1 = released
      const e = left * left * (3 - 2 * left)
      const a = 1 - e * (1 - final)
      const k = 2 * Math.PI * u
      const y = mid + 26 * a * (Math.sin(3 * k + seed) * 0.55 + Math.sin(5 * k + seed * 2.3) * 0.3 + Math.sin(8 * k + seed * 0.7) * 0.15)
      pts.push(`${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(2)}`)
    }
    return pts.join(" ")
  }, [p, final, seed])

  return (
    <svg viewBox={`0 0 ${RW} ${RH}`} className={cn("h-16 w-full", className)} aria-hidden="true" preserveAspectRatio="none">
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
