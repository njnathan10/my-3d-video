import { useLayoutEffect, useRef } from "react";
import { random, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import type { Subject, Vec3 } from "../timeline/types";
import { AnatomyModel } from "./AnatomyModel";
import { Grow } from "./Grow";
import { Alveoli } from "./micro/Alveoli";
import { Bacillus, Cell, Coccus, Virion } from "./micro/Microbes";
import { RedBloodCell } from "./micro/RedBloodCell";

const Body: React.FC<{ s: Subject; seed: string }> = ({ s, seed }) => {
  switch (s.kind) {
    case "model":
      return <AnatomyModel src={s.src} materials={s.materials} highlight={s.highlight} />;
    case "rbc":
      return <RedBloodCell />;
    case "bacillus":
      return <Bacillus gram={s.gram} flagella={s.flagella} seed={seed} />;
    case "coccus":
      return <Coccus gram={s.gram} arrangement={s.arrangement} seed={seed} />;
    case "virion":
      return <Virion spikes={s.spikes} />;
    case "cell":
      return <Cell nucleus={s.nucleus} seed={seed} />;
    case "alveoli":
      return <Alveoli capillaries={s.capillaries} />;
  }
};

/**
 * Renders any Subject spec from episode JSON: transform, slow spin, and a
 * smooth entrance at `at`. This is the ONLY way templates place 3D objects.
 */
export const SubjectView: React.FC<{ s: Subject; seed?: string; drift?: Vec3 }> = ({ s, seed = "subject" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spin = (s.spin ?? 0) * (frame / fps);
  const rot = s.rotation ?? [0, 0, 0];
  return (
    <group position={s.position ?? [0, 0, 0]} rotation={[rot[0], rot[1] + spin, rot[2]]} scale={s.scale ?? 1}>
      <Grow at={s.at}>
        <Body s={s} seed={seed} />
      </Grow>
    </group>
  );
};

/**
 * A microscopic field: many seeded copies of one subject drifting slowly
 * through depth, the standard "under the microscope" look.
 */
export const Field: React.FC<{ s: Subject; count?: number; spread?: Vec3; seed?: string }> = ({
  s,
  count = 14,
  spread = [9, 6, 6],
  seed = "field",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <group>
      {new Array(count).fill(0).map((_, i) => {
        const r = (k: string) => random(`${seed}-${k}-${i}`);
        const p: Vec3 = [
          (r("x") - 0.5) * spread[0] + Math.sin(t * 0.3 + i) * 0.15,
          (r("y") - 0.5) * spread[1] + Math.cos(t * 0.25 + i) * 0.12,
          -1.5 - r("z") * spread[2],
        ];
        const rotation: Vec3 = [r("rx") * 6 + t * (r("sx") - 0.5) * 0.4, r("ry") * 6 + t * (r("sy") - 0.5) * 0.5, r("rz") * 6];
        return <SubjectView key={i} seed={`${seed}-${i}`} s={{ ...s, position: p, rotation, scale: (s.scale ?? 1) * (0.75 + r("s") * 0.4), spin: 0 }} />;
      })}
    </group>
  );
};

/**
 * Applies clipping planes to every material below it (cross-sections).
 * Materials become double-sided so the interior shows through the cut.
 */
export const ClipGroup: React.FC<{ planes: THREE.Plane[]; children: React.ReactNode }> = ({ planes, children }) => {
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    ref.current?.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        m.clippingPlanes = planes;
        m.clipShadows = true;
        m.side = THREE.DoubleSide;
      });
    });
  });
  return <group ref={ref}>{children}</group>;
};
