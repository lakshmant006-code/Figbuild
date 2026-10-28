import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { VoiceBars, VoiceOrb } from "@/components/ui/voice-orb"
import { useVoiceLevel } from "@/hooks/use-voice-level"
import { NOISE_TYPES, areaName, newRef, type Complaint, type Profile } from "@/lib/data"
import { cn } from "@/lib/utils"

export default function ReportTab({ profile, onSubmit }: { profile: Profile; onSubmit: (c: Complaint) => void }) {
  const [type, setType] = useState<string>(profile.hears[0] ?? NOISE_TYPES[0])
  const [note, setNote] = useState("")
  const [heard, setHeard] = useState(false)
  const { level, listening, simulated, start, stop } = useVoiceLevel()
  const [history, setHistory] = useState<number[]>(() => Array(28).fill(0))
  const timer = useRef(0)

  useEffect(() => {
    if (listening) setHistory(h => [...h.slice(1), level])
  }, [level, listening])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const toggle = () => {
    window.clearTimeout(timer.current)
    if (listening) {
      stop()
      setHeard(true)
      return
    }
    void start()
    timer.current = window.setTimeout(() => {
      stop()
      setHeard(true)
    }, 6000)
  }

  const send = () => {
    onSubmit({ ref: newRef(), type, area: profile.area, stage: 0, createdAt: Date.now(), note: note.trim() || undefined })
    setNote("")
    setHeard(false)
    setHistory(Array(28).fill(0))
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[430px] flex-col px-5 pt-[max(var(--sat),12px)] pb-6">
      <h1 className="pt-4 text-[30px] leading-[1.1] font-bold tracking-[-0.025em]">What are you hearing?</h1>
      <p className="mt-2 text-[17px] text-muted-foreground">Near {areaName(profile.area)}. Tap the orb and say it.</p>

      <div className="mt-6 flex flex-col items-center">
        <button onClick={toggle} aria-label={listening ? "Stop recording" : "Start recording"} className="rounded-full">
          <VoiceOrb level={level} active={listening} />
        </button>
        <VoiceBars history={history} className="-mt-1" />
        <p className="mt-2 text-[15px] text-muted-foreground">
          {listening ? (simulated ? "Listening (simulated voice)…" : "Listening…") : heard ? "Got it. Review and send." : "Tap to record, up to 6 seconds"}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {NOISE_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            aria-pressed={type === t}
            className={cn("h-10 rounded-full px-4 text-[15px] font-medium", type === t ? "bg-accent text-white" : "bg-fill")}
          >
            {t}
          </button>
        ))}
      </div>

      <label htmlFor="note" className="sr-only">Details</label>
      <textarea
        id="note"
        value={note}
        onChange={e => setNote(e.target.value)}
        rows={2}
        placeholder="Add details (optional)"
        className="mt-4 w-full resize-none rounded-[16px] bg-fill p-4 text-[17px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-accent"
      />

      <Button className="mt-4" variant="blue" onClick={send}>
        Send report
      </Button>
    </div>
  )
}
