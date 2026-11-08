import { useMemo } from "react";
import * as THREE from "three";
import { useMaterial } from "../../brand/materials";
import type { Vec3 } from "../../timeline/types";
import { Vessel } from "../Vessel";

/** Alveolar sac positions (shared so episodes can anchor callouts/flows to them). */
export const ALVEOLI: { p: Vec3; r: number }[] = [
  { p: [0, 0, 0], r: 0.9 },
  { p: [1.25, 0.45, 0.2], r: 0.75 },
  { p: [-1.2, 0.35, 0.3], r: 0.78 },
  { p: [0.55, -1.05, 0.35], r: 0.72 },
  { p: [-0.65, -1.0, 0.1], r: 0.7 },
  { p: [0.3, 0.95, -0.6], r: 0.7 },
  { p: [-0.35, 0.2, -1.05], r: 0.68 },
];

/**
 * Cluster of alveoli at the end of a bronchiole, wrapped in pulmonary
 * capillaries that shift from deoxygenated → oxygenated along their length.
 */
export const Alveoli: React.FC<{ capillaries?: boolean }> = ({ capillaries = true }) => {
  const sac = useMaterial("membrane", { color: "#F3C4C0", opacity: 0.42 });
  const duct = useMaterial("tissue", { transparent: true, opacity: 0.6 });

  const caps = useMemo(
    () =>
      ALVEOLI.slice(0, 5).map(({ p, r }, k) => {
        const pts: Vec3[] = [];
        const tilt = new THREE.Euler(k * 0.7, k * 1.3, k * 0.4);
        for (let i = 0; i <= 10; i++) {
          const a = -Math.PI * 0.85 + (i / 10) * Math.PI * 1.7;
          const v = new THREE.Vector3(Math.cos(a) * r * 1.04, Math.sin(a) * r * 1.04, Math.sin(a * 2) * 0.12).applyEuler(tilt);
          pts.push([p[0] + v.x, p[1] + v.y, p[2] + v.z]);
        }
        return pts;
      }),
    [],
  );

  return (
    <group>
      {ALVEOLI.map(({ p, r }, i) => (
        <mesh key={i} position={p} material={sac} renderOrder={3}>
          <sphereGeometry args={[r, 48, 32]} />
        </mesh>
      ))}
      <mesh position={[0, 1.9, 0.25]} material={duct}>
        <cylinderGeometry args={[0.22, 0.32, 1.6, 32, 1, true]} />
      </mesh>
      {capillaries && caps.map((pts, i) => <Vessel key={i} points={pts} radius={0.055} color="oxygenate" solid />)}
    </group>
  );
};
