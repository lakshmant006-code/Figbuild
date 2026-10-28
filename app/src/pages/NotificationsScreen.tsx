import { ChevronLeft } from "lucide-react"

import { MomentCard } from "@/components/ui/moment-card"
import { Switch } from "@/components/ui/switch"
import type { Notice, Prefs } from "@/lib/notices"

const time = (t: number) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
const sameDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString()

const ROWS: { key: keyof Prefs; title: string; body: string }[] = [
  { key: "updates", title: "Case updates", body: "Each time the city moves your case forward." },
  { key: "outcome", title: "Outcome ready", body: "When it's time to say if it got better." },
  { key: "nearby", title: "Spikes near me", body: "Only when reports jump on your block." },
  { key: "quiet", title: "Quiet hours", body: "Nothing from 10 PM to 7 AM." },
]

// Notifications: calm and in your control. They only appear when something changes on your cases.
export default function NotificationsScreen({
  notices,
  seenAt,
  prefs,
  setPrefs,
  onBack,
  onOpen,
}: {
  notices: Notice[]
  seenAt: number
  prefs: Prefs
  setPrefs: (p: Prefs) => void
  onBack: () => void
  onOpen: (n: Notice) => void
}) {
  const now = Date.now()
  const today = notices.filter(n => sameDay(n.at, now))
  const earlier = notices.filter(n => !sameDay(n.at, now))

  const group = (label: string, list: Notice[]) =>
    list.length > 0 && (
      <section className="mt-7">
        <p className="mb-2 px-1 text-[14px] font-medium text-muted-foreground">{label}</p>
        <ul className="flex flex-col gap-2.5">
          {list.map((n, i) => (
            <li key={n.id} className="anim-rise" style={{ animationDelay: `${0.05 + i * 0.05}s` }}>
              <MomentCard
                type={n.type}
                time={time(n.at)}
                title={n.title}
                body={n.body}
                aside={n.at > seenAt ? <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-accent" aria-label="Unread" /> : undefined}
              >
                {n.action && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpen(n)}
                    onKeyDown={e => e.key === "Enter" && onOpen(n)}
                    className="mt-2.5 inline-flex h-8 cursor-pointer items-center rounded-full bg-accent/12 px-3.5 text-[13px] font-semibold text-accent"
                  >
                    {n.action.label}
                  </span>
                )}
              </MomentCard>
            </li>
          ))}
        </ul>
      </section>
    )

  return (
    <div className="anim-rise absolute inset-0 z-40 overflow-y-auto bg-background">
      <div className="mx-auto min-h-full max-w-[430px] px-5 pt-[max(var(--sat),12px)] pb-[max(var(--sab),24px)]">
        <button onClick={onBack} aria-label="Back" className="-ml-2 grid size-11 place-items-center rounded-full active:bg-fill">
          <ChevronLeft className="size-6" />
        </button>
        <h1 className="mt-2 text-[32px] leading-[1.08] font-semibold tracking-[-0.03em]">Notifications</h1>
        <p className="mt-2 text-[17px] leading-snug text-muted-foreground">Only things that need you. Quiet by default.</p>

        {notices.length === 0 && (
          <div className="moment mt-7 rounded-[26px] p-6 text-center">
            <p className="text-[18px] font-semibold">All quiet.</p>
            <p className="mt-1 text-[15px] text-muted-foreground">We&apos;ll tell you when a case changes. Nothing else.</p>
          </div>
        )}

        {group("Today", today)}
        {group("Earlier", earlier)}

        <section className="mt-9">
          <p className="mb-2 px-1 text-[14px] font-medium text-muted-foreground">What can notify you</p>
          <div className="moment overflow-hidden rounded-[26px]">
            {ROWS.map((r, i) => (
              <div key={r.key} className={"flex min-h-[64px] items-center gap-3 py-3 pr-4 pl-5" + (i ? " border-t border-separator" : "")}>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] leading-tight font-medium">{r.title}</p>
                  <p className="text-[14px] leading-snug text-muted-foreground">{r.body}</p>
                </div>
                <Switch checked={prefs[r.key]} onChange={v => setPrefs({ ...prefs, [r.key]: v })} label={r.title} />
              </div>
            ))}
          </div>
          <p className="mt-3 px-1 text-[13px] leading-snug text-muted-foreground">Prototype: these show in the app. Real push alerts need your permission on a device.</p>
        </section>
      </div>
    </div>
  )
}
