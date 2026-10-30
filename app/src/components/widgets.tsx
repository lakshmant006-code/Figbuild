import type { CSSProperties, ReactNode } from "react"
import { Mic } from "lucide-react"

import { ComplaintWave } from "@/components/ui/complaint-wave"
import { photosFor } from "@/components/ui/moment-card"
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
      <img src="logo.png" alt="" className="size-[18px] rounded-[5px] ring-1 ring-black/10" />
      <span className="text-[12px] font-semibold tracking-tight">Chime</span>
      {ref_ && <span className="ml-auto font-mono text-[10px] text-muted-foreground">{ref_}</span>}
    </div>
  )
}

const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })

// Five-segment progress ring: pale blue, blue, then dark as the case moves on.
function StageRing({ stage }: { stage: number }) {
  const r = 25
  const circ = 2 * Math.PI * r
  return (
    <div className="relative size-[62px] shrink-0">
      <svg viewBox="0 0 62 62" className="size-full -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#9cc2ff" />
            <stop offset="0.55" stopColor="#0866ff" />
            <stop offset="1" stopColor="#0a1030" />
          </linearGradient>
        </defs>
        <circle cx="31" cy="31" r={r} fill="none" stroke="var(--fill)" strokeWidth="6" />
        <circle cx="31" cy="31" r={r} fill="none" stroke="url(#ring-g)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(circ * (stage + 1)) / 5 - 4} ${circ}`} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <p className="text-[19px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
          {stage + 1}
          <span className="text-[11px] font-medium text-muted-foreground">/5</span>
        </p>
      </div>
    </div>
  )
}

export function SignalWidget({ c }: { c?: Complaint }) {
  return (
    <WidgetShell size="small" className="flex flex-col p-4">
      <div className="flex items-start justify-between">
        {c ? <StageRing stage={c.stage} /> : <span className="grid size-[62px] place-items-center rounded-full bg-fill text-[22px]">✓</span>}
        <img src="logo.png" alt="" className="size-[22px] rounded-[6px]" />
      </div>
      {c ? (
        <div className="mt-auto">
          <p className="line-clamp-2 text-[16px] leading-[1.12] font-semibold tracking-[-0.02em]">{stageCopy(c, c.stage).title}</p>
          <p className="mt-1 truncate text-[11.5px] text-muted-foreground">{agencyFor(c.type).short} · {c.type}</p>
        </div>
      ) : (
        <div className="mt-auto">
          <p className="text-[16px] leading-[1.12] font-semibold tracking-[-0.02em]">All quiet.</p>
          <p className="mt-1 text-[11.5px] text-muted-foreground">No open cases</p>
        </div>
      )}
    </WidgetShell>
  )
}

export function SpeakWidget() {
  return (
    <WidgetShell
      size="small"
      className="border-0 text-white"
      style={{ background: "linear-gradient(165deg,#f6f9ff 0%,#a9c8ff 26%,#0866ff 60%,#050a24 100%)" }}
    >
      {/* sound rings + glass orb */}
      {[78, 104, 130].map((d, i) => (
        <span key={d} className="absolute top-[18px] left-[18px] rounded-full border border-white/60" style={{ width: d, height: d, marginLeft: -(d - 54) / 2, marginTop: -(d - 54) / 2, opacity: 0.7 - i * 0.2 }} />
      ))}
      <div
        className="absolute top-[18px] left-[18px] grid size-[54px] place-items-center rounded-full shadow-[0_10px_26px_rgb(8_102_255/0.55)]"
        style={{ background: "radial-gradient(circle at 32% 28%, #ffffff 0%, #bcd6ff 28%, #0866ff 70%, #07123a 100%)" }}
      >
        <Mic className="size-[22px] text-white drop-shadow" strokeWidth={2} />
      </div>
      <div className="absolute right-4 bottom-4 left-4">
        <p className="text-[18px] leading-tight font-semibold tracking-[-0.02em]">Tell Chime</p>
        <p className="text-[12px] text-white/75">Tap to speak</p>
      </div>
    </WidgetShell>
  )
}

// Hourly reports for the last 14 hours (example data). Pale blue early, deep blue and dark as the evening gets louder.
const HOURS = Array.from({ length: 14 }, (_, i) => 0.2 + 0.8 * Math.pow(Math.sin(((i + 1.5) / 16) * Math.PI), 2) * (0.82 + 0.18 * Math.sin(i * 2.3)))

function HourBars() {
  return (
    <div>
      <div className="flex h-[22px] items-end gap-1 border-b border-separator pb-px" aria-hidden="true">
        {HOURS.map((v, i) => {
          const t = i / (HOURS.length - 1)
          const last = i === HOURS.length - 1
          return (
            <span
              key={i}
              className="w-full rounded-t-[3px] rounded-b-[1px]"
              style={{
                height: `${Math.round(v * 100)}%`,
                background: last ? "var(--accent)" : `hsl(${222 - t * 4} ${95 - t * 30}% ${86 - t * 70}%)`,
                boxShadow: last ? "0 0 0 2px color-mix(in srgb, var(--accent) 28%, transparent)" : undefined,
              }}
            />
          )
        })}
      </div>
      <div className="mt-1 flex justify-between text-[9.5px] leading-none text-muted-foreground">
        <span>8 AM</span>
        <span>Now</span>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-[15px] leading-none font-semibold tracking-[-0.02em] tabular-nums">{value}</p>
      <p className="mt-1 truncate text-[10px] leading-none text-muted-foreground">{label}</p>
    </div>
  )
}

export function NearbyWidget({ area }: { area: string }) {
  return (
    <WidgetShell size="medium" className="flex gap-3 p-3">
      <div className="flex min-w-0 flex-1 flex-col pt-1.5 pl-2.5">
        <Brand />
        <div className="mt-1.5 flex shrink-0 items-end gap-2">
          <p className="text-[32px] leading-[0.9] font-semibold tracking-[-0.04em] tabular-nums">186</p>
          <p className="pb-0.5 text-[11.5px] leading-[1.15] text-muted-foreground">
            reports
            <br />
            this week
          </p>
        </div>
        <div className="mt-2 shrink-0">
          <HourBars />
        </div>
        <div className="mt-auto flex shrink-0 gap-3 pb-0.5 pt-1.5">
          <Stat value="2h 10m" label="median reply" />
          <span className="w-px bg-separator" />
          <Stat value="78%" label="got an outcome" />
        </div>
      </div>

      <div className="relative w-[136px] shrink-0 overflow-hidden rounded-[20px] bg-fill">
        <img src={photosFor(area)[0]} alt="" className="size-full object-cover" draggable={false} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgb(255 255 255 / 0.0) 45%, rgb(5 10 36 / 0.55) 100%)" }} />
        {[58, 36, 18].map((d, i) => (
          <span key={d} className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70" style={{ width: d * 2, height: d * 2, opacity: 0.85 - i * 0.2, background: i === 2 ? "rgb(8 102 255 / 0.18)" : "transparent" }} />
        ))}
        <span className="absolute top-[46%] left-1/2 grid size-[30px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#0866ff] shadow-[0_4px_14px_rgb(8_102_255/0.55)] ring-[3px] ring-white">
          <svg viewBox="0 0 24 24" className="size-[17px]" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l2.2-6 3.6 12 2.6-8 1.4 2H22" /></svg>
        </span>
        <span className="absolute bottom-2 left-2 max-w-[calc(100%-16px)] truncate rounded-full bg-white/85 px-2.5 py-1 text-[10.5px] font-semibold text-[#0a0f1f] backdrop-blur">{areaName(area)}</span>
      </div>
    </WidgetShell>
  )
}

