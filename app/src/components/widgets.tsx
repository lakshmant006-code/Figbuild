import type { CSSProperties, ReactNode } from "react"
import { Mic } from "lucide-react"

import { ComplaintWave } from "@/components/ui/complaint-wave"
import { MapTile, PhotoTile, photosFor } from "@/components/ui/moment-card"
import { STAGES, agencyFor, areaName, stageCopy, type Complaint } from "@/lib/data"
import { cn } from "@/lib/utils"

// iPhone 17 Pro widget sizes in points (402 pt wide screen).
export const SIZES = {
  small: { w: 170, h: 170 },
  medium: { w: 362, h: 170 },
  large: { w: 362, h: 382 },
} as const
export type WidgetSize = keyof typeof SIZES

export type WidgetId = "signal" | "speak" | "nearby" | "tracker"

export const WIDGETS: { id: WidgetId; size: WidgetSize; name: string; desc: string }[] = [
  { id: "signal", size: "small", name: "Signal", desc: "Where your newest case is right now." },
  { id: "speak", size: "small", name: "Speak", desc: "One tap to report by voice." },
  { id: "nearby", size: "medium", name: "Is the city listening?", desc: "Nearby reports and how fast the city replies." },
  { id: "tracker", size: "large", name: "Case tracker", desc: "Every step of your case, in plain words." },
]

const AMP = [1, 0.72, 0.46, 0.22, 0.04]

export function WidgetShell({ size, className, style, children }: { size: WidgetSize; className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <div
      className={cn("moment relative shrink-0 overflow-hidden rounded-[26px] bg-card text-left", className)}
      style={{ width: SIZES[size].w, height: SIZES[size].h, ...style }}
    >
      {children}
    </div>
  )
}

function Brand({ ref_ }: { ref_?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <img src="logo.png" alt="" className="size-[18px] rounded-[5px]" />
      <span className="text-[12px] font-semibold tracking-tight">HUSH</span>
      {ref_ && <span className="ml-auto font-mono text-[10px] text-muted-foreground">{ref_}</span>}
    </div>
  )
}

export function SignalWidget({ c }: { c?: Complaint }) {
  return (
    <WidgetShell size="small" className="p-4">
      <Brand />
      {c ? (
        <>
          <ComplaintWave amplitude={AMP[c.stage]} seed={c.ref.length + c.stage} color={c.stage === 4 ? "var(--accent)" : undefined} className="-mx-1 mt-1 h-[52px]" />
          <p className="line-clamp-2 text-[15px] leading-[1.15] font-semibold tracking-[-0.015em]">{stageCopy(c, c.stage).title}</p>
          <p className="mt-1 truncate text-[11px] text-muted-foreground">{agencyFor(c.type).short} · {c.ref}</p>
        </>
      ) : (
        <p className="mt-6 text-[15px] leading-tight font-semibold">All quiet. No open cases.</p>
      )}
    </WidgetShell>
  )
}

export function SpeakWidget() {
  return (
    <WidgetShell
      size="small"
      className="border-0 p-4 text-white"
      style={{ background: "linear-gradient(160deg,#ffffff 0%,#9cc2ff 26%,#0866ff 60%,#050a24 100%)" }}
    >
      <div className="grid size-[54px] place-items-center rounded-full bg-white/25 shadow-[inset_0_1px_0_rgb(255_255_255/0.5)] backdrop-blur-md">
        <Mic className="size-6" strokeWidth={1.8} />
      </div>
      <div className="absolute bottom-4 left-4">
        <p className="text-[17px] leading-tight font-semibold tracking-[-0.015em]">Tell HUSH</p>
        <p className="text-[12px] text-white/75">Tap to speak</p>
      </div>
    </WidgetShell>
  )
}

export function NearbyWidget({ area }: { area: string }) {
  return (
    <WidgetShell size="medium" className="flex gap-3 p-4">
      <div className="flex min-w-0 flex-1 flex-col">
        <Brand />
        <p className="mt-2 text-[17px] leading-tight font-semibold tracking-[-0.02em]">Is the city listening?</p>
        <p className="text-[12px] text-muted-foreground">{areaName(area)} · this week</p>
        <div className="mt-auto grid grid-cols-3 gap-1.5">
          {[
            ["Reports", "186"],
            ["Reply", "2h 10m"],
            ["Outcome", "78%"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-fill px-2 py-1.5">
              <p className="truncate text-[9px] text-muted-foreground">{k}</p>
              <p className="truncate text-[13px] leading-tight font-semibold tabular-nums">{v}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="grid w-[118px] shrink-0 grid-rows-2 gap-1.5">
        <PhotoTile src={photosFor(area)[0]} />
        <MapTile label={areaName(area)} />
      </div>
    </WidgetShell>
  )
}

export function TrackerWidget({ c }: { c?: Complaint }) {
  const stage = c?.stage ?? 0
  return (
    <WidgetShell size="large" className="flex flex-col p-5">
      <Brand ref_={c?.ref} />
      <p className="mt-2 text-[20px] leading-tight font-semibold tracking-[-0.02em]">{c ? `${c.type} near ${areaName(c.area)}` : "No open cases"}</p>
      <p className="text-[13px] text-muted-foreground">{c ? `With ${agencyFor(c.type).short}` : "Send a report to start tracking."}</p>
      <ol className="mt-4 flex flex-1 flex-col justify-between">
        {STAGES.map((label, i) => {
          const done = i < stage || (i === 4 && stage === 4)
          const now = i === stage && stage < 4
          return (
            <li key={label} className="relative flex items-center gap-3">
              {i < STAGES.length - 1 && <span className="absolute top-[22px] left-[10px] h-[calc(100%+4px)] w-0.5 rounded-full" style={{ background: i < stage ? "var(--accent)" : "var(--fill)" }} />}
              <span
                className={cn("relative z-10 grid size-[22px] place-items-center rounded-full text-[10px] font-semibold", done ? "bg-accent text-white" : now ? "bg-card text-accent ring-2 ring-accent" : "bg-fill text-muted-foreground")}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className={cn("text-[15px] font-medium", !done && !now && "text-muted-foreground")}>{label}</span>
            </li>
          )
        })}
      </ol>
      {stage === 4 && c && !c.confirmed && (
        <div className="mt-3 flex h-10 items-center justify-center rounded-full bg-accent text-[14px] font-semibold text-white">Did it get better?</div>
      )}
    </WidgetShell>
  )
}

export function renderWidget(id: WidgetId, c: Complaint | undefined, area: string) {
  if (id === "signal") return <SignalWidget c={c} />
  if (id === "speak") return <SpeakWidget />
  if (id === "nearby") return <NearbyWidget area={area} />
  return <TrackerWidget c={c} />
}
