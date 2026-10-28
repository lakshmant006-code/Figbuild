import { useEffect, useRef, useState, type RefObject } from "react"
import { Box, Building2, Footprints, Layers } from "lucide-react"

import { AREAS, NOISE_TYPES, areaName, type AreaId } from "@/lib/data"

interface FeedItem {
  id: number
  type: string
  at: number
}

const cmdButtons = [
  { cmd: "tilt", label: "3D / 2D", Icon: Box },
  { cmd: "city", label: "Whole city", Icon: Layers },
  { cmd: "sky", label: "Skyline", Icon: Building2 },
  { cmd: "street", label: "Street level", Icon: Footprints },
] as const

function ago(at: number, now: number) {
  const s = Math.max(0, Math.round((now - at) / 1000))
  return s < 5 ? "just now" : s < 60 ? `${s}s ago` : `${Math.round(s / 60)}m ago`
}

// Single-file builds (the artifact) inline the map page here instead of linking map.html.
const srcDoc = (window as unknown as { __HUSH_MAP_SRCDOC__?: string }).__HUSH_MAP_SRCDOC__

export default function MapTab({
  area,
  setArea,
  frameRef,
  active,
}: {
  area: AreaId
  setArea: (a: AreaId) => void
  frameRef: RefObject<HTMLIFrameElement | null>
  active: boolean
}) {
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [total, setTotal] = useState(184)
  const [block, setBlock] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const idRef = useRef(0)
  const areaRef = useRef(area)
  areaRef.current = area

  const send = (msg: object) => frameRef.current?.contentWindow?.postMessage(msg, "*")

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow) return
      if (e.data?.type === "hex") setBlock(e.data.count)
      if (e.data?.type === "ready") send({ cmd: "area", id: areaRef.current })
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [frameRef])

  // Simulated live feed: a new report every few seconds, pulsing on the map.
  useEffect(() => {
    if (!active) return
    const add = () => {
      const type = NOISE_TYPES[Math.floor(Math.random() * NOISE_TYPES.length)]
      idRef.current += 1
      setFeed(f => [{ id: idRef.current, type, at: Date.now() }, ...f].slice(0, 4))
      setTotal(n => n + 1)
      send({ cmd: "complaint" })
    }
    const first = window.setTimeout(add, 1500)
    const iv = window.setInterval(add, 4200)
    const clock = window.setInterval(() => setNow(Date.now()), 1000)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(iv)
      window.clearInterval(clock)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

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

      <div className="absolute top-[max(env(safe-area-inset-top),12px)] right-4 flex flex-col gap-2">
        {cmdButtons.map(({ cmd, label, Icon }) => (
          <button
            key={cmd}
            onClick={() => send({ cmd })}
            aria-label={label}
            className="grid size-11 place-items-center rounded-full bg-card/95 text-foreground shadow-[0_1px_8px_rgb(0_0_0/0.18)] backdrop-blur active:scale-95"
          >
            <Icon className="size-5" />
          </button>
        ))}
      </div>

      <section className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-card/95 pt-2 pb-3 shadow-[0_-8px_30px_rgb(0_0_0/0.14)] backdrop-blur-xl">
        <div className="mx-auto h-1 w-9 rounded-full bg-fill" />
        <div className="mx-auto max-w-[430px] px-5 pt-3">
          <div className="flex items-center gap-2">
            <span className="relative grid size-2.5 place-items-center">
              <span className="absolute size-2.5 animate-ping rounded-full bg-accent/60" />
              <span className="size-2 rounded-full bg-accent" />
            </span>
            <h2 className="text-[20px] font-bold tracking-[-0.02em]">Live in {areaName(area)}</h2>
          </div>
          <p className="mt-0.5 text-[14px] text-muted-foreground">
            {total} reports this week{block !== null ? ` · ${block} on the block you tapped` : ""} · Simulated example data
          </p>

          <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
            {AREAS.map(a => (
              <button
                key={a.id}
                onClick={() => pick(a.id)}
                aria-pressed={a.id === area}
                className="h-9 shrink-0 rounded-full px-4 text-[14px] font-medium transition-colors"
                style={a.id === area ? { background: "var(--foreground)", color: "var(--background)" } : { background: "var(--fill)" }}
              >
                {a.name}
              </button>
            ))}
          </div>

          <ul className="mt-3 flex flex-col" aria-live="polite">
            {feed.length === 0 && <li className="py-3 text-[15px] text-muted-foreground">Listening for new reports…</li>}
            {feed.slice(0, 3).map((f, i) => (
              <li key={f.id} className={"flex items-center gap-3 py-2.5 " + (i ? "border-t border-separator" : "")}>
                <span className="size-2.5 rounded-full bg-accent" />
                <span className="flex-1 text-[16px] font-medium">{f.type}</span>
                <span className="text-[14px] text-muted-foreground">{ago(f.at, now)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
