# Anatomy models (GLB)

Microscopic subjects (RBC, bacteria, viruses, cells, alveoli) are procedural and need
no files. Organ-level anatomy (heart, kidney, brain, skeleton) uses GLB models in
`public/models/`, rendered with `{ "kind": "model", "src": "models/heart.glb" }`.
`AnatomyModel` re-skins every mesh with brand material presets, so models from
different sources still look like one house style.

## Sources (check each model's license and keep attribution)

| Source | License | Notes |
|---|---|---|
| Z-Anatomy (z-anatomy.com, GitHub) | CC BY-SA 4.0 | Full-body atlas in Blender, mesh names follow Terminologia Anatomica |
| BodyParts3D (DBCLS) | CC BY-SA 2.1 JP | Accurate organ meshes from the Life Science DB |
| NIH 3D (3d.nih.gov) | Varies (many public domain) | Anatomy, proteins, cells, viruses |
| Sketchfab | Filter by CC BY / CC0 | Quality varies; check accuracy |
| RCSB PDB → ChimeraX | Free | Molecules (hemoglobin, antibodies) exported as GLB |

Credit CC BY / BY-SA models in the post description: keep a `credits` note in the
episode folder (e.g. `src/episodes/<slug>/CREDITS.md`).

## Preparation checklist

1. **Blender**: delete cameras, lights, armatures you don't need. Apply transforms.
2. **Name meshes meaningfully** (`LeftVentricle`, `Aorta`, `PulmonaryTrunk`): names drive
   `materials` and `highlight` matching (case-insensitive substring).
3. **Orientation & scale**: +Y up, anterior facing +Z (toward the camera), centered at the
   origin, largest dimension ≈ 3 units. Verify left/right: the patient's left is the viewer's
   right in an anterior view.
4. **Simplify**: target < 300k triangles total. Decimate hidden interior detail.
5. **Export glTF Binary (.glb)**, no embedded cameras/lights, materials don't matter (replaced).
6. **Compress with meshopt** (not Draco: its decoder downloads from a CDN at render time):
   ```bash
   npx @gltf-transform/cli optimize in.glb public/models/heart.glb --compress meshopt --texture-compress false
   ```
7. QA: put it in a scene with `"materials": {"*": "tissue"}` and render `npm run qa`.

## Usage

```jsonc
{
  "kind": "model",
  "src": "models/heart.glb",
  "scale": 1,
  "rotation": [0, -0.3, 0],
  "materials": { "*": "muscle", "aorta": "arterial", "pulmonary": "venous", "vena": "venous", "valve": "ghost" },
  "highlight": [{ "meshes": ["LeftVentricle"], "at": "@ventricle", "tone": "teal" }]
}
```

For cut-away views, use the `crossSection` template with the model as a subject.
