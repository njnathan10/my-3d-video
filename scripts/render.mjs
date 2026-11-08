// Render an episode to MP4 and write its SRT subtitles.
//
//   npm run render -- <slug>            vertical 1080×1920 (requires --final validation)
//   npm run render -- <slug> --wide     16:9 1920×1080
//   npm run render -- <slug> --draft    skip the final gate (DRAFT watermark stays on)
//   npm run render -- <slug> --preview  half resolution, ~4× faster (for review)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { args, loadTimeline, outDir, ROOT } from "./lib/episode.mjs";

const { slug, flags } = args();
const wide = flags.has("--wide");
const draft = flags.has("--draft");
const preview = flags.has("--preview");
const node = process.execPath;

execFileSync(node, [path.join(ROOT, "scripts/validate.mjs"), slug, ...(draft ? [] : ["--final"])], { stdio: "inherit" });

const tl = loadTimeline(slug);
const out = outDir(slug);
fs.mkdirSync(out, { recursive: true });
const file = path.join(out, `${slug}-${wide ? "wide" : "vertical"}${draft ? "-draft" : ""}${preview ? "-preview" : ""}.mp4`);

execFileSync(
  "npx",
  ["remotion", "render", "src/index.ts", wide ? `${slug}-wide` : slug, file, "--codec=h264", "--crf=18", "--audio-bitrate=192k", ...(preview ? ["--scale=0.5"] : [])],
  { stdio: "inherit", cwd: ROOT },
);

// Subtitles for platforms that accept uploads (YouTube, accessibility).
const ts = (ms) => {
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000), x = Math.floor(ms % 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(x).padStart(3, "0")}`;
};
const lines = [];
for (const sc of tl.scenes) {
  const off = (sc.from / tl.fps) * 1000;
  let chunk = [];
  const flush = () => {
    if (!chunk.length) return;
    lines.push({ start: off + chunk[0].startMs, end: off + chunk[chunk.length - 1].endMs, text: chunk.map((w) => w.text).join(" ") });
    chunk = [];
  };
  for (const w of sc.words) {
    chunk.push(w);
    if (chunk.length >= 7 || /[.?!]$/.test(w.text)) flush();
  }
  flush();
}
const srt = lines.map((l, i) => `${i + 1}\n${ts(l.start)} --> ${ts(l.end)}\n${l.text}\n`).join("\n");
fs.writeFileSync(path.join(out, `${slug}.srt`), srt);
console.log(`\n✓ ${path.relative(ROOT, file)}\n✓ ${path.relative(ROOT, path.join(out, `${slug}.srt`))}`);
