import { useMemo } from "react";
import * as THREE from "three";
import { colors } from "../brand/tokens";
import type { FlowPath, Vec3 } from "../timeline/types";
import { toCurve } from "./curves";

const wallColor = (mode: FlowPath["color"]): [string, string] => {
  switch (mode) {
    case "oxygenate":
      return [colors.venous, colors.arterial];
    case "deoxygenate":
      return [colors.arterial, colors.venous];
    case "venous":
      return [colors.venous, colors.venous];
    case "teal":
      return [colors.teal, colors.teal];
    case "amber":
      return [colors.amber, colors.amber];
    case "offWhite":
      return [colors.offWhite, colors.offWhite];
    default:
      return [colors.arterial, colors.arterial];
  }
};

/**
 * Translucent vessel / duct / airway tube along a path. With a gradient
 * color mode it shows oxygenation changing along its length.
 */
export const Vessel: React.FC<{ points: Vec3[]; radius?: number; color?: FlowPath["color"]; opacity?: number; solid?: boolean }> = ({
  points,
  radius = 0.25,
  color = "arterial",
  opacity = 0.32,
  solid = false,
}) => {
  const geometry = useMemo(() => {
    const curve = toCurve(points);
    const g = new THREE.TubeGeometry(curve, Math.max(64, points.length * 24), radius, 32, false);
    const [a, b] = wallColor(color).map((h) => new THREE.Color(h));
    const pos = g.attributes.position;
    const cols = new Float32Array(pos.count * 3);
    const radial = 33; // radialSegments + 1
    for (let i = 0; i < pos.count; i++) {
      const u = Math.floor(i / radial) / Math.max(1, pos.count / radial - 1);
      const c = a.clone().lerp(b, THREE.MathUtils.smoothstep(u, 0.3, 0.7));
      cols.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    return g;
  }, [points, radius, color]);

  return (
    <mesh geometry={geometry} renderOrder={solid ? 0 : 2} receiveShadow>
      <meshPhysicalMaterial
        vertexColors
        roughness={0.3}
        clearcoat={1}
        clearcoatRoughness={0.2}
        transparent={!solid}
        opacity={solid ? 1 : opacity}
        depthWrite={solid}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