const NEXT_UP = [
  "Your case gets sent to the team that handles it.",
  "We are assigned to go and check.",
  "We visit the address to listen or look.",
  "The outcome is posted to your case.",
  "Tell us if it got better. It closes the case.",
]
const SHORT = ["Received", "Routed", "On the way", "Checked", "Outcome"]

export function TrackerWidget({ c }: { c?: Complaint }) {
  const stage = c?.stage ?? 0
  const ready = stage === 4 && c && !c.confirmed
  return (
    <WidgetShell size="large" className="flex flex-col p-5">
      <div className="flex items-center">
        <Brand />
        {c && <span className="ml-auto rounded-full bg-fill px-2.5 py-1 font-mono text-[10.5px] text-muted-foreground">{c.ref}</span>}
      </div>

      {c ? (
        <>
          <p className="mt-3 text-[13px] text-muted-foreground">{c.type} near {areaName(c.area)}</p>
          <p className="mt-0.5 text-[27px] leading-[1.06] font-semibold tracking-[-0.03em]">{stageCopy(c, stage).title}</p>
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-muted-foreground">{stageCopy(c, stage).detail}</p>

          <ComplaintWave amplitude={AMP[stage]} seed={c.ref.length + stage} color={stage === 4 ? "var(--accent)" : undefined} className="mt-1 h-[74px]" />

          {/* horizontal stepper */}
          <ol className="relative mt-1 grid grid-cols-5">
            <span className="absolute top-[11px] right-[10%] left-[10%] h-[3px] rounded-full bg-fill" />
            <span className="absolute top-[11px] left-[10%] h-[3px] rounded-full bg-accent" style={{ width: `${(stage / 4) * 80}%` }} />
            {SHORT.map((label, i) => {
              const done = i < stage || (i === 4 && stage === 4)
              const now = i === stage && stage < 4
              return (
                <li key={label} className="relative flex flex-col items-center gap-1.5">
                  <span className={cn("grid size-[25px] place-items-center rounded-full text-[10px] font-semibold ring-4 ring-card", done ? "bg-accent text-white" : now ? "bg-card text-accent outline-2 -outline-offset-2 outline-accent" : "bg-fill text-muted-foreground")}>
                    {done ? "✓" : i + 1}
                  </span>
                  <span className={cn("text-[10.5px] leading-none", done || now ? "font-semibold" : "text-muted-foreground")}>{label}</span>
                </li>
              )
            })}
          </ol>

          <div className="mt-3 rounded-2xl bg-fill px-3.5 py-2.5">
            <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">What happens next</p>
            <p className="mt-0.5 text-[13px] leading-snug font-medium">{NEXT_UP[stage]}</p>
          </div>

          <div className="mt-auto pt-3">
            {ready ? (
              <div className="flex h-11 items-center justify-center rounded-full bg-accent text-[15px] font-semibold text-white shadow-[0_8px_20px_rgb(8_102_255/0.35)]">Did it get better?</div>
            ) : (
              <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                <span>With {agencyFor(c.type).short}</span>
                <span className="tabular-nums">Updated {clock(c.times[stage] ?? c.createdAt)}</span>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="grid flex-1 place-items-center text-center">
          <div>
            <p className="text-[22px] font-semibold tracking-[-0.02em]">All quiet.</p>
            <p className="mt-1 text-[14px] text-muted-foreground">Send a report to start tracking.</p>
          </div>
        </div>
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
