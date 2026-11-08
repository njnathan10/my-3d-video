// ─────────────────────────────────────────────────────────────────────────────
// BRAND TOKENS: the single source of truth for the visual identity.
// Change a value here and every episode, template and component follows.
// Never hard-code colors, fonts, sizes or timings in templates or episodes.
// ─────────────────────────────────────────────────────────────────────────────

export const colors = {
  // Brand palette
  navy: "#102638", // primary background
  navyDeep: "#0A1A28", // vignette / depth
  navyLight: "#1B3A52", // panels, cards
  teal: "#0B8C83", // anatomy highlights, accents
  tealBright: "#19B5A9", // teal on dark when it must glow (emissive, active)
  amber: "#F0BA55", // key concepts, emphasis
  offWhite: "#F5F7FA", // text, labels
  muted: "#9FB3C4", // secondary text

  // Medical conventions: use ONLY when the meaning requires it
  arterial: "#D2343E", // oxygenated blood
  venous: "#3A5BC7", // deoxygenated blood
  tissue: "#C98A82", // generic soft tissue
  muscle: "#B4545A", // myocardium, skeletal muscle
  bone: "#E8E1D3",
  nerve: "#F2D46B",
  lymph: "#8FD19E",
  gramPositive: "#7B4FA0", // crystal violet stain
  gramNegative: "#D45C8A", // safranin counterstain
} as const;

export type BrandColor = keyof typeof colors;

/** Resolve a brand color name or pass through a raw hex (raw hex is discouraged). */
export const c = (name: string): string =>
  name in colors ? colors[name as BrandColor] : name;

export const fonts = {
  family: "Inter",
  stack: "Inter, Manrope, system-ui, sans-serif",
} as const;

export type Format = "vertical" | "wide";

export const formats = {
  vertical: { width: 1080, height: 1920 },
  wide: { width: 1920, height: 1080 },
} as const;

export const FPS = 30;

/**
 * Safe zones, as fractions of the frame. Platform UI (TikTok/Reels/Shorts
 * buttons, username, description) covers the bottom ~22% and the right ~12%
 * of a 9:16 frame. Keep text inside these bounds.
 */
export const safeZones = {
  vertical: { top: 0.09, bottom: 0.22, left: 0.06, right: 0.13 },
  wide: { top: 0.06, bottom: 0.08, left: 0.05, right: 0.05 },
} as const;

/**
 * Screen layout per format: where the 3D subject sits and where captions go.
 * Vertical: subject in the upper-middle, captions in a band just above the
 * platform UI so they never cover the subject.
 */
export const layout = {
  vertical: { subjectCenterY: 0.4, captionY: 0.665, titleY: 0.16 },
  wide: { subjectCenterY: 0.5, captionY: 0.87, titleY: 0.19 },
} as const;

/** Type scale, as a fraction of frame WIDTH, so text scales with the format. */
export const type = {
  vertical: { hero: 0.095, title: 0.072, caption: 0.066, body: 0.046, label: 0.036, small: 0.028 },
  wide: { hero: 0.05, title: 0.036, caption: 0.03, body: 0.02, label: 0.0155, small: 0.0125 },
} as const;

/** Motion: durations in frames (30fps) and the house easing. */
export const motion = {
  enter: 14, // element entrance
  exit: 10,
  sceneTransition: 12, // crossfade overlap between scenes
  calloutStagger: 6,
  springConfig: { damping: 200, mass: 0.6 }, // smooth, no bounce (documentary feel)
  popConfig: { damping: 14, mass: 0.5 }, // tiny overshoot, used sparingly
} as const;

/** Narration pacing used for estimates and validation. */
export const pacing = {
  wordsPerMinute: 155,
  targetSeconds: 120,
  minSeconds: 105,
  maxSeconds: 135,
  sceneTailPadMs: 350, // silence after each scene's narration
} as const;
