import { Ear } from "lucide-react"

import { Button } from "@/components/ui/button"
import { areaName, type Complaint } from "@/lib/data"

const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })

// The moment a report is heard in person. Quiet, slow, and a little bit of relief.
export default function HeardScreen({ c, onSee, onClose }: { c: Complaint; onSee: () => void; onClose: () => void }) {
  return (
    <div className="anim-rise absolute inset-0 z-40 overflow-y-auto bg-background">
      <div className="mx-auto flex min-h-full max-w-[430px] flex-col px-5 pt-[max(var(--sat),12px)] pb-[max(var(--sab),20px)]">
        <div className="relative mt-16 grid h-[240px] place-items-center">
          <span aria-hidden="true" className="absolute size-[230px] rounded-full" style={{ background: "radial-gradient(closest-side, rgb(8 102 255 / 0.16), transparent)", animation: "glow-in 1.4s cubic-bezier(0.32,0.72,0,1) both" }} />
          {[0, 1, 2, 3].map(i => (
            <span
              key={i}
              aria-hidden="true"
              className="absolute size-[190px] rounded-full border-2 border-accent"
              style={{ animation: "hear-in 3.4s cubic-bezier(0.32,0.72,0,1) infinite", animationDelay: `${0.3 + i * 0.85}s`, opacity: 0 }}
            />
          ))}
          <div
            className="anim-pop relative grid size-[112px] place-items-center rounded-full text-white shadow-[0_20px_50px_rgb(8_102_255/0.45)]"
            style={{ background: "linear-gradient(150deg,#ffffff 0%,#9cc2ff 28%,#0866ff 62%,#050a24 100%)", animationDelay: "0.4s", opacity: 0 }}
          >
            <Ear className="size-[52px]" strokeWidth={1.6} />
          </div>
        </div>

        <p className="anim-rise mt-6 text-center text-[13px] font-medium tracking-[0.08em] text-muted-foreground uppercase" style={{ animationDelay: "0.9s" }}>
          {clock(c.times[3] ?? Date.now())} · {c.ref}
        </p>
        <h1 className="anim-rise mt-2 text-center text-[36px] leading-[1.05] font-semibold tracking-[-0.03em]" style={{ animationDelay: "1.05s" }}>
          We listened.
        </h1>
        <p className="anim-rise mt-3 text-center text-[17px] leading-snug text-balance text-muted-foreground" style={{ animationDelay: "1.25s" }}>
          We went to {areaName(c.area)} and heard it for ourselves. What you reported was real, and now it is on record.
        </p>

        {c.note && (
          <p className="anim-rise mx-auto mt-6 max-w-[320px] border-l-2 border-accent/40 pl-4 text-[15px] leading-snug text-foreground/80 italic" style={{ animationDelay: "1.45s" }}>
            &ldquo;{c.note}&rdquo;
          </p>
        )}

        <div className="flex-1" />
        <div className="anim-rise mt-8 flex flex-col gap-1" style={{ animationDelay: "1.6s" }}>
          <Button variant="blue" onClick={onSee}>See what happens next</Button>
          <Button variant="plain" onClick={onClose}>Not now</Button>
        </div>
        <p className="mt-2 text-center text-[12px] text-muted-foreground">Prototype: this visit is simulated, not a live 311 update.</p>
      </div>
    </div>
  )
}
