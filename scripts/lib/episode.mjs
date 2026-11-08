import fs from "node:fs";
import path from "node:path";

export const ROOT = process.cwd();
export const episodeDir = (slug) => path.join(ROOT, "src", "episodes", slug);
export const publicDir = (slug) => path.join(ROOT, "public", "episodes", slug);
export const outDir = (slug) => path.join(ROOT, "out", slug);

export const loadEpisode = (slug) => {
  if (!slug) throw new Error("Usage: <command> <episode-slug>");
  const file = path.join(episodeDir(slug), "episode.json");
  if (!fs.existsSync(file)) throw new Error(`No episode at ${file}. Create one with: npm run new-episode -- ${slug}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
};

export const loadTimeline = (slug) => {
  const file = path.join(publicDir(slug), "timeline.json");
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
};

export const loadVoice = () => JSON.parse(fs.readFileSync(path.join(ROOT, "src", "brand", "voice.json"), "utf8"));

/** Minimal .env loader (KEY=VALUE lines). */
export const loadEnv = () => {
  const f = path.join(ROOT, ".env");
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
};

export const args = () => {
  const a = process.argv.slice(2);
  return { slug: a.find((x) => !x.startsWith("--")), flags: new Set(a.filter((x) => x.startsWith("--"))) };
};

export const remotionEnv = () => ({
  browserExecutable: process.env.REMOTION_BROWSER || null,
  gl: process.env.REMOTION_GL || "angle",
});
