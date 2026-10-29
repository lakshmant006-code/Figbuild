import { useEffect, useRef, useState } from "react"
import { BarChart3, Bell, ClipboardList, Map as MapIcon, Mic } from "lucide-react"

import {
  loadCases,
  loadProfile,
  pickOutcome,
  saveCases,
  saveProfile,
  type AreaId,
  type Complaint,
  type Confirmed,
  type Profile,
} from "@/lib/data"
import { stageCopy } from "@/lib/data"
import { buildNotices, loadPrefs, loadSeen, savePrefs, saveSeen, type Notice, type Prefs } from "@/lib/notices"
import { areaName } from "@/lib/data"
import CasesScreen from "@/pages/CasesScreen"
import ClosureScreen from "@/pages/ClosureScreen"
import InsightsTab from "@/pages/InsightsTab"
import MapTab from "@/pages/MapTab"
import HeardScreen from "@/pages/HeardScreen"
import HomeScreenNotify from "@/pages/HomeScreenNotify"
import NotificationsScreen from "@/pages/NotificationsScreen"
import Onboarding from "@/pages/Onboarding"
import ReportTab from "@/pages/ReportTab"
import WidgetsScreen from "@/pages/WidgetsScreen"
import SentScreen from "@/pages/SentScreen"
import TrackTab from "@/pages/TrackTab"

type Tab = "report" | "track" | "city" | "insights"
type Overlay = { kind: "sent"; ref: string } | { kind: "closure"; ref: string } | { kind: "notices" } | { kind: "widgets" } | { kind: "home" } | { kind: "cases" } | { kind: "heard"; ref: string } | null

const now0 = Date.now()
const SEED: Complaint[] = [
  {
    ref: "CHM-48213",
    type: "Music or party",
    area: "williamsburg",
    stage: 2,
    createdAt: now0 - 36e5,
    times: [now0 - 36e5, now0 - 34e5, now0 - 31e5],
    note: "Example case",
  },
]

