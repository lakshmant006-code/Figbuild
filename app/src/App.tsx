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

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <main className="relative flex-1 overflow-hidden">
        <div className={tab === "map" ? "absolute inset-0" : "hidden"}>
          <MapTab area={profile.area} setArea={(a: AreaId) => setProfile({ ...profile, area: a })} frameRef={frameRef} active={tab === "map"} />
        </div>
        {tab === "report" && (
          <div className="absolute inset-0 overflow-y-auto">
            <ReportTab profile={profile} onSubmit={submit} />
          </div>
        )}
        {tab === "cases" && (
          <div className="absolute inset-0 overflow-y-auto">
            <CasesTab cases={cases} />
          </div>
        )}
        {toast && (
          <div role="status" className="absolute inset-x-4 top-[max(env(safe-area-inset-top),12px)] z-20 mx-auto max-w-[398px] rounded-full bg-primary px-5 py-3 text-center text-[15px] font-medium text-primary-foreground shadow-lg">
            {toast}
          </div>
        )}
      </main>

      <nav className="border-t border-separator bg-card/90 pb-[max(env(safe-area-inset-bottom),6px)] backdrop-blur-xl" aria-label="Main">
        <ul className="mx-auto flex max-w-[430px]">
          {tabs.map(({ id, label, Icon }) => (
            <li key={id} className="flex-1">
              <button
                onClick={() => setTab(id)}
                aria-current={tab === id ? "page" : undefined}
                className="flex h-[54px] w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium"
                style={{ color: tab === id ? "var(--accent)" : "var(--muted-foreground)" }}
              >
                <Icon className="size-[22px]" />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
