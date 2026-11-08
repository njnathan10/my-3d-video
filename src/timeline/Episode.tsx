import { useMemo } from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame, type CalculateMetadataFunction } from "remotion";
import { Audio } from "@remotion/media";
import { ensureBrandFonts } from "../brand/fonts";
import { colors, motion, type Format } from "../brand/tokens";
import { episodes } from "../episodes";
import { BrandBug, DraftWatermark } from "../overlay/BrandFrame";
import { Captions } from "../overlay/Captions";
import { BrandBackground, Vignette } from "../overlay/ui";
import { SceneRenderer } from "../templates/registry";
import { SceneContext } from "./SceneContext";
import type { Episode, Scene, Timeline, Word } from "./types";

ensureBrandFonts();

export type EpisodeProps = { slug: string; format: Format; timeline?: Timeline | null };

/** Loads the generated timeline so the video length always matches the narration. */
export const calculateEpisodeMetadata: CalculateMetadataFunction<EpisodeProps> = async ({ props }) => {
  const res = await fetch(staticFile(`episodes/${props.slug}/timeline.json`));
  if (!res.ok) throw new Error(`No timeline for "${props.slug}". Run: npm run voiceover -- ${props.slug} --estimate`);
  const timeline = (await res.json()) as Timeline;
  return { durationInFrames: timeline.totalFrames, fps: timeline.fps, props: { ...props, timeline } };
};

/** Scene wrapper: crossfade / dip-to-navy entrance, no change to timing. */
const SceneShell: React.FC<{ transition: Scene["transition"]; first: boolean; children: React.ReactNode }> = ({ transition, first, children }) => {
  const frame = useCurrentFrame();
  const T = motion.sceneTransition;
  const mode = first ? "cut" : transition ?? "crossfade";
  const opacity = mode === "cut" ? 1 : interpolate(frame, [0, T], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity }}>
      {mode === "dip" && <AbsoluteFill style={{ background: colors.navy }} />}
      {children}
    </AbsoluteFill>
  );
};

export const EpisodeVideo: React.FC<EpisodeProps> = ({ slug, format, timeline }) => {
  const episode = episodes[slug] as Episode | undefined;
  if (!episode) throw new Error(`Episode "${slug}" is not registered. Run: npm run sync-episodes`);
  if (!timeline) throw new Error("Timeline missing");

  const allWords: Word[] = useMemo(
    () =>
      timeline.scenes.flatMap((ts) =>
        ts.words.map((w) => ({ ...w, startMs: w.startMs + (ts.from / timeline.fps) * 1000, endMs: w.endMs + (ts.from / timeline.fps) * 1000 })),
      ),
    [timeline],
  );
  const draft = episode.review.status !== "approved";

  return (
    <AbsoluteFill style={{ backgroundColor: colors.navy }}>
      <BrandBackground />
      {timeline.scenes.map((ts, i) => {
        const scene = episode.scenes.find((s) => s.id === ts.id);
        if (!scene) throw new Error(`Timeline scene "${ts.id}" not found in episode.json. Re-run the voiceover step.`);
        const next = episode.scenes[i + 1];
        const overlap = next && next.transition !== "cut" ? motion.sceneTransition : 0;
        return (
          <Sequence key={ts.id} from={ts.from} durationInFrames={ts.durationInFrames + overlap} premountFor={20} name={`${i + 1}. ${ts.id} (${scene.template})`}>
            <SceneContext.Provider value={{ scene, words: ts.words, durationInFrames: ts.durationInFrames, format }}>
              <SceneShell transition={scene.transition} first={i === 0}>
                <SceneRenderer scene={scene} />
              </SceneShell>
            </SceneContext.Provider>
          </Sequence>
        );
      })}
      <Vignette />
      {timeline.scenes.map((ts) =>
        ts.audio ? (
          <Sequence key={`a-${ts.id}`} from={ts.from} durationInFrames={ts.durationInFrames} layout="none">
            <Audio src={staticFile(ts.audio)} />
          </Sequence>
        ) : null,
      )}
      {episode.music && <Audio src={staticFile(episode.music)} volume={0.08} loop />}
      <BrandBug category={episode.category} />
      <Captions words={allWords} />
      {draft && <DraftWatermark />}
    </AbsoluteFill>
  );
};
