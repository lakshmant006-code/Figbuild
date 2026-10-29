import { useCallback, useEffect, useRef, useState } from "react"
import { RotateCcw } from "lucide-react"

import { ChimeIcon, IosApp } from "@/components/ios-icons"
import { renderWidget } from "@/components/widgets"
import type { Complaint } from "@/lib/data"
import type { Notice } from "@/lib/notices"

const DEMO: Notice = { id: "demo", at: Date.now(), type: "Music or party", title: "We are on the way.", body: "NYPD · CHM-48213", ref: "CHM-48213", action: { label: "View case", to: "track" } }

// A notification as it really arrives: over your normal Home Screen, from the top, then it tucks away.
export default function HomeScreenNotify({
  notices,
  c,
  area,
  onOpenChime,
  onOpenNotice,
}: {
  notices: Notice[]
  c?: Complaint
  area: string
  onOpenChime: () => void
  onOpenNotice: (n: Notice) => void
}) {
  const list = notices.length ? notices.slice(0, 3) : [DEMO]
  const [idx, setIdx] = useState(0)
  const [shown, setShown] = useState<"in" | "out" | null>(null)
  const timers = useRef<number[]>([])
  const down = useRef<number | null>(null)
  const swiped = useRef(false)

  const clear = () => {
    timers.current.forEach(t => window.clearTimeout(t))
    timers.current = []
  }
  const play = useCallback((i: number) => {
    clear()
    setIdx(i)
    setShown("in")
    timers.current.push(window.setTimeout(() => setShown("out"), 5600))
    timers.current.push(window.setTimeout(() => setShown(null), 6200))
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => play(0), 900)
    return () => {
      window.clearTimeout(t)
      clear()
    }
  }, [play])

  const n = list[idx % list.length]
  const dismiss = () => {
    clear()
    setShown("out")
    timers.current.push(window.setTimeout(() => setShown(null), 500))
  }

  return (
    <div className="anim-rise absolute inset-0 z-40 overflow-hidden" style={{ background: "linear-gradient(175deg,#eaf2ff 0%,#a9c6ff 34%,#3b79ff 68%,#0a1030 100%)" }}>
      {/* the Home Screen */}
      <div className="flex flex-col gap-[18px] px-5 pt-[66px]">
        <div className="flex justify-between">
          {renderWidget("signal", c, area)}
          <div className="grid size-[170px] grid-cols-2 place-items-center gap-y-2">
            <IosApp app="mail" /><IosApp app="maps" /><IosApp app="camera" /><IosApp app="clock" />
          </div>
        </div>
        {renderWidget("nearby", c, area)}
        <div className="grid grid-cols-4 gap-y-4">
          <button onClick={onOpenChime} aria-label="Open Chime" className="transition-transform duration-200 ease-ios active:scale-90">
            <ChimeIcon />
          </button>
          <IosApp app="calendar" /><IosApp app="weather" /><IosApp app="settings" />
        </div>
      </div>

      <p className="absolute bottom-[222px] left-0 right-0 text-center text-[12px] font-medium text-white/85">Tap the banner to open it. Tap Chime to go back.</p>
      <button
        onClick={() => play((idx + 1) % list.length)}
        className="absolute bottom-[178px] left-1/2 flex h-9 -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/30 px-4 text-[13px] font-semibold text-white backdrop-blur-xl active:scale-95"
      >
        <RotateCcw className="size-3.5" /> Replay notification
      </button>

      <div className="absolute bottom-[152px] left-1/2 flex -translate-x-1/2 gap-2" aria-hidden="true">
        <span className="size-[7px] rounded-full bg-white" />
        <span className="size-[7px] rounded-full bg-white/45" />
      </div>
      <div className="absolute inset-x-4 bottom-[calc(var(--sab)+6px)] flex justify-around rounded-[34px] bg-white/30 px-3 py-3 backdrop-blur-xl">
        <IosApp app="phone" label={false} /><IosApp app="safari" label={false} /><IosApp app="messages" label={false} /><IosApp app="music" label={false} />
      </div>

      {/* the notification banner */}
      {shown && (
        <div
          role="button"
          tabIndex={0}
          aria-label={`Notification: ${n.title} ${n.body}`}
          onPointerDown={e => {
            down.current = e.clientY
            swiped.current = false
          }}
          onPointerUp={e => {
            if (down.current !== null && down.current - e.clientY > 14) {
              swiped.current = true
              dismiss()
            }
            down.current = null
          }}
          onClick={() => {
            if (swiped.current) return
            clear()
            onOpenNotice(n)
          }}
          onKeyDown={e => e.key === "Enter" && onOpenNotice(n)}
          className="absolute inset-x-2 top-[58px] z-20 flex cursor-pointer touch-none gap-3 rounded-[26px] p-3.5 text-left select-none"
          style={{
            background: "rgb(250 250 253 / 0.74)",
            backdropFilter: "blur(30px) saturate(1.9)",
            WebkitBackdropFilter: "blur(30px) saturate(1.9)",
            boxShadow: "0 14px 40px rgb(8 20 70 / 0.28), inset 0 1px 0 rgb(255 255 255 / 0.6), 0 0 0 0.5px rgb(0 0 0 / 0.08)",
            animation: shown === "in" ? "banner-in 0.75s cubic-bezier(0.32,0.72,0,1) both" : "banner-out 0.55s cubic-bezier(0.5,0,0.75,0) both",
          }}
        >
          <img src="logo.png" alt="" className="size-[40px] shrink-0 rounded-[10px] ring-1 ring-black/10" />
          <div className="min-w-0 flex-1 text-black">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-[15px] leading-tight font-semibold">{n.title}</p>
              <span className="shrink-0 text-[12px] text-black/50">now</span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-[15px] leading-[1.25] text-black/70">{n.body}</p>
          </div>
        </div>
      )}
    </div>
  )
}
