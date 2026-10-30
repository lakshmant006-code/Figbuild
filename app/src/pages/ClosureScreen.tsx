import { useState } from "react"
import { ChevronLeft, Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MapTile, PhotoTile, photosFor } from "@/components/ui/moment-card"
import { ComplaintWave } from "@/components/ui/complaint-wave"
import { ReleaseWave, SignalSignature } from "@/components/ui/signal"
import { agencyFor, areaName, type Complaint, type Confirmed } from "@/lib/data"

const clock = (t: number) => new Date(t).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })

function dur(ms: number) {
  const m = Math.max(1, Math.round(ms / 60000))
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`
}

// 06 · Did it get better?  Resident-confirmed closure, a personal outcome record, and follow-up options.
export default function ClosureScreen({
  c,
  onConfirm,
  onBack,
  onNew,
}: {
  c: Complaint
  onConfirm: (a: Confirmed) => void
  onBack: () => void
  onNew: () => void
}) {
  const ag = agencyFor(c.type)
  const [alerts, setAlerts] = useState(true)
  const [note, setNote] = useState("")
  const [copied, setCopied] = useState(false)

  // quiet becomes a small, visible release: plays once, right after you answer
  const [justClosed, setJustClosed] = useState(false)
  const [settled, setSettled] = useState(false)

  const share = `Chime outcome record\n${c.ref} · ${c.type} · ${areaName(c.area)}\n${ag.short}: ${c.outcome}\nConfirmed by resident: ${c.confirmed === "yes" ? "quiet" : "better, not gone"}`
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(share)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked: the record is still on screen */
    }
  }

  const closed = c.confirmed === "yes" || c.confirmed === "partly"

  return (
    <div className="anim-rise absolute inset-0 z-40 overflow-y-auto bg-background">
      <div className="mx-auto min-h-full max-w-[430px] px-5 pt-[max(var(--sat),12px)] pb-[max(var(--sab),24px)]">
        <button onClick={onBack} aria-label="Back to tracker" className="-ml-2 grid size-11 place-items-center rounded-full active:bg-fill">
          <ChevronLeft className="size-6" />
        </button>

        {/* question */}
        {!c.confirmed && (
          <div key="q" className="anim-step">
            <h1 className="mt-2 text-[32px] leading-[1.08] font-semibold tracking-[-0.03em]">Did it get better?</h1>
            <p className="mt-2 text-[17px] leading-snug text-muted-foreground">
              {ag.short} says: <span className="font-medium text-foreground">{c.outcome}</span> Your answer closes the case, or sends it back to them.
            </p>
            <ComplaintWave flow speed={6} amplitude={0.5} seed={3} className="mt-4" />
            <div className="mt-4 flex flex-col gap-3">
              {(
                [
                  ["yes", "Yes, it's quiet", "Close the case and save it to my record."],
                  ["partly", "A little better", "Close it, and note it isn't fully gone."],
                  ["no", "No, still loud", "Send it back to " + ag.short + "."],
                ] as [Confirmed, string, string][]
              ).map(([k, t, d], i) => (
                <button
                  key={k}
                  onClick={() => {
                    setJustClosed(true)
                    onConfirm(k)
                  }}
                  className="glass anim-rise flex items-center justify-between rounded-[22px] p-5 text-left transition-transform duration-200 ease-ios active:scale-[0.98]"
                  style={{ animationDelay: `${0.1 + i * 0.08}s` }}
                >
                  <span>
                    <span className="block text-[18px] font-semibold">{t}</span>
                    <span className="block text-[14px] text-muted-foreground">{d}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {c.confirmed === "no" && (
          <div key="no" className="anim-step">
            <h1 className="mt-2 text-[32px] leading-[1.08] font-semibold tracking-[-0.03em]">Reopened.</h1>
            <p className="mt-2 text-[17px] leading-snug text-muted-foreground">
              We sent {c.ref} back to {ag.name} and marked it as a repeat. You&apos;ll see the new steps in your tracker.
            </p>
            {/* still loud: the signal stays */}
            <ComplaintWave flow speed={6} amplitude={0.5} seed={3} className="mt-4" />
            <Button className="mt-8" variant="blue" onClick={onBack}>Back to tracker</Button>
          </div>
        )}

        {closed && (
          <div key="rec" className="anim-step">
            <ReleaseWave to={c.confirmed === "yes" ? "yes" : "partly"} play={justClosed} seed={5} className="mt-4" onSettled={() => setSettled(true)} />
            <h1 className="mt-1 text-[32px] leading-[1.08] font-semibold tracking-[-0.03em]">
              {c.confirmed === "yes" ? "Glad it's quiet." : "Good to hear it's better."}
            </h1>
            <p className="mt-2 text-[17px] leading-snug text-muted-foreground">Saved to your outcome record.</p>

            <section className="moment mt-5 rounded-[28px] p-3">
              <div className="grid grid-cols-3 gap-2">
                <PhotoTile src={photosFor(c.ref)[0]} badge="Voice" />
                <PhotoTile src={photosFor(c.ref)[1]} />
                <MapTile label={areaName(c.area)} />
              </div>
              <div className="px-2 pt-4 pb-2">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Outcome record</p>
                <span
                  className="flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-[12px] font-semibold text-accent"
                  style={settled ? { animation: justClosed ? "fade-in 120ms ease-out both" : undefined } : { opacity: 0 }}
                >
                  <Check className="size-3.5" strokeWidth={3} /> Resident confirmed
                </span>
              </div>
              <dl className="mt-3 flex flex-col text-[15px]">
                {[
                  ["Reference", <span key="r" className="inline-flex items-center gap-2"><SignalSignature samples={c.signature} height={12} />{c.ref}</span>],
                  ["Noise", `${c.type} · ${areaName(c.area)}`],
                  ["Reported", clock(c.createdAt)],
                  ["Closed", clock(c.closedAt ?? Date.now())],
                  ["Time to answer", dur((c.closedAt ?? Date.now()) - c.createdAt)],
                  [ag.short, c.outcome ?? ""],
                  ["You said", c.confirmed === "yes" ? "It's quiet" : "A little better"],
                ].map(([k, v], i) => (
                  <div key={String(k)} className={"flex justify-between gap-4 py-2.5 " + (i ? "border-t border-separator" : "")}>
                    <dt className="shrink-0 text-muted-foreground">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              </div>
            </section>

            <h2 className="mt-7 mb-2 px-1 text-[14px] font-medium text-muted-foreground">What next</h2>
            <div className="overflow-hidden rounded-[20px] bg-card">
              <div className="flex min-h-[60px] items-center gap-3 px-4 py-3">
                <div className="flex-1">
                  <p className="text-[16px] font-medium">Watch this address</p>
                  <p className="text-[14px] text-muted-foreground">Tell me if new reports appear nearby.</p>
                </div>
                <button
                  role="switch"
                  aria-checked={alerts}
                  aria-label="Watch this address"
                  onClick={() => setAlerts(a => !a)}
                  className="relative h-8 w-[52px] rounded-full transition-colors duration-300"
                  style={{ background: alerts ? "var(--accent)" : "var(--fill)" }}
                >
                  <span className="absolute top-0.5 left-0.5 size-7 rounded-full bg-white shadow transition-transform duration-300 ease-ios" style={{ transform: alerts ? "translateX(20px)" : "none" }} />
                </button>
              </div>
              <div className="border-t border-separator px-4 py-3">
                <label htmlFor="rec-note" className="text-[16px] font-medium">Add a note to your record</label>
                <input
                  id="rec-note"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Quiet since the warning"
                  className="mt-2 h-11 w-full rounded-full bg-fill px-4 text-[16px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-accent"
                />
              </div>
              <button onClick={copy} className="flex min-h-[56px] w-full items-center gap-3 border-t border-separator px-4 text-left text-[16px] font-medium">
                <span className="flex-1">{copied ? "Copied" : "Copy this record to share"}</span>
                <Copy className="size-5 text-muted-foreground" />
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Button variant="blue" onClick={onNew}>Report something new</Button>
              <Button variant="plain" onClick={onBack}>Back to tracker</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
