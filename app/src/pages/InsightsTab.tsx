import { useMemo, useState, type ReactNode } from "react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import { AREAS, NOISE_TYPES, areaName, type Complaint, type Profile } from "@/lib/data"
import { cn } from "@/lib/utils"

// Everything here is example data shaped by the neighborhood and the time range, except your own cases.
function rng(s: string) {
  let h = 7
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 9973
  return () => ((h = (h * 16807) % 2147483647) / 2147483647)
}

const RANGES = [
  { d: 7, label: "7 days", unit: "week", pts: 7, reports: 44 },
  { d: 30, label: "30 days", unit: "month", pts: 10, reports: 186 },
  { d: 90, label: "90 days", unit: "quarter", pts: 12, reports: 530 },
] as const

const shade = (t: number) => `hsl(${222 - t * 4} ${96 - t * 34}% ${86 - t * 74}%)`

function Section({ title, sub, aside, children }: { title: string; sub?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-9">
      <div className="flex items-end justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <h2 className="text-[19px] leading-tight font-semibold tracking-[-0.02em]">{title}</h2>
          {sub && <p className="mt-0.5 text-[13.5px] leading-snug text-muted-foreground">{sub}</p>}
        </div>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Segmented<T extends string | number>({ value, onChange, items, size = "md" }: { value: T; onChange: (v: T) => void; items: { v: T; label: string }[]; size?: "sm" | "md" }) {
  const i = items.findIndex(x => x.v === value)
  return (
    <div className={cn("relative flex rounded-full bg-fill p-[3px]", size === "sm" ? "w-[132px]" : "w-full")} role="tablist">
      <span
        aria-hidden="true"
        className="absolute top-[3px] bottom-[3px] left-[3px] rounded-full bg-background shadow-sm transition-transform duration-500 ease-ios"
        style={{ width: `calc((100% - 6px) / ${items.length})`, transform: `translateX(${i * 100}%)` }}
      />
      {items.map(x => (
        <button key={String(x.v)} role="tab" aria-selected={x.v === value} onClick={() => onChange(x.v)} className={cn("relative flex-1 rounded-full font-semibold", size === "sm" ? "h-7 text-[12.5px]" : "h-9 text-[14px]")}>
          {x.label}
        </button>
      ))}
    </div>
  )
}

function Delta({ pct, goodWhenDown = false }: { pct: number; goodWhenDown?: boolean }) {
  const up = pct >= 0
  const good = goodWhenDown ? !up : up
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[12px] font-semibold tabular-nums", good ? "text-accent" : "text-muted-foreground")}>
      <Icon className="size-3.5" strokeWidth={2.4} />
      {Math.abs(pct)}%
    </span>
  )
}

// smooth line through the points (Catmull-Rom to Bezier)
function smoothPath(p: [number, number][]) {
  let d = `M${p[0][0]} ${p[0][1]}`
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] ?? p2
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6}, ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6}, ${p2[0]} ${p2[1]}`
  }
  return d
}

export default function InsightsTab({ profile, cases }: { profile: Profile; cases: Complaint[] }) {
  const [range, setRange] = useState<7 | 30 | 90>(30)
  const [when, setWhen] = useState<"hour" | "day">("hour")
  const R = RANGES.find(r => r.d === range)!
  const area = areaName(profile.area)

  const data = useMemo(() => {
    const r = rng(profile.area + range)
    const total = Math.round(R.reports * (0.9 + r() * 0.2))
    const quiet = Math.round(range * (0.45 + r() * 0.25))
    const trend = Array.from({ length: R.pts }, (_, i) => 0.35 + 0.45 * Math.sin((i / (R.pts - 1)) * 2.4 + r()) ** 2 + 0.2 * r() + i * 0.012)
    const hours = Array.from({ length: 24 }, (_, i) => 0.14 + 0.86 * Math.exp(-Math.pow((i - 12 + r() * 1.5) / 4.6, 2)) * (0.8 + 0.2 * r()))
    const days = [0.5, 0.45, 0.5, 0.58, 0.82, 1, 0.78].map(v => v * (0.88 + r() * 0.2))
    const mix = [41, 22, 14, 9, 8, 6].map(v => v + Math.round((r() - 0.5) * 4))
    const sum = mix.reduce((a, b) => a + b, 0)
    const idx = AREAS.findIndex(a => a.id === profile.area)
    const others = [1, 2, 3, 5].map(k => AREAS[(idx + k * 3) % AREAS.length]).filter(a => a.id !== profile.area)
    const near = [{ name: area, v: Math.round(8 + r() * 6), you: true }, ...others.map(a => ({ name: a.name, v: Math.round(4 + r() * 12), you: false }))].sort((a, b) => b.v - a.v).slice(0, 5)
    return {
      total,
      quiet,
      trend,
      hours,
      days,
      mix: mix.map(v => Math.round((v / sum) * 100)),
      near,
      dReports: Math.round((r() - 0.35) * 30),
      dReply: -Math.round(6 + r() * 20),
      dDone: Math.round(2 + r() * 8),
      dQuiet: Math.round(r() * 6 - 1),
    }
  }, [profile.area, range, R.reports, R.pts, area])

  const types = useMemo(() => {
    const order = [...new Set([...profile.hears, ...NOISE_TYPES])].slice(0, 6)
    return order.map((t, i) => ({ t, v: data.mix[i], n: Math.round((data.total * data.mix[i]) / 100) }))
  }, [profile.hears, data])

  // trend line geometry
  const W = 340, H = 104, padT = 10, padB = 6
  const mx = Math.max(...data.trend)
  const pts = data.trend.map((v, i) => [(i / (data.trend.length - 1)) * W, H - padB - (v / mx) * (H - padT - padB)] as [number, number])
  const line = smoothPath(pts)
  const last = pts[pts.length - 1]

  const open = cases.filter(c => c.confirmed !== "yes" && c.confirmed !== "partly")
  const closed = cases.filter(c => c.closedAt)
  const avgMin = closed.length ? Math.round(closed.reduce((a, c) => a + ((c.closedAt ?? 0) - c.createdAt), 0) / closed.length / 60000) : null
  const dur = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`)
  const since = new Date(Date.now() - range * 864e5).toLocaleDateString([], { month: "short", day: "numeric" })

  const ring = 2 * Math.PI * 46
  const quietPct = data.quiet / range
  const bars = when === "hour" ? data.hours : data.days
  const peak = bars.indexOf(Math.max(...bars))

  return (
    <div className="mx-auto w-full max-w-[430px] px-5 pt-[max(var(--sat),12px)] pb-6">
      <h1 className="mt-4 pr-14 text-[32px] leading-[1.08] font-semibold tracking-[-0.03em]">Insights</h1>
      <p className="mt-2 text-[17px] leading-snug text-muted-foreground">{area}, last {R.label}.</p>

      <div className="mt-5">
        <Segmented value={range} onChange={setRange} items={RANGES.map(r => ({ v: r.d as 7 | 30 | 90, label: r.label }))} />
      </div>

      <div key={range} className="anim-step">
        {/* hero */}
        <section className="moment mt-5 flex items-center gap-5 rounded-[28px] p-5">
          <div className="relative size-[116px] shrink-0">
            <svg viewBox="0 0 116 116" className="size-full -rotate-90" aria-hidden="true">
              <defs>
                <linearGradient id="ins-ring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#9cc2ff" />
                  <stop offset="0.55" stopColor="#0866ff" />
                  <stop offset="1" style={{ stopColor: "var(--foreground)" }} />
                </linearGradient>
              </defs>
              <circle cx="58" cy="58" r="46" fill="none" stroke="var(--fill)" strokeWidth="12" />
              <circle cx="58" cy="58" r="46" fill="none" stroke="url(#ins-ring)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${ring * quietPct} ${ring}`} style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.32,0.72,0,1)" }} />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <p className="text-[30px] leading-none font-semibold tracking-[-0.04em] tabular-nums">{Math.round(quietPct * 100)}%</p>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[13.5px] text-muted-foreground">Quiet nights</p>
            <p className="mt-1 text-[24px] leading-tight font-semibold tracking-[-0.025em] tabular-nums">
              {data.quiet} of {range}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Delta pct={data.dQuiet} /> vs the {R.unit} before
            </p>
          </div>
        </section>

        {/* headline numbers */}
        <section className="moment mt-3 grid grid-cols-3 divide-x divide-separator rounded-[24px] py-4">
          {[
            { k: "Reports", v: String(data.total), d: <Delta pct={data.dReports} goodWhenDown /> },
            { k: "Median reply", v: "2h 10m", d: <Delta pct={data.dReply} goodWhenDown /> },
            { k: "Got an outcome", v: "78%", d: <Delta pct={data.dDone} /> },
          ].map(s => (
            <div key={s.k} className="px-4">
              <p className="text-[11.5px] text-muted-foreground">{s.k}</p>
              <p className="mt-1 text-[21px] leading-none font-semibold tracking-[-0.03em] tabular-nums">{s.v}</p>
              <div className="mt-1.5">{s.d}</div>
            </div>
          ))}
        </section>

        <Section title="Reports over time" sub={`Since ${since}`}>
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-[104px] w-full overflow-visible" role="img" aria-label="Reports over time">
            <defs>
              <linearGradient id="ins-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#0866ff" stopOpacity="0.22" />
                <stop offset="1" stopColor="#0866ff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="ins-line" gradientUnits="userSpaceOnUse" x1="0" x2={W} y1="0" y2="0">
                <stop offset="0" stopColor="#9cc2ff" />
                <stop offset="0.55" stopColor="#0866ff" />
                <stop offset="1" style={{ stopColor: "var(--foreground)" }} />
              </linearGradient>
            </defs>
            {[0.25, 0.6, 0.95].map(t => <line key={t} x1="0" x2={W} y1={H - padB - t * (H - padT - padB)} y2={H - padB - t * (H - padT - padB)} stroke="var(--separator)" strokeWidth="1" />)}
            <path d={`${line} L${W} ${H} L0 ${H} Z`} fill="url(#ins-area)" />
            <path d={line} fill="none" stroke="url(#ins-line)" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx={last[0]} cy={last[1]} r="9" fill="#0866ff" opacity="0.18" />
            <circle cx={last[0]} cy={last[1]} r="4.5" fill="#0866ff" stroke="var(--background)" strokeWidth="2" />
          </svg>
          <div className="mt-2 flex justify-between text-[11.5px] text-muted-foreground">
            <span>{since}</span>
            <span>Today</span>
          </div>
        </Section>

        <Section title="When it gets loud" sub={when === "hour" ? `Peaks around ${peak < 10 ? "11 PM" : peak < 14 ? "midnight" : "1 AM"}` : `Busiest on ${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][peak]}`} aside={<Segmented size="sm" value={when} onChange={setWhen} items={[{ v: "hour", label: "Hour" }, { v: "day", label: "Day" }]} />}>
          <div className={cn("flex h-[96px] items-end border-b border-separator pb-px", when === "hour" ? "gap-[3px]" : "gap-3")} aria-hidden="true">
            {bars.map((v, i) => (
              <span
                key={when + i}
                className="w-full rounded-t-[4px] rounded-b-[1px] transition-[height] duration-700 ease-ios"
                style={{ height: `${Math.round(v * 100)}%`, background: i === peak ? "var(--accent)" : shade(v), boxShadow: i === peak ? "0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent)" : undefined }}
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[11.5px] text-muted-foreground">
            {(when === "hour" ? ["6 PM", "12 AM", "6 AM"] : ["Mon", "Wed", "Fri", "Sun"]).map(l => <span key={l}>{l}</span>)}
          </div>
        </Section>

        <Section title="What people hear" sub={`${data.total} reports`}>
          <div className="flex h-3.5 overflow-hidden rounded-full" role="img" aria-label="Share of reports by noise type">
            {types.map((t, i) => <span key={t.t} style={{ width: `${t.v}%`, background: shade(i / (types.length - 1) * 0.95), marginLeft: i ? 2 : 0 }} className="first:rounded-l-full last:rounded-r-full" />)}
          </div>
          <ul className="mt-4">
            {types.slice(0, 5).map((t, i) => (
              <li key={t.t} className={cn("flex items-center gap-3 py-2.5", i && "border-t border-separator")}>
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: shade(i / (types.length - 1) * 0.95) }} />
                <span className="flex-1 text-[15px] font-medium">{t.t}</span>
                <span className="text-[13px] text-muted-foreground tabular-nums">{t.n}</span>
                <span className="w-10 text-right text-[15px] font-semibold tabular-nums">{t.v}%</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Around you" sub="Reports per 1,000 residents">
          <ul>
            {data.near.map((n, i) => (
              <li key={n.name} className={cn("flex items-center gap-3 py-2.5", i && "border-t border-separator")}>
                <span className={cn("w-[148px] shrink-0 truncate text-[14px]", n.you ? "font-semibold" : "font-medium")}>
                  {n.name}
                  {n.you && <span className="ml-1.5 text-[11px] font-semibold text-accent">you</span>}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-fill">
                  <span className="block h-full rounded-full" style={{ width: `${(n.v / data.near[0].v) * 100}%`, background: n.you ? "var(--accent)" : "linear-gradient(90deg,#c9dcff,#7aa9ff)" }} />
                </span>
                <span className="w-7 text-right text-[14px] font-semibold tabular-nums">{n.v}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="How the city responds" sub="Median reply, and share that got an outcome">
          <ul>
            {[
              { name: "NYPD", reply: "2h 05m", done: 81 },
              { name: "Buildings Dept.", reply: "6h 20m", done: 64 },
              { name: "Env. Protection", reply: "1d 3h", done: 58 },
            ].map((a, i) => (
              <li key={a.name} className={cn("flex items-center gap-3 py-2.5", i && "border-t border-separator")}>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] leading-tight font-medium">{a.name}</span>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-fill">
                    <span className="block h-full rounded-full bg-accent" style={{ width: `${a.done}%` }} />
                  </span>
                </span>
                <span className="w-[78px] shrink-0 text-right">
                  <span className="block text-[15px] font-semibold tabular-nums">{a.reply}</span>
                  <span className="block text-[11.5px] text-muted-foreground tabular-nums">{a.done}% done</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Your cases">
          <div className="moment grid grid-cols-3 divide-x divide-separator rounded-[24px] py-4">
            {[
              [String(open.length), "open"],
              [String(closed.length), "closed"],
              [avgMin !== null ? dur(avgMin) : "-", "avg. to close"],
            ].map(([v, k]) => (
              <div key={k} className="px-4">
                <p className="text-[24px] leading-none font-semibold tracking-[-0.03em] tabular-nums">{v}</p>
                <p className="mt-1.5 text-[12px] text-muted-foreground">{k}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <p className="mt-8 px-1 text-[12.5px] leading-snug text-muted-foreground">Example data for this neighborhood, except your own cases. Not live 311 data.</p>
    </div>
  )
}
