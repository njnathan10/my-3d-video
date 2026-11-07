import { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { createTikTokStyleCaptions, type Caption, type TikTokPage } from "@remotion/captions";
import { loadFont } from "@remotion/fonts";

// Font is bundled in /public so renders work offline.
// (Alternatively: import { loadFont } from "@remotion/google-fonts/Montserrat")
const fontFamily = "Montserrat";
loadFont({ family: fontFamily, url: staticFile("fonts/Montserrat-ExtraBold.woff2"), weight: "800" });

// How many ms of speech to group into one on-screen "page"
const SWITCH_CAPTIONS_EVERY_MS = 1200;

const Page: React.FC<{ page: TikTokPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const currentMs = (frame / fps) * 1000 + page.startMs;
  const pop = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 6 });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: "12%" }}>
      <div
        style={{
          fontFamily,
          fontSize: Math.round(width * (height > width ? 0.09 : 0.055)),
          fontWeight: 800,
          textTransform: "uppercase",
          textAlign: "center",
          color: "white",
          WebkitTextStroke: "6px black",
          paintOrder: "stroke",
          transform: `scale(${interpolate(pop, [0, 1], [0.85, 1])})`,
          maxWidth: "85%",
        }}
      >
        {page.tokens.map((t) => {
          const active = t.fromMs <= currentMs && t.toMs > currentMs;
          return (
            <span key={t.fromMs} style={{ color: active ? "#ffd32a" : "white", whiteSpace: "pre" }}>
              {t.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Captions: React.FC<{ src: string }> = ({ src }) => {
  const { fps } = useVideoConfig();
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const [handle] = useState(() => delayRender("Loading captions"));

  useEffect(() => {
    fetch(staticFile(src))
      .then((r) => r.json())
      .then((json: Caption[]) => {
        setCaptions(json);
        continueRender(handle);
      })
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
  }, [src, handle]);

  const pages = useMemo(
    () =>
      captions
        ? createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: SWITCH_CAPTIONS_EVERY_MS }).pages
        : [],
    [captions],
  );

  return (
    <AbsoluteFill>
      {pages.map((page, i) => {
        const next = pages[i + 1] ?? null;
        const from = Math.floor((page.startMs / 1000) * fps);
        const endMs = Math.min(next ? next.startMs : Infinity, page.startMs + SWITCH_CAPTIONS_EVERY_MS);
        const duration = Math.max(1, Math.ceil(((endMs - page.startMs) / 1000) * fps));
        return (
          <Sequence key={i} from={from} durationInFrames={duration} layout="none">
            <Page page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
