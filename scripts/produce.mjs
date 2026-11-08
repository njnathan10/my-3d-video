// End-to-end production: validate → voiceover → QA contact sheet → render.
//   npm run produce -- <slug>               final (TTS + medical review must be approved)
//   npm run produce -- <slug> --draft       draft: estimated timings, no TTS cost, DRAFT watermark
//   add --wide to also render 16:9, --no-qa to skip the contact sheet
import { execFileSync } from "node:child_process";
import path from "node:path";
const a = process.argv.slice(2);
const slug = a.find((x) => !x.startsWith("--"));
const has = (f) => a.includes(f);
const draft = has("--draft");
const run = (script, ...rest) => execFileSync(process.execPath, [path.join(process.cwd(), "scripts", script), slug, ...rest], { stdio: "inherit" });

run("validate.mjs");
run("voiceover.mjs", ...(draft ? ["--estimate"] : []));
run("validate.mjs", ...(draft ? [] : ["--final"]));
if (!has("--no-qa")) run("qa.mjs");
run("render.mjs", ...(draft ? ["--draft"] : []));
if (has("--wide")) run("render.mjs", "--wide", ...(draft ? ["--draft"] : []));
