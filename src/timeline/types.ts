import type { MaterialPreset } from "../brand/materials";

export type Vec3 = [number, number, number];

/**
 * A point in time inside a scene. One of:
 *  - number: seconds from scene start            e.g. 2.5
 *  - "@word": when that word is spoken (cue)     e.g. "@oxygen", "@lungs#2" (2nd occurrence), "@heme+0.4" (offset seconds)
 *  - "NN%": fraction of the scene's duration     e.g. "60%"
 */
export type TimeRef = number | string;

export type Tone = "teal" | "amber" | "white";

// ── Camera shots ────────────────────────────────────────────────────────────
/** `wide`: camera-distance multiplier for 16:9 (default 0.8). Use ~1.0 for tall subjects, ~0.65 for wide ones. */
export type Shot = { wide?: number } & (
  | { type: "orbit"; target?: Vec3; radius: number; height?: number; from?: number; to?: number; fov?: number }
  | { type: "dolly"; from: Vec3; to: Vec3; target?: Vec3; targetTo?: Vec3; fov?: number }
  | { type: "push"; target?: Vec3; dir?: Vec3; from: number; to: number; fov?: number }
  | { type: "static"; position: Vec3; target?: Vec3; fov?: number }
  | { type: "keyframes"; keys: { at: TimeRef; position: Vec3; target?: Vec3; fov?: number }[] }
);

// ── 3D subjects ─────────────────────────────────────────────────────────────
export type Highlight = { meshes: string[]; at?: TimeRef; until?: TimeRef; tone?: "teal" | "amber" };

export type Subject = { position?: Vec3; rotation?: Vec3; scale?: number; spin?: number; at?: TimeRef } & (
  | {
      kind: "model"; // GLB in /public/models (see references/models.md)
      src: string;
      materials?: Record<string, MaterialPreset>; // mesh-name substring -> preset ("*" = default)
      highlight?: Highlight[];
    }
  | { kind: "rbc"; count?: number }
  | { kind: "bacillus"; gram?: "positive" | "negative" | "none"; flagella?: number }
  | { kind: "coccus"; gram?: "positive" | "negative" | "none"; arrangement?: "single" | "diplo" | "chain" | "cluster" }
  | { kind: "virion"; spikes?: number }
  | { kind: "cell"; nucleus?: boolean }
  | { kind: "alveoli"; capillaries?: boolean }
);

export type Callout = {
  text: string;
  anchor: Vec3; // 3D point the leader line points at
  at?: TimeRef;
  until?: TimeRef;
  tone?: Tone;
  side?: "left" | "right";
};

export type FlowPath = {
  points: Vec3[];
  radius?: number; // vessel radius
  count?: number; // particles
  speed?: number; // path lengths per second
  color?: "arterial" | "venous" | "oxygenate" | "deoxygenate" | "teal" | "amber" | "offWhite";
  particle?: "rbc" | "sphere";
  particleSize?: number;
  wall?: boolean; // draw the vessel tube
  at?: TimeRef;
};

export type Arrow = { points: Vec3[]; at?: TimeRef; tone?: Tone; radius?: number };

// ── Scenes ──────────────────────────────────────────────────────────────────
type SceneBase = {
  id: string;
  /** Spoken text. Markup: **amber emphasis**, ==teal anatomy term==. */
  narration: string;
  transition?: "crossfade" | "dip" | "cut";
  minSeconds?: number;
  holdSeconds?: number; // extra time after narration (e.g. quiz thinking time)
};

export type HookParams = { title: string; kicker?: string; subject?: Subject; shot?: Shot };
export type AnatomyParams = { subjects: Subject[]; shot: Shot; callouts?: Callout[]; arrows?: Arrow[]; heading?: string; flows?: FlowPath[] };
export type FlowParams = { flows: FlowPath[]; subjects?: Subject[]; shot: Shot; callouts?: Callout[]; arrows?: Arrow[]; heading?: string };
export type MicroParams = {
  organism: Subject; // the repeated microbe/cell
  count?: number;
  hero?: Subject; // optional large foreground specimen
  shot?: Shot;
  callouts?: Callout[];
  heading?: string;
  magnification?: string; // e.g. "×10,000"
};
export type CrossSectionParams = {
  subjects: Subject[];
  axis?: "x" | "y" | "z";
  from: number; // clip plane start offset
  to: number; // clip plane end offset
  at?: TimeRef; // when the cut starts
  shot: Shot;
  callouts?: Callout[];
  heading?: string;
  flows?: FlowPath[];
};
export type ConceptParams = { term: string; definition?: string; bullets?: { text: string; at?: TimeRef }[]; formula?: string; backdrop?: Subject };
export type CompareParams = {
  title?: string;
  left: { title: string; tone?: Tone; points: string[] };
  right: { title: string; tone?: Tone; points: string[] };
  revealAt?: TimeRef[];
};
export type QuizParams = { label?: string; question: string; options: string[]; answer: number; revealAt?: TimeRef; rationale?: string };
export type RecapParams = { title?: string; points: string[]; cta?: string };
export type CustomParams = { component: string; [k: string]: unknown };

export type Scene =
  | (SceneBase & { template: "hook"; params: HookParams })
  | (SceneBase & { template: "anatomy"; params: AnatomyParams })
  | (SceneBase & { template: "flow"; params: FlowParams })
  | (SceneBase & { template: "micro"; params: MicroParams })
  | (SceneBase & { template: "crossSection"; params: CrossSectionParams })
  | (SceneBase & { template: "concept"; params: ConceptParams })
  | (SceneBase & { template: "compare"; params: CompareParams })
  | (SceneBase & { template: "quiz"; params: QuizParams })
  | (SceneBase & { template: "recap"; params: RecapParams })
  | (SceneBase & { template: "custom"; params: CustomParams });

export type TemplateName = Scene["template"];

export type Episode = {
  slug: string;
  title: string;
  category: "Anatomy" | "Physiology" | "Microbiology" | "Pathophysiology" | "Pharmacology" | "Nursing" | "NCLEX";
  audience?: string;
  learningObjectives: string[];
  /** Every factual claim made in the narration, each with a reputable source. */
  claims: { text: string; source: string }[];
  review: { status: "pending" | "approved"; reviewer?: string; date?: string; notes?: string };
  music?: string; // path in /public
  scenes: Scene[];
};

// ── Generated timeline (scripts/voiceover.mjs writes this) ──────────────────
export type Word = { text: string; startMs: number; endMs: number; emphasis?: "amber" | "teal" };

export type TimelineScene = {
  id: string;
  from: number; // absolute start frame
  durationInFrames: number;
  audio: string | null; // path in /public
  words: Word[]; // scene-relative ms
};

export type Timeline = {
  slug: string;
  fps: number;
  mode: "tts" | "estimate" | "recorded";
  totalFrames: number;
  scenes: TimelineScene[];
};
