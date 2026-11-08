import { AbsoluteFill, useVideoConfig } from "remotion";
import { colors, fonts, safeZones, type } from "../brand/tokens";
import { useFormat } from "../timeline/SceneContext";

/** Pixel sizes of the type scale for the current format. */
export const useTypeScale = () => {
  const { width } = useVideoConfig();
  const format = useFormat();
  const t = type[format];
  return {
    hero: Math.round(width * t.hero),
    title: Math.round(width * t.title),
    caption: Math.round(width * t.caption),
    body: Math.round(width * t.body),
    label: Math.round(width * t.label),
    small: Math.round(width * t.small),
  };
};

/** Safe-zone insets in pixels for the current format. */
export const useSafe = () => {
  const { width, height } = useVideoConfig();
  const s = safeZones[useFormat()];
  return { top: s.top * height, bottom: s.bottom * height, left: s.left * width, right: s.right * width };
};

export const baseText: React.CSSProperties = {
  fontFamily: fonts.stack,
  color: colors.offWhite,
  fontFeatureSettings: '"ss01", "cv11"', // Inter: straight-sided digits, single-storey a
  letterSpacing: "-0.01em",
};

/** Brand background: deep navy with a soft center glow. Sits behind the 3D canvas. */
export const BrandBackground: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 70% 55% at 50% 42%, ${colors.navyLight} 0%, ${colors.navy} 55%, ${colors.navyDeep} 100%)`,
    }}
  />
);

/** Edge vignette above the 3D, below text. Adds depth, focuses the eye. */
export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 85% 75% at 50% 45%, transparent 55%, ${colors.navyDeep}cc 100%)`,
      pointerEvents: "none",
    }}
  />
);
