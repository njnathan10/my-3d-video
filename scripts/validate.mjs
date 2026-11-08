// Pre-flight checks for an episode: structure, pacing, cues, readability,
// assets, and the medical-accuracy gate.
//
//   npm run validate -- <slug>           draft checks
//   npm run validate -- <slug> --final   also requires real TTS + approved medical review
import fs from "node:fs";
import path from "node:path";
import { args, loadEpisode, loadTimeline, ROOT } from "./lib/episode.mjs";
import { tokenize, wordCount } from "./lib/narration.mjs";

const { slug, flags } = args();
const final = flags.has("--final");
const ep = loadEpisode(slug);
const tl = loadTimeline(slug);
const errors = [];
const warns = [];
const E = (m) => errors.push(m);
const W = (m) => warns.push(m);

const TEMPLATES = {
  hook: ["title"],
  anatomy: ["subjects", "shot"],
  flow: ["flows", "shot"],
  micro: ["organism"],
  crossSection: ["subjects", "from", "to", "shot"],
  concept: ["term"],
  compare: ["left", "right"],
  quiz: ["question", "options", "answer"],
  recap: ["points"],
  custom: ["component"],
};
const CATEGORIES = ["Anatomy", "Physiology", "Microbiology", "Pathophysiology", "Pharmacology", "Nursing", "NCLEX"];
const LIMITS = { callout: 26, heading: 34, bullet: 52, option: 44, title: 48, term: 30 };

// ── Episode-level ───────────────────────────────────────────────────────────
if (ep.slug !== slug) E(`episode.slug "${ep.slug}" must equal folder name "${slug}"`);
if (!ep.title) E("missing title");
if (!CATEGORIES.includes(ep.category)) E(`category must be one of ${CATEGORIES.join(", ")}`);
if (!ep.learningObjectives?.length) E("add 1–3 learningObjectives");
if (!Array.isArray(ep.scenes) || ep.scenes.length < 5) E("an episode needs at least 5 scenes");
if (ep.scenes?.[0]?.template !== "hook") W("first scene should be a hook (retention in the first 2 seconds)");
if (!ep.scenes?.some((s) => s.template === "recap")) W("no recap scene");

// ── Medical accuracy gate ───────────────────────────────────────────────────
if (!ep.claims?.length) E("claims[] is empty: list every factual statement in the narration with a source");
ep.claims?.forEach((c, i) => {
  if (!c.text || !c.source) E(`claims[${i}] needs both text and source`);
  else if (c.source.length < 12) W(`claims[${i}] source looks too vague: "${c.source}"`);
});
const claimText = (ep.claims ?? []).map((c) => c.text.toLowerCase()).join(" ");
const allNarration = (ep.scenes ?? []).map((s) => s.narration.replace(/\[pause\s+[\d.]+\]/g, "")).join(" ");
for (const num of new Set(allNarration.match(/\b\d[\d,.]*\b/g) ?? [])) {
  if (!claimText.includes(num.toLowerCase())) W(`number "${num}" in narration is not covered by any claim`);
}
if (final) {
  if (ep.review?.status !== "approved") E('review.status must be "approved" for a final render (medical review gate)');
  if (!ep.review?.reviewer || !ep.review?.date) E("review.reviewer and review.date are required for a final render");
}

// ── Scenes ──────────────────────────────────────────────────────────────────
const ids = new Set();
const walk = (v, fn, p = "") => {
  if (Array.isArray(v)) v.forEach((x, i) => walk(x, fn, `${p}[${i}]`));
  else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => walk(x, fn, p ? `${p}.${k}` : k));
  else fn(v, p);
};
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9₂]/g, "");
let emphasisWords = 0;
let totalWords = 0;

