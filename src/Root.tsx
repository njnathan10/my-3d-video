import { Composition } from "remotion";
import { Main, mainSchemaDefaults, type MainProps } from "./Main";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Landscape 16:9 */}
      <Composition
        id="Main"
        component={Main}
        durationInFrames={30 * 8}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={mainSchemaDefaults satisfies MainProps}
      />
      {/* Vertical 9:16 for Shorts / Reels / TikTok */}
      <Composition
        id="MainVertical"
        component={Main}
        durationInFrames={30 * 8}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={mainSchemaDefaults}
      />
    </>
  );
};
