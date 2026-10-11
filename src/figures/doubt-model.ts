/**
 * The toy language model behind the Doubt figure, with no DOM. A tiny grammar
 * of contexts: each has candidate next tokens with logits, and the context
 * each one leads to. Every other entry of the 49-token vocabulary sits in the
 * long tail with a low logit, so at a high temperature it can be sampled too.
 * The numbers are illustrative, chosen to give some contexts a sharp answer
 * and others many good ones; the post says so.
 */

export type Candidate = { token: string; logit: number; next: string };
export type Context = { name: string; candidates: Candidate[] };

const c = (token: string, logit: number, next: string): Candidate => ({ token, logit, next });

export const CONTEXTS: Record<string, Context> = {
  obj: { name: "obj", candidates: [c(" mat", 3.0, "after"), c(" floor", 2.3, "after"), c(" sofa", 2.0, "after"), c(" rug", 1.6, "after"), c(" roof", 1.3, "after"), c(" bed", 1.1, "after"), c(" keyboard", 0.4, "after")] },
  after: { name: "after", candidates: [c(".", 2.2, "sent"), c(",", 1.5, "part"), c(" and", 1.4, "verb2"), c(" for", 0.7, "dur")] },
  part: { name: "part", candidates: [c(" purring", 2.1, "end"), c(" asleep", 1.9, "end"), c(" watching", 1.2, "end"), c(" waiting", 1.0, "end")] },
  verb2: { name: "verb2", candidates: [c(" purred", 2.0, "end"), c(" slept", 1.9, "end"), c(" stared", 1.3, "end"), c(" yawned", 1.2, "end")] },
  dur: { name: "dur", candidates: [c(" hours", 2.4, "end"), c(" ages", 1.4, "end"), c(" days", 0.6, "end")] },
  end: { name: "end", candidates: [c(".", 3.2, "sent"), c(" and", 0.5, "verb2")] },
  sent: { name: "sent", candidates: [c(" The", 2.2, "subj"), c(" It", 1.8, "verb"), c(" Then", 0.8, "then")] },
  then: { name: "then", candidates: [c(" it", 2.5, "verb"), c(" the", 1.2, "subj")] },
  subj: { name: "subj", candidates: [c(" cat", 2.6, "verb"), c(" dog", 1.9, "verb"), c(" bird", 1.0, "verb"), c(" fox", 0.7, "verb")] },
  verb: { name: "verb", candidates: [c(" sat", 2.4, "on"), c(" slept", 1.8, "on"), c(" waited", 1.2, "on"), c(" jumped", 1.1, "on")] },
  on: { name: "on", candidates: [c(" on", 2.6, "the"), c(" by", 1.6, "the"), c(" under", 1.0, "the")] },
  the: { name: "the", candidates: [c(" the", 4.0, "obj"), c(" a", 1.4, "obj")] },
};

/** The figure opens on this context, after these tokens. */
export const START = { context: "obj", tokens: ["The", " cat", " sat", " on", " the"] };

/** The long tail: tokens no context expects. */
const TAIL = [" banana", " quantum", "ly", " 7", " Paris", " the", " ###", " ing", " moon", " soup", " ion", " 1999", " oh", " blue", " API", " (", " yes", " river", " tax", " slow", " NULL", " und", " ;", " jazz", " poem", " Mars", " wet", " cloud", " -", " tree", " vote", " ink", " iron", " lamp", " bolt", " fish", " hmm", " salt", " zero", " gate", " echo", " Kyoto", " rain", " dust", " owl", " wick", " vast", " mint"];

/** 49 tokens: every candidate of every context, then the tail. Index = the token's place in the logit layer. */
export const VOCAB: string[] = (() => {
  const seen: string[] = [];
  for (const ctx of Object.values(CONTEXTS)) for (const k of ctx.candidates) if (!seen.includes(k.token)) seen.push(k.token);
  for (const t of TAIL) if (seen.length < 49 && !seen.includes(t)) seen.push(t);
  return seen;
})();

/** Where each vocabulary entry sits in the 7 × 7 layer: a fixed scatter, so a context's candidates are not one row. */
export const CELL_OF: number[] = VOCAB.map((_, i) => (i * 17) % 49);

/** A small seeded generator, so the tail's logits are the same on every load. */
function rng(seed: number) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
}

/** Every vocabulary entry's logit in a context: its candidate logit, or a low one from the tail (−5.5 to −4). */
export function logits(ctx: Context): number[] {
  const r = rng([...ctx.name].reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7));
  return VOCAB.map((t) => ctx.candidates.find((k) => k.token === t)?.logit ?? -5.5 + 1.5 * r());
}

/** Softmax at a temperature. */
export function softmax(z: number[], T: number): number[] {
  const m = Math.max(...z), e = z.map((v) => Math.exp((v - m) / T)), s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

/** Entropy in bits: how much doubt the distribution holds. */
export const entropy = (p: number[]) => -p.reduce((s, v) => (v > 0 ? s + v * Math.log2(v) : s), 0);

/** One draw from a distribution, with a uniform number u in [0, 1). */
export function sample(p: number[], u: number): number {
  let acc = 0;
  for (let i = 0; i < p.length; i++) { acc += p[i]; if (u < acc) return i; }
  return p.length - 1;
}

/** The context a committed token leads to; a token from the tail leads where the likeliest candidate would. */
export function nextContext(ctx: Context, token: string): string {
  return (ctx.candidates.find((k) => k.token === token) ?? ctx.candidates[0]).next;
}
