import React, { useMemo } from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { MapPin } from "lucide-react";
import { theme as T } from "./theme";
import { AppIconTile, ChimeMark, Composer, Kinetic, LavenderBg, NavyBg, Laptop, Phone, SceneShell, Streak, TabIcons, Tablet, WordLine } from "./ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const center: React.CSSProperties = { alignItems: "center", justifyContent: "center" };

// ------------------------------------------------------------------ A · the mark appears (reference 0:10 – the glass flower on navy)
export const SceneMark: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - 4, fps, config: T.spring.bouncy });
  const rot = interpolate(spring({ frame: f - 4, fps, config: T.spring.smooth }), [0, 1], [-70, 0]);
  const out = interpolate(f, [dur - 18, dur], [1, 1.9], { ...clamp, easing: T.ease.in });
  const breathe = 1 + Math.sin(f / 18) * 0.02;
  const glow = interpolate(f, [4, 40], [0, 1], clamp);
  return (
    <SceneShell dur={dur} inF={4} outF={12}>
      <NavyBg />
      <AbsoluteFill style={center}>
        <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${T.colors.blue}55, transparent 62%)`, filter: "blur(30px)", opacity: glow, transform: `scale(${1 + Math.sin(f / 25) * 0.05})` }} />
        <div style={{ transform: `scale(${p * out * breathe}) rotate(${rot}deg)`, opacity: Math.min(1, p * 1.4) }}>
          <ChimeMark size={330} glow light id="a1" />
        </div>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const q = spring({ frame: f - 14 - i * 3, fps, config: T.spring.snappy });
          const a = (i / 6) * Math.PI * 2 + f / 90;
          return <div key={i} style={{ position: "absolute", left: 960 + Math.cos(a) * 250 * q - 4, top: 540 + Math.sin(a) * 250 * q - 4, width: 8, height: 8, borderRadius: 8, background: T.colors.sky, opacity: q * (0.35 + 0.35 * Math.sin(f / 7 + i)) }} />;
        })}
      </AbsoluteFill>
    </SceneShell>
  );
};

// ------------------------------------------------------------------ B · the composer, zoom in, typing (reference 0:11 – 0:14)
const Leaf: React.FC<{ x: number; y: number; rot: number; len: number; sway: number; o: number }> = ({ x, y, rot, len, sway, o }) => {
  const f = useCurrentFrame();
  return <div style={{ position: "absolute", left: x, top: y, width: len, height: len * 0.11, borderRadius: "50%", background: `rgba(52,64,78,${o})`, transform: `rotate(${rot + Math.sin(f / 40 + sway) * 2.2}deg)`, transformOrigin: "0% 50%", filter: "blur(7px)" }} />;
};
export const SceneComposer: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const chipsP = [650, 650], textP = [790, 440], mid = [960, 540];
  const k1 = interpolate(f, [0, 36], [0, 1], { ...clamp, easing: T.ease.inOut });
  const k2 = interpolate(f, [70, 108], [0, 1], { ...clamp, easing: T.ease.inOut });
  const pull = interpolate(f, [26, 62], [0, 1], { ...clamp, easing: T.ease.inOut });
  let s = interpolate(pull, [0, 1], [3.1, 1]);
  let px = interpolate(pull, [0, 1], [chipsP[0], mid[0]]);
  let py = interpolate(pull, [0, 1], [chipsP[1], mid[1]]);
  s = interpolate(k2, [0, 1], [s, 2.15]); px = interpolate(k2, [0, 1], [px, textP[0]]); py = interpolate(k2, [0, 1], [py, textP[1]]);
  const typed = "Loud music upstairs, again".slice(0, Math.max(0, Math.floor((f - 78) / 1.7)));
  const showText = f > 74;
  const caret = Math.floor(f / 14) % 2 === 0;
  const drift = Math.sin(f / 50) * 8;
  return (
    <SceneShell dur={dur} inF={6} outF={8}>
      <AbsoluteFill style={{ background: "linear-gradient(160deg, #8C9BA6 0%, #B9C4CC 45%, #9AA7B1 100%)" }}>
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${drift}px)` }}>
          <Leaf x={-80} y={-40} rot={34} len={900} sway={0} o={0.42} /><Leaf x={-60} y={20} rot={52} len={820} sway={1} o={0.36} /><Leaf x={-40} y={120} rot={18} len={760} sway={2} o={0.3} /><Leaf x={1080} y={-80} rot={142} len={900} sway={3} o={0.4} /><Leaf x={1100} y={10} rot={122} len={840} sway={4} o={0.34} />
          <div style={{ position: "absolute", left: 260, top: 0, width: 70, height: 1080, background: "rgba(40,50,60,0.4)", filter: "blur(4px)" }} />
          <div style={{ position: "absolute", left: 1000, top: 0, width: 520, height: 1080, background: "rgba(255,255,255,0.1)" }} />
        </div>
        <AbsoluteFill style={{ transform: `translate(${960 - px}px, ${540 - py}px) scale(${s})`, transformOrigin: `${px}px ${py}px` }}>
          <AbsoluteFill style={{ ...center, display: "flex" }}>
            <Composer typed={typed} caret={caret || f < 74} placeholder="Tell Chime what you hear." showText={showText} />
          </AbsoluteFill>
        </AbsoluteFill>
      </AbsoluteFill>
    </SceneShell>
  );
};

