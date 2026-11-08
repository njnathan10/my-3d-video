import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, motion } from "../brand/tokens";
import { projectPoint, type Pose } from "../three/camera";
import { revealValue, useFormat, useTimeResolver } from "../timeline/SceneContext";
import type { Callout } from "../timeline/types";
import { baseText, useSafe, useTypeScale } from "./ui";

const toneColor = { teal: colors.tealBright, amber: colors.amber, white: colors.offWhite };

/**
 * Anatomical labels pinned to 3D points. They follow the camera because they
 * use the same Pose as the 3D stage. A dot marks the structure, a leader
 * line draws out, and the label slides in. Labels flip sides automatically
 * to stay inside the platform safe zone.
 */
export const Callouts: React.FC<{ items?: Callout[]; pose: Pose }> = ({ items = [], pose }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const format = useFormat();
  const resolve = useTimeResolver();
  const ts = useTypeScale();
  const safe = useSafe();

  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {items.map((c, i) => {
        const start = resolve(c.at, i * motion.calloutStagger);
        const end = c.until !== undefined ? resolve(c.until) : Number.POSITIVE_INFINITY;
        const r = revealValue(frame, fps, start, end);
        if (r <= 0.001) return null;
        const a = projectPoint(c.anchor, pose, width, height, format);
        if (!a.visible) return null;

        const tone = toneColor[c.tone ?? "teal"];
        const dx = width * (format === "vertical" ? 0.13 : 0.08);
        const dy = -height * 0.035;
        const labelW = ts.label * (c.text.length * 0.56) + ts.label * 1.4;
        let side = c.side ?? (a.x > width / 2 ? "right" : "left");
        if (side === "right" && a.x + dx + labelW > width - safe.right) side = "left";
        if (side === "left" && a.x - dx - labelW < safe.left) side = "right";
        const ex = side === "right" ? a.x + dx : a.x - dx;
        const ey = Math.max(safe.top + ts.label, a.y + dy);
        const line = interpolate(r, [0, 0.6], [0, 1], { extrapolateRight: "clamp" });
        const lx = a.x + (ex - a.x) * line;
        const ly = a.y + (ey - a.y) * line;
        const labelOpacity = interpolate(r, [0.4, 1], [0, 1], { extrapolateLeft: "clamp" });
        const slide = (1 - labelOpacity) * 16 * (side === "right" ? -1 : 1);

        return (
          <g key={i}>
            <circle cx={a.x} cy={a.y} r={ts.label * 0.42 * r} fill="none" stroke={tone} strokeWidth={3} opacity={0.9} />
            <circle cx={a.x} cy={a.y} r={ts.label * 0.16 * r} fill={tone} />
            <line x1={a.x} y1={a.y} x2={lx} y2={ly} stroke={tone} strokeWidth={3} strokeLinecap="round" />
            <foreignObject
              x={side === "right" ? ex + 10 + slide : ex - labelW - 10 + slide}
              y={ey - ts.label * 0.95}
              width={labelW + 20}
              height={ts.label * 2}
              opacity={labelOpacity}
            >
              <div
                style={{
                  ...baseText,
                  display: "inline-block",
                  fontSize: ts.label,
                  fontWeight: 700,
                  lineHeight: 1.25,
                  padding: `${ts.label * 0.22}px ${ts.label * 0.45}px`,
                  background: `${colors.navyDeep}e0`,
                  borderLeft: side === "right" ? `4px solid ${tone}` : undefined,
                  borderRight: side === "left" ? `4px solid ${tone}` : undefined,
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                  float: side === "left" ? "right" : "left",
                }}
              >
                {c.text}
              </div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
};
