import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

// The HUSH voice: a glass orb that goes white → blue → black and swells with the sound.
export function VoiceOrb({ level, active, className }: { level: number; active: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const levelRef = useRef(level)
  levelRef.current = level

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const size = 280
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)
    let raf = 0
    let smooth = 0
    const draw = (now: number) => {
      const t = now / 1000
      smooth += (levelRef.current - smooth) * 0.25
      const amp = active ? 0.05 + smooth * 0.16 : 0.035
      const r = 86 + (active ? smooth * 20 : 0)
      ctx.clearRect(0, 0, size, size)
      const cx = size / 2
      const cy = size / 2

      // outer halo rings
      for (let i = 0; i < 3; i++) {
        const k = (t * 0.5 + i / 3) % 1
        ctx.beginPath()
        ctx.arc(cx, cy, r + 8 + k * 52, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(8,102,255,${(1 - k) * (active ? 0.35 : 0.12)})`
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // blobby body
      ctx.beginPath()
      for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.05) {
        const wob = 1 + amp * (Math.sin(a * 3 + t * 2.1) * 0.6 + Math.sin(a * 5 - t * 1.7) * 0.4)
        const x = cx + Math.cos(a) * r * wob
        const y = cy + Math.sin(a) * r * wob
        a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.save()
      ctx.shadowColor = "rgba(8,102,255,0.35)"
      ctx.shadowBlur = 40
      ctx.shadowOffsetY = 14
      const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
      const shift = Math.sin(t * 0.8) * 0.08
      g.addColorStop(0, "#ffffff")
      g.addColorStop(Math.min(0.9, 0.3 + shift), "#9cc2ff")
      g.addColorStop(Math.min(0.95, 0.55 + shift), "#0866ff")
      g.addColorStop(0.8, "#0a1030")
      g.addColorStop(1, "#000000")
      ctx.fillStyle = g
      ctx.fill()
      ctx.restore()

      // inner swirl + glass highlight
      ctx.save()
      ctx.clip()
      const sw = ctx.createRadialGradient(cx + Math.cos(t * 0.9) * 34, cy + Math.sin(t * 1.1) * 30, 4, cx, cy, r * 1.1)
      sw.addColorStop(0, "rgba(255,255,255,0.55)")
      sw.addColorStop(0.45, "rgba(8,102,255,0.0)")
      sw.addColorStop(1, "rgba(0,0,0,0.35)")
      ctx.fillStyle = sw
      ctx.fillRect(0, 0, size, size)
      const hl = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.5, 2, cx - r * 0.4, cy - r * 0.5, r * 0.6)
      hl.addColorStop(0, "rgba(255,255,255,0.9)")
      hl.addColorStop(1, "rgba(255,255,255,0)")
      ctx.fillStyle = hl
      ctx.fillRect(0, 0, size, size)
      ctx.restore()
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [active])

  return <canvas ref={ref} className={cn("size-[280px]", className)} style={{ width: 280, height: 280 }} aria-hidden="true" />
}

// Live bars in the same gradient: pale on the left, blue in the middle, black on the right.
export function VoiceBars({ history, className }: { history: number[]; className?: string }) {
  return (
    <div className={cn("flex h-12 items-center justify-center gap-[3px]", className)} aria-hidden="true">
      {history.map((v, i) => (
        <span
          key={i}
          className="w-[5px] rounded-full"
          style={{
            height: `${6 + v * 42}px`,
            background: `hsl(${222 - (i / history.length) * 6} ${100 - (i / history.length) * 40}% ${88 - (i / history.length) * 82}%)`,
            outline: "1px solid rgb(8 102 255 / 0.15)",
          }}
        />
      ))}
    </div>
  )
}
