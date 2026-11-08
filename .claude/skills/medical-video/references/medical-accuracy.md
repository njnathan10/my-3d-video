# Medical accuracy

The audience studies for exams from these videos, so an error is a liability. Accuracy
is enforced in three layers: claims with sources (you), automated checks
(`npm run validate`), and human approval (the user) before any final render.

## Source hierarchy (cite the most authoritative that covers the fact)

1. Current clinical guidelines and regulators: CDC, WHO, NIH/NLM (MedlinePlus, StatPearls on NCBI Bookshelf), FDA labels/DailyMed for drugs
2. Standard textbooks: OpenStax *Anatomy & Physiology 2e*, OpenStax *Microbiology*,
   Guyton & Hall *Medical Physiology*, Brunner & Suddarth / Lewis *Medical-Surgical Nursing*,
   Lehne's / Katzung *Pharmacology*, Porth *Pathophysiology*
3. NCSBN NCLEX-RN / NCLEX-PN test plans (for exam framing)
4. Peer-reviewed reviews (PubMed) for specifics textbooks lack

Not acceptable as sole sources: blogs, Quizlet, YouTube, uncited websites, AI output.

## Rules for claims[]

- One atomic fact per claim, phrased as stated (or implied) in the narration
- Source = title + edition/section (e.g. "OpenStax A&P 2e, §22.5 Transport of Gases")
- Verify numbers against the source text. Look them up; do not rely on memory
- **If reputable sources disagree, drop the number** and use "most", "about", "up to"
  (example: CO₂ transport percentages vary 70–85% across textbooks, so the reference episode says "most")
- Drug content: generic names, class, mechanism, key adverse effects/nursing considerations
  only. No dosing unless it is the explicit topic and is checked against the label
- Visuals are claims too: colors, shapes, directions of flow, relative sizes and
  left/right must be correct or explicitly schematic

## Review checklist (present this to the user with the claims table)

- [ ] Every sentence in the narration is covered by a claim with a valid source
- [ ] Numbers match the cited source exactly (or are hedged)
- [ ] No outdated terminology or guidance (check guideline year)
- [ ] Simplifications don't become wrong (simplify the level of detail, never the direction of a fact)
- [ ] Flow directions correct (e.g. pulmonary veins carry oxygenated blood)
- [ ] Color conventions explained when they could mislead (blue ≠ real deoxygenated blood)
- [ ] Quiz has exactly one defensible answer; rationale matches the mechanism
- [ ] Nothing reads as personal medical advice

## Common errors to catch

- "Deoxygenated blood is blue" (it is dark red)
- "Arteries carry oxygenated blood" (pulmonary arteries don't; say "away from the heart")
- Confusing Gram+ (thick peptidoglycan, purple) and Gram− (outer membrane, LPS, pink)
- Antibiotics for viral infections; "antibiotic resistance" happening in people (it's bacteria)
- Mixing up afferent/efferent, sympathetic/parasympathetic effects
- Hemoglobin carries 4 O₂ per molecule (not per heme pair), and RBCs have no nucleus (mammalian)
- Wrong laterality in anatomy models (left/right flipped by camera or model import)

## The gate

`npm run render` without `--draft` runs `validate --final`, which fails unless
`review.status == "approved"` with `reviewer` and `date`, and the timeline uses real TTS.
Only set approval after the user explicitly approves the script and claims in the
conversation. Record their name and the date.
