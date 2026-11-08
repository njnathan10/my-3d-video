# Component library (for custom scenes and new templates)

Build custom scenes only from these. Register them in `src/templates/custom.tsx`:

```tsx
import { AbsoluteFill } from "remotion";
import { usePose } from "../three/camera";
import { MedicalStage } from "../three/MedicalStage";
import { SubjectView } from "../three/Subject";
import { FlowParticles } from "../three/FlowParticles";
import { Callouts } from "../overlay/Callouts";
import { SceneHeading } from "../overlay/Text";
import type { CustomParams } from "../timeline/types";

const ReceptorBinding: React.FC<{ params: CustomParams }> = ({ params }) => {
  const pose = usePose({ type: "push", from: 12, to: 9 });
  return (
    <AbsoluteFill>
      <MedicalStage pose={pose}>
        <SubjectView s={{ kind: "cell", scale: 1.2 }} />
        <FlowParticles points={[[-4, 1, 0], [-1, 0.6, 0.5]]} particle="sphere" color="amber" count={20} radius={0.3} />
      </MedicalStage>
      <Callouts pose={pose} items={[{ text: "Beta-1 receptor", anchor: [-1.1, 0.5, 0.6], at: "@receptor" }]} />
      <SceneHeading text="How beta blockers work" />
    </AbsoluteFill>
  );
};
export const customScenes = { ReceptorBinding };
```

## Timing (`src/timeline/SceneContext.tsx`)

- `useReveal(at?, until?)` → 0..1 smooth entrance/exit. The standard way to animate in.
- `useCueFrame(ref)` → scene-relative frame of a TimeRef.
- `useTimeResolver()` → `(ref) => frame`, for loops. `revealValue(frame, fps, start, end?)` is the non-hook form.
- `useScene()` → `{ scene, words, durationInFrames, format }`. `useFormat()` → "vertical" | "wide".

## 3D (`src/three/`)

| Component | Purpose |
|---|---|
| `MedicalStage pose shadows? fog? rim?` | Canvas + brand lighting + fog + camera. Every 3D scene starts here |
| `usePose(shot)` / `poseAt` / `projectPoint` | Deterministic camera + 3D→2D projection (labels) |
| `SubjectView s` | Any Subject spec (model, rbc, bacillus, coccus, virion, cell, alveoli) |
| `Field s count spread` | Many drifting copies (microscope field) |
| `ClipGroup planes` | Cross-section clipping for its children |
| `FlowParticles {...FlowPath}` | Instanced particle stream on a path (cells, molecules, ions) |
| `Vessel points radius color opacity solid` | Tube with optional oxygenation gradient (vessel, airway, duct, axon) |
| `Arrow3D points at tone` | Self-drawing direction arrow |
| `Grow at until` | Scale-in wrapper |
| `AnatomyModel src materials highlight` | GLB with brand re-skin + cue highlights |
| `RedBloodCell`, `Bacillus`, `Coccus`, `Virion`, `Cell`, `Alveoli` | Procedural micro-anatomy |
| `useMaterial(preset)` / `makeMaterial` | Brand materials (never `new MeshStandardMaterial`) |

## 2D overlays (`src/overlay/`)

| Component | Purpose |
|---|---|
| `Callouts items pose` | Labels pinned to 3D anchors with leader lines |
| `SceneHeading text` | Teal rule + scene title |
| `TitleCard kicker title` | Hook title |
| `Card tone reveal` · `Kicker` · `Bullets items numbered?` | Card building blocks |
| `Magnification text` | Microscope scale readout |
| `Captions words` | Global captions (rendered by Episode; don't add per scene) |
| `useTypeScale()` · `useSafe()` · `baseText` | Sizes, safe-zone insets, base text style |
