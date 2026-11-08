// Narration markup → tokens. Shared by voiceover, validate and estimate.
//   **amber emphasis**   ==teal anatomy term==   [pause 2.5]
const MARK = /(\*\*[^*]+\*\*|==[^=]+==|\[pause\s+[\d.]+\])/g;

export const tokenize = (narration) => {
  const tokens = [];
  for (const part of narration.split(MARK).filter((p) => p && p.length)) {
    const pause = part.match(/^\[pause\s+([\d.]+)\]$/);
    if (pause) {
      tokens.push({ type: "pause", seconds: parseFloat(pause[1]) });
      continue;
    }
    let emphasis;
    let text = part;
    if (/^\*\*[^*]+\*\*$/.test(part)) { emphasis = "amber"; text = part.slice(2, -2); }
    else if (/^==[^=]+==$/.test(part)) { emphasis = "teal"; text = part.slice(2, -2); }
    for (const w of text.split(/\s+/).filter(Boolean)) tokens.push({ type: "word", text: w, ...(emphasis ? { emphasis } : {}) });
  }
  // Attach punctuation that markup split off (e.g. "**oxygen**." → "oxygen.")
  const out = [];
  for (const t of tokens) {
    const prev = out[out.length - 1];
    if (t.type === "word" && /^[.,;:!?)]+$/.test(t.text) && prev?.type === "word") prev.text += t.text;
    else out.push(t);
  }
  return out;
};

export const plainText = (narration) =>
  tokenize(narration).filter((t) => t.type === "word").map((t) => t.text).join(" ");

export const wordCount = (narration) => tokenize(narration).filter((t) => t.type === "word").length;

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Spoken form of a word for TTS (pronunciation dictionary, whole-token match). */
export const spoken = (word, pronunciations = {}) => {
  let w = word;
  for (const [k, v] of Object.entries(pronunciations)) {
    w = w.replace(new RegExp(`(^|[^\\p{L}])${escapeRe(k)}(?=$|[^\\p{L}])`, "gu"), `$1${v}`);
  }
  return w;
};

/** Estimated word timings (no TTS): for drafts, previews and planning. */
export const estimateWords = (narration, wpm = 155) => {
  const tokens = tokenize(narration);
  const words = tokens.filter((t) => t.type === "word");
  const weights = words.map((w) => 0.55 + 0.45 * Math.min(14, w.text.replace(/[^\p{L}\p{N}]/gu, "").length) / 6);
  const totalSpeech = (words.length / wpm) * 60 * 1000;
  const unit = totalSpeech / weights.reduce((a, b) => a + b, 0);
  let t = 150;
  const out = [];
  let wi = 0;
  for (const tok of tokens) {
    if (tok.type === "pause") { t += tok.seconds * 1000; continue; }
    const d = weights[wi++] * unit;
    out.push({ text: tok.text, startMs: Math.round(t), endMs: Math.round(t + d * 0.92), ...(tok.emphasis ? { emphasis: tok.emphasis } : {}) });
    t += d;
    if (/[.?!]$/.test(tok.text)) t += 320;
    else if (/[,;:]$/.test(tok.text)) t += 160;
  }
  return { words: out, durationMs: Math.round(t) };
};
