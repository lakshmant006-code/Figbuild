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
  "Received",
  "Sent to the right team",
  "Someone is on the way",
  "Checked on site",
  "Outcome posted",
] as const

export type Confirmed = "yes" | "partly" | "no"

export interface Complaint {
  ref: string
  type: string
  area: string
  stage: number // 0..4
  createdAt: number
  times: number[] // when each stage was reached, times[0] = createdAt
  note?: string
  outcome?: string
  confirmed?: Confirmed
  closedAt?: number
  reopened?: number
}

// Which city team handles which kind of noise, and who shows up. Modeled on the real NYC process; the progress itself is simulated.
interface Agency {
  name: string
  short: string
  visitor: string
  outcomes: string[]
}
const NYPD: Agency = {
  name: "the NYPD",
  short: "NYPD",
  visitor: "An officer",
  outcomes: ["Warning issued to the source.", "Summons issued to the source.", "Officer arrived. Nothing loud at the time."],
}
const AGENCIES: Record<string, Agency> = {
  "Music or party": NYPD,
  Neighbors: NYPD,
  "Bar or club": NYPD,
  "Car horns": NYPD,
  Deliveries: NYPD,
  Construction: {
    name: "the Department of Buildings",
    short: "Buildings Dept.",
    visitor: "An inspector",
    outcomes: ["Work stopped until it follows the permit.", "Work was within permitted hours. No violation.", "Violation issued to the contractor."],
  },
  "AC or vents": {
    name: "Environmental Protection",
    short: "Env. Protection",
    visitor: "A noise inspector",
    outcomes: ["Reading was over the limit. Violation issued.", "Reading was under the limit. No violation."],
  },
  Sirens: {
    name: "311",
    short: "311",
    visitor: "A 311 specialist",
    outcomes: ["Logged on the city noise map. Emergency vehicles are not ticketed."],
  },
}
export const agencyFor = (type: string): Agency => AGENCIES[type] ?? NYPD

// Plain-language explanation of each stage, no jargon.
export function stageCopy(c: Complaint, i: number): { title: string; detail: string } {
  const ag = agencyFor(c.type)
  const t = c.type.toLowerCase()
  return [
    { title: "We have it.", detail: "311 logged your report. There is nothing you need to do right now." },
    { title: `Sent to ${ag.name}.`, detail: `They are the team that handles ${t} complaints, so your case now sits with them.` },
    { title: "Someone is on the way.", detail: `${ag.visitor} has been assigned. Visits usually happen within a few hours.` },
    { title: "They checked.", detail: "They went to the address to listen or look. Sometimes the noise has stopped by the time they arrive." },
    { title: "Here is what they decided.", detail: c.outcome ?? "The outcome is posted to your case." },
  ][i]
}

export const pickOutcome = (type: string) => {
  const o = agencyFor(type).outcomes
  return o[Math.floor(Math.random() * o.length)]
}

export interface Profile {
  area: AreaId
  hears: string[]
  notify: boolean
}

const PROFILE_KEY = "hush.profile.v1"
const CASES_KEY = "hush.cases.v2"

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
export const newRef = () => `CHM-${Math.floor(10000 + Math.random() * 89999)}`
