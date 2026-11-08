import { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { colors } from "../brand/tokens";
import { useCueFrame } from "../timeline/SceneContext";
import type { Arrow } from "../timeline/types";
import { cameraEase } from "./camera";
import { toCurve } from "./curves";

const toneColor = { teal: colors.tealBright, amber: colors.amber, white: colors.offWhite };

/** Directional arrow that draws itself along a path (diffusion, flow, signal direction). */
export const Arrow3D: React.FC<Arrow & { drawFrames?: number }> = ({ points, at, tone = "amber", radius = 0.045, drawFrames = 22 }) => {
  const frame = useCurrentFrame();
  const start = useCueFrame(at, 0);
  const p = interpolate(frame, [start, start + drawFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: cameraEase });
  const curve = useMemo(() => toCurve(points), [points]);
  const color = toneColor[tone];

  const { shaft, tip, quat } = useMemo(() => {
    const end = Math.max(0.001, p);
    const pts = new Array(32).fill(0).map((_, i) => curve.getPointAt((i / 31) * end));
    const sub = new THREE.CatmullRomCurve3(pts);
    const shaftG = new THREE.TubeGeometry(sub, 32, radius, 12, false);
    const tipPos = curve.getPointAt(end);
    const dir = curve.getTangentAt(end).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return { shaft: shaftG, tip: tipPos, quat: q };
  }, [curve, p, radius]);

  if (p <= 0) return null;
  return (
    <group>
      <mesh geometry={shaft}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.4} />
      </mesh>
      <mesh position={tip} quaternion={quat}>
        <coneGeometry args={[radius * 3, radius * 7, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
};
