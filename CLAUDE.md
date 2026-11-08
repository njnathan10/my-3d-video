# my-3d-video

3D medical-education video studio (three.js + Remotion). Faceless 2-minute episodes
for TikTok / Reels / Shorts (1080×1920), optional 16:9.

- To make or edit a video, follow the **medical-video** skill: `.claude/skills/medical-video/SKILL.md`.
- Episodes are data (`src/episodes/<slug>/episode.json`); style lives only in `src/brand/`.
- Never mark an episode's medical review as approved; only the user does that.
- Before calling work done: `npm run typecheck`, `npm run validate -- <slug>`, `npm run qa -- <slug>`, and look at the contact sheet.
- No GPU (cloud/CI)? Prefix render/QA commands with `REMOTION_GL=swangle`.
