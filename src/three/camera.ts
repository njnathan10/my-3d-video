import * as THREE from "three";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { layout, type Format } from "../brand/tokens";
import { resolveTime, useFormat, useMaybeScene } from "../timeline/SceneContext";
import type { Shot, Vec3 } from "../timeline/types";

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic camera. A Shot + frame → Pose, as a pure function. The same
// pose drives the 3D camera AND the 2D label projection, so callouts stay
// pinned to anatomy during camera moves.
// ─────────────────────────────────────────────────────────────────────────────

export type Pose = { position: Vec3; target: Vec3; fov: number };

/** House camera easing: slow in, slow out. Intentional, never snappy. */
export const cameraEase = Easing.bezier(0.45, 0, 0.2, 1);

const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const DEFAULT_FOV = 35;

export const poseAt = (
  shot: Shot,
  frame: number,
  durationInFrames: number,
  resolve: (ref: string | number) => number = (r) => (typeof r === "number" ? r * 30 : 0),
): Pose => {
  const t = cameraEase(Math.min(1, Math.max(0, frame / Math.max(1, durationInFrames - 1))));
  switch (shot.type) {
    case "static":
      return { position: shot.position, target: shot.target ?? [0, 0, 0], fov: shot.fov ?? DEFAULT_FOV };
    case "orbit": {
      const target = shot.target ?? [0, 0, 0];
      const a = ((shot.from ?? -20) + ((shot.to ?? 20) - (shot.from ?? -20)) * t) * (Math.PI / 180);
      return {
        position: [target[0] + Math.sin(a) * shot.radius, target[1] + (shot.height ?? 0.6), target[2] + Math.cos(a) * shot.radius],
        target,
        fov: shot.fov ?? DEFAULT_FOV,
      };
    }
    case "dolly":
      return {
        position: lerp3(shot.from, shot.to, t),
        target: shot.targetTo ? lerp3(shot.target ?? [0, 0, 0], shot.targetTo, t) : shot.target ?? [0, 0, 0],
        fov: shot.fov ?? DEFAULT_FOV,
      };
    case "push": {
      const target = shot.target ?? [0, 0, 0];
      const dir = new THREE.Vector3(...(shot.dir ?? [0, 0.15, 1])).normalize();
      const d = shot.from + (shot.to - shot.from) * t;
      return { position: [target[0] + dir.x * d, target[1] + dir.y * d, target[2] + dir.z * d], target, fov: shot.fov ?? DEFAULT_FOV };
    }
    case "keyframes": {
      const keys = shot.keys.map((k) => ({ ...k, f: resolve(k.at) })).sort((a, b) => a.f - b.f);
      if (keys.length === 0) return { position: [0, 0, 6], target: [0, 0, 0], fov: DEFAULT_FOV };
      if (frame <= keys[0].f) return { position: keys[0].position, target: keys[0].target ?? [0, 0, 0], fov: keys[0].fov ?? DEFAULT_FOV };
      for (let i = 0; i < keys.length - 1; i++) {
        const a = keys[i];
        const b = keys[i + 1];
        if (frame <= b.f) {
          const k = interpolate(frame, [a.f, b.f], [0, 1], { easing: cameraEase });
          return {
            position: lerp3(a.position, b.position, k),
            target: lerp3(a.target ?? [0, 0, 0], b.target ?? [0, 0, 0], k),
            fov: (a.fov ?? DEFAULT_FOV) + ((b.fov ?? DEFAULT_FOV) - (a.fov ?? DEFAULT_FOV)) * k,
          };
        }
      }
      const last = keys[keys.length - 1];
      return { position: last.position, target: last.target ?? [0, 0, 0], fov: last.fov ?? DEFAULT_FOV };
    }
  }
};

/** Current pose for a shot inside a scene (cue-aware). */
export const usePose = (shot: Shot | undefined, fallback: Shot = { type: "orbit", radius: 6, from: -15, to: 15 }): Pose => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: compDuration } = useVideoConfig();
  const ctx = useMaybeScene();
  const duration = ctx?.durationInFrames ?? compDuration;
  const format = useFormat();
  const resolve = (r: string | number) => resolveTime(r, { words: ctx?.words ?? [], durationInFrames: duration, fps });
  const active = shot ?? fallback;
  const pose = poseAt(active, frame, duration, resolve);
  return format === "wide" ? reframeWide(pose, active.wide ?? WIDE_DISTANCE) : pose;
};

/**
 * Shots are authored for 9:16 (narrow, so the camera sits far back). In 16:9
 * there is more horizontal room, so the camera moves closer (default 0.8×).
 * Tall subjects (e.g. a whole circulation loop) set shot.wide ≈ 1.0.
 * One shot definition serves both formats.
 */
export const WIDE_DISTANCE = 0.8;
const reframeWide = (p: Pose, k: number): Pose => ({
  ...p,
  position: [
    p.target[0] + (p.position[0] - p.target[0]) * k,
    p.target[1] + (p.position[1] - p.target[1]) * k,
    p.target[2] + (p.position[2] - p.target[2]) * k,
  ],
});

/** Vertical shift so the look-at target lands at the format's subject line. */
export const viewOffsetY = (format: Format, height: number) => (0.5 - layout[format].subjectCenterY) * height;

export const buildCamera = (pose: Pose, width: number, height: number, format: Format) => {
  const cam = new THREE.PerspectiveCamera(pose.fov, width / height, 0.05, 200);
  applyPose(cam, pose, width, height, format);
  return cam;
};

export const applyPose = (cam: THREE.PerspectiveCamera, pose: Pose, width: number, height: number, format: Format) => {
  cam.fov = pose.fov;
  cam.aspect = width / height;
  cam.near = 0.05;
  cam.far = 200;
  cam.position.set(...pose.position);
  cam.lookAt(...pose.target);
  cam.setViewOffset(width, height, 0, viewOffsetY(format, height), width, height);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
};

/** Project a 3D point to pixel coordinates for 2D overlays. */
export const projectPoint = (p: Vec3, pose: Pose, width: number, height: number, format: Format) => {
  const cam = buildCamera(pose, width, height, format);
  const v = new THREE.Vector3(...p).project(cam);
  return { x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height, visible: v.z < 1 && v.z > -1 };
};
