import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useVideoConfig } from "remotion";
import * as THREE from "three";
import { BrandLighting } from "../brand/Lighting";
import { colors } from "../brand/tokens";
import { useFormat } from "../timeline/SceneContext";
import { applyPose, type Pose } from "./camera";

const CameraDriver: React.FC<{ pose: Pose }> = ({ pose }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const { width, height } = useVideoConfig();
  const format = useFormat();
  useLayoutEffect(() => {
    applyPose(camera, pose, width, height, format);
  });
  return null;
};

/**
 * The standard 3D stage: transparent canvas over the brand background,
 * house lighting, depth fog, soft shadows, clipping enabled, and a camera
 * driven by a deterministic Pose. Every 3D scene renders inside this.
 */
export const MedicalStage: React.FC<{
  pose: Pose;
  children: React.ReactNode;
  shadows?: boolean;
  fog?: [near: number, far: number];
  rim?: number;
}> = ({ pose, children, shadows = true, fog = [13, 34], rim }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0 }}
      gl={{ antialias: true, alpha: true, localClippingEnabled: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      shadows={shadows ? "soft" : false}
      camera={{ fov: pose.fov, position: pose.position, near: 0.05, far: 200 }}
    >
      <fog attach="fog" args={[colors.navy, fog[0], fog[1]]} />
      <CameraDriver pose={pose} />
      <BrandLighting shadows={shadows} rim={rim} />
      {children}
    </ThreeCanvas>
  );
};
