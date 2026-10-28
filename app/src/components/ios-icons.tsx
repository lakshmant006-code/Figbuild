import type { ReactNode } from "react"
import { Camera, Clock, Cloud, Compass, Mail, MapPin, MessageCircle, Music, Phone, Settings } from "lucide-react"

// iOS-style app icons: continuous-corner squircle, soft gradient, white glyph. Stand-ins, not Apple artwork.
export function IosIcon({ bg, children, label, size = 60, labelColor = "#fff" }: { bg: string; children: ReactNode; label?: string; size?: number; labelColor?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className="relative grid place-items-center overflow-hidden shadow-[0_2px_6px_rgb(0_0_0/0.18)]"
        style={{ width: size, height: size, borderRadius: size * 0.2237, background: bg }}
      >
        <span className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgb(255 255 255 / 0.22) 0%, rgb(255 255 255 / 0) 48%)" }} />
        <span className="relative">{children}</span>
      </span>
      {label && <span className="text-[11px] leading-none font-medium tracking-tight" style={{ color: labelColor, textShadow: "0 1px 2px rgb(0 0 0 / 0.25)" }}>{label}</span>}
    </div>
  )
}

const G = "linear-gradient(180deg,#67e686 0%,#1fb946 100%)"
const glyph = "size-[30px] text-white"

type AppKey = "phone" | "messages" | "safari" | "music" | "mail" | "maps" | "camera" | "clock" | "calendar" | "weather" | "settings"

export function IosApp({ app, label = true, size = 60 }: { app: AppKey; label?: boolean; size?: number }) {
  const l = (t: string) => (label ? t : undefined)
  switch (app) {
    case "phone":
      return <IosIcon size={size} bg={G} label={l("Phone")}><Phone className={glyph} fill="#fff" strokeWidth={1.2} /></IosIcon>
    case "messages":
      return <IosIcon size={size} bg={G} label={l("Messages")}><MessageCircle className={glyph} fill="#fff" strokeWidth={1.2} /></IosIcon>
    case "safari":
      return <IosIcon size={size} bg="linear-gradient(180deg,#ffffff 0%,#dfeaff 100%)" label={l("Safari")}><Compass className="size-[36px] text-[#0a84ff]" strokeWidth={1.6} /></IosIcon>
    case "music":
      return <IosIcon size={size} bg="linear-gradient(180deg,#ff6a86 0%,#fa233b 100%)" label={l("Music")}><Music className={glyph} strokeWidth={2} /></IosIcon>
    case "mail":
      return <IosIcon size={size} bg="linear-gradient(180deg,#58b8ff 0%,#0a78ff 100%)" label={l("Mail")}><Mail className={glyph} strokeWidth={1.8} /></IosIcon>
    case "maps":
      return <IosIcon size={size} bg="linear-gradient(180deg,#f2f6ea 0%,#bfe0b0 100%)" label={l("Maps")}><MapPin className="size-[32px] text-[#ff3b30]" fill="#ff3b30" strokeWidth={1.4} /></IosIcon>
    case "camera":
      return <IosIcon size={size} bg="linear-gradient(180deg,#e4e5ea 0%,#a2a4ad 100%)" label={l("Camera")}><Camera className="size-[30px] text-[#1c1c1e]" fill="#1c1c1e" strokeWidth={1.4} /></IosIcon>
    case "clock":
      return <IosIcon size={size} bg="linear-gradient(180deg,#2b2b2e 0%,#000 100%)" label={l("Clock")}><Clock className={glyph} strokeWidth={1.8} /></IosIcon>
    case "calendar": {
      const d = new Date()
      return (
        <IosIcon size={size} bg="#fff" label={l("Calendar")}>
          <span className="flex flex-col items-center leading-none">
            <span className="text-[10px] font-semibold tracking-wide text-[#ff3b30] uppercase">{d.toLocaleDateString([], { weekday: "short" })}</span>
            <span className="mt-0.5 text-[30px] font-light tracking-tight text-black">{d.getDate()}</span>
          </span>
        </IosIcon>
      )
    }
    case "weather":
      return <IosIcon size={size} bg="linear-gradient(180deg,#4fb0ff 0%,#2f6fe0 100%)" label={l("Weather")}><Cloud className={glyph} fill="#fff" strokeWidth={1.4} /></IosIcon>
    case "settings":
      return <IosIcon size={size} bg="linear-gradient(180deg,#b5b7bf 0%,#6d7078 100%)" label={l("Settings")}><Settings className={glyph} strokeWidth={1.8} /></IosIcon>
  }
}

export function ChimeIcon({ size = 60, label = true }: { size?: number; label?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <img src="logo.png" alt="Chime" className="shadow-[0_2px_6px_rgb(0_0_0/0.22)]" style={{ width: size, height: size, borderRadius: size * 0.2237 }} />
      {label && <span className="text-[11px] leading-none font-medium tracking-tight text-white" style={{ textShadow: "0 1px 2px rgb(0 0 0 / 0.25)" }}>Chime</span>}
    </div>
  )
}
