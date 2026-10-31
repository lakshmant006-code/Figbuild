import { useState } from "react"
import { ChevronLeft } from "lucide-react"

import { MomentCard } from "@/components/ui/moment-card"
import { areaName, stageCopy, type Complaint } from "@/lib/data"

const time = (t: number) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
const isClosed = (c: Complaint) => c.confirmed === "yes" || c.confirmed === "partly"

// A small space of its own for every case, so the tracker only ever shows the one you are following.
export default function CasesScreen({
  cases,
  current,
  onPick,
  onBack,
}: {
  cases: Complaint[]
  current: string | null
  onPick: (ref: string) => void
  onBack: () => void
}) {
  const open = cases.filter(c => !isClosed(c))
  const closed = cases.filter(isClosed)
  const [tab, setTab] = useState<"open" | "closed">(open.length ? "open" : "closed")
  const list = tab === "open" ? open : closed

  return (
    <div className="anim-rise absolute inset-0 z-40 overflow-y-auto bg-background">
      <div className="mx-auto min-h-full max-w-[430px] px-5 pt-[max(var(--sat),12px)] pb-[max(var(--sab),24px)]">
        <button onClick={onBack} aria-label="Back" className="-ml-2 grid size-11 place-items-center rounded-full active:bg-fill">
          <ChevronLeft className="size-6" />
        </button>
        <h1 className="mt-2 text-[32px] leading-[1.08] font-semibold tracking-[-0.03em]">Your cases</h1>
        <p className="mt-2 text-[17px] leading-snug text-muted-foreground">Pick one to follow it in the tracker.</p>

        <div className="relative mt-5 flex rounded-full bg-fill p-1" role="tablist" aria-label="Cases">
          <span
            aria-hidden="true"
            className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-background shadow-sm transition-transform duration-500 ease-ios"
            style={{ transform: tab === "closed" ? "translateX(100%)" : "none" }}
          />
          {(["open", "closed"] as const).map(t => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className="relative h-10 flex-1 rounded-full text-[15px] font-semibold">
              {t === "open" ? "Open" : "Closed"} · {t === "open" ? open.length : closed.length}
            </button>
          ))}
        </div>

        <ul key={tab} className="anim-step mt-5 flex flex-col gap-2.5">
          {list.length === 0 && (
            <li className="moment rounded-[26px] p-6 text-center">
              <p className="text-[17px] font-semibold">{tab === "open" ? "Nothing open." : "Nothing closed yet."}</p>
              <p className="mt-1 text-[14px] text-muted-foreground">{tab === "open" ? "All your cases have been answered." : "Cases you confirm as better appear here."}</p>
            </li>
          )}
          {list.map(c => (
            <li key={c.ref}>
              <MomentCard
                type={c.type}
                time={`${time(c.createdAt)} · ${c.ref}`}
                title={`${c.type} near ${areaName(c.area)}`}
                body={isClosed(c) ? (c.outcome ?? "Closed.") : stageCopy(c, c.stage).title}
                selected={c.ref === current}
                onClick={() => onPick(c.ref)}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
