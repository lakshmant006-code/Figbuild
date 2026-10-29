import type { ReactNode } from "react"

import { NOISE_TYPES, agencyFor, areaName, type Complaint, type Profile } from "@/lib/data"

// Example data, shaped by the neighborhood so it changes when you switch areas.
function seed(s: string) {
  let h = 7
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 9973
  return () => ((h = (h * 16807) % 2147483647) / 2147483647)
}

function Card({ title, sub, children, className = "" }: { title: string; sub?: string; children: ReactNode; className?: string }) {
  return (
    <section className={"moment rounded-[26px] p-5 " + className}>
      <h2 className="text-[17px] leading-tight font-semibold tracking-[-0.015em]">{title}</h2>
      {sub && <p className="mt-0.5 text-[13.5px] leading-snug text-muted-foreground">{sub}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

const grad = (t: number) => `hsl(${222 - t * 4} ${96 - t * 34}% ${88 - t * 76}%)`

const AGENCIES = [
  { name: "NYPD", reply: "2h 05m", done: 81 },
  { name: "Buildings Dept.", reply: "6h 20m", done: 64 },
  { name: "Env. Protection", reply: "1d 3h", done: 58 },
]

export default function InsightsTab({ profile, cases }: { profile: Profile; cases: Complaint[] }) {
  const rnd = seed(profile.area)
  const area = areaName(profile.area)

  // 30 nights: dark = a report was filed that night
  const nights = Array.from({ length: 30 }, (_, i) => (i === 29 && cases.length > 0) || rnd() < 0.38)
  const quiet = nights.filter(n => !n).length
  let streak = 0
  for (let i = nights.length - 1; i >= 0 && !nights[i]; i--) streak++

  // reports by half-hour, 6 PM to 6 AM, peaking around midnight
  const bars = Array.from({ length: 24 }, (_, i) => 0.14 + 0.86 * Math.exp(-Math.pow((i - 12 + rnd() * 1.5) / 4.6, 2)) * (0.8 + 0.2 * rnd()))
  const peak = bars.indexOf(Math.max(...bars))

  // what people hear here: your own picks float to the top
  const base = [41, 22, 14, 9, 8, 6]
  const order = [...new Set([...profile.hears, ...NOISE_TYPES])].slice(0, 6)
  const types = order.map((t, i) => ({ t, v: base[i] }))

  const open = cases.filter(c => c.confirmed !== "yes" && c.confirmed !== "partly")
  const closed = cases.filter(c => c.closedAt)
  const avgMin = closed.length ? Math.round(closed.reduce((a, c) => a + ((c.closedAt ?? 0) - c.createdAt), 0) / closed.length / 60000) : null
  const dur = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`)

  return (
    <div className="mx-auto w-full max-w-[430px] px-5 pt-[max(var(--sat),12px)] pb-6">
      <h1 className="mt-4 pr-14 text-[32px] leading-[1.08] font-semibold tracking-[-0.03em]">Insights</h1>
      <p className="mt-2 text-[17px] leading-snug text-muted-foreground">What&apos;s happening around {area}.</p>

      <div className="mt-5 flex flex-col gap-3">
        <Card title="Quiet nights" sub="Last 30 nights">
          <div className="flex items-end justify-between">
            <p className="text-[44px] leading-none font-semibold tracking-[-0.04em] tabular-nums">
              {quiet}
              <span className="text-[17px] font-medium tracking-normal text-muted-foreground"> of 30</span>
            </p>
            <p className="pb-1 text-[13.5px] text-muted-foreground">{streak > 0 ? `${streak}-night quiet streak` : "Noisy last night"}</p>
          </div>
          <div className="mt-4 grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1.5" role="img" aria-label={`${quiet} quiet nights out of 30`}>
            {nights.map((noisy, i) => (
              <span
                key={i}
                className="aspect-square rounded-full"
                style={noisy ? { background: "var(--foreground)", opacity: 0.85 } : { background: "var(--accent)", opacity: 0.25 + 0.75 * (i / 29) }}
              />
            ))}
          </div>
        </Card>

        <Card title="When it gets loud" sub={`Reports peak around ${peak < 10 ? "11 PM" : peak < 14 ? "midnight" : "1 AM"}`}>
          <div className="flex h-[92px] items-end gap-[3px] border-b border-separator pb-px" aria-hidden="true">
            {bars.map((v, i) => (
              <span
                key={i}
                className="w-full rounded-t-[3px] rounded-b-[1px]"
                style={{ height: `${Math.round(v * 100)}%`, background: i === peak ? "var(--accent)" : grad(v), boxShadow: i === peak ? "0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent)" : undefined }}
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
            <span>6 PM</span>
            <span>12 AM</span>
            <span>6 AM</span>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {[
            ["Median reply", "2h 10m", "City: 3h 05m"],
            ["Got an outcome", "78%", "Last 30 days"],
            ["Repeat addresses", "3", "Flagged for follow-up"],
            ["Reported with you", "9", "Neighbors, same block"],
          ].map(([k, v, s]) => (
            <section key={k} className="moment rounded-[22px] p-4">
              <p className="text-[12.5px] text-muted-foreground">{k}</p>
              <p className="mt-1 text-[26px] leading-none font-semibold tracking-[-0.03em] tabular-nums">{v}</p>
              <p className="mt-1.5 text-[11.5px] leading-tight text-muted-foreground">{s}</p>
            </section>
          ))}
        </div>

        <Card title="What people hear" sub={`Share of reports in ${area}`}>
          <ul className="flex flex-col gap-3">
            {types.slice(0, 5).map(({ t, v }) => (
              <li key={t}>
                <div className="flex items-baseline justify-between text-[14.5px]">
                  <span className="font-medium">{t}</span>
                  <span className="tabular-nums text-muted-foreground">{v}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-fill">
                  <div className="h-full rounded-full" style={{ width: `${(v / 41) * 100}%`, background: "linear-gradient(90deg,#9cc2ff,#0866ff 60%,var(--foreground))" }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="How the city responds" sub="Median time to a reply, and cases that got an outcome">
          <ul className="flex flex-col">
            {AGENCIES.map((a, i) => (
              <li key={a.name} className={"flex items-center gap-3 py-2.5 " + (i ? "border-t border-separator" : "")}>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] leading-tight font-medium">{a.name}</span>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-fill">
                    <span className="block h-full rounded-full bg-accent" style={{ width: `${a.done}%` }} />
                  </span>
                </span>
                <span className="w-[74px] shrink-0 text-right">
                  <span className="block text-[15px] font-semibold tabular-nums">{a.reply}</span>
                  <span className="block text-[11.5px] text-muted-foreground tabular-nums">{a.done}% done</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Your cases" sub="From what you have reported">
          <div className="flex gap-6">
            <div>
              <p className="text-[30px] leading-none font-semibold tracking-[-0.03em] tabular-nums">{open.length}</p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">open</p>
            </div>
            <div>
              <p className="text-[30px] leading-none font-semibold tracking-[-0.03em] tabular-nums">{closed.length}</p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">closed</p>
            </div>
            <div>
              <p className="text-[30px] leading-none font-semibold tracking-[-0.03em] tabular-nums">{avgMin !== null ? dur(avgMin) : "-"}</p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">avg. to close</p>
            </div>
          </div>
          {cases[0] && <p className="mt-4 text-[13.5px] text-muted-foreground">Latest: {cases[0].type}, handled by {agencyFor(cases[0].type).short}.</p>}
        </Card>
      </div>

      <p className="mt-4 px-1 text-[12.5px] leading-snug text-muted-foreground">Example data for this neighborhood, except your own cases. Not live 311 data.</p>
    </div>
  )
}
