// Single source of truth. Palette is taken from the Chime brand board: white, blue, black.
import { Easing } from "remotion";
export const theme = {
  colors: {
    navy: "#030814", navy2: "#071A3E", navy3: "#0B2A66",
    blue: "#2F7BFF", blueHi: "#6AB0FF", sky: "#9CC2FF", ice: "#E6F0FF",
    lav: "#CFD3F7", lav2: "#8D93E6", violet: "#4A52C8",
    text: "#F4F7FF", textDim: "#9FB2D8", ink: "#0A0F1E", cream: "#F6EEDC",
  },
  fonts: { display: "Outfit, 'Inter', sans-serif", ui: "Inter, sans-serif" },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.83, 0, 0.17, 1),
    soft: Easing.bezier(0.45, 0, 0.15, 1),
    in: Easing.bezier(0.7, 0, 0.84, 0),
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
  },
} as const;
export const FPS = 30;
export const W = 1920;
export const H = 1080;
