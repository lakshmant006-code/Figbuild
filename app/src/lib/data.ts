export const AREAS = [
  { id: "williamsburg", name: "Williamsburg" },
  { id: "greenpoint", name: "Greenpoint" },
  { id: "bushwick", name: "Bushwick" },
  { id: "dumbo", name: "DUMBO" },
  { id: "dtbk", name: "Downtown Brooklyn" },
  { id: "lic", name: "Long Island City" },
  { id: "fidi", name: "Financial District" },
  { id: "chinatown", name: "Chinatown" },
  { id: "les", name: "Lower East Side" },
  { id: "soho", name: "SoHo" },
  { id: "village", name: "Greenwich Village" },
  { id: "eastvillage", name: "East Village" },
  { id: "chelsea", name: "Chelsea" },
  { id: "timessq", name: "Times Square" },
  { id: "midtown", name: "Midtown" },
] as const

export type AreaId = (typeof AREAS)[number]["id"]

export const NOISE_TYPES = [
  "Music or party",
  "Construction",
  "Car horns",
  "Neighbors",
  "AC or vents",
  "Bar or club",
  "Sirens",
  "Deliveries",
] as const

export const STAGES = [
  "The city received it.",
  "Routed to the right team.",
  "Someone is on the way.",
  "Checked on site.",
  "Official outcome posted.",
] as const

export interface Complaint {
  ref: string
  type: string
  area: string
  stage: number // 0..4
  createdAt: number
  note?: string
}

export interface Profile {
  area: AreaId
  hears: string[]
  notify: boolean
}

const PROFILE_KEY = "hush.profile.v1"
const CASES_KEY = "hush.cases.v1"

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable: the app still works for this session */
  }
}

export const loadProfile = () => read<Profile>(PROFILE_KEY)
export const saveProfile = (p: Profile) => write(PROFILE_KEY, p)
export const loadCases = () => read<Complaint[]>(CASES_KEY)
export const saveCases = (c: Complaint[]) => write(CASES_KEY, c)

export const areaName = (id: string) => AREAS.find(a => a.id === id)?.name ?? "your area"
export const newRef = () => `HSH-${Math.floor(10000 + Math.random() * 89999)}`
