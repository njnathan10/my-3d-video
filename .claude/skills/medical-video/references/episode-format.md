# Episode format

Source of truth for types: `src/timeline/types.ts`. Reference episode:
`src/episodes/oxygen-transport/episode.json`.

```jsonc
{
  "slug": "kebab-case (== folder name)",
  "title": "How Your Blood Carries Oxygen",
  "category": "Anatomy | Physiology | Microbiology | Pathophysiology | Pharmacology | Nursing | NCLEX",
  "audience": "Pre-nursing and A&P students",
  "learningObjectives": ["1–3 measurable objectives"],
  "claims": [{ "text": "One factual statement", "source": "Book/guideline, edition, chapter/section" }],
  "review": { "status": "pending" },          // user sets approved + reviewer + date
  "music": "brand/music/bed.mp3",             // optional, plays at 8% volume
  "scenes": [ /* 7–10 scenes */ ]
}
```

## Scene

```jsonc
{
  "id": "kebab-id",
  "template": "hook | anatomy | flow | micro | crossSection | concept | compare | quiz | recap | custom",
  "narration": "Spoken text with **amber** and ==teal== markup and [pause 2.5]",
  "transition": "crossfade (default) | dip | cut",
  "minSeconds": 0,       // floor on scene length
  "holdSeconds": 0,      // extra time after narration ends
  "params": { }
}
```

Scene length = narration length + 0.35 s (+ holdSeconds). The whole video's length
comes from the narration. Never set durations by hand.

## TimeRef (when things happen)

- `2.5`: seconds from scene start
- `"@oxygen"`: when the first word starting with "oxygen" is spoken (single word only). `"@lungs#2"` = 2nd occurrence. `"@heme+0.4"` = 0.4 s after.
- `"60%"`: fraction of the scene

Prefer cues: they stay in sync when the voice or script changes. `validate` fails on cues
not in that scene's narration.

## Templates

| Template | Use for | Params |
|---|---|---|
| `hook` | First 3–6 s: big title + hero subject | `title`, `kicker?`, `subject?`, `shot?` |
| `anatomy` | A structure with labels, optional flows/arrows | `subjects[]`, `shot`, `callouts?`, `arrows?`, `flows?`, `heading?` |
| `flow` | A process along paths: circulation, airflow, nerve signal, filtrate | `flows[]`, `shot`, `subjects?`, `arrows?`, `callouts?`, `heading?` |
| `micro` | Microscopic field: bacteria, viruses, cells | `organism` (Subject), `count?`, `hero?`, `shot?`, `callouts?`, `heading?`, `magnification?` |
| `crossSection` | Cut a structure open to show the interior | `subjects[]`, `axis` x/y/z, `from`, `to` (clip offsets), `at?`, `shot`, `callouts?`, `flows?`, `heading?` |
| `concept` | Define a term, list facts, show a formula | `term`, `definition?`, `bullets?[{text, at?}]`, `formula?`, `backdrop?` (Subject) |
| `compare` | X vs Y (Gram+ vs Gram−, type 1 vs 2 DM) | `title?`, `left{title,tone?,points[]}`, `right{…}`, `revealAt?[]` |
| `quiz` | NCLEX-style question with timed reveal | `question`, `options[3–4]`, `answer` (0-based), `revealAt` ("@answer"), `rationale?`, `label?` |
| `recap` | 3 takeaways + CTA | `points[]`, `title?`, `cta?` |
| `custom` | Anything else (see components.md) | `component` + your params |

## Subject (3D object spec)

Common: `position [x,y,z]`, `rotation [rx,ry,rz]` (radians), `scale`, `spin` (rad/s around Y), `at` (entrance TimeRef).

| `kind` | Extra | Size at scale 1 |
|---|---|---|
| `model` | `src` (in /public), `materials` {meshNameSubstring: preset, "*": default}, `highlight[{meshes[], at, until?, tone}]` | model's own units, so normalize to ~2–3 units |
| `rbc` | — | diameter 2 (accurate biconcave, Evans–Fung) |
| `bacillus` | `gram` positive/negative/none, `flagella` | length ~3.2 incl. flagella |
| `coccus` | `gram`, `arrangement` single/diplo/chain/cluster | sphere Ø 0.84 |
| `virion` | `spikes` | Ø ~2.2 incl. spikes |
| `cell` | `nucleus` | Ø 2.6 |
| `alveoli` | `capillaries` | cluster ~4 wide × 4.5 tall |

Material presets for `model.materials`: tissue, muscle, arterial, venous, vesselWall, bone,
nerve, membrane, cytoplasm, nucleus, bacterium, gramPositive, gramNegative, virus, rbc,
highlight, accent, ghost, glass.

## Flows, arrows, callouts

```jsonc
{ "points": [[x,y,z], …], "color": "arterial|venous|oxygenate|deoxygenate|teal|amber|offWhite",
  "radius": 0.25, "count": 90, "speed": 0.08, "particle": "rbc|sphere", "particleSize": 0.1, "wall": true, "at": "@word" }   // flow
{ "points": [[x,y,z], …], "at": "@diffuses", "tone": "amber|teal|white", "radius": 0.045 }                                      // arrow (draws itself)
{ "text": "≤26 chars", "anchor": [x,y,z], "at": "@word", "until": "@word", "tone": "teal|amber|white", "side": "left|right" }    // callout
```

`oxygenate` / `deoxygenate` shift color along the path (gas exchange). Paths are
Catmull-Rom curves: 4–6 points is plenty. Callout `anchor` is the 3D point on the
structure. Labels follow camera motion and flip sides to stay in the safe zone.

## Shots (camera)

```jsonc
{ "type": "orbit", "target": [0,0,0], "radius": 10, "height": 1, "from": -25, "to": 20, "fov": 35 }
{ "type": "push", "target": [0,0,0], "dir": [0,0.12,1], "from": 13, "to": 11 }
{ "type": "dolly", "from": [x,y,z], "to": [x,y,z], "target": [x,y,z], "targetTo": [x,y,z] }
{ "type": "static", "position": [x,y,z], "target": [x,y,z] }
{ "type": "keyframes", "keys": [{ "at": 0, "position": […], "target": […] }, { "at": "@word", "position": […] }, { "at": "100%", "position": […] }] }
```

Any shot accepts `"wide": k`, the camera-distance multiplier for 16:9 (default 0.8).
Use ~1.0–1.25 for tall subjects (whole-body loops), ~0.7 for wide ones.

**Framing rule (9:16, fov 35):** camera distance ≈ **3.8 × subject width** fills ~75% of
the frame width. Visible height ≈ 0.63 × distance. Examples: RBC scale 1.3 (Ø 2.6) → ~10;
alveoli scale 0.8 (~3.2 wide) → ~12; tall circulation diagram 7 units → ~15–16.

**Coordinates:** +Y up, +X right, +Z toward camera. Keep scenes centered on the origin,
within about ±4 units. Fog starts at 13 units from the camera.
