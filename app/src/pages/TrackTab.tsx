import { Check } from "lucide-react"

import { ComplaintWave } from "@/components/ui/complaint-wave"
import { STAGES, agencyFor, areaName, stageCopy, type Complaint } from "@/lib/data"
import { cn } from "@/lib/utils"

const AMP = [1, 0.72, 0.46, 0.22, 0.04]
const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
const NEXT = ["a few minutes", "about an hour", "a few hours", "about an hour", ""]

// 04 · Follow your signal.  A delivery-style tracker with the agency response in plain words.
export default function TrackTab({
  cases,
  selected,
  setSelected,
  onClosure,
}: {
  cases: Complaint[]
  selected: string | null
  setSelected: (ref: string) => void
  onClosure: (ref: string) => void
}) {
  const c = cases.find(x => x.ref === selected) ?? cases[0]
  const record = cases.filter(x => x.confirmed === "yes" || x.confirmed === "partly")

  return (
    <div className="mx-auto w-full max-w-[430px] px-5 pt-[max(var(--sat),12px)] pb-6">
      <p className="pt-4 text-[13px] font-semibold tracking-wide text-accent uppercase">Track</p>
      <h1 className="mt-1 text-[32px] leading-[1.08] font-bold tracking-[-0.03em]">Follow your signal.</h1>

      {!c && <p className="mt-6 text-[17px] text-muted-foreground">No cases yet. Send a report and it shows up here.</p>}

      {cases.length > 1 && (
        <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          {cases.map(x => (
            <button
              key={x.ref}
              onClick={() => setSelected(x.ref)}
              aria-pressed={x.ref === c?.ref}
              className="h-9 shrink-0 rounded-full px-4 font-mono text-[13px] transition-colors duration-300"
              style={x.ref === c?.ref ? { background: "var(--foreground)", color: "var(--background)" } : { background: "var(--fill)" }}
            >
              {x.ref}
            </button>
          ))}
        </div>
      )}

      {c && (
        <div key={c.ref} className="anim-rise">
          {/* status hero */}
          <section className="glass mt-4 rounded-[28px] p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-[15px] font-semibold">{c.type}</p>
              <p className="font-mono text-[13px] text-muted-foreground">{c.ref}</p>
            </div>
            <p className="text-[13px] text-muted-foreground">{areaName(c.area)} · with {agencyFor(c.type).short}</p>
            <ComplaintWave amplitude={AMP[c.stage]} seed={c.ref.length + c.stage} color={c.stage === 4 ? "var(--accent)" : undefined} className="mt-1" />
            <p className="text-[22px] leading-tight font-bold tracking-[-0.02em]">{stageCopy(c, c.stage).title}</p>
            <p className="mt-1 text-[15px] text-muted-foreground">
              {c.stage < 4 ? `Next update usually in ${NEXT[c.stage]}.` : `Posted at ${clock(c.times[4] ?? Date.now())}.`}
            </p>
          </section>

          {/* delivery-style stepper */}
          <ol className="mt-5">
            {STAGES.map((label, i) => {
              const done = i < c.stage || (i === 4 && c.stage === 4)
              const now = i === c.stage && c.stage < 4
              const copy = stageCopy(c, i)
              const last = i === STAGES.length - 1
              return (
                <li key={label} className="relative flex gap-4 pb-6 last:pb-0">
                  {!last && (
                    <span className="absolute top-8 left-[15px] h-[calc(100%-18px)] w-0.5 overflow-hidden rounded-full bg-fill">
                      <span
                        className="block w-full bg-accent transition-[height] duration-[900ms] ease-ios"
                        style={{ height: i < c.stage ? "100%" : "0%" }}
                      />
                    </span>
                  )}
                  <span
                    className={cn(
                      "relative z-10 grid size-8 shrink-0 place-items-center rounded-full transition-colors duration-500",
                      done ? "bg-accent text-white" : now ? "bg-card text-accent ring-2 ring-accent" : "bg-fill text-muted-foreground",
                    )}
                    style={now ? { animation: "beat 1.6s ease-in-out infinite" } : undefined}
                  >
                    {done ? <Check className="size-4" strokeWidth={3} /> : <span className="text-[13px] font-semibold">{i + 1}</span>}
                  </span>
                  <div className={cn("min-w-0 flex-1 transition-opacity duration-500", !done && !now && "opacity-45")}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[17px] leading-tight font-semibold">{copy.title}</p>
                      {c.times[i] && <span className="text-[13px] text-muted-foreground tabular-nums">{clock(c.times[i])}</span>}
                    </div>
                    {(done || now) && <p className="anim-feed mt-0.5 text-[15px] leading-snug text-muted-foreground">{copy.detail}</p>}
                  </div>
                </li>
              )
            })}
          </ol>

          {c.stage === 4 && !c.confirmed && (
            <button
              onClick={() => onClosure(c.ref)}
              className="anim-rise mt-6 h-[54px] w-full rounded-full bg-accent text-[17px] font-semibold text-white shadow-[0_10px_28px_rgb(8_102_255/0.35)] transition-transform duration-200 ease-ios active:scale-[0.98]"
            >
              Did it get better?
            </button>
          )}
          {c.confirmed && (
            <button onClick={() => onClosure(c.ref)} className="mt-6 h-12 w-full rounded-full bg-fill text-[16px] font-semibold">
              {c.confirmed === "no" ? "Reopened. See what happens next" : "View your outcome record"}
            </button>
          )}
        </div>
      )}

      {record.length > 0 && (
        <>
          <h2 className="mt-10 mb-2 px-1 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">Your outcome record</h2>
          <ul className="overflow-hidden rounded-[20px] bg-card">
            {record.map((r, i) => (
              <li key={r.ref} className="pl-4">
                <button onClick={() => onClosure(r.ref)} className={"flex min-h-[60px] w-full items-center gap-3 py-3 pr-4 text-left" + (i ? " border-t border-separator" : "")}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-medium">{r.type}</p>
                    <p className="truncate text-[14px] text-muted-foreground">{r.outcome}</p>
                  </div>
                  <span className="rounded-full bg-accent/15 px-3 py-1 text-[12px] font-semibold text-accent">{r.confirmed === "yes" ? "Quiet" : "Better"}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-6 text-[13px] leading-snug text-muted-foreground">
        Steps follow the real process for each kind of noise. Progress and outcomes here are simulated, not live 311 data.
      </p>
    </div>
  )
}
