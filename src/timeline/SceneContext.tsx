import { createContext, useContext } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { motion, type Format } from "../brand/tokens";
import type { Scene, TimeRef, Word } from "./types";

export type SceneCtx = {
  scene: Scene;
  words: Word[];
  durationInFrames: number;
  format: Format;
};

export const SceneContext = createContext<SceneCtx | null>(null);

export const useScene = (): SceneCtx => {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error("useScene() must be used inside an episode scene");
  return ctx;
};

/** Optional variant for components that also work outside episodes. */
export const useMaybeScene = () => useContext(SceneContext);

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9₂]/g, "");
const CUE_RE = /^@(.+?)(?:#(\d+))?(?:([+-]\d+(?:\.\d+)?))?$/;

/** Resolve a TimeRef to a scene-relative frame. Unknown cues fall back to `fallback`. */
export const resolveTime = (
  ref: TimeRef | undefined,
  ctx: { words: Word[]; durationInFrames: number; fps: number },
  fallback = 0,
): number => {
  if (ref === undefined || ref === null) return fallback;
  if (typeof ref === "number") return Math.round(ref * ctx.fps);
  const s = ref.trim();
  if (s.endsWith("%")) return Math.round((parseFloat(s) / 100) * ctx.durationInFrames);
  const m = s.match(CUE_RE);
  if (m) {
    const target = norm(m[1]);
    const nth = m[2] ? parseInt(m[2], 10) : 1;
    const offset = m[3] ? parseFloat(m[3]) : 0;
    let seen = 0;
    for (const w of ctx.words) {
      if (norm(w.text).startsWith(target)) {
        seen++;
        if (seen === nth) return Math.max(0, Math.round((w.startMs / 1000 + offset) * ctx.fps));
      }
    }
    return fallback;
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.round(n * ctx.fps) : fallback;
};

/** Frame (scene-relative) for a TimeRef. */
export const useCueFrame = (ref: TimeRef | undefined, fallback = 0) => {
  const { fps } = useVideoConfig();
  const ctx = useMaybeScene();
  return resolveTime(ref, { words: ctx?.words ?? [], durationInFrames: ctx?.durationInFrames ?? 0, fps }, fallback);
};

/**
 * 0→1 entrance progress starting at a TimeRef (smooth spring, no bounce),
 * and 1→0 exit if `until` is given. The standard way to animate anything in.
 */
export const useReveal = (at?: TimeRef, until?: TimeRef, fallback = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = useCueFrame(at, fallback);
  const end = useCueFrame(until, Number.POSITIVE_INFINITY);
  const enter = spring({ frame: frame - start, fps, config: motion.springConfig, durationInFrames: motion.enter });
  const exit = Number.isFinite(end)
    ? interpolate(frame, [end, end + motion.exit], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;
  return Math.min(enter, exit);
};

/** Non-hook reveal value, for loops over variable-length arrays. */
export const revealValue = (frame: number, fps: number, start: number, end = Number.POSITIVE_INFINITY) => {
  const enter = spring({ frame: frame - start, fps, config: motion.springConfig, durationInFrames: motion.enter });
  const exit = Number.isFinite(end)
    ? interpolate(frame, [end, end + motion.exit], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;
  return Math.min(enter, exit);
};

/** Resolver bound to the current scene, for use inside loops. */
export const useTimeResolver = () => {
  const { fps } = useVideoConfig();
  const ctx = useMaybeScene();
  return (ref: TimeRef | undefined, fallback = 0) =>
    resolveTime(ref, { words: ctx?.words ?? [], durationInFrames: ctx?.durationInFrames ?? 0, fps }, fallback);
};

/** Current format (vertical/wide) derived from the composition size. */
export const useFormat = (): Format => {
  const { width, height } = useVideoConfig();
  return height > width ? "vertical" : "wide";
};
