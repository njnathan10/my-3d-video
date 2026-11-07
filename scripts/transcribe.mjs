// Auto-generate captions from a voiceover with whisper.cpp (runs locally, free).
// Usage: npm run transcribe -- public/voiceover.wav [model]
//   model: tiny.en | base.en | small.en | medium.en (default) | large-v3 ...
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import {
  installWhisperCpp,
  downloadWhisperModel,
  transcribe,
  toCaptions,
} from "@remotion/install-whisper-cpp";

const input = process.argv[2] ?? "public/audio.wav";
const model = process.argv[3] ?? "medium.en";
const whisperDir = path.join(process.cwd(), "whisper.cpp");
const out = path.join("public", path.basename(input).replace(/\.[^.]+$/, "") + ".captions.json");

await installWhisperCpp({ to: whisperDir, version: "1.7.6" });
await downloadWhisperModel({ model, folder: whisperDir });

// whisper.cpp needs 16kHz mono WAV
const tmp = path.join(whisperDir, "input-16k.wav");
execSync(`ffmpeg -y -loglevel error -i "${input}" -ar 16000 -ac 1 "${tmp}"`);

const whisperOutput = await transcribe({
  inputPath: tmp,
  whisperPath: whisperDir,
  whisperCppVersion: "1.7.6",
  model,
  tokenLevelTimestamps: true,
});
const { captions } = toCaptions({ whisperCppOutput: whisperOutput });
fs.writeFileSync(out, JSON.stringify(captions, null, 2));
console.log(`Wrote ${captions.length} captions to ${out}`);
