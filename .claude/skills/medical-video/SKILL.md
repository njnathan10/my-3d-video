---
name: medical-video
description: Produce a complete, on-brand ~2-minute 3D medical-education video (9:16 TikTok/Reels/Shorts, optional 16:9) from a topic, using this repo's three.js + Remotion design system. Use whenever the user gives a medical, nursing, anatomy, physiology, microbiology, pathophysiology, pharmacology or NCLEX topic to turn into a video, asks for a new episode, wants to edit an existing episode's script/scenes/visuals, or wants to extend the video design system (templates, 3D components, brand). Covers research and claims, script, scene design, AI voiceover, word-synced captions, validation, medical-accuracy review, QA stills and final render.
---

# Medical video production

This repo is a **design system + production pipeline**, not a blank canvas. Every
episode is a single data file (`src/episodes/<slug>/episode.json`) rendered by
shared templates and components. You make a new video by **writing data**, not by
designing or animating from scratch. That is what keeps every episode on-brand,
fast and cheap.

## Non-negotiable rules

1. **Never hard-code style.** Colors, fonts, sizes, safe zones, timings, lighting and
   materials come from `src/brand/` (`tokens.ts`, `materials.tsx`, `Lighting.tsx`,
   `identity.ts`, `voice.json`). Use brand color *names* in JSON (`"teal"`, `"arterial"`), never hex.
2. **Reuse before you build.** Use an existing template (see `references/episode-format.md`).
   If none fits, write a `custom` scene composed only of library components
   (`references/components.md`). Never create one-off materials, lights, caption styles or cameras.
3. **Everything animates from the frame.** Use `useCurrentFrame()`, `useReveal()`, cues
   (`"@word"`) and `random(seed)`. Never use three's `useFrame`, clocks, `Date.now()` or `Math.random()`.
4. **Medical accuracy is a gate, not a step.** Every factual statement goes in `claims[]`
   with a specific source. Final renders are blocked until `review.status` is `"approved"`
   by the user (a human). Never set `approved` yourself. Drafts carry a red DRAFT watermark.
5. **One narrator forever.** `src/brand/voice.json` defines the voice. Do not change
   `voiceId`, model or settings per episode.
6. **Look before you ship.** Always run QA and inspect the contact sheet image yourself
   before rendering or reporting done.

## Workflow: "make a video about <topic>"

1. **Intake.** Confirm topic, category (`Anatomy | Physiology | Microbiology | Pathophysiology | Pharmacology | Nursing | NCLEX`)
   and level. Check `src/episodes/` for overlap. Pick a kebab-case slug.
2. **Research → claims first.** Gather facts from sources in the hierarchy in
   `references/medical-accuracy.md`. Write `claims[]` (one per fact, with source and
   section) *before* the script. Where sources disagree, say less (no number) rather than pick one.
3. **Script.** Follow `references/script-writing.md`: ~270–300 words for 120 s,
   hook → mechanism → clinical relevance → NCLEX check → recap, one idea per scene,
   `**amber**` for key concepts and `==teal==` for anatomy terms (≤15% of words).
4. **Scene design.** Map each beat to a template and fill params: subjects, camera
   shot, flows, arrows, callouts, cues timed to narration words (`"@oxygen"`). Use the
   framing rule in `references/episode-format.md` (camera distance ≈ 3.8 × subject width for 9:16).
5. **Scaffold & write.** `npm run new-episode -- <slug> "<Title>" <Category>`, then
   replace the skeleton in `episode.json`. If it needs anatomy GLBs, follow `references/models.md`.
6. **Draft loop (free, no TTS).**
   ```bash
   npm run validate -- <slug>
   npm run voiceover -- <slug> --estimate
   npm run qa -- <slug>
   ```
   Read `out/<slug>/qa/contact-sheet.png` and check it against the visual checklist
   below. Fix the JSON and repeat until clean. Use `npm run qa -- <slug> --wide` if 16:9 is wanted.
7. **Medical review.** Present the claims table + script to the user with the
   checklist in `references/medical-accuracy.md`. Apply corrections. Only the user
   approves; then set `review` to `{ "status": "approved", "reviewer": "<name>", "date": "YYYY-MM-DD" }`.
8. **Final.** Requires `ELEVENLABS_API_KEY` (in `.env`) and `voiceId` in `voice.json`.
   ```bash
   npm run produce -- <slug>          # validate → TTS voiceover → validate --final → QA → render
   npm run produce -- <slug> --wide   # also 16:9
   ```
   Re-check the contact sheet (real narration shifts timings). Deliver
   `out/<slug>/<slug>-vertical.mp4` + `<slug>.srt`, and a post caption with hashtags.

