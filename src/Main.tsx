import { AbsoluteFill, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { Scene3D } from "./Scene3D";
import { Captions } from "./Captions";

export type MainProps = {
  /** Audio/voiceover file (put it in /public). Empty string = no audio. */
  audioSrc: string;
  /** Captions JSON in /public (Remotion Caption[] format). Empty string = no captions. */
  captionsFile: string;
};

export const mainSchemaDefaults: MainProps = {
  audioSrc: staticFile("audio.wav"),
  captionsFile: "captions.json",
};

export const Main: React.FC<MainProps> = ({ audioSrc, captionsFile }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0b1a" }}>
      <Scene3D />
      {captionsFile ? <Captions src={captionsFile} /> : null}
      {audioSrc ? <Audio src={audioSrc} /> : null}
    </AbsoluteFill>
  );
};
