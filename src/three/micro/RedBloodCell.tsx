import { useMemo } from "react";
import * as THREE from "three";
import { useMaterial } from "../../brand/materials";

let cached: THREE.BufferGeometry | null = null;

/**
 * Anatomically accurate erythrocyte: biconcave disc from the Evans–Fung
 * shape equation (Evans & Fung 1972), normalized to radius 1.
 *   z(r) = ±½·√(1−ρ²)·(C0 + C2ρ² + C4ρ⁴),  ρ = r/R,  R = 3.91 µm
 */
export const rbcGeometry = () => {
  if (cached) return cached;
  const R = 3.91;
  const C0 = 0.81;
  const C2 = 7.83;
  const C4 = -4.39;
  const N = 48;
  // Half-profile from center (ρ=0) to rim (ρ=1); denser sampling near the rim.
  const half: THREE.Vector2[] = [];
  for (let i = 0; i <= N; i++) {
    const rho = Math.sin((i / N) * (Math.PI / 2));
    const z = 0.5 * Math.sqrt(Math.max(0, 1 - rho * rho)) * (C0 + C2 * rho * rho + C4 * rho ** 4);
    half.push(new THREE.Vector2(Math.max(0.0001, rho), z / R));
  }
  // Lathe profile: bottom-center → rim → top-center (correct outward normals).
  const bottom = half.map((v) => new THREE.Vector2(v.x, -v.y));
  const top = half.slice(0, -1).reverse();
  const g = new THREE.LatheGeometry([...bottom, ...top], 96);
  g.computeVertexNormals();
  cached = g;
  return g;
};

/** A single erythrocyte. Disc faces +Y by default; rotate to taste. */
export const RedBloodCell: React.FC<{ scale?: number }> = ({ scale = 1 }) => {
  const geometry = useMemo(() => rbcGeometry(), []);
  const material = useMaterial("rbc", { side: THREE.DoubleSide });
  return <mesh geometry={geometry} material={material} scale={scale} castShadow receiveShadow />;
};