Without a TTS key: `npm run produce -- <slug> --draft` gives a full silent draft
(estimated timings, DRAFT watermark) for review.

## Visual QA checklist (contact sheet)

- Subject fully in frame, centered in the upper-middle (9:16), not under the heading or captions
- Callouts point at the correct structure, are readable, and don't overlap each other or the subject's key part
- Captions sit in the caption band, never over the subject, and never in the bottom 22% (platform UI)
- Medical color conventions are correct (oxygenated = arterial red, deoxygenated = venous blue, Gram+ purple, Gram− pink)
- Anatomical relationships are plausible (left/right, proximal/distal, scale between structures)
- Every scene is visibly different from the previous one (camera, subject or layout), with no dead frames
- Text is legible at phone size and nothing is clipped at the edges

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Remotion Studio: scrub every episode live |
| `npm run new-episode -- <slug> "<Title>" <Category>` | Scaffold + register an episode |
| `npm run validate -- <slug> [--final]` | Structure, cues, pacing, readability, claims, review gate |
| `npm run voiceover -- <slug> [--estimate] [--force]` | TTS per scene (cached by hash) + word timings → timeline |
| `npm run qa -- <slug> [--wide]` | Key frames per scene → `out/<slug>/qa/contact-sheet.png` |
| `npm run render -- <slug> [--wide] [--draft] [--preview]` | MP4 + SRT into `out/<slug>/` (`--preview` = half resolution, fast) |
| `npm run produce -- <slug> [--draft] [--wide]` | All of the above, in order |
| `npm run transcribe -- <audio>` | whisper.cpp captions for a human-recorded narration |

GPU-less machines/servers: prefix with `REMOTION_GL=swangle`. To use an installed
Chrome instead of downloading one: `REMOTION_BROWSER=/path/to/chrome`.

## Project map

```
src/brand/        tokens.ts (colors, type, layout, safe zones, motion, pacing) · materials.tsx · Lighting.tsx · identity.ts · voice.json · fonts.ts
src/three/        MedicalStage · camera (shots, poses, projection) · FlowParticles · Vessel · Arrow3D · AnatomyModel · Subject (SubjectView, Field, ClipGroup) · micro/ (RedBloodCell, Bacillus, Coccus, Virion, Cell, Alveoli)
src/overlay/      Captions · Callouts · Text (TitleCard, SceneHeading, Bullets, Card, Kicker, Magnification) · BrandFrame · ui
src/templates/    Stage3D (hook, anatomy, flow, micro, crossSection) · Cards (concept, compare, quiz, recap) · custom.tsx · registry.tsx
src/timeline/     types.ts (episode schema) · SceneContext (cues, reveals) · Episode.tsx (assembly)
src/episodes/     <slug>/episode.json (+ auto-generated index.ts)
public/episodes/  <slug>/timeline.json + audio/ (generated)
public/models/    GLB anatomy models
scripts/          voiceover · validate · qa · render · produce · new-episode · sync-episodes · transcribe
```

`src/episodes/oxygen-transport/episode.json` is the reference episode: copy its patterns.

## Extending the system

When an episode needs something new, add it **to the system** so every future episode benefits:
- New reusable 3D object → `src/three/micro/` or `src/three/`, add a `kind` to `Subject` in `types.ts`, render it in `Subject.tsx`, document it in `references/components.md`.
- New material → a preset in `materials.tsx`. New color → `tokens.ts` (medical conventions only).
- New scene pattern used twice → promote from `custom.tsx` to a template, add it to `types.ts`, `registry.tsx`, `scripts/validate.mjs` (`TEMPLATES`) and `references/episode-format.md`.
- Run `npm run typecheck`, then QA the reference episode to confirm nothing regressed.

## References (load as needed)

- `references/brand.md`: visual identity: palette rules, typography, captions, camera language, lighting, motion, layout
- `references/episode-format.md`: full episode JSON schema, every template's params, shots, subjects, cues, framing math
- `references/script-writing.md`: 120 s structure, word budgets, markup, pauses, pronunciation, hooks, quiz pattern
- `references/medical-accuracy.md`: source hierarchy, claims rules, review checklist, common errors to avoid
- `references/models.md`: sourcing, licensing and preparing GLB anatomy models
- `references/components.md`: component API for custom scenes
