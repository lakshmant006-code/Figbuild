export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-8 w-[52px] shrink-0 rounded-full transition-colors duration-300"
      style={{ background: checked ? "var(--accent)" : "var(--fill)" }}
    >
      <span className="absolute top-0.5 left-0.5 size-7 rounded-full bg-white shadow transition-transform duration-300 ease-ios" style={{ transform: checked ? "translateX(20px)" : "none" }} />
    </button>
  )
}
