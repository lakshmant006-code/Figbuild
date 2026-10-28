import type { CSSProperties } from "react"

// A small line-art scene that plays out as a case moves through its five stages.
//   1 your voice leaves the window   2 the signal crosses the rooftops   3 a patrol car drives in
//   4 someone steps out and listens  5 the night goes calm and the case is closed
const DRAW = (on: boolean, delay = 0): CSSProperties => ({
  strokeDasharray: 1,
  strokeDashoffset: on ? 0 : 1,
  transition: `stroke-dashoffset 1.4s cubic-bezier(0.32,0.72,0,1) ${delay}s`,
})
const FADE = (on: boolean, delay = 0): CSSProperties => ({ opacity: on ? 1 : 0, transition: `opacity 1s ease ${delay}s` })

const SIGNAL = "M62 62 C 110 4, 222 0, 281 38"
const ARCS = [12, 21, 30]

export function StageScene({ stage }: { stage: number }) {
  const calm = stage === 4
  return (
    <svg viewBox="0 0 340 140" className="mt-1 block h-auto w-full" role="img" aria-label="Line-art scene of your case moving through the city">
      <defs>
        <linearGradient id="scene-g" gradientUnits="userSpaceOnUse" x1="0" x2="340" y1="0" y2="0">
          <stop offset="0" stopColor="#7fb0ff" />
          <stop offset="0.55" stopColor="#0866ff" />
          <stop offset="1" style={{ stopColor: "var(--foreground)" }} />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#scene-g)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {/* night sky arrives with the outcome */}
        <g style={FADE(calm, 0.4)}>
          <path d="M214 22 a11 11 0 1 0 12 15 a9 9 0 0 1 -12 -15 z" />
          {[[120, 20], [160, 34], [262, 18], [304, 54], [96, 40], [190, 12]].map(([x, y], i) => (
            <path key={i} d={`M${x - 3} ${y} h6 M${x} ${y - 3} v6`} strokeWidth="1.2" style={{ animation: `twinkle ${2.4 + (i % 3) * 0.7}s ease-in-out ${i * 0.3}s infinite` }} />
          ))}
        </g>

        {/* street */}
        <path d="M8 118 H332" opacity="0.5" />

        {/* neighbors */}
        <path d="M84 118 V86 H112 V118 M92 94 h4 M102 94 h4 M92 104 h4 M102 104 h4" opacity="0.55" />
        <path d="M118 118 V74 H150 V118 M126 82 h4 M138 82 h4 M126 92 h4 M138 92 h4 M126 102 h4 M138 102 h4" opacity="0.55" />
        <path d="M160 118 V92 H186 V118" opacity="0.4" />

        {/* your building and its window */}
        <path d="M28 118 V58 H76 V118 M28 58 L52 44 L76 58" />
        <path d="M58 82 h6 M58 94 h6 M36 94 h6 M36 106 h6" />
        <rect x="36" y="71" width="14" height="16" rx="1.5" fill="var(--accent)" fillOpacity={calm ? 0 : 0.16} style={{ transition: "fill-opacity 1.6s" }} />

        {/* the voice leaves the window */}
        <g style={{ opacity: calm ? 0 : 1, transition: "opacity 1.2s" }}>
          {ARCS.map((r, i) => {
            const c = Math.SQRT1_2 * r
            return <path key={r} d={`M${43 + c} ${79 - c} A${r} ${r} 0 0 1 ${43 + c} ${79 + c}`} style={{ animation: `arc-pulse 2.8s ease-out ${i * 0.45}s infinite`, opacity: 0 }} />
          })}
        </g>

        {/* the signal crosses the rooftops */}
        <path d={SIGNAL} pathLength={1} style={DRAW(stage >= 1)} />
        <path d={SIGNAL} strokeDasharray="1 11" strokeWidth="2.4" style={{ ...FADE(stage >= 1 && stage < 4, 1.2), animation: "dash-run 2.4s linear infinite" }} />
        {stage >= 1 && stage < 3 && (
          <circle r="3.6" fill="var(--accent)" stroke="none" style={{ offsetPath: `path("${SIGNAL}")`, animation: `dot-travel ${stage === 1 ? 4.5 : 7}s ease-in-out infinite` } as CSSProperties} />
        )}

        {/* the agency */}
        <path d="M246 118 V70 H316 V118 M246 70 L281 50 L316 70" />
        <path d="M258 74 V118 M270 74 V118 M292 74 V118 M304 74 V118" opacity="0.6" />
        <path d="M274 118 V100 H288 V118" />
        <path d="M281 50 V30 M281 30 h12 l-3 4 l3 4 h-12" />
        <g style={FADE(calm, 0.8)}>
          <circle cx="314" cy="34" r="12" fill="var(--accent)" fillOpacity="0.14" />
          <path d="M308 34 l4.5 4.5 l8 -9" pathLength={1} style={DRAW(calm, 1.1)} stroke="var(--accent)" strokeWidth="2.4" />
        </g>

        {/* the patrol car */}
        <g style={{ transform: stage >= 3 ? "translate(206px, 104px)" : undefined, animation: stage === 2 ? "drive 9s cubic-bezier(0.45,0,0.2,1) forwards" : undefined, opacity: stage >= 2 ? 1 : 0, transition: "opacity 0.8s" }}>
          <path d="M0 10 V5 Q0 2 3 2 H7 L11 -4 H23 L27 2 H31 Q34 2 34 5 V10 Z" />
          <path d="M13.5 -2.5 L10 2 H17 V-2.5 Z M20 -2.5 V2 H27 L23.5 -2.5 Z" strokeWidth="1.2" />
          {[9, 25].map(cx => (
            <g key={cx}>
              <circle cx={cx} cy="10" r="4.2" fill="var(--background)" />
              <path d={`M${cx - 2.4} 10 h4.8 M${cx} 7.6 v4.8`} strokeWidth="1" style={{ transformBox: "fill-box", transformOrigin: "center", animation: stage === 2 ? "spin 1.1s linear infinite" : undefined }} />
            </g>
          ))}
          <path d="M16 -7 h4" strokeWidth="2" style={{ stroke: "var(--accent)", animation: stage === 2 ? "twinkle 1s ease-in-out infinite" : undefined }} />
        </g>

        {/* someone steps out and listens */}
        <g style={FADE(stage >= 3, stage === 3 ? 1.6 : 0)}>
          <circle cx="236" cy="93" r="3.6" />
          <path d="M236 97 V108 M236 108 L232 118 M236 108 L240 118 M236 101 L243 104" />
          <rect x="242" y="102" width="5" height="7" rx="1" strokeWidth="1.2" />
        </g>
        {stage === 3 && (
          <g>
            {[0, 1.2].map(delay => (
              <circle key={delay} cx="236" cy="93" r="26" strokeWidth="1.2" style={{ transformBox: "fill-box", transformOrigin: "center", animation: `listen 2.4s ease-out ${delay}s infinite`, opacity: 0 }} />
            ))}
          </g>
        )}
      </g>
    </svg>
  )
}
