import type { CSSProperties, ReactNode } from "react"
import { BatteryFull, Signal, Wifi } from "lucide-react"

// iPhone 17 Pro: 6.3" display, 402 × 874 pt (1206 × 2622 px @3x). Fixed size on purpose: the prototype is not responsive.
const W = 402
const H = 874
const BEZEL = 12

const screenVars = { "--sat": "54px", "--sab": "34px" } as CSSProperties

export function DeviceFrame({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center py-10" style={{ background: "var(--stage)" }}>
      <figure className="m-0 flex flex-col items-center gap-5">
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
              className="relative size-full overflow-hidden rounded-[56px] bg-background text-foreground"
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
