import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MapTile, PhotoTile, photosFor } from "@/components/ui/moment-card"
import { agencyFor, areaName, type Complaint } from "@/lib/data"

// 03 · Your voice is on its way.  A confirmation with the official complaint reference.
export default function SentScreen({ c, onTrack, onAnother }: { c: Complaint; onTrack: () => void; onAnother: () => void }) {
  const [typed, setTyped] = useState("")
  useEffect(() => {
    let i = 0
    let iv = 0
    const start = window.setTimeout(() => {
      iv = window.setInterval(() => {
        i += 1
        setTyped(c.ref.slice(0, i))
        if (i >= c.ref.length) window.clearInterval(iv)
      }, 70)
    }, 1100)
    return () => {
      window.clearTimeout(start)
      window.clearInterval(iv)
    }
  }, [c.ref])

  return (
    <div className="anim-rise absolute inset-0 z-40 overflow-y-auto bg-background">
      <div className="mx-auto flex min-h-full max-w-[430px] flex-col px-5 pt-[max(var(--sat),12px)] pb-[max(var(--sab),20px)]">
        <div className="relative mt-6 grid h-[190px] place-items-center">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="absolute size-[130px] rounded-full border-2 border-accent"
              style={{ animation: "ring-out 2.6s cubic-bezier(0.32,0.72,0,1) infinite", animationDelay: `${0.5 + i * 0.8}s`, opacity: 0 }}
            />
          ))}
          <div
            className="anim-pop relative grid size-[130px] place-items-center rounded-full shadow-[0_20px_50px_rgb(8_102_255/0.45)]"
            style={{ background: "linear-gradient(150deg,#ffffff 0%,#9cc2ff 28%,#0866ff 62%,#050a24 100%)", animationDelay: "0.1s" }}
          >
            <svg viewBox="0 0 52 52" className="size-[60px]" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 27 L22 36 L40 16" strokeDasharray="48" strokeDashoffset="48" style={{ animation: "draw 0.6s cubic-bezier(0.32,0.72,0,1) 0.55s forwards" }} />
            </svg>
          </div>
        </div>

        <h1 className="anim-rise text-center text-[32px] leading-[1.08] font-semibold tracking-[-0.03em] text-balance" style={{ animationDelay: "0.7s" }}>
          Your voice is on its way.
        </h1>
        <p className="anim-rise mt-2 text-center text-[16px] leading-snug text-muted-foreground" style={{ animationDelay: "0.85s" }}>
          Filed with {agencyFor(c.type).name}. Keep this reference to follow the case.
        </p>

        <div className="moment anim-rise mt-6 rounded-[28px] p-3 text-center" style={{ animationDelay: "1s" }}>
          <div className="grid grid-cols-3 gap-2">
            <PhotoTile src={photosFor(c.ref)[0]} badge="Voice" />
            <PhotoTile src={photosFor(c.ref)[1]} />
            <MapTile label={areaName(c.area)} />
          </div>
          <div className="px-2 pt-4 pb-3">
          <p className="text-[12px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Official complaint reference</p>
          <p className="mt-2 min-h-[44px] font-mono text-[34px] font-medium tracking-[0.04em]" aria-label={c.ref}>
            {typed}
            <span className="ml-0.5 inline-block w-[3px] animate-pulse bg-accent align-middle" style={{ height: 30 }} />
          </p>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {c.type} · {areaName(c.area)}
          </p>
          </div>
        </div>

        <div className="flex-1" />
        <div className="mt-5 flex flex-col gap-1">
          <Button variant="blue" onClick={onTrack}>
            Follow your signal <ArrowRight className="size-5" />
          </Button>
          <Button variant="plain" onClick={onAnother}>Report something else</Button>
        </div>
        <p className="mt-2 text-center text-[12px] text-muted-foreground">Prototype: the reference is an example, not a live 311 filing.</p>
      </div>
    </div>
  )
}
