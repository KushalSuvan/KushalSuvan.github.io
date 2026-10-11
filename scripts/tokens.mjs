#!/usr/bin/env node
/**
 * Token heat (spec/08-plots.md, PLOT-9): turns a data file of tokens and their
 * entropies into static HTML for a post, so the exhibit reads without
 * JavaScript, in print and in feeds. Each token is a span with a heat class
 * (h0–h12, half a nat each, 6 nats and over is h12) and its exact value in a
 * tooltip; the colour comes from the stylesheet, never from the markup.
 *
 *   node scripts/tokens.mjs data/<file>.json [example indices, e.g. 0,1,2] [--legend]
 *
 * Data, one of two shapes:
 *   { model, examples: [{ q, tokens: [...], entropy: [...] }] }   question and answer
 *   { model, tokens: [...], entropy: [...], top3?: [[[tok, p], ...], ...] }   one passage
 */
import { readFileSync } from "node:fs";

const [file, pick, ...flags] = process.argv.slice(2);
if (!file) { console.error("usage: node scripts/tokens.mjs data/<file>.json [indices] [--legend]"); process.exit(2); }
const data = JSON.parse(readFileSync(file, "utf8"));
const legend = flags.includes("--legend") || pick === "--legend";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MAX = 6, STEPS = 12;
const heat = (h) => Math.min(STEPS, Math.round((h / MAX) * STEPS));
const pct = (p) => `${Math.round(p * 100)}%`;

/**
 * One token: its heat class and a tooltip with the entropy, and the alternatives
 * when the data has them. Line breaks stay outside the span, so only the
 * characters a reader sees are tinted.
 */
function token(t, h, top) {
  const tip = `${h.toFixed(2)} nats` + (top ? " · " + top.map(([w, p]) => `${w.trim() || "␣"} ${pct(p)}`).join(" · ") : "");
  const [, before, seen, after] = /^(\n*)([\s\S]*?)(\n*)$/.exec(t);
  const br = (s) => s.replace(/\n/g, "<br>"); // breaks as tags, so the markup stays on one line wherever it is pasted
  return br(before) + (seen ? `<span class="tk h${heat(h)}" title="${esc(tip)}">${esc(seen)}</span>` : "") + br(after);
}

const run = (tokens, entropy, top) => tokens.map((t, i) => token(t, entropy[i], top?.[i])).join("");

const out = [`<div class="tokens">`, `  <p class="tk-model">${esc(data.model)}</p>`];
if (data.examples) {
  const which = pick && pick !== "--legend" ? pick.split(",").map(Number) : data.examples.map((_, i) => i);
  for (const i of which) {
    const ex = data.examples[i];
    out.push(`  <p class="tk-q"><span class="tk-label">q</span>${esc(ex.q)}</p>`);
    out.push(`  <p class="tk-a"><span class="tk-label">a</span>${run(ex.tokens, ex.entropy)}</p>`);
  }
} else {
  out.push(`  <p class="tk-a tk-passage">${run(data.tokens, data.entropy, data.top3).replace(/(<br>|\s)+$/, "")}</p>`);
}
if (legend) {
  const keys = [0, 2, 4, 6, 8, 10, 12].map((k) => `<span class="tk h${k}">${k / 2}</span>`).join("");
  out.push(`  <p class="tk-legend">entropy, nats ${keys}</p>`);
}
out.push(`</div>`);
console.log(out.join("\n"));
