import { useState } from "react"
import { ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ComplaintWave } from "@/components/ui/complaint-wave"
import { ShaderBackground } from "@/components/ui/waves-shaders-homlu-ui"

const stages = [
  { label: "The city received it.", amp: 1, color: "var(--accent)" },
  { label: "Routed to the right team.", amp: 0.72, color: "var(--accent)" },
  { label: "Someone is on the way.", amp: 0.46, color: "#e0a52b" },
  { label: "Checked on site.", amp: 0.22, color: "#e0a52b" },
  { label: "Official outcome posted.", amp: 0.05, color: "var(--calm)" },
]

const steps = [
  ["Drop a sound", "Pick the gripe, tap your block."],
  ["The city has ears", "Complaints cluster across 15 neighborhoods."],
  ["The silence moment", "Did it get quieter? Yes settles the wave."],
]

export default function Landing() {
  const [stage, setStage] = useState(0)
  const s = stages[stage]

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[430px] px-5 pt-[max(env(safe-area-inset-top),12px)] pb-[max(env(safe-area-inset-bottom),24px)]">
      <header className="flex h-12 items-center gap-2.5">
        <img src="/logo.png" alt="" className="size-8 rounded-[9px]" />
        <span className="text-[17px] font-semibold tracking-[-0.01em]">HUSH</span>
      </header>

      <main>
        <div className="relative mt-3 h-[300px] overflow-hidden rounded-[28px]">
          <ShaderBackground className="absolute inset-0 h-full w-full" />
          <img
            src="/logo.png"
            alt="HUSH"
            className="absolute top-1/2 left-1/2 size-[104px] -translate-x-1/2 -translate-y-1/2 rounded-[26px] shadow-[0_12px_32px_rgb(20_27_60/0.28)]"
          />
        </div>

        <h1 className="mt-8 text-[34px] leading-[1.08] font-bold tracking-[-0.025em] text-balance">
          Give every complaint a heartbeat.
        </h1>
        <p className="mt-3 text-[17px] leading-[1.4] text-muted-foreground">
          Your neighbor&apos;s subwoofer now has a case number. HUSH turns each noise complaint into a living wave that
          calms as the city answers.
        </p>

        <div className="mt-7 flex flex-col gap-2">
          <Button>Drop a sound</Button>
          <Button variant="plain" asChild>
            <a href="/copy-that.html">See the city map</a>
          </Button>
        </div>

        <h2 className="mt-12 mb-2 px-4 text-[13px] font-normal tracking-[0.01em] text-muted-foreground uppercase">
          How it works
        </h2>
        <ul className="overflow-hidden rounded-[20px] bg-card">
          {steps.map(([title, body], i) => (
            <li key={title} className="pl-4">
              <div className={"flex min-h-[64px] items-center gap-3 py-3 pr-4" + (i ? " border-t border-separator" : "")}>
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] leading-tight font-medium">{title}</p>
                  <p className="mt-0.5 text-[15px] leading-snug text-muted-foreground">{body}</p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground/60" />
              </div>
            </li>
          ))}
        </ul>

        <h2 className="mt-10 mb-2 px-4 text-[13px] font-normal tracking-[0.01em] text-muted-foreground uppercase">
          The wave is the receipt
        </h2>
        <section className="rounded-[20px] bg-card p-5">
          <ComplaintWave amplitude={s.amp} color={s.color} seed={stage + 1} />
          <p className="mt-2 text-[13px] text-muted-foreground">
            Stage {stage + 1} of {stages.length}
          </p>
          <p className="mt-0.5 text-[20px] leading-tight font-semibold tracking-[-0.015em]">{s.label}</p>
          <div className="mt-5 flex gap-1.5" role="tablist" aria-label="Complaint stage">
            {stages.map((st, i) => (
              <button
                key={st.label}
                role="tab"
                aria-selected={i === stage}
                aria-label={`Stage ${i + 1}: ${st.label}`}
                onClick={() => setStage(i)}
                className="h-11 flex-1 rounded-full"
              >
                <span
                  className="mx-auto block h-1.5 rounded-full transition-[background-color,width] duration-200"
                  style={{ background: i <= stage ? "var(--foreground)" : "var(--fill)" }}
                />
              </button>
            ))}
          </div>
          <Button variant="secondary" className="mt-3" onClick={() => setStage((stage + 1) % stages.length)}>
            {stage === stages.length - 1 ? "New complaint" : "Next stage"}
          </Button>
        </section>
        <p className="mt-3 px-4 text-[13px] leading-snug text-muted-foreground">
          Conceptual stages · Not live 311 data. The wave shows case progress, not street noise.
        </p>
      </main>
    </div>
  )
}
