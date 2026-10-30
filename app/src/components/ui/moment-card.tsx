import type { ReactNode } from "react"
import { Car, Fan, HardHat, Music, Package, Siren, Users, Volume2, Wine, type LucideIcon } from "lucide-react"

import block from "@/assets/tile-block.jpg"
import skyline from "@/assets/tile-skyline.jpg"
import street from "@/assets/tile-street.jpg"
import { cn } from "@/lib/utils"

const ICONS: Record<string, LucideIcon> = {
  "Music or party": Music,
  Construction: HardHat,
  "Car horns": Car,
  Neighbors: Users,
  "AC or vents": Fan,
  "Bar or club": Wine,
  Sirens: Siren,
  Deliveries: Package,
}

// Renders of the real 3D city model, used as the "photos" on a card.
export const PHOTOS = [street, block, skyline]
export const photosFor = (key: string) => {
  const n = [...key].reduce((a, c) => a + c.charCodeAt(0), 0)
  return [PHOTOS[n % 3], PHOTOS[(n + 1) % 3]]
}

const tile = "relative aspect-[0.92] overflow-hidden rounded-[18px] bg-fill"

export function PhotoTile({ src, badge }: { src: string; badge?: string }) {
  return (
    <div className={tile}>
      <img src={src} alt="" className="size-full object-cover" draggable={false} />
      {badge && <span className="glass absolute bottom-1.5 left-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold">{badge}</span>}
    </div>
  )
}

// A tiny stylized street map with a blue pin, like the location tile on a memory card.
export function MapTile({ label }: { label: string }) {
  return (
    <div className={tile} style={{ background: "color-mix(in srgb, var(--fill) 80%, var(--background))" }}>
      <svg viewBox="0 0 100 108" className="absolute inset-0 size-full" aria-hidden="true">
        <g style={{ fill: "var(--separator)" }}>
          {[[6, 8], [40, 8], [74, 6], [6, 44], [74, 42], [6, 76], [42, 78], [76, 76]].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width={20 + (i % 3) * 6} height={22 + (i % 2) * 6} rx="3" />
          ))}
        </g>
        <path d="M0 36 L100 30 M0 70 L100 66 M34 0 L30 108 M68 0 L72 108" style={{ stroke: "var(--background)" }} strokeWidth="5" fill="none" />
        <circle cx="52" cy="52" r="13" fill="#0866ff" />
        <circle cx="52" cy="52" r="13" fill="none" stroke="#9cc2ff" strokeOpacity="0.55" strokeWidth="4" />
        <path d="M45.5 52 h2.2 l1.6 -5 l2.6 10 l2 -7 l1.2 2 h1.4" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="absolute bottom-1.5 left-1.5 max-w-[calc(100%-12px)] truncate rounded-md bg-background/85 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">{label}</span>
    </div>
  )
}

export function IconTile({ type, size = 56 }: { type: string; size?: number }) {
  const Icon = ICONS[type] ?? Volume2
  return (
    <span className="grid shrink-0 place-items-center rounded-[16px] bg-fill text-muted-foreground" style={{ width: size, height: size }}>
      <Icon className="size-6" strokeWidth={1.6} />
    </span>
  )
}

export function MomentCard({
  tiles,
  type,
  time,
  title,
  body,
  onClick,
  selected,
  className,
  children,
  aside,
}: {
  tiles?: ReactNode[]
  type?: string
  time: ReactNode
  title: string
  body: string
  onClick?: () => void
  selected?: boolean
  className?: string
  children?: ReactNode
  aside?: ReactNode
}) {
  const Tag = onClick ? "button" : "div"
  const copy = (
    <div className="min-w-0 flex-1 text-left">
      <p className="text-[13px] text-muted-foreground tabular-nums">{time}</p>
      <h3 className="text-[18px] leading-tight font-semibold tracking-[-0.015em]">{title}</h3>
      <p className="mt-1 line-clamp-2 text-[15px] leading-snug text-muted-foreground">{body}</p>
      {children}
    </div>
  )
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "moment block w-full rounded-[26px] text-left transition-[transform,box-shadow] duration-300 ease-ios",
        onClick && "active:scale-[0.985]",
        selected && "ring-1 ring-foreground/15",
        className,
      )}
    >
      {tiles ? (
        <>
          <div className="grid grid-cols-3 gap-2 p-3 pb-0">{tiles}</div>
          <div className="flex gap-3 px-5 pt-3.5 pb-5">{copy}{aside}</div>
        </>
      ) : (
        <div className="flex items-center gap-3.5 p-3">
          <IconTile type={type ?? ""} />
          {copy}
          {aside}
        </div>
      )}
    </Tag>
  )
}
