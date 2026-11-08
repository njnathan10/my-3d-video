import { interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { colors, layout, motion } from "../brand/tokens";
import { useFormat, useReveal, useTimeResolver, revealValue } from "../timeline/SceneContext";
import type { TimeRef, Tone } from "../timeline/types";
import { baseText, useSafe, useTypeScale } from "./ui";

const toneColor: Record<Tone, string> = { teal: colors.tealBright, amber: colors.amber, white: colors.offWhite };

/** Small uppercase kicker: category, section label. */
export const Kicker: React.FC<{ children: React.ReactNode; tone?: Tone }> = ({ children, tone = "amber" }) => {
  const ts = useTypeScale();
  return (
    <div style={{ ...baseText, fontSize: ts.small, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: toneColor[tone] }}>
      {children}
    </div>
  );
};

/** Scene heading: teal rule + short title at the top of the frame. */
export const SceneHeading: React.FC<{ text?: string; at?: TimeRef }> = ({ text, at }) => {
  const r = useReveal(at);
  const ts = useTypeScale();
  const safe = useSafe();
  const { height } = useVideoConfig();
  const format = useFormat();
  if (!text) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: safe.left,
        right: safe.right,
        top: Math.max(safe.top, layout[format].titleY * height - ts.title),
        opacity: r,
        transform: `translateY(${(1 - r) * 18}px)`,
      }}
    >
      <div style={{ width: ts.title * 1.1 * r, height: 6, background: colors.teal, borderRadius: 3, marginBottom: ts.small * 0.6 }} />
      <div style={{ ...baseText, fontSize: ts.title, fontWeight: 800, lineHeight: 1.08 }}>{text}</div>
    </div>
  );
};

/** Hook title: kicker + big title, words rising in one by one. */
export const TitleCard: React.FC<{ kicker?: string; title: string }> = ({ kicker, title }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const ts = useTypeScale();
  const safe = useSafe();
  const format = useFormat();
  const words = title.split(" ");
  return (
    <div style={{ position: "absolute", left: safe.left, right: safe.right, top: Math.max(safe.top, layout[format].titleY * height - ts.hero * 0.6) }}>
      {kicker && (
        <div style={{ opacity: interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" }), marginBottom: ts.small }}>
          <Kicker>{kicker}</Kicker>
        </div>
      )}
      <div style={{ ...baseText, fontSize: ts.hero, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.025em" }}>
        {words.map((w, i) => {
          const p = spring({ frame: frame - 4 - i * 3, fps, config: motion.springConfig, durationInFrames: motion.enter });
          return (
            <span key={i} style={{ display: "inline-block", opacity: p, transform: `translateY(${(1 - p) * 30}px)`, marginRight: "0.24em" }}>
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** Bullet list with teal markers, each revealed at its own TimeRef. */
export const Bullets: React.FC<{ items: { text: string; at?: TimeRef }[]; numbered?: boolean; startDelay?: number }> = ({
  items,
  numbered,
  startDelay = 10,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const resolve = useTimeResolver();
  const ts = useTypeScale();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ts.body * 0.6 }}>
      {items.map((b, i) => {
        const r = revealValue(frame, fps, resolve(b.at, startDelay + i * 18));
        return (
          <div key={i} style={{ display: "flex", gap: ts.body * 0.55, alignItems: "flex-start", opacity: r, transform: `translateX(${(1 - r) * 24}px)` }}>
            <div
              style={{
                ...baseText,
                flex: "none",
                width: ts.body * 1.25,
                height: ts.body * 1.25,
                borderRadius: numbered ? "50%" : 6,
                background: colors.teal,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: ts.body * 0.7,
                fontWeight: 800,
                marginTop: ts.body * 0.08,
              }}
            >
              {numbered ? i + 1 : ""}
            </div>
            <div style={{ ...baseText, fontSize: ts.body, fontWeight: 600, lineHeight: 1.3 }}>{b.text}</div>
          </div>
        );
      })}
    </div>
  );
};

/** Card container used by concept / compare / quiz / recap. */
export const Card: React.FC<{ children: React.ReactNode; tone?: Tone; style?: React.CSSProperties; reveal?: number }> = ({
  children,
  tone = "teal",
  style,
  reveal = 1,
}) => {
  const ts = useTypeScale();
  return (
    <div
      style={{
        background: `linear-gradient(160deg, ${colors.navyLight}f2, ${colors.navy}f2)`,
        border: `1px solid ${colors.offWhite}1f`,
        borderTop: `5px solid ${toneColor[tone]}`,
        borderRadius: 18,
        padding: ts.body * 0.95,
        boxShadow: `0 24px 60px ${colors.navyDeep}aa`,
        opacity: reveal,
        transform: `translateY(${(1 - reveal) * 30}px) scale(${0.97 + 0.03 * reveal})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Microscope readout, e.g. "×10,000". Signals scale in micro scenes. */
export const Magnification: React.FC<{ text?: string }> = ({ text }) => {
  const ts = useTypeScale();
  const safe = useSafe();
  const { height } = useVideoConfig();
  const format = useFormat();
  const r = useReveal(0.3);
  if (!text) return null;
  return (
    <div
      style={{
        ...baseText,
        position: "absolute",
        left: safe.left,
        top: height * (layout[format].captionY - 0.075),
        fontSize: ts.small,
        fontWeight: 700,
        letterSpacing: "0.12em",
        color: colors.muted,
        opacity: r,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{ width: ts.small * 2.2, height: 3, background: colors.muted }} />
      {text}
    </div>
  );
};
