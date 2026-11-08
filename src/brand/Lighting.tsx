import { Environment, Lightformer } from "@react-three/drei";
import { colors } from "./tokens";

/**
 * THE house lighting rig. Every 3D scene uses it, which is what makes all
 * episodes read as one brand:
 *  - warm-white key from upper left (soft shadows)
 *  - cool navy hemisphere fill (never fully black shadows)
 *  - signature TEAL RIM from behind: the brand's visual fingerprint
 *  - procedural studio environment for clearcoat reflections (no network/HDR files)
 */
export const BrandLighting: React.FC<{ shadows?: boolean; rim?: number }> = ({ shadows = true, rim = 1 }) => {
  return (
    <>
      <hemisphereLight args={["#cfe3f2", colors.navyDeep, 0.55]} />
      <directionalLight
        position={[4, 6, 5]}
        intensity={2.2}
        color="#fff4e6"
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-radius={6}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <directionalLight position={[-5, 1, 3]} intensity={0.45} color="#d6e6ff" />
      {/* Teal rim (back light) */}
      <directionalLight position={[-2, 3, -6]} intensity={2.4 * rim} color={colors.tealBright} />
      <directionalLight position={[3, -2, -5]} intensity={1.1 * rim} color={colors.teal} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#ffffff" position={[3, 4, 4]} scale={[6, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.4} color={colors.tealBright} position={[-4, 1, -4]} scale={[4, 6, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={0.8} color={colors.amber} position={[0, -4, 2]} scale={2} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.5} color="#9fc3e6" position={[0, 6, -2]} scale={[8, 2, 1]} target={[0, 0, 0]} />
      </Environment>
    </>
  );
};
