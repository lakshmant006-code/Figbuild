import { useEffect, useRef, useState } from "react"
import { Bell, Check, ChevronLeft, MapPin, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { VoiceBars, VoiceOrb } from "@/components/ui/voice-orb"
import { ShaderBackground } from "@/components/ui/waves-shaders-homlu-ui"
import { useVoiceLevel } from "@/hooks/use-voice-level"
import { AREAS, NOISE_TYPES, type AreaId, type Profile } from "@/lib/data"
import { cn } from "@/lib/utils"

const STEPS = 5

export default function Onboarding({ onDone }: { onDone: (p: Profile) => void }) {
  const [step, setStep] = useState(0)
  const [area, setArea] = useState<AreaId>("williamsburg")
  const [hears, setHears] = useState<string[]>(["Music or party"])
  const [notify, setNotify] = useState(true)
  const [q, setQ] = useState("")
  const [dir, setDir] = useState(1)

  const next = () => { setDir(1); setStep(s => Math.min(STEPS - 1, s + 1)) }
  const back = () => { setDir(-1); setStep(s => Math.max(0, s - 1)) }
  const finish = () => onDone({ area, hears, notify })

  return (
    <div className="absolute inset-0 overflow-y-auto">
    <div className="mx-auto flex min-h-full w-full max-w-[430px] flex-col px-5 pt-[max(var(--sat),12px)] pb-[max(var(--sab),20px)]">
      {step > 0 && (
        <header className="flex h-12 items-center gap-3">
          <button onClick={back} aria-label="Back" className="-ml-2 grid size-11 place-items-center rounded-full active:bg-fill">
            <ChevronLeft className="size-6" />
          </button>
          <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step + 1}>
            {Array.from({ length: STEPS - 1 }, (_, i) => (
              <span key={i} className="h-1 flex-1 rounded-full transition-colors duration-300" style={{ background: i < step ? "var(--foreground)" : "var(--fill)" }} />
            ))}
          </div>
          <button onClick={finish} className="h-11 px-2 text-[15px] font-medium text-muted-foreground">
            Skip
          </button>
        </header>
      )}

      <div key={step} className="anim-step flex flex-1 flex-col" style={{ ["--dx" as string]: `${dir * 28}px` }}>
        {step === 0 && <Welcome />}
        {step === 1 && <Neighborhood area={area} setArea={setArea} q={q} setQ={setQ} />}
        {step === 2 && <Hears hears={hears} setHears={setHears} />}
        {step === 3 && <Voice />}
        {step === 4 && <Ready area={area} notify={notify} setNotify={setNotify} />}
      </div>

      <div className="flex flex-col gap-2 pt-4">
        {step === 0 && (
          <Button onClick={next}>Get started</Button>
        )}
        {step > 0 && step < STEPS - 1 && (
          <Button onClick={next} disabled={step === 2 && hears.length === 0}>
            Continue
          </Button>
        )}
        {step === STEPS - 1 && <Button variant="blue" onClick={finish}>Start reporting</Button>}
      </div>
    </div>
    </div>
  )
}

function Title({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="pt-4 pb-5">
      <h1 className="text-[30px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance">{children}</h1>
      {sub && <p className="mt-2 text-[17px] leading-snug text-muted-foreground">{sub}</p>}
    </div>
  )
}

function Welcome() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="relative mt-3 flex-1 min-h-[320px] overflow-hidden rounded-[32px]">
        <ShaderBackground className="absolute inset-0 h-full w-full" />
        <img
          src="logo.png"
          alt="Chime"
          className="anim-rise absolute top-1/2 left-1/2 size-[112px] -translate-x-1/2 -translate-y-1/2 rounded-[28px] shadow-[0_14px_40px_rgb(0_0_0/0.35)]" style={{ animationDelay: "0.1s" }}
        />
      </div>
      <div className="pt-7">
        <h1 className="anim-rise text-[34px] leading-[1.06] font-semibold tracking-[-0.03em] text-balance" style={{ animationDelay: "0.25s" }}>Every noise complaint gets a heartbeat.</h1>
        <p className="anim-rise mt-3 text-[17px] leading-snug text-muted-foreground" style={{ animationDelay: "0.4s" }}>
          Report in seconds with your voice. Watch the city answer on a live 3D map.
        </p>
      </div>
    </div>
  )
}

