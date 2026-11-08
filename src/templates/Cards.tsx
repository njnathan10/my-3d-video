import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { identity } from "../brand/identity";
import { colors, layout } from "../brand/tokens";
import { Bullets, Card, Kicker } from "../overlay/Text";
import { baseText, useSafe, useTypeScale } from "../overlay/ui";
import { usePose } from "../three/camera";
import { MedicalStage } from "../three/MedicalStage";
import { SubjectView } from "../three/Subject";
import { revealValue, useCueFrame, useFormat, useReveal, useTimeResolver } from "../timeline/SceneContext";
import type { CompareParams, ConceptParams, QuizParams, RecapParams, Subject, Tone } from "../timeline/types";

/** Card stack anchored in the subject area, above the caption band. */
const CardArea: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const safe = useSafe();
  const { width, height } = useVideoConfig();
  const format = useFormat();
  const captionTop = layout[format].captionY * height - height * 0.06;
  const right = format === "wide" ? width * 0.4 : safe.right;
  return (
    <div
      style={{
        position: "absolute",
        left: safe.left,
        right,
        top: safe.top + height * 0.05,
        height: captionTop - safe.top - height * 0.05,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 28,
      }}
    >
      {children}
    </div>
  );
};

/** Dimmed, slowly orbiting 3D subject behind cards (keeps 2D scenes "in world"). */
const Backdrop: React.FC<{ s?: Subject }> = ({ s }) => {
  const format = useFormat();
  // In 16:9 the cards sit left, so the backdrop orbits a point left of it (subject appears on the right).
  const pose = usePose({ type: "orbit", target: format === "wide" ? [-5.5, 0, 0] : [0, 0, 0], radius: 13, height: 1.5, from: -25, to: 25, wide: 1 });
  if (!s) return null;
  return (
    <AbsoluteFill style={{ opacity: 0.22 }}>
      <MedicalStage pose={pose} shadows={false}>
        <SubjectView s={s} />
      </MedicalStage>
    </AbsoluteFill>
  );
};

export const ConceptScene: React.FC<{ params: ConceptParams }> = ({ params }) => {
  const ts = useTypeScale();
  const r = useReveal(0);
  const f = useReveal(params.bullets?.length ? "60%" : 1.2);
  return (
    <AbsoluteFill>
      <Backdrop s={params.backdrop} />
      <CardArea>
        <Card tone="amber" reveal={r}>
          <Kicker>Key concept</Kicker>
          <div style={{ ...baseText, fontSize: ts.title, fontWeight: 800, color: colors.amber, marginTop: ts.small * 0.5, lineHeight: 1.05 }}>{params.term}</div>
          {params.definition && (
            <div style={{ ...baseText, fontSize: ts.body, fontWeight: 500, marginTop: ts.small * 0.8, lineHeight: 1.35, color: colors.offWhite }}>
              {params.definition}
            </div>
          )}
        </Card>
        {params.bullets && params.bullets.length > 0 && <Bullets items={params.bullets} />}
        {params.formula && (
          <div
            style={{
              ...baseText,
              alignSelf: "center",
              fontSize: ts.body,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              padding: `${ts.small * 0.6}px ${ts.body}px`,
              border: `2px solid ${colors.teal}`,
              borderRadius: 14,
              background: `${colors.navyDeep}cc`,
              opacity: f,
              whiteSpace: "nowrap",
            }}
          >
            {params.formula}
          </div>
        )}
      </CardArea>
    </AbsoluteFill>
  );
};

export const CompareScene: React.FC<{ params: CompareParams }> = ({ params }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ts = useTypeScale();
  const resolve = useTimeResolver();
  const format = useFormat();
  const col = (side: "left" | "right", idx: number) => {
    const c = params[side];
    const r = revealValue(frame, fps, resolve(params.revealAt?.[idx], idx * 20));
    const tone: Tone = c.tone ?? (side === "left" ? "teal" : "amber");
    return (
      <Card tone={tone} reveal={r} style={{ flex: 1 }}>
        <div style={{ ...baseText, fontSize: ts.body * 1.1, fontWeight: 800, color: tone === "amber" ? colors.amber : colors.tealBright, marginBottom: ts.small }}>
          {c.title}
        </div>
        {c.points.map((p, i) => (
          <div key={i} style={{ ...baseText, fontSize: ts.body * 0.85, fontWeight: 600, lineHeight: 1.3, marginTop: ts.small * 0.5 }}>
            {p}
          </div>
        ))}
      </Card>
    );
  };
  return (
    <AbsoluteFill>
      <CardArea>
        {params.title && <div style={{ ...baseText, fontSize: ts.title, fontWeight: 800 }}>{params.title}</div>}
        <div style={{ display: "flex", flexDirection: format === "vertical" ? "column" : "row", gap: 24 }}>
          {col("left", 0)}
          {col("right", 1)}
        </div>
      </CardArea>
    </AbsoluteFill>
  );
};

