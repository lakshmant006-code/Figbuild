import { ComplaintWave } from "@/components/ui/complaint-wave"
import { STAGES, areaName, type Complaint } from "@/lib/data"

const AMP = [1, 0.7, 0.45, 0.22, 0.04]

export default function CasesTab({ cases }: { cases: Complaint[] }) {
  return (
    <div className="mx-auto w-full max-w-[430px] px-5 pt-[max(var(--sat),12px)] pb-6">
      <h1 className="pt-4 text-[30px] leading-[1.1] font-bold tracking-[-0.025em]">Your cases</h1>
      <p className="mt-2 text-[17px] text-muted-foreground">Each wave calms as the city acts.</p>
      <ul className="mt-5 flex flex-col gap-3">
        {cases.map(c => (
          <li key={c.ref} className="rounded-[20px] bg-card p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[17px] font-semibold">{c.type}</p>
              <p className="font-mono text-[13px] text-muted-foreground">{c.ref}</p>
            </div>
            <p className="text-[14px] text-muted-foreground">{areaName(c.area)}{c.note ? ` · ${c.note}` : ""}</p>
            <ComplaintWave amplitude={AMP[c.stage]} seed={c.ref.length + c.stage} color={c.stage === 4 ? "var(--accent)" : undefined} className="mt-2" />
            <p className="text-[13px] text-muted-foreground">Stage {c.stage + 1} of {STAGES.length}</p>
            <p className="text-[18px] font-semibold tracking-[-0.01em]">{STAGES[c.stage]}</p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[13px] leading-snug text-muted-foreground">
        Conceptual stages · Not live 311 data. Progress here is simulated.
      </p>
    </div>
  )
}
