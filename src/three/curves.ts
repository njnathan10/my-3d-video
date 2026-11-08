import * as THREE from "three";
import type { Vec3 } from "../timeline/types";

export const toCurve = (points: Vec3[], closed = false) =>
  new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed, "centripetal");

/** A stable perpendicular frame at u along a curve (for offsets around a path). */
export const frameAt = (curve: THREE.Curve<THREE.Vector3>, u: number) => {
  const t = curve.getTangentAt(u).normalize();
  const ref = Math.abs(t.y) < 0.95 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const n = new THREE.Vector3().crossVectors(t, ref).normalize();
  const b = new THREE.Vector3().crossVectors(t, n).normalize();
  return { t, n, b };
};
