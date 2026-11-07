# my-3d-video

3D animated videos with **three.js** (via React Three Fiber) + **Remotion** for captions, audio and rendering to MP4.

## What's installed

| Package | Purpose |
|---|---|
| `three`, `@react-three/fiber`, `@react-three/drei` | 3D scenes, meshes, lights, helpers |
| `remotion`, `@remotion/cli` | Timeline, Studio preview, MP4 rendering |
| `@remotion/three` | `<ThreeCanvas>`: syncs three.js to Remotion's frame clock |
| `@remotion/media` | `<Audio>` / `<Video>` components |
| `@remotion/media-utils` | Audio data/waveforms (for audio-reactive visuals) |
| `@remotion/captions` | Caption types, SRT/VTT parsing, TikTok-style word highlighting |
| `@remotion/install-whisper-cpp` | Local, free speech-to-text to auto-generate captions |
| `@remotion/fonts`, `@remotion/google-fonts` | Fonts |

## Commands

```bash
npm run dev               # open Remotion Studio (live preview + scrubbing) at http://localhost:3000
npm run render            # render 16:9 → out/video.mp4
npm run render:vertical   # render 9:16 → out/video-vertical.mp4
npm run still             # render a single frame → out/still.png
npm run transcribe -- public/voiceover.wav   # auto-captions → public/voiceover.captions.json
npm run typecheck
```

## Project layout

```
src/
  index.ts      entry point (registerRoot)
  Root.tsx      compositions: size, fps, duration (Main 1920x1080, MainVertical 1080x1920)
  Main.tsx      combines the 3D scene + captions + audio
  Scene3D.tsx   the three.js scene: edit this to build your animation
  Captions.tsx  TikTok-style word-by-word captions
public/         assets (audio, captions JSON, fonts, models, textures); load with staticFile()
scripts/transcribe.mjs   whisper.cpp captioning
remotion.config.ts       render settings
```

## Workflow

1. **Audio**: drop your voiceover/music in `public/` (e.g. `public/voiceover.mp3`).
2. **Captions**: `npm run transcribe -- public/voiceover.mp3` (first run downloads whisper.cpp + model, ~1.5 GB for `medium.en`; pass `small.en` or `tiny.en` as a 2nd arg for faster/smaller). Or write `public/*.json` by hand, or parse an SRT with `parseSrt()`.
3. **Wire it up**: in `src/Main.tsx` set `audioSrc: staticFile("voiceover.mp3")` and `captionsFile: "voiceover.captions.json"`. Set `durationInFrames` in `Root.tsx` to match your audio (seconds × 30).
4. **Animate** in `src/Scene3D.tsx`, then `npm run dev` to preview and `npm run render` to export.

## The one rule for three.js in Remotion

Drive **all** motion from `useCurrentFrame()` (with `interpolate()` / `spring()`), **never** from three's `useFrame()`, `clock`, `Date.now()` or `Math.random()` (use `random("seed")` from remotion). Remotion renders frames in parallel and out of order, so animation must be a pure function of the frame number.

Loading GLTF models: put `model.glb` in `public/` and use `useGLTF(staticFile("model.glb"))` from drei.

## Rendering notes

- First render auto-downloads Chrome Headless Shell (one time).
- WebGL backend is set in `remotion.config.ts`. Default `angle` works on desktops. On a server or VM without a GPU, use software GL:
  `REMOTION_GL=swangle npm run render`
- To use an existing Chrome/Chromium instead of downloading: `REMOTION_BROWSER=/path/to/chrome npm run render`
- Remotion licensing: free for individuals and companies ≤3 people; larger companies need a company license (remotion.pro).
