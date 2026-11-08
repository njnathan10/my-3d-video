import { colors } from "../brand/tokens";
import { identity } from "../brand/identity";
import { baseText, useSafe, useTypeScale } from "./ui";

/** Persistent brand bug (top-left): teal mark + category. Identical on every episode. */
export const BrandBug: React.FC<{ category: string }> = ({ category }) => {
  const ts = useTypeScale();
  const safe = useSafe();
  return (
    <div
      style={{
        ...baseText,
        position: "absolute",
        left: safe.left,
        top: safe.top * 0.55,
        display: "flex",
        alignItems: "center",
        gap: ts.small * 0.5,
        fontSize: ts.small,
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: colors.muted,
      }}
    >
      <div style={{ width: ts.small * 0.75, height: ts.small * 0.75, borderRadius: 4, background: colors.teal, boxShadow: `0 0 18px ${colors.teal}` }} />
      {identity.seriesName ? `${identity.seriesName} · ${category}` : category}
    </div>
  );
};

/** Shown on every render until the episode's medical review is approved. */
export const DraftWatermark: React.FC = () => {
  const ts = useTypeScale();
  return (
    <div
      style={{
        ...baseText,
        position: "absolute",
        right: 0,
        top: 0,
        padding: `${ts.small * 0.35}px ${ts.small * 0.8}px`,
        background: "#B3261E",
        fontSize: ts.small * 0.8,
        fontWeight: 800,
        letterSpacing: "0.1em",
        borderBottomLeftRadius: 10,
      }}
    >
      DRAFT · NOT MEDICALLY REVIEWED
    </div>
  );
};
