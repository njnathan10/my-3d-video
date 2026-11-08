import { useLayoutEffect, useMemo, useRef } from "react";
import { random, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { colors } from "../brand/tokens";
import { useReveal } from "../timeline/SceneContext";
import type { FlowPath } from "../timeline/types";
import { frameAt, toCurve } from "./curves";
import { rbcGeometry } from "./micro/RedBloodCell";

const colorFor = (mode: FlowPath["color"], u: number, out: THREE.Color) => {
  const art = new THREE.Color(colors.arterial);
  const ven = new THREE.Color(colors.venous);
  const s = THREE.MathUtils.smoothstep(u, 0.35, 0.65);
  switch (mode) {
    case "oxygenate":
      return out.copy(ven).lerp(art, s);
    case "deoxygenate":
      return out.copy(art).lerp(ven, s);
    case "venous":
      return out.copy(ven);
    case "teal":
      return out.set(colors.tealBright);
    case "amber":
      return out.set(colors.amber);
    case "offWhite":
      return out.set(colors.offWhite);
    default:
      return out.copy(art);
  }
};

/**
 * Reusable particle stream along a path: blood cells, O₂ molecules, ions,
 * drug molecules, air. Deterministic (seeded), so it renders identically
 * on every frame and every machine.
 *
 * color: "oxygenate" (venous→arterial) / "deoxygenate" (arterial→venous)
 * shifts color along the path, the standard for gas-exchange visuals.
 */
export const FlowParticles: React.FC<FlowPath & { seed?: string }> = ({
  points,
  radius = 0.25,
  count = 90,
  speed = 0.08,
  color = "arterial",
  particle = "rbc",
  particleSize,
  at,
  seed = "flow",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = useReveal(at);
  const ref = useRef<THREE.InstancedMesh>(null);
  const curve = useMemo(() => toCurve(points), [points]);
  const size = particleSize ?? (particle === "rbc" ? radius * 0.55 : radius * 0.22);

  const geometry = useMemo(
    () => (particle === "rbc" ? rbcGeometry() : new THREE.SphereGeometry(1, 16, 12)),
    [particle],
  );
  const material = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.3, sheen: 0.4 }),
    [],
  );
  const seeds = useMemo(
    () =>
      new Array(count).fill(0).map((_, i) => ({
        u0: random(`${seed}-u-${i}`),
        ang: random(`${seed}-a-${i}`) * Math.PI * 2,
        r: Math.sqrt(random(`${seed}-r-${i}`)) * 0.7,
        spin: (random(`${seed}-s-${i}`) - 0.5) * 2.4,
        tilt: random(`${seed}-t-${i}`) * Math.PI,
        jitter: 0.85 + random(`${seed}-j-${i}`) * 0.3,
      })),
    [count, seed],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const col = new THREE.Color();
    const t = frame / fps;
    seeds.forEach((s, i) => {
      const u = (((s.u0 + t * speed * s.jitter) % 1) + 1) % 1;
      const { n, b } = frameAt(curve, u);
      pos.copy(curve.getPointAt(u))
        .addScaledVector(n, Math.cos(s.ang) * s.r * radius)
        .addScaledVector(b, Math.sin(s.ang) * s.r * radius);
      e.set(s.tilt + t * s.spin, t * s.spin * 0.7, s.ang);
      q.setFromEuler(e);
      const sc = size * reveal;
      m.compose(pos, q, new THREE.Vector3(sc, sc, sc));
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, colorFor(color, u, col));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[geometry, material, count]} castShadow frustumCulled={false} />;
};
