import { useEffect, useMemo, useRef, useState, type RefObject } from "react"
import { Box, Building2, Footprints, Layers } from "lucide-react"

import { IconTile } from "@/components/ui/moment-card"
import { AREAS, NOISE_TYPES, areaName, type AreaId, type Complaint } from "@/lib/data"

const cmdButtons = [
  { cmd: "tilt", label: "3D / 2D", Icon: Box },
  { cmd: "city", label: "Whole city", Icon: Layers },
  { cmd: "sky", label: "Skyline", Icon: Building2 },
  { cmd: "street", label: "Street level", Icon: Footprints },
] as const

function AnimatedNumber({ value }: { value: number }) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    const start = performance.now()
    const a = from.current
    let raf = 0
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 500)
      const e = 1 - Math.pow(1 - k, 3)
      setShown(Math.round(a + (value - a) * e))
      if (k < 1) raf = requestAnimationFrame(step)
      else from.current = value
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <span className="tabular-nums">{shown}</span>
}

// A thin heartbeat line that scrolls forever and spikes whenever a new report lands.
function LiveWave({ pulse }: { pulse: number }) {
  const path = "M0 14 L40 14 L48 14 L54 4 L60 24 L66 10 L72 14 L120 14 L130 14 L136 7 L142 21 L148 14 L200 14"
  return (
    <div className="relative mt-2 h-7 overflow-hidden" aria-hidden="true" style={{ maskImage: "linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent)" }}>
      <div key={pulse} className="absolute inset-0" style={{ animation: "spike 0.7s cubic-bezier(0.32,0.72,0,1)" }}>
        <svg className="h-7 w-[200%]" viewBox="0 0 400 28" preserveAspectRatio="none">
          <defs>
            <linearGradient id="ecg-g" x1="0" x2="1">
              <stop offset="0" stopColor="#9cc2ff" />
              <stop offset="0.5" stopColor="#0866ff" />
              <stop offset="1" style={{ stopColor: "var(--foreground)" }} />
            </linearGradient>
          </defs>
          <path d={path} fill="none" stroke="url(#ecg-g)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d={path} transform="translate(200 0)" fill="none" stroke="url(#ecg-g)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

// Single-file builds (the artifact) inline the map page here instead of linking map.html.
const srcDoc = (window as unknown as { __HUSH_MAP_SRCDOC__?: string }).__HUSH_MAP_SRCDOC__

export default function MapTab({
  area,
  setArea,
  frameRef,
  mine,
}: {
  area: AreaId
  setArea: (a: AreaId) => void
  frameRef: RefObject<HTMLIFrameElement | null>
  mine?: Complaint | null
}) {
  const [block, setBlock] = useState<number | null>(null)
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(true)
  const dragY = useRef<number | null>(null)
  const areaRef = useRef(area)
  areaRef.current = area

  const send = (msg: object) => frameRef.current?.contentWindow?.postMessage(msg, "*")

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow) return
      if (e.data?.type === "hex" && typeof e.data.count === "number") setBlock(e.data.count)
      if (e.data?.type === "loaded") window.setTimeout(() => setReady(true), 500)
      if (e.data?.type === "ready") send({ cmd: "area", id: areaRef.current })
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [frameRef])

  // A calm, fixed set of recent example reports for the neighborhood. Only your own report adds a new one.
  const recent = useMemo(() => {
    const i = Math.max(0, AREAS.findIndex(a => a.id === area))
    return [
      { id: "a", type: NOISE_TYPES[(i + 1) % NOISE_TYPES.length], when: "12 min ago", status: "Sent to the agency" },
      { id: "b", type: NOISE_TYPES[(i + 4) % NOISE_TYPES.length], when: "41 min ago", status: "Checked on site" },
    ]
  }, [area])
  const items = mine
    ? [{ id: mine.ref, type: mine.type, when: "You · just now", status: "Sent to the agency" }, ...recent.slice(0, 1)]
    : recent
  const total = 186 + (mine ? 1 : 0)

  // Safety net: never leave the frosted loader up forever.
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 20000)
    return () => window.clearTimeout(t)
  }, [])

  const pick = (id: AreaId) => {
    setArea(id)
    setBlock(null)
    send({ cmd: "area", id })
  }

  return (
    <div className="absolute inset-0">
      <iframe
        ref={frameRef}
        title="Live 3D map of noise complaints"
        {...(srcDoc ? { srcDoc } : { src: `map.html?area=${area}` })}
        className="absolute inset-0 h-full w-full border-0"
        allow="fullscreen"
      />

      <div className="absolute top-[max(var(--sat),12px)] right-4 flex flex-col gap-2">
        {cmdButtons.map(({ cmd, label, Icon }, i) => (
          <button
            key={cmd}
            onClick={() => send({ cmd })}
            aria-label={label}
            className="glass anim-rise grid size-11 place-items-center rounded-full text-foreground transition-transform duration-200 ease-ios active:scale-90"
            style={{ animationDelay: `${0.5 + i * 0.07}s` }}
          >
            <Icon className="size-5" />
          </button>
        ))}
      </div>

      <section
        className="glass absolute inset-x-2 bottom-[calc(max(var(--sab),12px)+74px)] mx-auto max-w-[414px] rounded-[30px] anim-rise"
        style={{ animationDelay: "0.35s" }}
      >
        <button
          aria-label={open ? "Collapse the live feed" : "Expand the live feed"}
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          onPointerDown={e => (dragY.current = e.clientY)}
          onPointerUp={e => {
            if (dragY.current !== null && Math.abs(e.clientY - dragY.current) > 24) setOpen(e.clientY < dragY.current)
            dragY.current = null
          }}
          className="mx-auto block h-6 w-full touch-none"
        >
          <span className="mx-auto mt-2 block h-1 w-9 rounded-full bg-foreground/20 transition-all duration-300 ease-ios" style={{ width: open ? 36 : 52 }} />
        </button>
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2">
            <span className="relative grid size-2.5 place-items-center">
              <span className="size-2 rounded-full bg-accent" />
            </span>
            <h2 className="text-[20px] font-semibold tracking-[-0.02em]">Is the city listening?</h2>
          </div>
          <p className="mt-0.5 text-[14px] text-muted-foreground">
            <span key={area} className="anim-feed inline-block font-medium text-foreground">{areaName(area)}</span> · <AnimatedNumber value={total} /> reports this week
            {block !== null ? ` · ${block} on the block you tapped` : ""}
          </p>
          <LiveWave pulse={mine ? 1 : 0} />

          <div className="mt-1 grid grid-cols-3 gap-2">
            {[
              ["Median reply", "2 h 10 m"],
              ["Got an outcome", "78%"],
              ["Most reported", "Music"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-fill px-3 py-2">
                <p className="text-[11px] text-muted-foreground">{k}</p>
                <p className="text-[15px] leading-tight font-semibold tabular-nums">{v}</p>
              </div>
            ))}
          </div>

          <div className="-mx-5 mt-2 flex snap-x gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
            {AREAS.map(a => (
              <button
                key={a.id}
                onClick={() => pick(a.id)}
                aria-pressed={a.id === area}
                className="h-9 shrink-0 snap-start rounded-full px-4 text-[14px] font-medium transition-[background-color,color,transform] duration-300 ease-ios active:scale-95"
                style={a.id === area ? { background: "var(--foreground)", color: "var(--background)" } : { background: "var(--fill)" }}
              >
                {a.name}
              </button>
            ))}
          </div>

          <div
            className="grid transition-[grid-template-rows,opacity] duration-500 ease-ios"
            style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}
          >
            <ul className="min-h-0 overflow-hidden" >
              {items.map((f, i) => (
                <li
                  key={f.id}
                  className="anim-feed moment relative mt-2 flex items-center gap-3 overflow-hidden rounded-[20px] p-2.5"
                >
                  {mine && i === 0 && <span className="anim-sweep pointer-events-none absolute inset-0" />}
                  <IconTile type={f.type} size={46} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] text-muted-foreground">{f.when}</span>
                    <span className="block truncate text-[16px] leading-tight font-semibold">{f.type}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">{f.status}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="min-h-0 overflow-hidden text-[12px] text-muted-foreground">Simulated example data. Replies are modeled on how NYC agencies respond.</p>
          </div>
        </div>
      </section>

      {/* frosted loader, lifts once the first neighborhood has loaded */}
      <div
        aria-hidden={ready}
        className="glass pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-none transition-[opacity,backdrop-filter] duration-[900ms] ease-ios"
        style={{ opacity: ready ? 0 : 1, backdropFilter: ready ? "blur(0px)" : undefined, WebkitBackdropFilter: ready ? "blur(0px)" : undefined, pointerEvents: ready ? "none" : "auto" }}
      >
        <div className="flex flex-col items-center gap-4">
          <img src="logo.png" alt="" className="size-20 rounded-[22px] shadow-[0_12px_40px_rgb(8_102_255/0.35)]" style={{ animation: "breathe 1.8s ease-in-out infinite" }} />
          <p className="text-[15px] font-medium text-muted-foreground">Loading the city in 3D…</p>
        </div>
      </div>
    </div>
  )
}
