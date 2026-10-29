import { agencyFor, stageCopy, type Complaint } from "@/lib/data"

export interface Prefs {
  updates: boolean // each step on my cases
  outcome: boolean // when an outcome is ready to confirm
  nearby: boolean // spikes near my block
  quiet: boolean // quiet hours 10 PM to 7 AM
}

export const DEFAULT_PREFS: Prefs = { updates: true, outcome: true, nearby: false, quiet: true }

export interface Notice {
  id: string
  at: number
  type: string
  title: string
  body: string
  ref?: string
  action?: { label: string; to: "track" | "closure" }
}

const PREFS_KEY = "hush.prefs.v1"
const SEEN_KEY = "hush.seen.v1"
function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
function write(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v))
  } catch {
    /* storage unavailable */
  }
}
export const loadPrefs = (): Prefs => ({ ...DEFAULT_PREFS, ...(read<Partial<Prefs>>(PREFS_KEY) ?? {}) })
export const savePrefs = (p: Prefs) => write(PREFS_KEY, p)
export const loadSeen = () => read<number>(SEEN_KEY) ?? 0
export const saveSeen = (t: number) => write(SEEN_KEY, t)

// Notifications come only from real changes on your cases. Nothing is generated on a timer.
export function buildNotices(cases: Complaint[], prefs: Prefs, nearbyArea?: string): Notice[] {
  const out: Notice[] = []
  for (const c of cases) {
    const ag = agencyFor(c.type)
    if (prefs.updates) {
      for (let i = 1; i < Math.min(c.stage + 1, 4); i++) {
        if (!c.times[i]) continue
        out.push({
          id: `${c.ref}-${i}`,
          at: c.times[i],
          type: c.type,
          ref: c.ref,
          title: stageCopy(c, i).title,
          body: i === 3 ? `We went to your block and heard it · ${c.ref}` : `${ag.short} · ${c.ref}`,
          action: { label: "View case", to: "track" },
        })
      }
    }
    if (prefs.outcome && c.stage === 4 && c.times[4]) {
      out.push({
        id: `${c.ref}-out`,
        at: c.times[4],
        type: c.type,
        ref: c.ref,
        title: "They answered you.",
        body: `${c.outcome ?? ""} Did it get better?`,
        action: c.confirmed ? { label: "View record", to: "closure" } : { label: "Did it get better?", to: "closure" },
      })
    }
  }
  if (prefs.nearby && nearbyArea) {
    out.push({ id: "nearby", at: Date.now() - 25 * 60000, type: "Neighbors", title: "Reports are up near you.", body: `More people than usual reported noise in ${nearbyArea} this evening. Example alert.` })
  }
  return out.sort((a, b) => b.at - a.at)
}
