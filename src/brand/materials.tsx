import { useMemo } from "react";
import * as THREE from "three";
import { colors } from "./tokens";

// ─────────────────────────────────────────────────────────────────────────────
// MATERIAL PRESETS: every surface in every episode uses one of these, so the
// rendering style stays identical across videos. Add presets here; never
// create ad-hoc materials inside templates or episodes.
// ─────────────────────────────────────────────────────────────────────────────

export type MaterialPreset =
  | "tissue"
  | "muscle"
  | "arterial"
  | "venous"
  | "vesselWall"
  | "bone"
  | "nerve"
  | "membrane"
  | "cytoplasm"
  | "nucleus"
  | "bacterium"
  | "gramPositive"
  | "gramNegative"
  | "virus"
  | "rbc"
  | "highlight"
  | "accent"
  | "ghost"
  | "glass";

type Spec = THREE.MeshPhysicalMaterialParameters;

const specs: Record<MaterialPreset, Spec> = {
  tissue: { color: colors.tissue, roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.4, sheen: 0.4, sheenColor: new THREE.Color("#ffd6cf") },
  muscle: { color: colors.muscle, roughness: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.35, sheen: 0.3, sheenColor: new THREE.Color("#ffb3b3") },
  arterial: { color: colors.arterial, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25 },
  venous: { color: colors.venous, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25 },
  vesselWall: { color: "#E9A3A0", roughness: 0.4, transmission: 0, transparent: true, opacity: 0.28, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide },
  bone: { color: colors.bone, roughness: 0.7, clearcoat: 0.1 },
  nerve: { color: colors.nerve, roughness: 0.45, emissive: colors.nerve, emissiveIntensity: 0.08 },
  membrane: { color: "#BFE7E3", roughness: 0.25, transparent: true, opacity: 0.35, clearcoat: 1, clearcoatRoughness: 0.15, depthWrite: false, side: THREE.DoubleSide },
  cytoplasm: { color: "#7FC8C1", roughness: 0.4, transparent: true, opacity: 0.18, depthWrite: false },
  nucleus: { color: "#5B4A9E", roughness: 0.45, clearcoat: 0.4 },
  bacterium: { color: "#6FBF8F", roughness: 0.4, clearcoat: 0.7, clearcoatRoughness: 0.3, sheen: 0.5, sheenColor: new THREE.Color("#d8ffe6") },
  gramPositive: { color: colors.gramPositive, roughness: 0.4, clearcoat: 0.7, clearcoatRoughness: 0.3 },
  gramNegative: { color: colors.gramNegative, roughness: 0.4, clearcoat: 0.7, clearcoatRoughness: 0.3 },
  virus: { color: "#C9D3DD", roughness: 0.35, clearcoat: 0.8, metalness: 0.05 },
  rbc: { color: "#C8283A", roughness: 0.38, clearcoat: 0.65, clearcoatRoughness: 0.3, sheen: 0.6, sheenColor: new THREE.Color("#ff8a8a") },
  highlight: { color: colors.teal, roughness: 0.3, emissive: colors.tealBright, emissiveIntensity: 0.55, clearcoat: 1 },
  accent: { color: colors.amber, roughness: 0.3, emissive: colors.amber, emissiveIntensity: 0.45, clearcoat: 1 },
  ghost: { color: colors.offWhite, roughness: 0.3, transparent: true, opacity: 0.12, depthWrite: false },
  glass: { color: "#DDEFF2", roughness: 0.08, transparent: true, opacity: 0.22, clearcoat: 1, depthWrite: false },
};

/** Create a fresh material instance for a preset (caller owns it). */
export const makeMaterial = (preset: MaterialPreset, overrides: Spec = {}) =>
  new THREE.MeshPhysicalMaterial({ ...specs[preset], ...overrides });

/** Memoized preset material for use in JSX: <mesh material={useMaterial("rbc")} /> */
export const useMaterial = (preset: MaterialPreset, overrides?: Spec) =>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => makeMaterial(preset, overrides), [preset, JSON.stringify(overrides ?? {})]);

export const isMaterialPreset = (s: string): s is MaterialPreset => s in specs;