export const QuizScene: React.FC<{ params: QuizParams }> = ({ params }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ts = useTypeScale();
  const reveal = useCueFrame(params.revealAt, Math.round(fps * 6));
  const shown = frame >= reveal;
  const k = interpolate(frame, [reveal, reveal + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const r = useReveal(0);
  const letters = "ABCDEF";
  return (
    <AbsoluteFill>
      <CardArea>
        <Card tone="amber" reveal={r}>
          <Kicker>{params.label ?? "NCLEX practice"}</Kicker>
          <div style={{ ...baseText, fontSize: ts.body * 1.05, fontWeight: 700, lineHeight: 1.3, marginTop: ts.small * 0.6 }}>{params.question}</div>
        </Card>
        {params.options.map((o, i) => {
          const correct = i === params.answer;
          const or = revealValue(frame, fps, 12 + i * 6);
          return (
            <div
              key={i}
              style={{
                ...baseText,
                display: "flex",
                alignItems: "center",
                gap: ts.body * 0.6,
                fontSize: ts.body * 0.92,
                fontWeight: 600,
                padding: `${ts.small * 0.7}px ${ts.body * 0.7}px`,
                borderRadius: 14,
                background: shown && correct ? `${colors.teal}` : `${colors.navyLight}e6`,
                border: `2px solid ${shown && correct ? colors.tealBright : `${colors.offWhite}22`}`,
                opacity: or * (shown && !correct ? 1 - 0.55 * k : 1),
                transform: `translateX(${(1 - or) * 30}px) scale(${shown && correct ? 1 + 0.03 * k : 1})`,
              }}
            >
              <div style={{ fontWeight: 800, color: shown && correct ? colors.offWhite : colors.amber, width: ts.body }}>{letters[i]}</div>
              <div style={{ flex: 1 }}>{o}</div>
              {shown && correct && <div style={{ fontWeight: 800, opacity: k }}>✓</div>}
            </div>
          );
        })}
        <div style={{ position: "relative", minHeight: ts.body * 2.4 }}>
          {!shown && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Countdown until={reveal} />
            </div>
          )}
          {params.rationale && (
            <div style={{ ...baseText, fontSize: ts.label, fontWeight: 500, color: colors.muted, lineHeight: 1.35, opacity: k }}>{params.rationale}</div>
          )}
        </div>
      </CardArea>
    </AbsoluteFill>
  );
};

/** Thin teal ring that empties until the answer reveal: "think time" cue. */
const Countdown: React.FC<{ until: number }> = ({ until }) => {
  const frame = useCurrentFrame();
  const ts = useTypeScale();
  const start = Math.max(0, until - 90);
  const p = interpolate(frame, [start, until], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (frame < start) return null;
  const R = ts.body;
  const C = 2 * Math.PI * R;
  return (
    <svg width={R * 2 + 12} height={R * 2 + 12}>
      <circle cx={R + 6} cy={R + 6} r={R} fill="none" stroke={`${colors.offWhite}22`} strokeWidth={6} />
      <circle
        cx={R + 6}
        cy={R + 6}
        r={R}
        fill="none"
        stroke={colors.tealBright}
        strokeWidth={6}
        strokeDasharray={C}
        strokeDashoffset={C * (1 - p)}
        transform={`rotate(-90 ${R + 6} ${R + 6})`}
        strokeLinecap="round"
      />
    </svg>
  );
};

export const RecapScene: React.FC<{ params: RecapParams }> = ({ params }) => {
  const ts = useTypeScale();
  const r = useReveal(0);
  const cta = useReveal("75%");
  const ctaText = params.cta ?? identity.defaultCta;
  return (
    <AbsoluteFill>
      <CardArea>
        <div style={{ opacity: r }}>
          <Kicker tone="teal">Recap</Kicker>
          <div style={{ ...baseText, fontSize: ts.title, fontWeight: 800, marginTop: ts.small * 0.4 }}>{params.title ?? "Key takeaways"}</div>
        </div>
        <Bullets items={params.points.map((text) => ({ text }))} numbered />
        <div
          style={{
            ...baseText,
            alignSelf: "flex-start",
            fontSize: ts.label,
            fontWeight: 800,
            color: colors.navy,
            background: colors.amber,
            padding: `${ts.small * 0.55}px ${ts.label}px`,
            borderRadius: 999,
            lineHeight: 1.25,
            textAlign: "center",
            opacity: cta,
            transform: `translateY(${(1 - cta) * 16}px)`,
          }}
        >
          {ctaText}
          {identity.handle ? ` · ${identity.handle}` : ""}
        </div>
      </CardArea>
    </AbsoluteFill>
  );
};