for (const s of ep.scenes ?? []) {
  const where = `scene "${s.id}"`;
  if (!/^[a-z0-9-]+$/.test(s.id ?? "")) E(`${where}: id must be kebab-case`);
  if (ids.has(s.id)) E(`${where}: duplicate id`);
  ids.add(s.id);
  if (!TEMPLATES[s.template]) { E(`${where}: unknown template "${s.template}"`); continue; }
  for (const k of TEMPLATES[s.template]) if (s.params?.[k] === undefined) E(`${where}: ${s.template} needs params.${k}`);
  if (!s.narration?.trim()) E(`${where}: empty narration`);
  if ((s.narration.match(/\*\*/g) ?? []).length % 2) E(`${where}: unbalanced **amber** markup`);
  if ((s.narration.match(/==/g) ?? []).length % 2) E(`${where}: unbalanced ==teal== markup`);

  const toks = tokenize(s.narration).filter((t) => t.type === "word");
  totalWords += toks.length;
  emphasisWords += toks.filter((t) => t.emphasis).length;
  const spokenWords = toks.map((t) => norm(t.text));

  walk(s.params, (v, p) => {
    if (typeof v !== "string") return;
    if (v.startsWith("@")) {
      const target = norm(v.slice(1).replace(/#\d+$|[+-]\d+(\.\d+)?$/g, ""));
      if (!spokenWords.some((w) => w.startsWith(target))) E(`${where}: cue "${v}" (${p}) is not spoken in this scene's narration`);
    }
    if (/^#[0-9a-f]{3,8}$/i.test(v)) W(`${where}: raw color ${v} at ${p}; use brand/medical color names`);
    if (p.endsWith(".src") && !fs.existsSync(path.join(ROOT, "public", v))) E(`${where}: model not found: public/${v}`);
  });

  const P = s.params ?? {};
  P.callouts?.forEach((c) => c.text.length > LIMITS.callout && W(`${where}: callout "${c.text}" > ${LIMITS.callout} chars (hard to read on mobile)`));
  if (P.heading?.length > LIMITS.heading) W(`${where}: heading > ${LIMITS.heading} chars`);
  if (s.template === "hook" && P.title?.length > LIMITS.title) W(`${where}: hook title > ${LIMITS.title} chars`);
  if (s.template === "concept" && P.term?.length > LIMITS.term) W(`${where}: term > ${LIMITS.term} chars`);
  P.bullets?.forEach((b) => b.text.length > LIMITS.bullet && W(`${where}: bullet "${b.text.slice(0, 20)}…" > ${LIMITS.bullet} chars`));
  P.points?.forEach?.((b) => typeof b === "string" && b.length > LIMITS.bullet && W(`${where}: point > ${LIMITS.bullet} chars`));
  if (s.template === "quiz") {
    if (P.options?.length < 3 || P.options?.length > 4) E(`${where}: quiz needs 3–4 options`);
    if (!(P.answer >= 0 && P.answer < P.options?.length)) E(`${where}: quiz answer index out of range`);
    P.options?.forEach((o) => o.length > LIMITS.option && W(`${where}: option "${o.slice(0, 20)}…" > ${LIMITS.option} chars`));
    if (!/\[pause/.test(s.narration)) W(`${where}: add a [pause 2.5] before the answer so viewers can think`);
  }
  if (toks.length > 70) W(`${where}: ${toks.length} words in one scene; split it (keep scenes ≤ ~20s)`);
}
if (totalWords && emphasisWords / totalWords > 0.15) W(`emphasis on ${Math.round((emphasisWords / totalWords) * 100)}% of words; keep ≤ 15% so highlights stay meaningful`);

// ── Pacing ──────────────────────────────────────────────────────────────────
const wc = (ep.scenes ?? []).reduce((a, s) => a + wordCount(s.narration), 0);
const estSec = (wc / 155) * 60 + (ep.scenes?.length ?? 0) * 0.7;
const realSec = tl ? tl.totalFrames / tl.fps : null;
const sec = realSec ?? estSec;
if (sec < 105 || sec > 135) (realSec ? E : W)(`duration ${sec.toFixed(0)}s is outside 105–135s (target 120s); ${wc} words`);
if (!tl) W(`no timeline yet: run npm run voiceover -- ${slug} [--estimate]`);
else {
  const tlIds = tl.scenes.map((s) => s.id).join(",");
  const epIds = ep.scenes.map((s) => s.id).join(",");
  if (tlIds !== epIds) E("timeline is stale (scene list changed): re-run voiceover");
  if (final && tl.mode !== "tts") E(`final render needs real narration (timeline mode is "${tl.mode}")`);
}

// ── Report ──────────────────────────────────────────────────────────────────
console.log(`\n${ep.title}  [${slug}]`);
console.log(`  ${ep.scenes?.length ?? 0} scenes · ${wc} words · ~${sec.toFixed(0)}s ${realSec ? "(timeline)" : "(estimate)"} · review: ${ep.review?.status ?? "missing"}`);
warns.forEach((w) => console.log(`  ⚠ ${w}`));
errors.forEach((e) => console.log(`  ✗ ${e}`));
if (errors.length) {
  console.log(`\n${errors.length} error(s). Fix before rendering.`);
  process.exit(1);
}
console.log(`  ✓ ${final ? "ready for final render" : "valid draft"}${warns.length ? ` (${warns.length} warning(s))` : ""}`);
