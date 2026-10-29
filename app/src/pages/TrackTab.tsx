import { Check, ChevronRight, LayoutGrid } from "lucide-react"

import { SkylineWave } from "@/components/ui/skyline-wave"
import { MapTile, MomentCard, PhotoTile, photosFor } from "@/components/ui/moment-card"
import { STAGES, agencyFor, areaName, stageCopy, type Complaint } from "@/lib/data"
import { cn } from "@/lib/utils"

const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
const NEXT = ["a few minutes", "about an hour", "a few hours", "about an hour", ""]

// 04 · Follow your signal.  A delivery-style tracker with the agency response in plain words.
export default function TrackTab({
  cases,
  selected,
  setSelected,
  onClosure,
  onWidgets,
  onAllCases,
}: {
  cases: Complaint[]
  selected: string | null
  setSelected: (ref: string) => void
  onClosure: (ref: string) => void
  onWidgets: () => void
  onAllCases: () => void
}) {
  const c = cases.find(x => x.ref === selected) ?? cases[0]
  const record = cases.filter(x => x.confirmed === "yes" || x.confirmed === "partly")

  return (
    <div className="mx-auto w-full max-w-[430px] px-5 pt-[max(var(--sat),12px)] pb-6">
      <h1 className="mt-1 pr-14 text-[32px] leading-[1.08] font-semibold tracking-[-0.03em]">Follow your signal.</h1>

      {cases.length > 1 && (
        <button
          onClick={onAllCases}
          className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-fill pr-3 pl-4 text-[14px] font-medium transition-transform duration-200 ease-ios active:scale-95"
        >
          All cases · {cases.length}
          <ChevronRight className="size-4" />
        </button>
      )}

      {!c && <p className="mt-6 text-[17px] text-muted-foreground">No cases yet. Send a report and it shows up here.</p>}

      {c && (
        <div key={c.ref} className="anim-rise">
          <MomentCard
            className="mt-5"
            tiles={[
              <PhotoTile key="a" src={photosFor(c.ref)[0]} badge="Voice" />,
              <PhotoTile key="b" src={photosFor(c.ref)[1]} />,
              <MapTile key="m" label={areaName(c.area)} />,
            ]}
            time={`${clock(c.createdAt)} · ${c.ref}`}
            title={`${c.type} near ${areaName(c.area)}`}
            body={`${stageCopy(c, c.stage).title} ${c.stage < 4 ? `Next update usually in ${NEXT[c.stage]}.` : `Posted at ${clock(c.times[4] ?? Date.now())}.`}`}
          >
            <SkylineWave stage={c.stage} seed={c.ref.length} className="mt-2" />
          </MomentCard>

          <p className="mt-7 mb-3 px-1 text-[14px] font-medium text-muted-foreground">Where it is, with {agencyFor(c.type).short}</p>

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
                      {c.times[i] && <span className="shrink-0 text-[13px] whitespace-nowrap text-muted-foreground tabular-nums">{clock(c.times[i])}</span>}
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
          <p className="mt-9 mb-2 px-1 text-[14px] font-medium text-muted-foreground">Your outcome record</p>
          <ul className="flex flex-col gap-2.5">
            {record.map(r => (
              <li key={r.ref}>
                <MomentCard
                  type={r.type}
                  time={`${clock(r.closedAt ?? r.createdAt)} · ${r.ref}`}
                  title={r.confirmed === "yes" ? "Quiet again" : "A little better"}
                  body={r.outcome ?? ""}
                  onClick={() => onClosure(r.ref)}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      <button onClick={onWidgets} className="moment mt-9 flex w-full items-center gap-3.5 rounded-[26px] p-3 text-left transition-transform duration-300 ease-ios active:scale-[0.985]">
        <span className="grid size-14 shrink-0 place-items-center rounded-[16px] bg-fill text-muted-foreground"><LayoutGrid className="size-6" strokeWidth={1.6} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] leading-tight font-semibold">Widgets</span>
          <span className="block text-[14px] leading-snug text-muted-foreground">Put your signal on the Home Screen.</span>
        </span>
        <ChevronRight className="size-5 text-muted-foreground/60" />
      </button>

      <p className="mt-6 text-[13px] leading-snug text-muted-foreground">
        Steps follow the real process for each kind of noise. Progress and outcomes here are simulated, not live 311 data.
      </p>
    </div>
  )
}
