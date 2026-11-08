// Visual QA: renders key frames of every scene (one browser, one bundle) and
// tiles them into a contact sheet for review before the full render.
//
//   npm run qa -- <slug> [--wide]
// Output: out/<slug>/qa/*.png and out/<slug>/qa/contact-sheet.png
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { args, loadTimeline, outDir, remotionEnv, ROOT } from "./lib/episode.mjs";

const { slug, flags } = args();
const wide = flags.has("--wide");
const tl = loadTimeline(slug);
if (!tl) throw new Error(`No timeline. Run: npm run voiceover -- ${slug} --estimate`);
const qaDir = path.join(outDir(slug), wide ? "qa-wide" : "qa");
fs.rmSync(qaDir, { recursive: true, force: true });
fs.mkdirSync(qaDir, { recursive: true });

const env = remotionEnv();
console.log("Bundling…");
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable: env.browserExecutable, chromiumOptions: { gl: env.gl }, logLevel: "error" });
const id = wide ? `${slug}-wide` : slug;
const composition = await selectComposition({ serveUrl, id, inputProps: {}, puppeteerInstance: browser, browserExecutable: env.browserExecutable, chromiumOptions: { gl: env.gl }, logLevel: "error" });

const frames = [];
tl.scenes.forEach((s, i) => {
  for (const f of [0.35, 0.8]) frames.push({ frame: s.from + Math.floor(s.durationInFrames * f), name: `${String(i + 1).padStart(2, "0")}-${s.id}-${f === 0.35 ? "a" : "b"}` });
});

for (const { frame, name } of frames) {
  const output = path.join(qaDir, `${name}.png`);
  await renderStill({ composition, serveUrl, frame, output, puppeteerInstance: browser, browserExecutable: env.browserExecutable, chromiumOptions: { gl: env.gl }, scale: 0.5, inputProps: {}, logLevel: "error" });
  console.log(`  ${name}  (frame ${frame})`);
}
await browser.close({ silent: true });

const cols = wide ? 4 : 6;
const rows = Math.ceil(frames.length / cols);
const list = frames.map((f) => path.join(qaDir, `${f.name}.png`));
const inputs = list.flatMap((f) => ["-i", f]);
const sheet = path.join(qaDir, "contact-sheet.png");
const w = wide ? 480 : 270;
const h = wide ? 270 : 480;
const scaled = list.map((_, i) => `[${i}:v]scale=${w}:${h}[v${i}]`).join(";");
const pads = new Array(cols * rows - list.length).fill(0).map((_, i) => `color=c=black:s=${w}x${h}:d=1[p${i}]`).join(";");
const all = [...list.map((_, i) => `[v${i}]`), ...new Array(cols * rows - list.length).fill(0).map((_, i) => `[p${i}]`)].join("");
const filter = [scaled, pads, `${all}xstack=inputs=${cols * rows}:layout=${grid(cols, rows, w, h)}[out]`].filter(Boolean).join(";");
execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...inputs, "-filter_complex", filter, "-map", "[out]", "-frames:v", "1", sheet]);
console.log(`\nContact sheet: ${path.relative(ROOT, sheet)}`);

function grid(c, r, cw, ch) {
  const cells = [];
  for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) cells.push(`${x * cw}_${y * ch}`);
  return cells.join("|");
}
