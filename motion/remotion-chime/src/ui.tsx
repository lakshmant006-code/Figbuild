import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ArrowUp, BarChart3, ClipboardList, Map as MapIcon, MapPin, Mic, Plus } from "lucide-react";
import { theme as T } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const mix = (a: number[], b: number[], k: number) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
export const rgb = (c: number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;

// ---------------------------------------------------------------- backgrounds
export const DotGrid: React.FC<{ opacity?: number }> = ({ opacity = 0.5 }) => (
  <AbsoluteFill style={{ opacity, backgroundImage: "radial-gradient(circle, rgba(130,165,255,0.55) 1.2px, transparent 1.7px)", backgroundSize: "22px 22px", WebkitMaskImage: "linear-gradient(200deg, #000 0%, rgba(0,0,0,0.35) 38%, transparent 62%)", maskImage: "linear-gradient(200deg, #000 0%, rgba(0,0,0,0.35) 38%, transparent 62%)" }} />
);

export const NavyBg: React.FC = () => {
  const f = useCurrentFrame();
  const d1 = Math.sin(f / 70) * 60, d2 = Math.cos(f / 90) * 40;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${T.colors.navy} 0%, ${T.colors.navy} 38%, ${T.colors.navy2} 100%)` }}>
      <div style={{ position: "absolute", left: 160 + d1, top: 640, width: 1600, height: 700, borderRadius: "50%", background: `radial-gradient(ellipse, ${T.colors.navy3}cc, transparent 66%)`, filter: "blur(40px)" }} />
      <div style={{ position: "absolute", left: 900 - d2, top: -200, width: 900, height: 520, borderRadius: "50%", background: `radial-gradient(ellipse, ${T.colors.blue}22, transparent 68%)`, filter: "blur(50px)" }} />
      <DotGrid />
    </AbsoluteFill>
  );
};

export const LavenderBg: React.FC<{ shift?: number }> = ({ shift = 0 }) => {
  const f = useCurrentFrame();
  const t = f / 90 + shift;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${T.colors.lav} 0%, #A4A9EE 55%, ${T.colors.lav2} 100%)` }}>
      <div style={{ position: "absolute", left: 300 + Math.sin(t) * 120, top: -260, width: 1300, height: 700, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,255,255,0.75), transparent 66%)", filter: "blur(40px)" }} />
      <div style={{ position: "absolute", left: -200 + Math.cos(t * 0.8) * 100, top: 560, width: 1500, height: 700, borderRadius: "50%", background: `radial-gradient(ellipse, ${T.colors.violet}88, transparent 68%)`, filter: "blur(60px)" }} />
      <div style={{ position: "absolute", left: 900, top: 620, width: 1200, height: 600, borderRadius: "50%", background: `radial-gradient(ellipse, ${T.colors.blue}55, transparent 68%)`, filter: "blur(60px)" }} />
    </AbsoluteFill>
  );
};

export const Grain: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const f = useCurrentFrame();
  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;
  return <AbsoluteFill style={{ pointerEvents: "none", backgroundImage: noise, backgroundSize: "220px", backgroundPosition: `${(f * 7) % 220}px ${(f * 13) % 220}px`, opacity: dark ? 0.07 : 0.045, mixBlendMode: dark ? "overlay" : "multiply" }} />;
};
export const Vignette: React.FC = () => <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,0.28) 100%)" }} />;

