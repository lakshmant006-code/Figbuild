import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { BatteryFull, Signal, Wifi } from "lucide-react"

// iPhone 17 Pro: 6.3" display, 402 × 874 pt (1206 × 2622 px @3x). Fixed size on purpose: the prototype is not responsive.
const W = 402
const H = 874
const BEZEL = 12

const screenVars = { "--sat": "54px", "--sab": "34px" } as CSSProperties

// The whole device is scaled uniformly to fit the window (like a prototype viewer), so it is always fully visible.
// The app inside keeps its fixed 402 x 874 layout: nothing in it reflows.
function useFitScale() {
  const [scale, setScale] = useState(1)
  const ref = useRef(1)
  useEffect(() => {
    const fit = () => {
      const s = Math.min(1, (window.innerHeight - 24) / (H + BEZEL * 2 + 52), (window.innerWidth - 16) / (W + BEZEL * 2 + 10))
      ref.current = Math.max(0.4, s)
      setScale(ref.current)
    }
    fit()
    window.addEventListener("resize", fit)
    return () => window.removeEventListener("resize", fit)
  }, [])
  return { scale, ref }
}

// Mouse drag scrolls like a finger would. Touch and wheel already work natively.
function useDragScroll(screen: React.RefObject<HTMLDivElement | null>, scale: React.RefObject<number>) {
  useEffect(() => {
    const root = screen.current
    if (!root) return
    const scrollable = (el: HTMLElement | null, axis: "x" | "y") => {
      for (let n = el; n && n !== root.parentElement; n = n.parentElement) {
        const o = getComputedStyle(n)
        const can = axis === "y" ? /(auto|scroll)/.test(o.overflowY) && n.scrollHeight > n.clientHeight : /(auto|scroll)/.test(o.overflowX) && n.scrollWidth > n.clientWidth
        if (can) return n
      }
      return null
    }
    let sx = 0
    let sy = 0
    let down = false
    let moved = false
    let axis: "x" | "y" | null = null
    let target: HTMLElement | null = null
    let el: HTMLElement | null = null
    let from = 0
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return
      const t = e.target as HTMLElement
      if (t.closest("input,textarea,select,iframe")) return
      down = true; moved = false; axis = null; target = t; el = null
      sx = e.clientX; sy = e.clientY
    }
    const onMove = (e: PointerEvent) => {
      if (!down) return
      const dx = e.clientX - sx
      const dy = e.clientY - sy
      if (!axis) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return
        axis = Math.abs(dy) >= Math.abs(dx) ? "y" : "x"
        el = scrollable(target, axis) ?? scrollable(target, axis === "y" ? "x" : "y")
        if (el && !scrollable(target, axis)) axis = axis === "y" ? "x" : "y"
        if (!el) { down = false; return }
        from = axis === "y" ? el.scrollTop : el.scrollLeft
        moved = true
      }
      if (!el) return
      const k = scale.current || 1
      if (axis === "y") el.scrollTop = from - (e.clientY - sy) / k
      else el.scrollLeft = from - (e.clientX - sx) / k
    }
    const onUp = () => {
      if (moved) {
        const stop = (ev: Event) => { ev.stopPropagation(); ev.preventDefault() }
        window.addEventListener("click", stop, { capture: true, once: true })
        window.setTimeout(() => window.removeEventListener("click", stop, { capture: true }), 0)
      }
      down = false
    }
    root.addEventListener("pointerdown", onDown)
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      root.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [screen, scale])
}

export function DeviceFrame({ children }: { children: ReactNode }) {
  const { scale, ref } = useFitScale()
  const screen = useRef<HTMLDivElement>(null)
  useDragScroll(screen, ref)
  return (
    <div className="fixed inset-0 grid place-items-center overflow-hidden" style={{ background: "var(--stage)" }}>
      <figure className="m-0 flex flex-col items-center gap-5" style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
        <div className="relative" style={{ width: W + BEZEL * 2, height: H + BEZEL * 2 }}>
          {/* side hardware: action button, volume, power, camera control */}
          {[
            { side: "left", top: 150, h: 34 },
            { side: "left", top: 216, h: 62 },
            { side: "left", top: 292, h: 62 },
            { side: "right", top: 232, h: 98 },
            { side: "right", top: 560, h: 68 },
          ].map((b, i) => (
            <span
              key={i}
              className="absolute w-[4px] rounded-[2px]"
              style={{ top: b.top, height: b.h, [b.side]: -3, background: "linear-gradient(90deg,#5b6a8a,#2a3350)" }}
            />
          ))}

          <div
            className="absolute inset-0 rounded-[68px]"
            style={{
              padding: BEZEL,
              background: "linear-gradient(145deg,#56668a 0%,#26304a 38%,#3a4767 62%,#1c2338 100%)",
              boxShadow: "0 40px 90px rgb(8 20 60 / 0.35), inset 0 0 0 1.5px rgb(255 255 255 / 0.18), inset 0 0 0 3px rgb(0 0 0 / 0.35)",
            }}
          >
            <div
              ref={screen}
              className="phone-screen relative size-full overflow-hidden rounded-[56px] bg-background text-foreground"
              style={{ ...screenVars, boxShadow: "0 0 0 5px #000", isolation: "isolate", transform: "translateZ(0)" }}
            >
              {children}

              {/* status bar */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex h-[54px] items-center justify-between bg-gradient-to-b from-background/70 to-transparent px-9 pt-3 text-foreground">
                <span className="text-[17px] font-semibold tracking-tight tabular-nums">9:41</span>
                <span className="flex items-center gap-1.5">
                  <Signal className="size-[17px]" strokeWidth={2.4} />
                  <Wifi className="size-[17px]" strokeWidth={2.4} />
                  <BatteryFull className="size-[25px]" strokeWidth={1.8} />
                </span>
              </div>

              {/* Dynamic Island */}
              <div className="pointer-events-none absolute top-[11px] left-1/2 z-50 h-[37px] w-[126px] -translate-x-1/2 rounded-full bg-black" />

              {/* home indicator */}
              <div className="pointer-events-none absolute bottom-2 left-1/2 z-50 h-[5px] w-[139px] -translate-x-1/2 rounded-full bg-foreground/80" />
            </div>
          </div>
        </div>
        <figcaption className="text-[13px] text-muted-foreground">iPhone 17 Pro · 402 × 874 pt · Fixed size, not responsive</figcaption>
      </figure>
    </div>
  )
}
