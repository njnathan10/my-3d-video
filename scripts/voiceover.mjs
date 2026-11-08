// Generate narration audio + word timings for every scene, then write the
// episode timeline (scene start frames and durations driven by the narration).
//
//   npm run voiceover -- <slug>              ElevenLabs TTS (needs ELEVENLABS_API_KEY + voiceId in src/brand/voice.json)
//   npm run voiceover -- <slug> --estimate   no audio; estimated timings (drafts, layout work, free)
//   npm run voiceover -- <slug> --force      regenerate every scene even if unchanged
//
// Scenes are cached by a hash of (narration + voice settings): editing one
// scene only re-synthesizes that scene, which keeps TTS costs low.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { args, loadEnv, loadEpisode, loadVoice, publicDir } from "./lib/episode.mjs";
import { estimateWords, spoken, tokenize } from "./lib/narration.mjs";

loadEnv();
const { slug, flags } = args();
const episode = loadEpisode(slug);
const voice = loadVoice();
const FPS = 30;
const TAIL_PAD_MS = 350;
const estimate = flags.has("--estimate");
const force = flags.has("--force");

const dir = publicDir(slug);
const audioDir = path.join(dir, "audio");
fs.mkdirSync(audioDir, { recursive: true });

const hashOf = (scene) =>
  crypto
    .createHash("sha1")
    .update(JSON.stringify({ n: scene.narration, v: voice.voiceId, m: voice.modelId, s: voice.voiceSettings, p: voice.pronunciations, seed: voice.seed }))
    .digest("hex")
    .slice(0, 16);

/** ElevenLabs TTS with character-level timestamps → word timings. */
const synthesize = async (scene, prevText, nextText) => {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set (put it in .env or the environment), or use --estimate.");
  if (!voice.voiceId) throw new Error('Set "voiceId" in src/brand/voice.json (pick ONE narrator voice and keep it for every episode).');

  const tokens = tokenize(scene.narration);
  const words = tokens.filter((t) => t.type === "word");
  const ttsText = tokens
    .map((t) => (t.type === "pause" ? `<break time="${Math.min(3, t.seconds).toFixed(1)}s" />` : spoken(t.text, voice.pronunciations)))
    .join(" ");

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice.voiceId}/with-timestamps?output_format=${voice.outputFormat}`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: ttsText,
        model_id: voice.modelId,
        voice_settings: voice.voiceSettings,
        seed: voice.seed,
        previous_text: prevText || undefined, // keeps intonation continuous across scenes
        next_text: nextText || undefined,
      }),
    },
  );
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const audio = Buffer.from(json.audio_base64, "base64");
  const al = json.alignment;
  const chars = al.characters.join("");

  // Map each caption word to its spoken span in the aligned text.
  let cursor = 0;
  const timed = words.map((w) => {
    const sp = spoken(w.text, voice.pronunciations);
    const idx = chars.indexOf(sp, cursor);
    if (idx === -1) return { w, start: null, end: null };
    cursor = idx + sp.length;
    return { w, start: al.character_start_times_seconds[idx], end: al.character_end_times_seconds[idx + sp.length - 1] };
  });
  // Fill any unmatched words by interpolating between neighbors.
  timed.forEach((t, i) => {
    if (t.start !== null) return;
    const prev = timed.slice(0, i).reverse().find((x) => x.start !== null);
    const next = timed.slice(i + 1).find((x) => x.start !== null);
    t.start = prev ? prev.end : 0;
    t.end = next ? next.start : t.start + 0.3;
  });
  const out = timed.map(({ w, start, end }) => ({
    text: w.text,
    startMs: Math.round(start * 1000),
    endMs: Math.round(end * 1000),
    ...(w.emphasis ? { emphasis: w.emphasis } : {}),
  }));
  const durationMs = Math.round(al.character_end_times_seconds[al.character_end_times_seconds.length - 1] * 1000);
  return { audio, words: out, durationMs };
};

const scenes = episode.scenes;
const timelineScenes = [];
let from = 0;

for (let i = 0; i < scenes.length; i++) {
  const scene = scenes[i];
  let words;
  let durationMs;
  let audioPath = null;

  if (estimate) {
    ({ words, durationMs } = estimateWords(scene.narration));
  } else {
    const hash = hashOf(scene);
    const metaFile = path.join(audioDir, `${scene.id}.json`);
    const mp3 = path.join(audioDir, `${scene.id}.mp3`);
    const cached = fs.existsSync(metaFile) && fs.existsSync(mp3) ? JSON.parse(fs.readFileSync(metaFile, "utf8")) : null;
    if (cached && cached.hash === hash && !force) {
      ({ words, durationMs } = cached);
      console.log(`  ✓ ${scene.id} (cached)`);
    } else {
      process.stdout.write(`  ♪ ${scene.id} … `);
      const prevText = scenes[i - 1] ? tokenize(scenes[i - 1].narration).filter((t) => t.type === "word").map((t) => t.text).join(" ") : "";
      const nextText = scenes[i + 1] ? tokenize(scenes[i + 1].narration).filter((t) => t.type === "word").map((t) => t.text).join(" ") : "";
      const r = await synthesize(scene, prevText, nextText);
      fs.writeFileSync(mp3, r.audio);
      ({ words, durationMs } = r);
      fs.writeFileSync(metaFile, JSON.stringify({ hash, words, durationMs }, null, 2));
      console.log(`${(durationMs / 1000).toFixed(1)}s`);
    }
    audioPath = `episodes/${slug}/audio/${scene.id}.mp3`;
  }

  const seconds = Math.max(scene.minSeconds ?? 0, (durationMs + TAIL_PAD_MS) / 1000 + (scene.holdSeconds ?? 0));
  const durationInFrames = Math.ceil(seconds * FPS);
  timelineScenes.push({ id: scene.id, from, durationInFrames, audio: audioPath, words });
  from += durationInFrames;
}

const timeline = { slug, fps: FPS, mode: estimate ? "estimate" : "tts", totalFrames: from, scenes: timelineScenes };
fs.writeFileSync(path.join(dir, "timeline.json"), JSON.stringify(timeline, null, 2));

console.log(`\nTimeline: ${(from / FPS).toFixed(1)}s, ${scenes.length} scenes (${timeline.mode}) → public/episodes/${slug}/timeline.json`);
for (const s of timelineScenes) console.log(`  ${String((s.from / FPS).toFixed(1)).padStart(6)}s  ${(s.durationInFrames / FPS).toFixed(1).padStart(5)}s  ${s.id}`);