// ---------------------------------------------------------------- brand marks
// The Chime mark: an open ring and a dot. Gradient is the "voice" gradient from the app.
export const ChimeMark: React.FC<{ size: number; glow?: boolean; light?: boolean; id?: string }> = ({ size, glow, light, id = "cm" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible", filter: glow ? `drop-shadow(0 0 ${size * 0.25}px ${T.colors.blue}aa)` : undefined }}>
    <defs>
      <linearGradient id={id} x1="10" y1="0" x2="90" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={light ? "#FFFFFF" : "#9CC2FF"} />
        <stop offset="0.5" stopColor={light ? "#EAF1FF" : "#2F7BFF"} />
        <stop offset="1" stopColor={light ? "#C9DBFF" : "#1646C8"} />
      </linearGradient>
    </defs>
    <circle cx="44" cy="50" r="31" fill="none" stroke={`url(#${id})`} strokeWidth="23" strokeLinecap="round" strokeDasharray="136 60" transform="rotate(38 44 50)" />
    <circle cx="84" cy="48" r="10" fill={`url(#${id})`} />
  </svg>
);
export const AppIconTile: React.FC<{ size: number }> = ({ size }) => (
  <Img src={staticFile("img/logo.png")} style={{ width: size, height: size, borderRadius: size * 0.2237, boxShadow: `0 ${size * 0.12}px ${size * 0.35}px rgba(20,60,200,0.45)` }} />
);

// ---------------------------------------------------------------- type
const displayStyle = (size: number): React.CSSProperties => ({ fontFamily: T.fonts.display, fontWeight: 700, fontSize: size, letterSpacing: "-0.02em", lineHeight: 1.04, color: T.colors.text, whiteSpace: "nowrap" });

// Letters resolve from a blurry blue ghost into crisp white, left to right. Exits with blur + lift.
export const Kinetic: React.FC<{ text: string; size?: number; start?: number; end?: number; per?: number; gradient?: boolean; color?: string; dark?: boolean }> = ({ text, size = 190, start = 0, end = 9999, per = 3, gradient, color, dark = true }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ex = interpolate(f, [end, end + 9], [0, 1], { ...clamp, easing: T.ease.in });
  return (
    <div style={{ ...displayStyle(size), display: "flex", justifyContent: "center", opacity: 1 - ex, transform: `translateY(${-24 * ex}px)`, filter: `blur(${ex * 18}px)` }}>
      {text.split("").map((ch, i) => {
        const p = spring({ frame: f - start - i * per, fps, config: T.spring.smooth });
        const col = gradient ? undefined : rgb(mix([70, 130, 255], dark ? [244, 247, 255] : [10, 15, 30], Math.min(1, p * 1.15)));
        return (
          <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: interpolate(p, [0, 0.4, 1], [0, 0.8, 1], clamp), transform: `translateY(${interpolate(p, [0, 1], [34, 0])}px) scale(${interpolate(p, [0, 1], [0.94, 1])})`, filter: `blur(${interpolate(p, [0, 1], [18, 0], clamp)}px)`, color: color ?? col, backgroundImage: gradient ? `linear-gradient(100deg, ${T.colors.blue}, ${T.colors.blueHi} ${50}%, ${T.colors.sky})` : undefined, WebkitBackgroundClip: gradient ? "text" : undefined, WebkitTextFillColor: gradient ? "transparent" : undefined }}>{ch}</span>
        );
      })}
    </div>
  );
};

