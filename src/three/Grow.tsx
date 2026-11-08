import { useReveal } from "../timeline/SceneContext";
import type { TimeRef } from "../timeline/types";

/** Smoothly scales its children in at a TimeRef (and out at `until`). */
export const Grow: React.FC<{ at?: TimeRef; until?: TimeRef; children: React.ReactNode }> = ({ at, until, children }) => {
  const r = useReveal(at, until);
  const s = Math.max(0.0001, r);
  return <group scale={s} visible={r > 0.001}>{children}</group>;
};
