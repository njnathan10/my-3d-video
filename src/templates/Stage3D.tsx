import { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { Callouts } from "../overlay/Callouts";
import { Magnification, SceneHeading, TitleCard } from "../overlay/Text";
import { Arrow3D } from "../three/Arrow3D";
import { cameraEase, usePose } from "../three/camera";
import { FlowParticles } from "../three/FlowParticles";
import { MedicalStage } from "../three/MedicalStage";
import { ClipGroup, Field, SubjectView } from "../three/Subject";
import { Vessel } from "../three/Vessel";
import { useCueFrame } from "../timeline/SceneContext";
import type { AnatomyParams, Arrow, Callout, CrossSectionParams, FlowParams, FlowPath, HookParams, MicroParams, Shot, Subject } from "../timeline/types";

/** Shared body for every 3D template: stage + subjects + flows + arrows + labels. */
const Scene3D: React.FC<{
  shot: Shot;
  subjects?: Subject[];
  flows?: FlowPath[];
  arrows?: Arrow[];
  callouts?: Callout[];
  heading?: string;
  clip?: THREE.Plane[];
  extra3D?: React.ReactNode;
  overlay?: React.ReactNode;
}> = ({ shot, subjects = [], flows = [], arrows = [], callouts, heading, clip, extra3D, overlay }) => {
  const pose = usePose(shot);
  const content = (
    <>
      {subjects.map((s, i) => (
        <SubjectView key={i} s={s} seed={`s${i}`} />
      ))}
      {extra3D}
    </>
  );
  return (
    <AbsoluteFill>
      <MedicalStage pose={pose}>
        {clip ? <ClipGroup planes={clip}>{content}</ClipGroup> : content}
        {flows.map((f, i) => (
          <group key={`f${i}`}>
            {f.wall !== false && <Vessel points={f.points} radius={f.radius} color={f.color} />}
            <FlowParticles {...f} seed={`flow${i}`} />
          </group>
        ))}
        {arrows.map((a, i) => (
          <Arrow3D key={`a${i}`} {...a} />
        ))}
      </MedicalStage>
      <Callouts items={callouts} pose={pose} />
      <SceneHeading text={heading} />
      {overlay}
    </AbsoluteFill>
  );
};

export const HookScene: React.FC<{ params: HookParams }> = ({ params }) => (
  <Scene3D
    shot={params.shot ?? { type: "orbit", radius: 6.5, height: 0.8, from: -35, to: 25 }}
    subjects={params.subject ? [params.subject] : []}
    overlay={<TitleCard kicker={params.kicker} title={params.title} />}
  />
);

export const AnatomyScene: React.FC<{ params: AnatomyParams }> = ({ params }) => <Scene3D {...params} />;

export const FlowScene: React.FC<{ params: FlowParams }> = ({ params }) => <Scene3D {...params} />;

export const MicroScene: React.FC<{ params: MicroParams }> = ({ params }) => (
  <Scene3D
    shot={params.shot ?? { type: "push", from: 9, to: 6.5, dir: [0.1, 0.12, 1] }}
    subjects={params.hero ? [params.hero] : []}
    callouts={params.callouts}
    heading={params.heading}
    extra3D={<Field s={params.organism} count={params.count ?? 14} />}
    overlay={<Magnification text={params.magnification} />}
  />
);

export const CrossSectionScene: React.FC<{ params: CrossSectionParams }> = ({ params }) => {
  const frame = useCurrentFrame();
  const start = useCueFrame(params.at, 15);
  const k = interpolate(frame, [start, start + 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: cameraEase });
  const offset = params.from + (params.to - params.from) * k;
  const axis = params.axis ?? "x";
  const plane = useMemo(() => new THREE.Plane(), []);
  plane.normal.set(axis === "x" ? -1 : 0, axis === "y" ? -1 : 0, axis === "z" ? -1 : 0);
  plane.constant = offset;
  return <Scene3D {...params} clip={[plane]} />;
};
