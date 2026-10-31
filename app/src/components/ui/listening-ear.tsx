import { useRef, useState } from "react"

import { useReducedMotion } from "@/components/ui/signal"
import { cn } from "@/lib/utils"

// A soft two-note chime, synthesized on tap (no audio files).
function playChime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const out = ctx.createGain()
    out.gain.value = 0.16
    out.connect(ctx.destination)
    ;[
      [1396.9, 0],
      [2093, 0.12],
    ].forEach(([f, at]) => {
      for (const [m, a] of [[1, 1], [2.76, 0.18], [5.4, 0.05]] as const) {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.frequency.value = f * m
        const t = ctx.currentTime + at
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(a, t + 0.006)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6 / m)
        o.connect(g).connect(out)
        o.start(t)
        o.stop(t + 1.7)
      }
    })
    window.setTimeout(() => void ctx.close(), 2200)
  } catch {
    /* audio unavailable: the visual still answers */
  }
}

// The city's ear: draws itself in, sound arcs travel toward it and land, and a tap is answered with a chime.
export function ListeningEar({ className }: { className?: string }) {
  const reduce = useReducedMotion()
  const [heard, setHeard] = useState(0)
  const busy = useRef(false)

  const tap = () => {
    playChime()
    if (busy.current) return
    busy.current = true
    setHeard(h => h + 1)
    window.setTimeout(() => (busy.current = false), 700)
  }

  return (
    <button onClick={tap} aria-label="Chime listens. Tap to hear it." className={cn("relative grid place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white", className)}>
      {/* glass disc */}
      <span className="absolute inset-0 rounded-full border border-white/40 bg-white/12 shadow-[0_20px_60px_rgb(0_0_0/0.35)] backdrop-blur-xl" />
      {/* answered: one ring settles onto the ear */}
      {heard > 0 && !reduce && (
        <span key={heard} aria-hidden="true" className="absolute inset-[-6px] rounded-full border-2 border-white" style={{ animation: "arrive-in 520ms cubic-bezier(0.16,1,0.3,1) both" }} />
      )}
      <svg viewBox="0 0 64 64" className="relative size-[66%] overflow-visible" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {/* sound arriving from the left, landing at the ear */}
        {[0, 1, 2].map(i => (
          <path
            key={i}
            d="M0 -13 A 19 19 0 0 1 0 13"
            strokeWidth={2.4}
            transform="translate(10 33)"
            style={
              reduce
                ? { opacity: 0.35 + i * 0.2, transform: `translate(${-2 + i * 8}px, 33px)` }
                : { animation: `ear-arc 2.4s cubic-bezier(0.32,0.72,0,1) ${i * 0.8 + 0.9}s infinite both` }
            }
          />
        ))}
        {/* the ear */}
        <g transform="translate(14 6) scale(2.1)" strokeWidth={1.7}>
          <path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0" pathLength={1} strokeDasharray={1} style={reduce ? undefined : { strokeDashoffset: 1, animation: "ear-draw 1.1s cubic-bezier(0.32,0.72,0,1) 0.2s forwards" }} />
          <path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4" pathLength={1} strokeDasharray={1} style={reduce ? undefined : { strokeDashoffset: 1, animation: "ear-draw 0.8s cubic-bezier(0.32,0.72,0,1) 0.7s forwards" }} />
        </g>
      </svg>
    </button>
  )
}