// ------------------------------------------------------------------ C · "noise" then the wordmark with the light streak (reference 0:15 – 0:17)
const useMeasure = (text: string, size: number) =>
  useMemo(() => {
    const c = document.createElement("canvas").getContext("2d")!;
    c.font = `700 ${size}px Outfit`;
    return text.split("").map((ch) => c.measureText(ch).width);
  }, [text, size]);
export const Wordmark: React.FC<{ size: number; start: number; light?: boolean; streak?: boolean; markGlow?: boolean }> = ({ size, start, light, streak = true, markGlow }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const letters = "Chime".split("");
  const widths = useMeasure("Chime", size);
  const total = widths.reduce((a, b) => a + b, 0) - size * 0.1;
  const iX = widths[0] + widths[1];
  const sp = streak ? spring({ frame: f - start - 6, fps, config: { damping: 22, stiffness: 70, mass: 1.1 } }) : 1;
  const mark = spring({ frame: f - start, fps, config: T.spring.bouncy });
  const col = light ? "#FFFFFF" : T.colors.text;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.18 }}>
      <div style={{ transform: `scale(${mark}) rotate(${interpolate(mark, [0, 1], [-40, 0])}deg)`, opacity: mark }}><ChimeMark size={size * 0.95} glow={markGlow} light id={`w${size}${start}`} /></div>
      <div style={{ position: "relative", width: total }}>
        <div style={{ display: "flex", fontFamily: T.fonts.display, fontWeight: 700, fontSize: size, letterSpacing: "-0.02em", lineHeight: 1, color: col }}>
          {letters.map((ch, i) => {
            const p = spring({ frame: f - start - 4 - i * 4, fps, config: T.spring.smooth });
            const isI = i === 2;
            const iVis = isI ? interpolate(sp, [0.55, 1], [0, 1], clamp) : 1;
            return <span key={i} style={{ display: "inline-block", width: widths[i], opacity: Math.min(p, iVis), transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px)`, filter: `blur(${interpolate(p, [0, 1], [14, 0], clamp)}px)` }}>{ch}</span>;
          })}
        </div>
        {streak && (
          <div style={{ position: "absolute", left: iX + widths[2] / 2 - 17, top: size * 0.14, height: size * 0.72, width: 34, opacity: interpolate(sp, [0.4, 1], [1, 0], clamp) }}>
            <Streak progress={interpolate(sp, [0, 0.5], [0.02, 1], clamp)} height={1200} />
          </div>
        )}
      </div>
    </div>
  );
};
export const SceneNoiseWordmark: React.FC<{ dur: number }> = ({ dur }) => (
  <SceneShell dur={dur} inF={6} outF={10}>
    <NavyBg />
    <AbsoluteFill style={{ ...center, display: "flex" }}><Kinetic text="noise" size={230} start={2} end={34} per={3} /></AbsoluteFill>
    <AbsoluteFill style={{ ...center, display: "flex", transform: "translateY(0px)" }}>
      <div style={{ opacity: 1 }}><WordmarkDelayed /></div>
    </AbsoluteFill>
  </SceneShell>
);
const WordmarkDelayed: React.FC = () => {
  const f = useCurrentFrame();
  return f < 40 ? null : <ShiftedWordmark />;
};
const ShiftedWordmark: React.FC = () => {
  const f = useCurrentFrame();
  return <div style={{ transform: `translateY(${Math.sin(f / 25) * 3}px)` }}><Wordmark size={170} start={40} light markGlow /></div>;
};

// ------------------------------------------------------------------ D · laptop on a bright desk (reference 0:18)
export const SceneLaptop: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dolly = interpolate(f, [0, dur], [1.0, 1.1], { easing: T.ease.inOut, ...clamp });
  const pan = interpolate(f, [0, dur], [40, -50], { easing: T.ease.inOut, ...clamp });
  const enter = spring({ frame: f - 2, fps, config: T.spring.smooth });
  const card = spring({ frame: f - 34, fps, config: T.spring.snappy });
  return (
    <SceneShell dur={dur} inF={8} outF={9}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #F4F6F9 0%, #E4E9EF 62%, #CBD1DA 100%)" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(150,160,175,0.18) 2px, transparent 2px), linear-gradient(90deg, rgba(150,160,175,0.18) 2px, transparent 2px)", backgroundSize: "200px 200px", transform: `translateX(${pan * 0.3}px)`, opacity: 0.8 }} />
        <div style={{ position: "absolute", left: 120 + pan * 0.6, top: 120, width: 190, height: 190, borderRadius: "50% 50% 8px 8px", background: "linear-gradient(140deg,#fff,#dfe3ea)", boxShadow: "0 30px 60px rgba(80,90,110,0.18)", transform: "rotate(-24deg)" }} />
        <div style={{ position: "absolute", left: 190 + pan * 0.6, top: 270, width: 16, height: 560, background: "linear-gradient(90deg,#fff,#cfd4dd)", borderRadius: 8, transform: "rotate(4deg)" }} />
        <div style={{ position: "absolute", left: 60, bottom: 120, width: 330, height: 36, borderRadius: 40, background: "rgba(110,120,140,0.28)", filter: "blur(10px)" }} />
        <AbsoluteFill style={{ ...center, display: "flex", transform: `scale(${dolly}) translateX(${pan}px) translateY(${(1 - enter) * 120 + 40}px)` }}>
          <Laptop img="img/map_top.jpg" focus={f / dur} />
        </AbsoluteFill>
        <div style={{ position: "absolute", right: 250, bottom: 250, opacity: card, transform: `translateY(${(1 - card) * 40}px) scale(${0.9 + 0.1 * card})`, padding: "22px 30px", borderRadius: 30, background: "rgba(255,255,255,0.78)", backdropFilter: "blur(24px)", boxShadow: "0 30px 70px rgba(20,40,90,0.25)", display: "flex", alignItems: "center", gap: 18, fontFamily: T.fonts.display }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: "linear-gradient(150deg,#9CC2FF,#2F7BFF 55%,#0A1A4A)", display: "grid", placeItems: "center" }}><MapPin size={30} color="#fff" strokeWidth={1.9} /></div>
          <div><div style={{ fontSize: 32, color: T.colors.ink, fontWeight: 700 }}>Is the city listening?</div><div style={{ fontSize: 24, color: "#5B6988" }}>Williamsburg · 186 reports this week</div></div>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};

// ------------------------------------------------------------------ E · "Report" → "Turn noise into answers" (reference "Create" → "Turn ideas into reality")
export const SceneTurn: React.FC<{ dur: number }> = ({ dur }) => (
  <SceneShell dur={dur} inF={6} outF={9}>
    <NavyBg />
    <AbsoluteFill style={{ ...center, display: "flex" }}><Kinetic text="Report" size={210} start={0} end={34} per={3} /></AbsoluteFill>
    <AbsoluteFill style={{ ...center, display: "flex" }}><div style={{ position: "absolute" }}><DelayedLine start={40} /></div></AbsoluteFill>
  </SceneShell>
);
const DelayedLine: React.FC<{ start: number }> = ({ start }) => {
  const f = useCurrentFrame();
  return f < start ? null : <Offset by={start}><WordLine words={["Turn", "noise", "into", "answers"]} size={92} start={0} per={5} accentFrom={3} end={9999} /></Offset>;
};
const Offset: React.FC<{ by: number; children: React.ReactNode }> = ({ by, children }) => {
  // re-base the frame so children's local timeline starts at 0
  return <FrameShift by={by}>{children}</FrameShift>;
};
import { Sequence } from "remotion";
const FrameShift: React.FC<{ by: number; children: React.ReactNode }> = ({ by, children }) => <Sequence from={by} layout="none">{children}</Sequence>;

// ------------------------------------------------------------------ F · phone shot on warm light (reference 0:14 – the phone swings in with motion blur)
export const ScenePhone: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - 2, fps, config: { damping: 18, stiffness: 70, mass: 1 } });
  const x = interpolate(p, [0, 1], [520, 0]);
  const ry = interpolate(p, [0, 1], [-48, 0]);
  const rz = interpolate(p, [0, 1], [14, 0]);
  const blur = interpolate(p, [0, 0.6, 1], [22, 6, 0], clamp);
  const float = Math.sin(f / 24) * 6;
  const push = interpolate(f, [20, dur], [1, 1.07], { easing: T.ease.inOut, ...clamp });
  return (
    <SceneShell dur={dur} inF={8} outF={9}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, #FFFDF4 0%, #F4E8C4 60%, #E2CE92 100%)" }}>
        <div style={{ position: "absolute", left: 360, top: 80, width: 1200, height: 700, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,255,255,0.9), transparent 66%)", filter: "blur(30px)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 300, background: "linear-gradient(0deg, rgba(190,150,70,0.45), transparent)" }} />
        <AbsoluteFill style={{ ...center, display: "flex", perspective: 1800 }}>
          <div style={{ transform: `translateX(${x}px) translateY(${float}px) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${1.1 * push})`, filter: `blur(${blur}px)` }}>
            <Phone src="clips/report.mp4" startFrom={170} />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </SceneShell>
  );
};

// ------------------------------------------------------------------ G · "From Noise to Answer" with the in-app tab icons
export const SceneFrom: React.FC<{ dur: number }> = ({ dur }) => (
  <SceneShell dur={dur} inF={6} outF={9}>
    <NavyBg />
    <AbsoluteFill style={{ ...center, display: "flex", flexDirection: "column", gap: 70 }}>
      <WordLine words={["From", "Noise", "to", "Answer"]} size={96} start={2} per={5} accentFrom={99} />
      <TabIcons start={26} />
    </AbsoluteFill>
  </SceneShell>
);

// ------------------------------------------------------------------ H · tablet with a light bar behind it (reference 0:21)
export const SceneTablet: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - 2, fps, config: T.spring.smooth });
  const push = interpolate(f, [0, dur], [1.0, 1.12], { easing: T.ease.inOut, ...clamp });
  const sway = interpolate(f, [0, dur], [-18, 18], { easing: T.ease.inOut, ...clamp });
  return (
    <SceneShell dur={dur} inF={8} outF={9}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #CDD5FF 0%, #6D78E0 55%, #1D2678 100%)" }}>
        <div style={{ position: "absolute", left: 250, top: 120, width: 1420, height: 760, borderRadius: 60, background: "radial-gradient(ellipse, rgba(255,255,255,0.95), rgba(190,205,255,0.5) 60%, transparent 75%)", filter: "blur(36px)", transform: `translateX(${sway * 1.4}px)` }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 250, background: "linear-gradient(180deg, rgba(18,22,70,0.2), #0C1138)" }} />
        <AbsoluteFill style={{ ...center, display: "flex", perspective: 2000 }}>
          <div style={{ transform: `translateX(${sway}px) translateY(${(1 - p) * 160 - 30}px) rotateY(${sway * 0.25}deg) scale(${push})`, opacity: p }}>
            <Tablet img="img/map_top.jpg" />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </SceneShell>
  );
};

// ------------------------------------------------------------------ I · light lavender: "Heard" → "Ready"
export const SceneReady: React.FC<{ dur: number }> = ({ dur }) => (
  <SceneShell dur={dur} inF={8} outF={9}>
    <LavenderBg />
    <AbsoluteFill style={{ ...center, display: "flex" }}><Kinetic text="Heard" size={250} start={2} end={36} per={3} gradient /></AbsoluteFill>
    <AbsoluteFill style={{ ...center, display: "flex" }}><div style={{ position: "absolute" }}><FrameShift by={42}><Kinetic text="Ready" size={250} start={0} per={4} gradient end={9999} /></FrameShift></div></AbsoluteFill>
  </SceneShell>
);

// ------------------------------------------------------------------ J · end card (reference: Mirox on violet-blue)
export const SceneEnd: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tag = spring({ frame: f - 46, fps, config: T.spring.smooth });
  const cred = spring({ frame: f - 62, fps, config: T.spring.smooth });
  const tile = spring({ frame: f - 30, fps, config: T.spring.bouncy });
  return (
    <SceneShell dur={dur} inF={9} outF={14}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #A8ADF0 0%, #6C73DD 52%, #4249C0 100%)" }}>
        <div style={{ position: "absolute", left: 420, top: 160, width: 1100, height: 620, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,255,255,0.5), transparent 68%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: -120, height: 520, background: "radial-gradient(ellipse at 50% 100%, rgba(30,40,160,0.7), transparent 70%)" }} />
        <AbsoluteFill style={{ ...center, display: "flex", flexDirection: "column", gap: 44 }}>
          <Wordmark size={190} start={4} light markGlow />
          <div style={{ fontFamily: T.fonts.display, fontSize: 52, color: "#fff", opacity: tag, transform: `translateY(${(1 - tag) * 24}px)`, filter: `blur(${(1 - tag) * 8}px)` }}>Give every complaint a heartbeat.</div>
          <div style={{ display: "flex", alignItems: "center", gap: 22, opacity: cred, transform: `translateY(${(1 - cred) * 18}px)` }}>
            <div style={{ transform: `scale(${tile})` }}><AppIconTile size={64} /></div>
            <span style={{ fontFamily: T.fonts.display, fontSize: 30, color: "rgba(255,255,255,0.85)" }}>Civic by Design · AIGA × Designpreneurs Hackathon</span>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </SceneShell>
  );
};