const tabs = [
  { id: "report", label: "Report", Icon: Mic },
  { id: "track", label: "Track", Icon: ClipboardList },
  { id: "city", label: "City", Icon: MapIcon },
  { id: "insights", label: "Insights", Icon: BarChart3 },
] as const

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(() => loadProfile())
  const [tab, setTab] = useState<Tab>("report")
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [mine, setMine] = useState<Complaint | null>(null)
  const [cases, setCases] = useState<Complaint[]>(() => loadCases() ?? SEED)
  const [prefs, setPrefsState] = useState<Prefs>(() => loadPrefs())
  const [seenAt, setSeenAt] = useState<number>(() => loadSeen())
  const frameRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => saveCases(cases), [cases])

  // A status change should be felt. Step 3 (someone listened) gets its own moment; the rest get a soft banner.
  const [toast, setToast] = useState<{ id: number; ref: string; title: string; body: string } | null>(null)
  const prevStage = useRef<Record<string, number>>({})
  const overlayRef = useRef<Overlay>(null)
  overlayRef.current = overlay
  useEffect(() => {
    const prev = prevStage.current
    for (const c of cases) {
      const before = prev[c.ref]
      prev[c.ref] = c.stage
      if (before === undefined || c.stage <= before) continue
      if (c.stage === 3 && overlayRef.current === null) {
        setOverlay({ kind: "heard", ref: c.ref })
        continue
      }
      const copy = stageCopy(c, c.stage)
      setToast({ id: Date.now(), ref: c.ref, title: c.stage === 4 ? "They answered you." : copy.title, body: c.stage === 4 ? "Tap to see what they decided." : copy.detail })
    }
  }, [cases])
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(t)
  }, [toast])

  // Simulated progress: the newest open case moves forward every few seconds.
  useEffect(() => {
    const iv = window.setInterval(() => {
      setCases(cs => {
        const i = cs.findIndex(c => c.stage < 4)
        if (i < 0) return cs
        return cs.map((c, j) => {
          if (j !== i) return c
          const stage = c.stage + 1
          const next: Complaint = { ...c, stage, times: [...c.times, Date.now()] }
          if (stage === 4) {
            next.outcome = pickOutcome(c.type)
            next.confirmed = undefined
          }
          return next
        })
      })
    }, 20000)
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
    setSelected(c.ref)
    setMine(c)
    frameRef.current?.contentWindow?.postMessage({ cmd: "complaint" }, "*")
    setOverlay({ kind: "sent", ref: c.ref })
  }

  const confirm = (ref: string, a: Confirmed) =>
    setCases(cs =>
      cs.map(c => {
        if (c.ref !== ref) return c
        if (a === "no") return { ...c, confirmed: a, stage: 1, times: c.times.slice(0, 2), outcome: undefined, reopened: (c.reopened ?? 0) + 1 }
        return { ...c, confirmed: a, closedAt: Date.now() }
      }),
    )

  const setPrefs = (p: Prefs) => {
    setPrefsState(p)
    savePrefs(p)
  }
  const notices = buildNotices(cases, prefs, areaName(profile.area))
  const unread = notices.filter(n => n.at > seenAt).length
  const openNotices = () => {
    setOverlay({ kind: "notices" })
  }
  const closeNotices = () => {
    const t = Date.now()
    saveSeen(t)
    setSeenAt(t)
    setOverlay(null)
  }
  const openNotice = (n: Notice) => {
    closeNotices()
    if (!n.ref || !n.action) return
    setSelected(n.ref)
    if (n.action.to === "closure") setOverlay({ kind: "closure", ref: n.ref })
    else setTab("track")
  }

  const idx = tabs.findIndex(t => t.id === tab)
  const sent = overlay?.kind === "sent" ? cases.find(c => c.ref === overlay.ref) : undefined
  const closing = overlay?.kind === "closure" ? cases.find(c => c.ref === overlay.ref) : undefined

  return (
    <div className="absolute inset-0 bg-background">
      <main className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 transition-[opacity,filter,transform] duration-500 ease-ios"
          style={{ opacity: tab === "city" ? 1 : 0, filter: tab === "city" ? "none" : "blur(14px)", transform: tab === "city" ? "none" : "scale(0.98)", pointerEvents: tab === "city" ? "auto" : "none" }}
        >
          <MapTab area={profile.area} setArea={(a: AreaId) => setProfile({ ...profile, area: a })} frameRef={frameRef} mine={mine} />
        </div>
        {tab === "report" && (
          <div key="report" className="anim-rise absolute inset-0 overflow-y-auto pb-28">
            <ReportTab profile={profile} onSubmit={submit} />
          </div>
        )}
        {tab === "insights" && (
          <div key="insights" className="anim-rise absolute inset-0 overflow-y-auto pb-28">
            <InsightsTab profile={profile} cases={cases} />
          </div>
        )}
        {tab === "track" && (
          <div key="track" className="anim-rise absolute inset-0 overflow-y-auto pb-28">
            <TrackTab cases={cases} selected={selected} setSelected={setSelected} onClosure={ref => setOverlay({ kind: "closure", ref })} onWidgets={() => setOverlay({ kind: "widgets" })} onAllCases={() => setOverlay({ kind: "cases" })} />
          </div>
        )}
      </main>

      {tab !== "city" && (
        <button
          onClick={openNotices}
          aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
          className="glass absolute top-[calc(var(--sat)+8px)] right-4 z-30 grid size-11 place-items-center rounded-full transition-transform duration-200 ease-ios active:scale-90"
        >
          <Bell className="size-[21px]" strokeWidth={1.8} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 grid min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white">{unread}</span>
          )}
        </button>
      )}

      <nav className="absolute inset-x-3 bottom-[max(var(--sab),12px)] z-30 mx-auto max-w-[406px]" aria-label="Main">
        <ul className="glass relative flex rounded-full p-1.5">
          <span
            aria-hidden="true"
            className="absolute top-1.5 bottom-1.5 left-1.5 rounded-full bg-accent/15 transition-transform duration-500 ease-ios"
            style={{ width: `calc((100% - 12px) / ${tabs.length})`, transform: `translateX(${idx * 100}%)` }}
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

      {toast && !overlay && (
        <button
          key={toast.id}
          onClick={() => {
            setSelected(toast.ref)
            setTab("track")
            setToast(null)
          }}
          className="glass absolute inset-x-4 top-[calc(var(--sat)+6px)] z-50 mx-auto flex max-w-[380px] items-center gap-3 rounded-[24px] px-4 py-3 text-left"
          style={{ animation: "banner-in 0.75s cubic-bezier(0.32,0.72,0,1) both, banner-out 0.55s cubic-bezier(0.5,0,0.75,0) 4.4s forwards" }}
        >
          <span className="size-2.5 shrink-0 rounded-full bg-accent" style={{ animation: "beat 1.6s ease-in-out infinite" }} />
          <span className="min-w-0">
            <span className="block text-[15px] leading-tight font-semibold">{toast.title}</span>
            <span className="line-clamp-2 block text-[13px] leading-snug text-muted-foreground">{toast.body}</span>
          </span>
        </button>
      )}
      {overlay?.kind === "heard" && (() => {
        const hc = cases.find(x => x.ref === overlay.ref)
        return hc ? (
          <HeardScreen
            key={hc.ref}
            c={hc}
            onSee={() => {
              setSelected(hc.ref)
              setOverlay(null)
              setTab("track")
            }}
            onClose={() => setOverlay(null)}
          />
        ) : null
      })()}
      {overlay?.kind === "notices" && (
        <NotificationsScreen notices={notices} seenAt={seenAt} prefs={prefs} setPrefs={setPrefs} onBack={closeNotices} onOpen={openNotice} onHome={() => setOverlay({ kind: "home" })} />
      )}
      {overlay?.kind === "widgets" && (
        <WidgetsScreen c={cases.find(x => x.stage < 4) ?? cases[0]} area={profile.area} onBack={() => setOverlay(null)} />
      )}
      {overlay?.kind === "home" && (
        <HomeScreenNotify notices={notices} c={cases.find(x => x.stage < 4) ?? cases[0]} area={profile.area} onOpenChime={closeNotices} onOpenNotice={openNotice} />
      )}
      {overlay?.kind === "cases" && (
        <CasesScreen
          cases={cases}
          current={selected}
          onBack={() => setOverlay(null)}
          onPick={ref => {
            setSelected(ref)
            setOverlay(null)
            setTab("track")
          }}
        />
      )}
      {sent && (
        <SentScreen
          key={sent.ref}
          c={sent}
          onTrack={() => {
            setOverlay(null)
            setTab("track")
          }}
          onAnother={() => {
            setOverlay(null)
            setTab("report")
          }}
        />
      )}
      {closing && (
        <ClosureScreen
          key={closing.ref}
          c={closing}
          onConfirm={a => confirm(closing.ref, a)}
          onBack={() => {
            setOverlay(null)
            setTab("track")
          }}
          onNew={() => {
            setOverlay(null)
            setTab("report")
          }}
        />
      )}
    </div>
  )
}
