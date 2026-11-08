import { useMemo } from "react";
import { random, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { useMaterial, type MaterialPreset } from "../../brand/materials";

const gramPreset = (gram?: "positive" | "negative" | "none"): MaterialPreset =>
  gram === "positive" ? "gramPositive" : gram === "negative" ? "gramNegative" : "bacterium";

/** Rod-shaped bacterium (bacillus) with animated flagella. Long axis = X. */
export const Bacillus: React.FC<{ gram?: "positive" | "negative" | "none"; flagella?: number; seed?: string }> = ({
  gram,
  flagella = 3,
  seed = "bac",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const body = useMaterial(gramPreset(gram));
  const flag = useMaterial("ghost", { opacity: 0.55, color: "#d9efe9" });
  const phase = (frame / fps) * 9;

  const flagGeoms = useMemo(
    () =>
      new Array(flagella).fill(0).map((_, k) => {
        const base = (k / Math.max(1, flagella)) * Math.PI * 2 + random(`${seed}-f${k}`) * 0.6;
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 40; i++) {
          const s = i / 40;
          const x = -0.95 - s * 2.1;
          const amp = 0.18 * s;
          pts.push(
            new THREE.Vector3(
              x,
              Math.cos(base) * 0.18 + Math.sin(s * 14 - phase + base) * amp,
              Math.sin(base) * 0.18 + Math.cos(s * 14 - phase + base) * amp,
            ),
          );
        }
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.018, 6, false);
      }),
    [flagella, phase, seed],
  );

  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} material={body} castShadow receiveShadow>
        <capsuleGeometry args={[0.36, 1.2, 16, 32]} />
      </mesh>
      {flagGeoms.map((g, i) => (
        <mesh key={i} geometry={g} material={flag} />
      ))}
    </group>
  );
};

/** Spherical bacteria with clinically meaningful arrangements. */
export const Coccus: React.FC<{ gram?: "positive" | "negative" | "none"; arrangement?: "single" | "diplo" | "chain" | "cluster"; seed?: string }> = ({
  gram,
  arrangement = "single",
  seed = "coc",
}) => {
  const mat = useMaterial(gramPreset(gram));
  const positions = useMemo<[number, number, number][]>(() => {
    const r = 0.42;
    switch (arrangement) {
      case "diplo": // e.g. Neisseria, Streptococcus pneumoniae
        return [[-r * 0.95, 0, 0], [r * 0.95, 0, 0]];
      case "chain": // Streptococcus
        return new Array(6).fill(0).map((_, i) => [(i - 2.5) * r * 1.9, Math.sin(i * 0.9) * 0.12, Math.cos(i * 0.7) * 0.08]);
      case "cluster": // Staphylococcus ("grape-like")
        return new Array(10).fill(0).map((_, i) => {
          const a = random(`${seed}-a${i}`) * Math.PI * 2;
          const b = Math.acos(2 * random(`${seed}-b${i}`) - 1);
          const d = i === 0 ? 0 : r * 1.75;
          return [Math.sin(b) * Math.cos(a) * d, Math.cos(b) * d * 0.8, Math.sin(b) * Math.sin(a) * d];
        });
      default:
        return [[0, 0, 0]];
    }
  }, [arrangement, seed]);
  return (
    <group>
      {positions.map((p, i) => (
        <mesh key={i} position={p} material={mat} castShadow receiveShadow>
          <sphereGeometry args={[0.42, 48, 32]} />
        </mesh>
      ))}
    </group>
  );
};

/** Enveloped virion with surface spike proteins (e.g. influenza, SARS-CoV-2 style). */
export const Virion: React.FC<{ spikes?: number }> = ({ spikes = 60 }) => {
  const shell = useMaterial("virus");
  const spikeMat = useMaterial("highlight", { emissiveIntensity: 0.25 });
  const dirs = useMemo(() => {
    // Fibonacci sphere: even spike distribution
    const out: THREE.Quaternion[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < spikes; i++) {
      const y = 1 - (i / (spikes - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = i * Math.PI * (3 - Math.sqrt(5));
      out.push(new THREE.Quaternion().setFromUnitVectors(up, new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r)));
    }
    return out;
  }, [spikes]);
  return (
    <group>
      <mesh material={shell} castShadow receiveShadow>
        <icosahedronGeometry args={[0.8, 6]} />
      </mesh>
      {dirs.map((q, i) => (
        <group key={i} quaternion={q}>
          <mesh position={[0, 0.92, 0]} material={spikeMat}>
            <cylinderGeometry args={[0.025, 0.035, 0.25, 8]} />
          </mesh>
          <mesh position={[0, 1.07, 0]} material={spikeMat}>
            <sphereGeometry args={[0.065, 12, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** Generic eukaryotic cell: membrane, cytoplasm, nucleus, mitochondria. */
export const Cell: React.FC<{ nucleus?: boolean; seed?: string }> = ({ nucleus = true, seed = "cell" }) => {
  const membrane = useMaterial("membrane");
  const cyto = useMaterial("cytoplasm");
  const nuc = useMaterial("nucleus");
  const mito = useMaterial("accent", { emissiveIntensity: 0.15, color: "#E39A4A" });
  const mitos = useMemo(
    () =>
      new Array(7).fill(0).map((_, i) => {
        const a = random(`${seed}-m${i}`) * Math.PI * 2;
        const h = (random(`${seed}-h${i}`) - 0.5) * 1.2;
        const d = 0.75 + random(`${seed}-d${i}`) * 0.2;
        return { p: [Math.cos(a) * d, h, Math.sin(a) * d] as [number, number, number], r: [a, random(`${seed}-r${i}`) * 3, 0] as [number, number, number] };
      }),
    [seed],
  );
  return (
    <group>
      <mesh material={membrane} renderOrder={3}>
        <sphereGeometry args={[1.3, 64, 48]} />
      </mesh>
      <mesh material={cyto} renderOrder={2}>
        <sphereGeometry args={[1.24, 48, 32]} />
      </mesh>
      {nucleus && (
        <mesh material={nuc} position={[0.15, 0.05, 0]} castShadow>
          <sphereGeometry args={[0.48, 48, 32]} />
        </mesh>
      )}
      {mitos.map((m, i) => (
        <mesh key={i} position={m.p} rotation={m.r} material={mito}>
          <capsuleGeometry args={[0.07, 0.22, 8, 16]} />
        </mesh>
      ))}
    </group>
  );
};
