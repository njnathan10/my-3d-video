import { useMemo } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, layout } from "../brand/tokens";
import { useFormat } from "../timeline/SceneContext";
import type { Word } from "../timeline/types";
import { baseText, useSafe, useTypeScale } from "./ui";

// Word-synchronized captions. Bold white, with **amber** concepts and
// ==teal== anatomy terms (markup in the narration). Sits in a band above
// the platform UI so it never covers the 3D subject or the app buttons.

type Page = { words: Word[]; startMs: number; endMs: number };

const MAX_CHARS = { vertical: 22, wide: 44 };
const PAUSE_BREAK_MS = 420;
const LINGER_MS = 500;

export const paginate = (words: Word[], maxChars: number): Page[] => {
  const pages: Page[] = [];
  let cur: Word[] = [];
  let chars = 0;
  const flush = () => {
    if (cur.length) pages.push({ words: cur, startMs: cur[0].startMs, endMs: cur[cur.length - 1].endMs });
    cur = [];
    chars = 0;
  };
  words.forEach((w, i) => {
    const prev = words[i - 1];
    const pause = prev ? w.startMs - prev.endMs : 0;
    const sentenceEnd = prev ? /[.?!:;]$/.test(prev.text) : false;
    const commaBreak = prev ? /,$/.test(prev.text) && chars > maxChars * 0.45 : false;
    if (cur.length && (chars + w.text.length + 1 > maxChars || pause > PAUSE_BREAK_MS || sentenceEnd || commaBreak)) flush();
    cur.push(w);
    chars += w.text.length + 1;
  });
  flush();
  return pages.map((p, i) => ({ ...p, endMs: Math.min(pages[i + 1]?.startMs ?? Infinity, p.endMs + LINGER_MS) }));
};

const emphasisColor = (w: Word) => (w.emphasis === "amber" ? colors.amber : w.emphasis === "teal" ? colors.tealBright : colors.offWhite);

export const Captions: React.FC<{ words: Word[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const format = useFormat();
  const ts = useTypeScale();
  const safe = useSafe();
  const pages = useMemo(() => paginate(words, MAX_CHARS[format]), [words, format]);
  const ms = (frame / fps) * 1000;
  const page = pages.find((p) => ms >= p.startMs && ms < p.endMs);
  if (!page) return null;

  const sinceStart = ms - page.startMs;
  const enter = interpolate(sinceStart, [0, 140], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        left: safe.left,
        right: safe.right,
        top: layout[format].captionY * height,
        transform: `translateY(-50%) translateY(${(1 - enter) * 10}px)`,
        opacity: enter,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          ...baseText,
          fontSize: ts.caption,
          fontWeight: 800,
          lineHeight: 1.12,
          textAlign: "center",
          letterSpacing: "-0.015em",
          WebkitTextStroke: `${Math.round(ts.caption * 0.13)}px ${colors.navyDeep}`,
          paintOrder: "stroke fill",
          textShadow: `0 4px 18px ${colors.navyDeep}cc`,
        }}
      >
        {page.words.map((w, i) => {
          const active = ms >= w.startMs && ms < w.endMs + 60;
          const spoken = ms >= w.startMs;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                margin: "0 0.14em",
                color: emphasisColor(w),
                opacity: spoken ? 1 : 0.55,
                transform: `translateY(${active ? -3 : 0}px)`,
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
