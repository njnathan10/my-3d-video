# Brand: visual identity

A premium 3D medical-documentary look with the clarity of an infographic. Every
value below lives in code (`src/brand/`). This file explains *how to use* them.

## Palette (`src/brand/tokens.ts`)

| Token | Hex | Use for | Never use for |
|---|---|---|---|
| `navy` | #102638 | Background (always) | Text |
| `navyDeep` / `navyLight` | #0A1A28 / #1B3A52 | Vignette, cards, label plates | Large flat areas competing with navy |
| `teal` / `tealBright` | #0B8C83 / #19B5A9 | Anatomy highlights, callouts, rim light, bullets, "correct" states; `tealBright` for text/glow on navy | Emphasis of concepts (that's amber) |
| `amber` | #F0BA55 | Key concepts, the ONE thing to remember, arrows of action (diffusion, release), CTAs | Decoration; more than ~15% of caption words |
| `offWhite` | #F5F7FA | All body text, labels | — |
| `muted` | #9FB3C4 | Secondary text (brand bug, rationale, magnification) | Primary information |

**Medical conventions** (only when the meaning requires it): `arterial` red (oxygenated),
`venous` blue (deoxygenated, a diagram convention, and say so when relevant), `tissue`,
`muscle`, `bone`, `nerve` (yellow), `lymph` (green), `gramPositive` (purple), `gramNegative` (pink).

Rule of thumb per frame: navy + one subject color family + teal accents + at most one amber focus.

## Typography

Inter (bundled, `public/brand/fonts/Inter-Variable.woff2`). Weights: 800 for titles and
captions, 700 for labels, 500–600 for body. Sizes come from the type scale (`type` in
`tokens.ts`, a fraction of frame width, so 9:16 and 16:9 both work). Headings are short
(≤ 34 chars), sentence case. Labels ≤ 26 chars. No all-caps except kickers and the brand bug.

## Captions

Word-synchronized from the voiceover timings. Bold off-white with a navy stroke, centered
in a band at 66.5% of the height (9:16): below the subject, above the platform UI.
Upcoming words are 55% opacity; the active word lifts slightly. `**amber**` = key concept,
`==teal==` = anatomy/medical term. Pages break at sentence ends, pauses and ~22 chars.
Captions are global (one component, `overlay/Captions.tsx`), so never style them per episode.

## Layout and safe zones (9:16)

- Top 9%: brand bug only. Bottom 22% and right 13%: platform UI, so no text there.
- Subject center line at 40% height (the camera view offset does this automatically).
- Scene heading at ~16% height; captions at 66.5%.
- 16:9: subject centered, captions at 87%, cards in the left 60%.

## Lighting and materials

One rig for everything (`Lighting.tsx`): warm key from upper left with soft shadows,
cool hemisphere fill, **signature teal rim light from behind**, and a procedural studio
environment for clearcoat reflections. Materials are physical presets (`materials.tsx`)
with clearcoat + sheen for a wet, biological look. Translucent presets (`membrane`,
`vesselWall`, `cytoplasm`, `ghost`) let viewers see inside. Never change the rig per
episode. If a scene looks wrong, fix the camera or subject, not the lights.

## Camera language

- Every shot moves, slowly, with one eased move per scene (`cameraEase`, slow in/out).
- `orbit` ±20–35° to reveal 3D form; `push`/`dolly` to direct attention; `keyframes`
  to go from overview to detail on a cue word.
- No fast cuts, shakes, spins or zoom-punches. Motion serves understanding.
- Frame the subject at ~70–80% of frame width (9:16).

## Motion

Entrances use `useReveal` (spring, no bounce, 14 frames). Callouts stagger 6 frames.
Scenes crossfade over 12 frames (`dip` for chapter changes, `cut` rarely). No decorative
motion: every animation shows a structure, a process or a direction.

## Brand frame

Brand bug (teal square + `SERIES · CATEGORY`) top-left on every frame. Fill in
`src/brand/identity.ts` (`seriesName`, `handle`, `defaultCta`) once.