// A sentence that builds word by word. `accentFrom` index words get the blue gradient.
export const WordLine: React.FC<{ words: string[]; size?: number; start?: number; per?: number; accentFrom?: number; end?: number; dim?: boolean }> = ({ words, size = 76, start = 0, per = 5, accentFrom = 99, end = 9999, dim }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ex = interpolate(f, [end, end + 9], [0, 1], { ...clamp, easing: T.ease.in });
  return (
    <div style={{ ...displayStyle(size), fontWeight: 400, display: "flex", gap: size * 0.28, justifyContent: "center", opacity: 1 - ex, filter: `blur(${ex * 14}px)`, transform: `translateY(${-18 * ex}px)` }}>
      {words.map((w, i) => {
        const p = spring({ frame: f - start - i * per, fps, config: T.spring.snappy });
        const acc = i >= accentFrom;
        return (
          <span key={i} style={{ display: "inline-block", opacity: p, transform: `translateY(${interpolate(p, [0, 1], [26, 0])}px)`, filter: `blur(${interpolate(p, [0, 1], [10, 0], clamp)}px)`, color: dim ? T.colors.textDim : T.colors.text, ...(acc ? { backgroundImage: `linear-gradient(90deg, ${T.colors.blue}, ${T.colors.blueHi})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } : {}) }}>{w}</span>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- app UI pieces (icons come from the Chime app: lucide set + app tile)
export const GlassChip: React.FC<{ children: React.ReactNode; round?: boolean; h?: number }> = ({ children, round, h = 64 }) => (
  <div style={{ height: h, minWidth: h, padding: round ? 0 : "0 26px", borderRadius: h, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, background: "rgba(255,255,255,0.22)", border: "1.5px solid rgba(255,255,255,0.45)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 30px rgba(10,30,70,0.12)", backdropFilter: "blur(20px)", color: "#fff", fontFamily: T.fonts.display, fontSize: h * 0.4, fontWeight: 400 }}>{children}</div>
);

export const Composer: React.FC<{ typed: string; caret: boolean; placeholder: string; showText: boolean }> = ({ typed, caret, placeholder, showText }) => (
  <div style={{ width: 880, height: 360, borderRadius: 56, padding: "42px 48px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "linear-gradient(160deg, rgba(255,255,255,0.34), rgba(255,255,255,0.14))", border: "2px solid rgba(255,255,255,0.55)", boxShadow: "inset 0 2px 0 rgba(255,255,255,0.6), 0 40px 100px rgba(10,30,70,0.2)", backdropFilter: "blur(30px)" }}>
    <div style={{ fontFamily: T.fonts.display, fontSize: 56, fontWeight: 400, color: showText ? "#fff" : "rgba(255,255,255,0.7)", letterSpacing: "-0.01em", minHeight: 70 }}>
      {showText ? typed : placeholder}{caret && <span style={{ display: "inline-block", width: 4, height: 54, background: "#fff", marginLeft: 6, verticalAlign: "-8px" }} />}
    </div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", gap: 16 }}>
        <GlassChip round><Plus size={34} color="#fff" strokeWidth={1.8} /></GlassChip>
        <GlassChip><MapPin size={32} color="#fff" strokeWidth={1.8} />Williamsburg</GlassChip>
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <GlassChip round><Mic size={32} color="#fff" strokeWidth={1.8} /></GlassChip>
        <div style={{ width: 64, height: 64, borderRadius: 64, display: "grid", placeItems: "center", background: "linear-gradient(150deg,#9CC2FF 0%,#2F7BFF 50%,#0A1A4A 100%)", boxShadow: "0 10px 30px rgba(30,90,255,0.45)" }}><ArrowUp size={34} color="#fff" strokeWidth={2.4} /></div>
      </div>
    </div>
  </div>
);

export const TabIcons: React.FC<{ start: number }> = ({ start }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = [{ I: Mic, l: "Report" }, { I: ClipboardList, l: "Track" }, { I: MapIcon, l: "City" }, { I: BarChart3, l: "Insights" }];
  return (
    <div style={{ display: "flex", gap: 34 }}>
      {items.map(({ I, l }, i) => {
        const p = spring({ frame: f - start - i * 5, fps, config: T.spring.bouncy });
        return (
          <div key={l} style={{ opacity: p, transform: `translateY(${interpolate(p, [0, 1], [40, 0])}px) scale(${interpolate(p, [0, 1], [0.7, 1])})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{ width: 118, height: 118, borderRadius: 34, display: "grid", placeItems: "center", background: "linear-gradient(160deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))", border: "1.5px solid rgba(160,190,255,0.35)", boxShadow: `0 20px 50px rgba(20,60,200,0.3), inset 0 1px 0 rgba(255,255,255,0.3)`, backdropFilter: "blur(14px)" }}><I size={54} color={T.colors.sky} strokeWidth={1.7} /></div>
            <span style={{ fontFamily: T.fonts.display, fontSize: 26, color: T.colors.textDim }}>{l}</span>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- devices
export const Phone: React.FC<{ src: string; startFrom?: number; scale?: number }> = ({ src, startFrom = 0, scale = 1 }) => (
  <div style={{ width: 426, height: 898, transform: `scale(${scale})`, transformOrigin: "50% 50%", borderRadius: 70, background: "#0b0c11", padding: 12, boxShadow: "0 60px 120px rgba(40,50,90,0.35), 0 20px 50px rgba(40,50,90,0.25), inset 0 0 0 2px #2a2d38", position: "relative" }}>
    <OffthreadVideo src={staticFile(src)} startFrom={startFrom} muted style={{ width: 402, height: 874, borderRadius: 58, objectFit: "cover", display: "block" }} />
    <div style={{ position: "absolute", left: 150, top: 22, width: 126, height: 36, borderRadius: 20, background: "#000" }} />
  </div>
);

export const Laptop: React.FC<{ img: string; focus?: number }> = ({ img, focus = 0 }) => (
  <div style={{ width: 1180, display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div style={{ width: 1100, height: 690, borderRadius: "26px 26px 8px 8px", background: "#17181c", padding: "18px 18px 22px", boxShadow: "0 50px 100px rgba(60,70,110,0.28), inset 0 0 0 2px #2c2f36" }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 10, overflow: "hidden", position: "relative", background: "#0b1020" }}>
        <Img src={staticFile(img)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 50%", transform: `scale(${1.02 + focus * 0.1})` }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,0.18) 0%, transparent 38%)" }} />
      </div>
    </div>
    <div style={{ width: 1260, height: 26, borderRadius: "0 0 40px 40px", background: "linear-gradient(180deg,#d6d8de,#a9acb5)", boxShadow: "0 30px 50px rgba(60,70,110,0.25)" }} />
  </div>
);

export const Tablet: React.FC<{ img: string }> = ({ img }) => (
  <div style={{ width: 1060, height: 720, borderRadius: 44, background: "#0b0c11", padding: 18, boxShadow: "0 0 140px rgba(120,140,255,0.55), 0 0 40px rgba(180,200,255,0.5), inset 0 0 0 2px #2c2f36" }}>
    <div style={{ width: "100%", height: "100%", borderRadius: 28, overflow: "hidden", position: "relative" }}>
      <Img src={staticFile(img)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 50%", transform: "scale(1.04)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(255,255,255,0.15), transparent 40%)" }} />
    </div>
  </div>
);

// light streak that falls through the "i" of the wordmark
export const Streak: React.FC<{ progress: number; height?: number }> = ({ progress, height = 900 }) => (
  <div style={{ position: "absolute", width: 34, height: height * progress, borderRadius: 30, bottom: 0, left: 0, background: "linear-gradient(0deg, rgba(255,255,255,0) 0%, rgba(210,225,255,0.85) 35%, #fff 100%)", filter: "blur(2px)", opacity: Math.min(1, progress * 2) }} />
);

export const SceneShell: React.FC<{ children: React.ReactNode; dur: number; inF?: number; outF?: number }> = ({ children, dur, inF = 9, outF = 9 }) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [0, inF], [0, 1], { ...clamp, easing: T.ease.out });
  const b = interpolate(f, [dur - outF, dur], [1, 0], { ...clamp, easing: T.ease.in });
  return <AbsoluteFill style={{ opacity: Math.min(a, b) }}>{children}</AbsoluteFill>;
};
