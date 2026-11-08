# Script writing: 120-second episodes

Voice: a calm, confident tutor. Second person ("your blood"), plain words first, then
the term ("a flexible disc, the ==erythrocyte=="). Short sentences. One idea per sentence.

## Budget

- ~155 words/min, so **270–300 words** for 120 s (validator target 105–135 s).
- 7–10 scenes, 8–20 s each (≤ ~55 words per scene).
- Amber + teal markup on ≤ 15% of words: amber for the 1–2 concepts per scene the
  viewer must remember, teal for structure/term names.

## Beat sheet

| Beat | Template | Time | Job |
|---|---|---|---|
| Hook | `hook` | 0–8 s | Surprising fact or question + promise ("Here's how it works.") |
| Setup | `anatomy` / `crossSection` / `micro` | 8–30 s | The structure: what it is, the one feature that matters |
| Mechanism 1–2 | `flow` / `anatomy` / `concept` | 30–80 s | How it works, step by step, cause → effect |
| Clinical tie-in | `concept` / `compare` / `micro` | 80–95 s | Why a nurse cares: disease, drug, assessment finding |
| NCLEX check | `quiz` | 95–112 s | One application question, pause, answer + rationale |
| Recap | `recap` | 112–120 s | 3 takeaways + follow CTA |

## Markup

- `**oxyhemoglobin**`: amber (key concept)
- `==alveoli==`: teal (anatomy/medical term)
- `[pause 2.5]`: silence (max 3 s per pause), mainly before quiz answers
- Write numbers as digits ("300 million") so captions show digits; TTS reads them fine.
- Symbols (O₂, CO₂, pH, NCLEX) are mapped to speech in `src/brand/voice.json` → `pronunciations`.
  Add new entries there (global), never respell words in the narration.

## Cues

Put words you will cue on in the narration on purpose: if a callout should appear
when the structure is named, name it. Cue words must be unique enough to match
(`"@capillaries"` not `"@the"`).

## Quiz pattern

```
"Quick NCLEX check. <stem in one sentence>. Which finding should the nurse expect? [pause 2.5]
 The answer is B. <one-sentence rationale linking back to the mechanism>."
```
Set `revealAt: "@answer"`, `holdSeconds: 0.8`. Options: 4, parallel grammar, one
clearly correct, distractors plausible (common misconceptions), no "all of the above".

## Hooks that work

- Scale: "Every second, your marrow makes 2 million…"
- Myth-bust: "Your veins aren't blue."
- Stakes: "This one enzyme is why antibiotics work."
- Question: "Why does a fever make your heart race?"

Never open with "In this video" or a greeting.

## Avoid

Absolutes ("always", "never") unless true · unexplained abbreviations · more than one
new term per sentence · numbers without a claim · clinical advice to viewers (educational only).
