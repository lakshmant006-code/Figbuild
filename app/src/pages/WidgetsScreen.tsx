import { useState } from "react"
import { Check, ChevronLeft, Plus } from "lucide-react"

import { ChimeIcon, IosApp } from "@/components/ios-icons"
import { WIDGETS, renderWidget, type WidgetId, type WidgetSize } from "@/components/widgets"
import { cn } from "@/lib/utils"
import type { Complaint } from "@/lib/data"

const GROUPS: { size: WidgetSize; label: string }[] = [
  { size: "small", label: "Small" },
  { size: "medium", label: "Medium" },
  { size: "large", label: "Large" },
]


function HomeScreenMock({ added, c, area }: { added: WidgetId[]; c?: Complaint; area: string }) {
  const smalls = WIDGETS.filter(w => w.size === "small" && added.includes(w.id))
  const rest = WIDGETS.filter(w => w.size !== "small" && added.includes(w.id))
  const grid = (apps: ("mail" | "maps" | "camera" | "clock" | "calendar" | "weather" | "settings")[], hush: boolean) => (
    <div className="grid grid-cols-4 gap-y-4">
      {hush && <ChimeIcon />}
      {apps.map(a => <IosApp key={a} app={a} />)}
    </div>
  )
  return (
    <div className="relative mt-5 flex flex-col overflow-hidden rounded-[34px] px-4 pt-5 pb-4" style={{ background: "linear-gradient(175deg,#eaf2ff 0%,#a9c6ff 36%,#3b79ff 70%,#0a1030 100%)" }}>
      <div className="flex flex-col gap-4" style={{ zoom: 0.88 }}>
        {smalls.length > 0 && (
          <div className="flex justify-between gap-3">
            {smalls.map(w => <div key={w.id} className="anim-pop">{renderWidget(w.id, c, area)}</div>)}
            {smalls.length === 1 && (
              <div className="grid size-[170px] grid-cols-2 place-items-center gap-y-2">
                <IosApp app="mail" /><IosApp app="maps" /><IosApp app="camera" /><IosApp app="clock" />
              </div>
            )}
          </div>
        )}
        {rest.map(w => <div key={w.id} className="anim-pop">{renderWidget(w.id, c, area)}</div>)}
        {grid(smalls.length === 1 ? ["calendar", "weather", "settings"] : ["mail", "maps", "camera"], true)}
      </div>
      {/* dock */}
      <div className="mt-4 flex justify-around rounded-[30px] bg-white/30 px-3 py-3 backdrop-blur-xl" style={{ zoom: 0.88 }}>
        <IosApp app="phone" label={false} />
        <IosApp app="safari" label={false} />
        <IosApp app="messages" label={false} />
        <IosApp app="music" label={false} />
      </div>
    </div>
  )
}

// Widgets: your signal on the Home Screen, in three sizes.
export default function WidgetsScreen({ c, area, onBack }: { c?: Complaint; area: string; onBack: () => void }) {
  const [mode, setMode] = useState<"gallery" | "home">("gallery")
  const [added, setAdded] = useState<WidgetId[]>(["signal", "nearby"])
  const toggle = (id: WidgetId) => setAdded(a => (a.includes(id) ? a.filter(x => x !== id) : [...a, id]))

  return (
    <div className="anim-rise absolute inset-0 z-40 overflow-y-auto bg-background">
      <div className="mx-auto min-h-full max-w-[430px] px-5 pt-[max(var(--sat),12px)] pb-[max(var(--sab),28px)]">
        <button onClick={onBack} aria-label="Back" className="-ml-2 grid size-11 place-items-center rounded-full active:bg-fill">
          <ChevronLeft className="size-6" />
        </button>
        <h1 className="mt-2 text-[32px] leading-[1.08] font-semibold tracking-[-0.03em]">Widgets</h1>
        <p className="mt-2 text-[17px] leading-snug text-muted-foreground">Your signal, one glance away. No opening the app.</p>

        <div className="relative mt-5 flex rounded-full bg-fill p-1" role="tablist" aria-label="View">
          <span
            aria-hidden="true"
            className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-background shadow-sm transition-transform duration-500 ease-ios"
            style={{ transform: mode === "home" ? "translateX(100%)" : "none" }}
          />
          {(["gallery", "home"] as const).map(m => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className="relative h-10 flex-1 rounded-full text-[15px] font-semibold">
              {m === "gallery" ? "Gallery" : "Home Screen"}
            </button>
          ))}
        </div>

        {mode === "gallery" ? (
          <div key="g" className="anim-step">
            {GROUPS.map(g => {
              const list = WIDGETS.filter(w => w.size === g.size)
              return (
                <section key={g.size} className="mt-7">
                  <p className="mb-3 px-1 text-[14px] font-medium text-muted-foreground">{g.label}</p>
                  <div className={cn("gap-3", g.size === "small" ? "flex" : "flex flex-col")}>
                    {list.map(w => (
                      <div key={w.id} className={g.size === "small" ? "min-w-0" : ""}>
                        <div className="origin-top-left">{renderWidget(w.id, c, area)}</div>
                        <div className="mt-2.5 flex items-center gap-2 px-1" style={{ width: g.size === "small" ? 170 : "100%" }}>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] leading-tight font-semibold">{w.name}</p>
                            <p className="line-clamp-2 text-[12px] leading-snug text-muted-foreground">{w.desc}</p>
                          </div>
                          <button
                            onClick={() => toggle(w.id)}
                            aria-label={added.includes(w.id) ? `Remove ${w.name}` : `Add ${w.name}`}
                            aria-pressed={added.includes(w.id)}
                            className={cn(
                              "grid size-9 shrink-0 place-items-center rounded-full transition-[background-color,color,transform] duration-300 ease-ios active:scale-90",
                              added.includes(w.id) ? "bg-accent text-white" : "bg-fill",
                            )}
                          >
                            {added.includes(w.id) ? <Check className="size-[18px]" strokeWidth={2.6} /> : <Plus className="size-[18px]" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
            <p className="mt-7 px-1 text-[13px] leading-snug text-muted-foreground">
              Prototype preview. On a real iPhone you touch and hold the Home Screen, tap +, and pick Chime.
            </p>
          </div>
        ) : (
          <div key="h" className="anim-step">
            <HomeScreenMock added={added} c={c} area={area} />
            <p className="mt-3 px-1 text-[13px] text-muted-foreground">
              {added.length === 0 ? "Nothing added yet. Switch to Gallery and tap +." : `${added.length} widget${added.length > 1 ? "s" : ""} on your Home Screen.`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
