import { useLayoutEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { makeMaterial, type MaterialPreset } from "../brand/materials";
import { colors } from "../brand/tokens";
import { revealValue, useTimeResolver } from "../timeline/SceneContext";
import type { Highlight } from "../timeline/types";

/**
 * Loads a GLB anatomy model from /public and re-skins EVERY mesh with brand
 * material presets, so models from any source look like one house style.
 *
 * materials: mesh-name substring → preset. "*" sets the default.
 *   { "*": "tissue", "ventricle": "muscle", "aorta": "arterial", "vena": "venous" }
 * highlight: glow specific meshes (teal/amber) from a cue, e.g. when narrated.
 *
 * Models must be meshopt- or un-compressed (see references/models.md). Draco
 * is disabled because its decoder is fetched from a CDN at render time.
 */
export const AnatomyModel: React.FC<{
  src: string;
  materials?: Record<string, MaterialPreset>;
  highlight?: Highlight[];
}> = ({ src, materials = {}, highlight = [] }) => {
  const gltf = useGLTF(staticFile(src), false, true);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const resolve = useTimeResolver();

  const scene = useMemo(() => {
    const root = gltf.scene.clone(true);
    const keys = Object.keys(materials).filter((k) => k !== "*");
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const name = mesh.name.toLowerCase();
      const key = keys.find((k) => name.includes(k.toLowerCase()));
      const preset = (key ? materials[key] : materials["*"]) ?? "tissue";
      mesh.material = makeMaterial(preset);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
    return root;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gltf, JSON.stringify(materials)]);

  useLayoutEffect(() => {
    const active = highlight.map((h) => ({
      h,
      v: revealValue(frame, fps, resolve(h.at, 0), h.until !== undefined ? resolve(h.until) : Number.POSITIVE_INFINITY),
    }));
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      const name = mesh.name.toLowerCase();
      const hit = active.find(({ h }) => h.meshes.some((m) => name.includes(m.toLowerCase())));
      if (hit && hit.v > 0) {
        const pulse = 0.75 + 0.25 * Math.sin((frame / fps) * Math.PI * 1.2);
        mat.emissive.set(hit.h.tone === "amber" ? colors.amber : colors.tealBright);
        mat.emissiveIntensity = 0.65 * hit.v * pulse;
      } else if (highlight.length) {
        mat.emissiveIntensity = 0;
      }
    });
  });

  return <primitive object={scene} />;
};
