// Scaffold a new episode with the standard 2-minute structure.
//   npm run new-episode -- <slug> "<Title>" <Category>
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const [slug, title = "Untitled", category = "Physiology"] = process.argv.slice(2);
if (!slug || !/^[a-z0-9-]+$/.test(slug)) throw new Error('Usage: npm run new-episode -- <kebab-slug> "<Title>" <Category>');
const dir = path.join(process.cwd(), "src", "episodes", slug);
if (fs.existsSync(dir)) throw new Error(`Episode ${slug} already exists`);
fs.mkdirSync(dir, { recursive: true });
const skeleton = {
  slug,
  title,
  category,
  audience: "Pre-nursing, A&P and nursing students",
  learningObjectives: ["TODO"],
  claims: [{ text: "TODO: every factual statement in the narration", source: "TODO: textbook/guideline, chapter/section" }],
  review: { status: "pending" },
  scenes: [
    { id: "hook", template: "hook", narration: "TODO", params: { kicker: category, title, subject: { kind: "cell", spin: 0.3 } } },
    { id: "setup", template: "anatomy", narration: "TODO", params: { subjects: [], shot: { type: "orbit", radius: 10, from: -20, to: 20 }, callouts: [] } },
    { id: "mechanism", template: "flow", narration: "TODO", params: { flows: [], shot: { type: "push", from: 13, to: 11 } } },
    { id: "key-concept", template: "concept", narration: "TODO", params: { term: "TODO", bullets: [] } },
    { id: "clinical", template: "micro", narration: "TODO", params: { organism: { kind: "cell" } } },
    { id: "quiz", template: "quiz", narration: "TODO [pause 2.5] The answer is", holdSeconds: 1, params: { question: "TODO", options: ["A", "B", "C", "D"], answer: 0, revealAt: "@answer" } },
    { id: "recap", template: "recap", narration: "TODO", params: { points: ["TODO"] } },
  ],
};
fs.writeFileSync(path.join(dir, "episode.json"), JSON.stringify(skeleton, null, 2) + "\n");
execFileSync(process.execPath, [path.join(process.cwd(), "scripts/sync-episodes.mjs")], { stdio: "inherit" });
console.log(`Created src/episodes/${slug}/episode.json`);
