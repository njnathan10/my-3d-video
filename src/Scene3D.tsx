import { ThreeCanvas } from "@remotion/three";
import { Environment, RoundedBox, Float } from "@react-three/drei";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// IMPORTANT: In Remotion, never animate with useFrame()/clocks from three.js.
// Drive everything from useCurrentFrame() so every render is deterministic.

const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const intro = spring({ frame, fps, config: { damping: 12 } });
  const rotY = frame * 0.03;
  const rotX = Math.sin(frame / 40) * 0.4;

  return (
    <group scale={intro}>
      <RoundedBox args={[1.6, 1.6, 1.6]} radius={0.18} smoothness={6} rotation={[rotX, rotY, 0]}>
        <meshStandardMaterial color="#6c5ce7" metalness={0.6} roughness={0.2} />
      </RoundedBox>
    </group>
  );
};

const Orbiters: React.FC = () => {
  const frame = useCurrentFrame();
  const count = 8;
  return (
    <>
      {new Array(count).fill(0).map((_, i) => {
        const a = (i / count) * Math.PI * 2 + frame * 0.02;
        const r = 2.6;
        return (
          <mesh key={i} position={[Math.cos(a) * r, Math.sin(a * 2) * 0.5, Math.sin(a) * r]}>
            <sphereGeometry args={[0.18, 32, 32]} />
            <meshStandardMaterial color={i % 2 ? "#00cec9" : "#fd79a8"} emissive={i % 2 ? "#00cec9" : "#fd79a8"} emissiveIntensity={0.4} />
          </mesh>
        );
      })}
    </>
  );
};

export const Scene3D: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  // Slow camera dolly-in across the whole video
  const camZ = interpolate(frame, [0, durationInFrames], [8, 6], { extrapolateRight: "clamp" });

  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ fov: 50, position: [0, 0.5, camZ] }}
      style={{ backgroundColor: "#0b0b1a" }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={2} />
      <pointLight position={[-4, -2, 3]} intensity={30} color="#fd79a8" />
      <Hero />
      <Orbiters />
    </ThreeCanvas>
  );
};

// Re-export helpers you may want in your own scenes
export { Environment, Float };
