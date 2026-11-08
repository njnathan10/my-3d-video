# my-3d-video: 3D medical education studio

Faceless, 3D-animated, ~2-minute medical education videos for TikTok, Instagram Reels and
YouTube Shorts (1080×1920), with optional 16:9 for YouTube. Built on **three.js**
(React Three Fiber) and **Remotion**.

Each episode is **one JSON file**. A shared design system (brand tokens, lighting, materials,
camera language, scene templates, captions) renders it, so every video looks like the same
brand and new episodes need no manual design or animation.

## Quick start

```bash
npm install
npm run dev                                         # Studio: preview the reference episode
npm run produce -- oxygen-transport --draft         # full silent draft (estimated timing)
```

Making a new episode with Claude: give it a topic and it follows the **medical-video** skill
(`.claude/skills/medical-video/SKILL.md`): research → claims → script → scenes → draft →
your medical review → AI voiceover → QA → render.

## One-time setup

1. `cp .env.example .env` and add your `ELEVENLABS_API_KEY`.
2. Choose your narrator once: set `voiceId` (and `voiceName`) in `src/brand/voice.json`.
3. Set your channel identity in `src/brand/identity.ts` (series name, @handle, CTA).

## Pipeline

| Step | Command |
|---|---|
| Scaffold an episode | `npm run new-episode -- <slug> "<Title>" <Category>` |
| Check structure, pacing, cues, claims | `npm run validate -- <slug>` |
| Narration + word timings (TTS, cached per scene) | `npm run voiceover -- <slug>` (`--estimate` = free draft timings) |
| Visual QA contact sheet | `npm run qa -- <slug>` → `out/<slug>/qa/contact-sheet.png` |
| Render MP4 + SRT | `npm run render -- <slug>` (`--wide`, `--draft`, `--preview`) |
| Everything | `npm run produce -- <slug>` |

Final renders are blocked until the episode's medical review is approved
(`"review": { "status": "approved", "reviewer": "...", "date": "..." }`). Drafts carry a
DRAFT watermark.

## Design system

- `src/brand/`: colors (navy `#102638`, teal `#0B8C83`, amber `#F0BA55`, off-white `#F5F7FA`), type scale, safe zones, motion, lighting rig, material presets, narrator voice
- `src/three/`: stage, deterministic camera, blood-flow particles, vessels, arrows, GLB anatomy loader, procedural RBC / bacteria / virus / cell / alveoli
- `src/overlay/`: word-synced captions, 3D-pinned callouts, titles, cards
- `src/templates/`: hook, anatomy, flow, micro, crossSection, concept, compare, quiz, recap (+ custom)

## Rendering notes

- No GPU (servers, cloud): `REMOTION_GL=swangle npm run render -- <slug>` (much slower).
- Anatomy GLB models: see `.claude/skills/medical-video/references/models.md` (sources, licenses, prep).
- Remotion license: free for individuals and companies ≤ 3 people; larger companies need a company license.
