import { Composition } from "remotion";
import { formats, FPS } from "./brand/tokens";
import { episodes } from "./episodes";
import { calculateEpisodeMetadata, EpisodeVideo } from "./timeline/Episode";

// Every registered episode gets two compositions:
//   <slug>        1080×1920 vertical (TikTok / Reels / Shorts) ← primary
//   <slug>-wide   1920×1080 (long-form YouTube)
export const RemotionRoot: React.FC = () => (
  <>
    {Object.keys(episodes).map((slug) => (
      <Composition
        key={slug}
        id={slug}
        component={EpisodeVideo}
        fps={FPS}
        durationInFrames={FPS * 120}
        {...formats.vertical}
        defaultProps={{ slug, format: "vertical", timeline: null }}
        calculateMetadata={calculateEpisodeMetadata}
      />
    ))}
    {Object.keys(episodes).map((slug) => (
      <Composition
        key={`${slug}-wide`}
        id={`${slug}-wide`}
        component={EpisodeVideo}
        fps={FPS}
        durationInFrames={FPS * 120}
        {...formats.wide}
        defaultProps={{ slug, format: "wide", timeline: null }}
        calculateMetadata={calculateEpisodeMetadata}
      />
    ))}
  </>
);