function Neighborhood({ area, setArea, q, setQ }: { area: AreaId; setArea: (a: AreaId) => void; q: string; setQ: (s: string) => void }) {
  const list = AREAS.filter(a => a.name.toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <>
      <Title sub="We open the map here and group reports by block.">Where do you live?</Title>
      <label className="relative block">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          id="area-search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search neighborhoods"
          className="h-12 w-full rounded-full bg-fill pr-4 pl-11 text-[17px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-accent"
        />
      </label>
      <ul className="mt-3 overflow-hidden rounded-[20px] bg-card">
        {list.map((a, i) => (
          <li key={a.id} className="pl-4">
            <button
              onClick={() => setArea(a.id)}
              className={"flex min-h-[52px] w-full items-center gap-3 pr-4 text-left" + (i ? " border-t border-separator" : "")}
              aria-pressed={area === a.id}
            >
              <MapPin className="size-5 text-muted-foreground" />
              <span className="flex-1 text-[17px]">{a.name}</span>
              {area === a.id && <Check className="size-5 text-accent" />}
            </button>
          </li>
        ))}
        {list.length === 0 && <li className="p-4 text-muted-foreground">No match. Try another name.</li>}
      </ul>
    </>
  )
}

function Hears({ hears, setHears }: { hears: string[]; setHears: (h: string[]) => void }) {
  const toggle = (t: string) => setHears(hears.includes(t) ? hears.filter(x => x !== t) : [...hears, t])
  return (
    <>
      <Title sub="Pick all that apply. We use this to pre-fill your reports.">What do you hear most?</Title>
      <div className="flex flex-wrap gap-2">
        {NOISE_TYPES.map(t => {
          const on = hears.includes(t)
          return (
            <button
              key={t}
              onClick={() => toggle(t)}
              aria-pressed={on}
              className={cn(
                "h-11 rounded-full px-5 text-[16px] font-medium transition-[background-color,color,transform] duration-300 ease-ios active:scale-95",
                on ? "bg-accent text-white" : "bg-fill text-foreground",
              )}
            >
              {t}
            </button>
          )
        })}
      </div>
    </>
  )
}

function Voice() {
  const { level, listening, simulated, start, stop } = useVoiceLevel()
  const [history, setHistory] = useState<number[]>(() => Array(28).fill(0))
  const [said, setSaid] = useState(false)
  const timer = useRef<number>(0)

  useEffect(() => {
    if (!listening) return
    setHistory(h => [...h.slice(1), level])
  }, [level, listening])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const toggle = () => {
    if (listening) {
      stop()
      setSaid(true)
      return
    }
    setSaid(false)
    void start()
    timer.current = window.setTimeout(() => {
      stop()
      setSaid(true)
    }, 4200)
  }

  return (
    <>
      <Title sub="Tap the orb and describe the noise. Chime turns it into a case.">Say it out loud.</Title>
      <div className="grid flex-1 place-items-center">
        <div className="flex flex-col items-center">
          <button onClick={toggle} aria-label={listening ? "Stop listening" : "Start listening"} className="rounded-full">
            <VoiceOrb level={level} active={listening} />
          </button>
          <VoiceBars history={history} className="mt-2" />
          <p className="mt-4 min-h-[48px] max-w-[300px] text-center text-[17px] leading-snug">
            {listening ? "Listening…" : said ? "“Loud music from the apartment upstairs, since 11.”" : "Tap to try it"}
          </p>
          <p className="text-center text-[13px] text-muted-foreground">
            {listening && simulated ? "Microphone unavailable here, so this is a simulated voice." : said ? "Example transcript. Your real words appear here." : "Your voice stays on your phone until you send."}
          </p>
        </div>
      </div>
    </>
  )
}

function Ready({ area, notify, setNotify }: { area: AreaId; notify: boolean; setNotify: (b: boolean) => void }) {
  const name = AREAS.find(a => a.id === area)?.name
  return (
    <>
      <Title sub={`Your neighborhood is ${name}. Reports there show up live on the city map.`}>You&apos;re all set.</Title>
      <div className="rounded-[20px] bg-card">
        <div className="flex min-h-[64px] items-center gap-3 px-4 py-3">
          <div className="grid size-9 place-items-center rounded-full bg-fill"><Bell className="size-5" /></div>
          <div className="flex-1">
            <p className="text-[17px] leading-tight font-medium">Case updates</p>
            <p className="text-[15px] text-muted-foreground">Know when the city acts on yours.</p>
          </div>
          <button
            role="switch"
            aria-checked={notify}
            aria-label="Case updates"
            onClick={() => setNotify(!notify)}
            className="relative h-8 w-[52px] rounded-full transition-colors"
            style={{ background: notify ? "var(--accent)" : "var(--fill)" }}
          >
            <span className="absolute top-0.5 left-0.5 size-7 rounded-full bg-white shadow transition-transform" style={{ transform: notify ? "translateX(20px)" : "none" }} />
          </button>
        </div>
      </div>
      <ul className="mt-4 flex flex-col gap-3 px-1 text-[16px] text-muted-foreground">
        <li>See live reports on a 3D model of the city.</li>
        <li>Send a report with your voice in under 10 seconds.</li>
        <li>Follow every case until the outcome is posted.</li>
      </ul>
    </>
  )
}
