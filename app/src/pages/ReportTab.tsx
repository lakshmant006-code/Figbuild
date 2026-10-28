import { useEffect, useRef, useState } from "react"
import { ArrowUp, Mic, Square } from "lucide-react"

import { VoiceBars, VoiceOrb } from "@/components/ui/voice-orb"
import { useVoiceLevel } from "@/hooks/use-voice-level"
import { NOISE_TYPES, agencyFor, areaName, newRef, type Complaint, type Profile } from "@/lib/data"
import { cn } from "@/lib/utils"

// 02 · What's bothering you?  Type it, say it, or pick the kind of noise.
export default function ReportTab({ profile, onSubmit }: { profile: Profile; onSubmit: (c: Complaint) => void }) {
  const [type, setType] = useState<string>(profile.hears[0] ?? NOISE_TYPES[0])
  const [text, setText] = useState("")
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [example, setExample] = useState(false)
  const { level, listening, simulated, start, stop } = useVoiceLevel()
  const [history, setHistory] = useState<number[]>(() => Array(28).fill(0))
  const timer = useRef(0)

  useEffect(() => {
    if (listening) setHistory(h => [...h.slice(1), level])
  }, [level, listening])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const finishVoice = () => {
    window.clearTimeout(timer.current)
    stop()
    setText(t => {
      if (t) return t
      setExample(true)
      return "Loud music from the apartment upstairs, going since 11 PM."
    })
  }
  const toggleVoice = () => {
    if (listening) return finishVoice()
    setVoiceOpen(true)
    setExample(false)
    void start()
    timer.current = window.setTimeout(finishVoice, 6000)
  }

  const send = () => {
    const now = Date.now()
    onSubmit({ ref: newRef(), type, area: profile.area, stage: 0, createdAt: now, times: [now], note: text.trim() || undefined })
    setText("")
    setVoiceOpen(false)
    setExample(false)
    setHistory(Array(28).fill(0))
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[430px] flex-col px-5 pt-[max(var(--sat),12px)] pb-6">
      <p className="pt-4 text-[13px] font-semibold tracking-wide text-accent uppercase">Report</p>
      <h1 className="mt-1 text-[32px] leading-[1.08] font-bold tracking-[-0.03em] text-balance">What&apos;s bothering you?</h1>
      <p className="mt-2 text-[17px] leading-snug text-muted-foreground">
        Report a disturbance by typing, speaking, or selecting the type of noise.
      </p>

      {/* voice panel opens above the composer */}
      <div className="grid transition-[grid-template-rows,opacity] duration-500 ease-ios" style={{ gridTemplateRows: voiceOpen ? "1fr" : "0fr", opacity: voiceOpen ? 1 : 0 }}>
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col items-center pt-3">
            <VoiceOrb level={level} active={listening} className="-my-8 scale-[0.72]" />
            <VoiceBars history={history} />
            <p className="mt-1 text-[14px] text-muted-foreground">
              {listening ? (simulated ? "Listening (simulated voice)…" : "Listening…") : example ? "Example transcript. Your real words appear here." : "Tap the mic to talk"}
            </p>
          </div>
        </div>
      </div>

      {/* composer */}
      <div className="glass mt-5 rounded-[26px] p-3 focus-within:ring-2 focus-within:ring-accent/60">
        <label htmlFor="describe" className="sr-only">Describe the noise</label>
        <textarea
          id="describe"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
          placeholder="Describe it. “Loud music from 3R since 11…”"
          className="w-full resize-none bg-transparent px-2 pt-2 text-[17px] leading-snug outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between pt-1">
          <span className="px-2 text-[13px] text-muted-foreground">Near {areaName(profile.area)}</span>
          <button
            onClick={toggleVoice}
            aria-label={listening ? "Stop recording" : "Speak your report"}
            className="grid size-11 place-items-center rounded-full text-white shadow-[0_6px_18px_rgb(8_102_255/0.4)] transition-transform duration-200 ease-ios active:scale-90"
            style={{ background: "linear-gradient(145deg,#9cc2ff 0%,#0866ff 45%,#050a24 100%)" }}
          >
            {listening ? <Square className="size-4 fill-white" /> : <Mic className="size-5" />}
          </button>
        </div>
      </div>

      <h2 className="mt-6 mb-2 px-1 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">Or choose the noise</h2>
      <div className="flex flex-wrap gap-2">
        {NOISE_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            aria-pressed={type === t}
            className={cn(
              "h-10 rounded-full px-4 text-[15px] font-medium transition-[background-color,color,transform] duration-300 ease-ios active:scale-95",
              type === t ? "bg-accent text-white" : "bg-fill",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <p className="mt-4 px-1 text-[14px] text-muted-foreground">
        {type} goes to <span className="font-semibold text-foreground">{agencyFor(type).short}</span>.
      </p>

      <button
        onClick={send}
        className="mt-5 flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-accent text-[17px] font-semibold text-white shadow-[0_10px_28px_rgb(8_102_255/0.35)] transition-transform duration-200 ease-ios active:scale-[0.98]"
      >
        Send my voice <ArrowUp className="size-5" />
      </button>
    </div>
  )
}
