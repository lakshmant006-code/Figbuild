import { useEffect, useRef, useState } from "react"
import { ClipboardList, Map as MapIcon, Mic } from "lucide-react"

import { loadCases, loadProfile, saveCases, saveProfile, type AreaId, type Complaint, type Profile } from "@/lib/data"
import CasesTab from "@/pages/CasesTab"
import MapTab from "@/pages/MapTab"
import Onboarding from "@/pages/Onboarding"
import ReportTab from "@/pages/ReportTab"

type Tab = "map" | "report" | "cases"

const SEED: Complaint[] = [
  { ref: "HSH-48213", type: "Music or party", area: "williamsburg", stage: 2, createdAt: Date.now() - 36e5, note: "Example case" },
]

const tabs = [
  { id: "map", label: "Map", Icon: MapIcon },
  { id: "report", label: "Report", Icon: Mic },
  { id: "cases", label: "Cases", Icon: ClipboardList },
] as const

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(() => loadProfile())
  const [tab, setTab] = useState<Tab>("map")
  const [cases, setCases] = useState<Complaint[]>(() => loadCases() ?? SEED)
  const [toast, setToast] = useState("")
  const frameRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => saveCases(cases), [cases])

  // Simulated progress: the newest open case advances every few seconds.
  useEffect(() => {
    const iv = window.setInterval(() => {
      setCases(cs => {
        const i = cs.findIndex(c => c.stage < 4)
        if (i < 0) return cs
        return cs.map((c, j) => (j === i ? { ...c, stage: c.stage + 1 } : c))
      })
    }, 9000)
    return () => window.clearInterval(iv)
  }, [])

  if (!profile) {
    return (
      <Onboarding
        onDone={p => {
          saveProfile(p)
          setProfile(p)
        }}
      />
    )
  }

  const submit = (c: Complaint) => {
    setCases(cs => [c, ...cs])
    frameRef.current?.contentWindow?.postMessage({ cmd: "complaint" }, "*")
    setToast(`Sent. Case ${c.ref} is open.`)
    setTab("cases")
    window.setTimeout(() => setToast(""), 3200)
  }

  const idx = tabs.findIndex(t => t.id === tab)

  return (
    <div className="absolute inset-0 bg-background">
      <main className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 transition-[opacity,filter,transform] duration-500 ease-ios"
          style={{ opacity: tab === "map" ? 1 : 0, filter: tab === "map" ? "none" : "blur(14px)", transform: tab === "map" ? "none" : "scale(0.98)", pointerEvents: tab === "map" ? "auto" : "none" }}
        >
          <MapTab area={profile.area} setArea={(a: AreaId) => setProfile({ ...profile, area: a })} frameRef={frameRef} active={tab === "map"} />
        </div>
        {tab === "report" && (
          <div key="report" className="anim-rise absolute inset-0 overflow-y-auto pb-28">
            <ReportTab profile={profile} onSubmit={submit} />
          </div>
        )}
        {tab === "cases" && (
          <div key="cases" className="anim-rise absolute inset-0 overflow-y-auto pb-28">
            <CasesTab cases={cases} />
          </div>
        )}
        {toast && (
          <div role="status" className="anim-feed glass absolute inset-x-4 top-[max(var(--sat),12px)] z-20 mx-auto max-w-[398px] rounded-full px-5 py-3 text-center text-[15px] font-semibold">
            {toast}
          </div>
        )}
      </main>

      <nav className="absolute inset-x-3 bottom-[max(var(--sab),12px)] z-30 mx-auto max-w-[406px]" aria-label="Main">
        <ul className="glass relative flex rounded-full p-1.5">
          <span
            aria-hidden="true"
            className="absolute top-1.5 bottom-1.5 left-1.5 rounded-full bg-accent/15 transition-transform duration-500 ease-ios"
            style={{ width: "calc((100% - 12px) / 3)", transform: `translateX(${idx * 100}%)` }}
          />
          {tabs.map(({ id, label, Icon }) => (
            <li key={id} className="relative flex-1">
              <button
                onClick={() => setTab(id)}
                aria-current={tab === id ? "page" : undefined}
                className="flex h-[50px] w-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors duration-300"
                style={{ color: tab === id ? "var(--accent)" : "var(--muted-foreground)" }}
              >
                <Icon className="size-[22px] transition-transform duration-500 ease-ios" style={{ transform: tab === id ? "translateY(-1px) scale(1.1)" : "none" }} />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
