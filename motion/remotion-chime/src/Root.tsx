import React from "react";
import { AbsoluteFill, Audio, Composition, Sequence, staticFile } from "remotion";
import { FPS, H, W } from "./theme";
import { Grain, Vignette } from "./ui";
import { SceneComposer, SceneEnd, SceneFrom, SceneLaptop, SceneMark, SceneNoiseWordmark, ScenePhone, SceneReady, SceneTablet, SceneTurn } from "./scenes";

// [from, duration] in frames at 30 fps. Scenes overlap ~8 frames so every cut is a blur/fade handoff.
export const TIMELINE = {
  mark: [0, 76], composer: [68, 138], noise: [198, 100], laptop: [292, 106], turn: [390, 88], phone: [470, 128], from: [592, 82], tablet: [668, 92], ready: [752, 90], end: [836, 134],
} as const;
export const TOTAL = 970;

const Main: React.FC = () => (
  <AbsoluteFill style={{ background: "#030814" }}>
    <Sequence from={TIMELINE.mark[0]} durationInFrames={TIMELINE.mark[1]}><SceneMark dur={TIMELINE.mark[1]} /></Sequence>
    <Sequence from={TIMELINE.composer[0]} durationInFrames={TIMELINE.composer[1]}><SceneComposer dur={TIMELINE.composer[1]} /></Sequence>
    <Sequence from={TIMELINE.noise[0]} durationInFrames={TIMELINE.noise[1]}><SceneNoiseWordmark dur={TIMELINE.noise[1]} /></Sequence>
    <Sequence from={TIMELINE.laptop[0]} durationInFrames={TIMELINE.laptop[1]}><SceneLaptop dur={TIMELINE.laptop[1]} /></Sequence>
    <Sequence from={TIMELINE.turn[0]} durationInFrames={TIMELINE.turn[1]}><SceneTurn dur={TIMELINE.turn[1]} /></Sequence>
    <Sequence from={TIMELINE.phone[0]} durationInFrames={TIMELINE.phone[1]}><ScenePhone dur={TIMELINE.phone[1]} /></Sequence>
    <Sequence from={TIMELINE.from[0]} durationInFrames={TIMELINE.from[1]}><SceneFrom dur={TIMELINE.from[1]} /></Sequence>
    <Sequence from={TIMELINE.tablet[0]} durationInFrames={TIMELINE.tablet[1]}><SceneTablet dur={TIMELINE.tablet[1]} /></Sequence>
    <Sequence from={TIMELINE.ready[0]} durationInFrames={TIMELINE.ready[1]}><SceneReady dur={TIMELINE.ready[1]} /></Sequence>
    <Sequence from={TIMELINE.end[0]} durationInFrames={TIMELINE.end[1]}><SceneEnd dur={TIMELINE.end[1]} /></Sequence>
    <Audio src={staticFile("audio/score.wav")} />
    <Vignette />
    <Grain dark />
  </AbsoluteFill>
);

export const Root: React.FC = () => <Composition id="ChimeLaunch" component={Main} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />;
