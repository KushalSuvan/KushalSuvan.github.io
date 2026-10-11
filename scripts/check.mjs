#!/usr/bin/env node
/**
 * The static checks (spec/12-architecture.md, ARCH-5): every rule of the spec
 * that can be read from the source, with the rule's ID beside each finding.
 *
 *   pnpm check
 *
 * Prints `ok` and exits 0, or prints each finding as `file:line  RULE  what`
 * and exits 1. No dependencies: the posts are read with patterns, not a parser,
 * so keep their markup plain.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const findings = [];
const flag = (file, line, rule, msg) => findings.push(`${relative(ROOT, file)}:${line}  ${rule}  ${msg}`);
const read = (f) => readFileSync(f, "utf8");
const walk = (dir, ext) => !existsSync(dir) ? [] : readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p, ext) : ext.some((e) => p.endsWith(e)) ? [p] : [];
});
const lineOf = (text, index) => text.slice(0, index).split("\n").length;
const each = (file, text, re, fn) => { for (const m of text.matchAll(re)) fn(m, lineOf(text, m.index)); };
/** Source without comments, so a rule named in a comment is not a finding. */
const code = (t) => t.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/(^|[^:"'`])\/\/.*$/gm, (m, p) => p + " ".repeat(m.length - p.length));

const SRC = join(ROOT, "src");
const OWN = walk(SRC, [".ts", ".css"]).filter((f) => !f.includes(`${join("src", "hairline")}`));
const EXHIBITS = ["figures", "scenes", "plots"].flatMap((d) => walk(join(SRC, d), [".ts"]));
const ENGINE = walk(join(SRC, "engine"), [".ts"]);

/* ARCH-2: the vendored core is unchanged */
for (const line of read(join(SRC, "hairline", "SHA256SUMS")).trim().split("\n")) {
  const [sum, name] = line.split(/\s+/), f = join(SRC, "hairline", name);
  if (!existsSync(f)) flag(f, 1, "ARCH-2", "vendored hairline file is missing");
  else if (createHash("sha256").update(readFileSync(f)).digest("hex") !== sum) flag(f, 1, "ARCH-2", "src/hairline/ is vendored and never edited: extend it in src/engine/ instead");
}

/* ARCH-7: nothing tracked, so nothing public, names the private research repository, its paths or its account */
const PRIVATE = /(?:~|\/home\/[\w.-]+)\/res\/|res\/meta\b|meta-research|ZephyrousChimes|\.proof-vault\/[\w-]+/g;
const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8" }).split("\0").filter(Boolean)
  .filter((f) => !f.endsWith("scripts/check.mjs") && /\.(html|json|md|ts|mjs|css|yml)$/.test(f));
for (const rel of tracked) {
  const f = join(ROOT, rel);
  if (existsSync(f)) each(f, read(f), PRIVATE, (m, l) => flag(f, l, "ARCH-7", `"${m[0]}" names something private, and this repo is public: keep it in .private/`));
}

/* TOK-1: colours only in tokens.css */
for (const f of OWN.filter((f) => !f.endsWith("tokens.css"))) {
  const t = code(read(f));
  each(f, t, /#[0-9a-fA-F]{3,8}\b(?![\w-])|\b(?:rgba?|hsla?|oklch|oklab)\(/g, (m, l) => {
    if (f.endsWith(".ts") && !/["'`]\s*#|\(\s*$/.test(t.slice(Math.max(0, m.index - 2), m.index + 1)) && m[0].startsWith("#")) return;
    flag(f, l, "TOK-1", `colour "${m[0]}" outside tokens.css: add a token`);
  });
}

/* LINE-1, TOK-1: drawings set classes, never colours, opacity or widths */
for (const f of [...EXHIBITS, ...ENGINE]) {
  const t = code(read(f));
  each(f, t, /setAttribute\(\s*["'](stroke|fill|opacity|stroke-width|filter|style)["']|\.style\.(stroke|fill|opacity|strokeWidth|filter|color)\b|["'](?:stroke|fill|opacity|stroke-width)["']\s*:/g, (m, l) =>
    flag(f, l, "LINE-1", `sets ${m[1] ?? m[2] ?? "a paint property"} directly: use a stroke class`));
}

/* MOT-6: one loop; no timers or animations in exhibits or the engine */
for (const f of [...EXHIBITS, ...ENGINE]) {
  each(f, code(read(f)), /\b(setTimeout|setInterval|requestAnimationFrame)\s*\(|@keyframes|\banimation\s*:/g, (m, l) =>
    flag(f, l, "MOT-6", `${m[1] ?? m[0]}: join the shared loop with register(stage, tick)`));
}

/* LINE-6, FIG-1: no words inside a figure or scene drawing; figures don't measure the DOM */
for (const f of [...walk(join(SRC, "figures"), [".ts"]), ...walk(join(SRC, "scenes"), [".ts"])]) {
  const t = code(read(f));
  each(f, t, /mk\(\s*["']text["']|createElementNS\([^)]*["']text["']|<text\b/g, (_m, l) => flag(f, l, "LINE-6", "text inside a drawing: names go to labels or the read-out"));
  if (f.includes(join("src", "figures"))) each(f, t, /getBoundingClientRect|elementFromPoint|addEventListener\(\s*["']pointer/g, (m, l) => flag(f, l, "FIG-1", `${m[0]}: use pointer() from the stage and test the rest pose`));
}

/* FIG-2: one figure, at most 200 lines */
for (const f of walk(join(SRC, "figures"), [".ts"]).filter((f) => !f.endsWith("index.ts"))) {
  const n = read(f).split("\n").length;
  if (n > 200) flag(f, 200, "FIG-2", `${n} lines; a figure over 200 is usually two ideas`);
}

/* registries: what posts may name */
const keys = (file, re) => existsSync(file) ? [...read(file).matchAll(re)].map((m) => m[1]) : [];
const FIGS = new Set(keys(join(SRC, "figures", "index.ts"), /^\s{2}(\w+): \{/gm));
const PLOTS = new Set(keys(join(SRC, "plots", "index.ts"), /^export const PLOTS[^{]*\{([^}]*)\}/gm)[0]?.split(",").map((s) => s.trim()).filter(Boolean) ?? []);
const SCENE_NAMES = keys(join(SRC, "scenes", "index.ts"), /^export const SCENES[^{]*\{([^}]*)\}/gm)[0]?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
const plotHasControl = (name) => { const f = join(SRC, "plots", `${name}.ts`); return existsSync(f) && /\bcontrol\s*:/.test(code(read(f))); };

/* SCN-2: scenes are data; labels short */
const SCENES = {};
for (const name of SCENE_NAMES) {
  const f = join(SRC, "scenes", `${name}.ts`), t = read(f);
  const nodes = [...t.matchAll(/\{\s*id:\s*"([\w-]+)",\s*kind:\s*"(\w+)"[^}]*label:\s*"([^"]*)"/g)].map((m) => ({ id: m[1], kind: m[2], label: m[3] }));
  const edges = [...t.matchAll(/\{\s*id:\s*"([\w-]+)",\s*from:\s*"([\w-]+)",\s*to:\s*"([\w-]+)",\s*kind:\s*"(\w+)"/g)].map((m) => ({ id: m[1], from: m[2], to: m[3], kind: m[4] }));
  SCENES[name] = { nodes, edges };
  const ids = new Set(nodes.map((n) => n.id));
  for (const n of nodes) {
    if (n.label.length > 24) flag(f, lineOf(t, t.indexOf(n.label)), "SCN-2", `label "${n.label}" is over 24 characters`);
    if (!["client", "edge", "service", "worker", "store", "cache", "queue", "zone"].includes(n.kind)) flag(f, lineOf(t, t.indexOf(n.id)), "LINE-3", `kind "${n.kind}" is not in the shape vocabulary`);
  }
  for (const e of edges) for (const end of [e.from, e.to]) if (!ids.has(end)) flag(f, lineOf(t, t.indexOf(e.id)), "SCN-2", `edge ${e.id} names unknown node "${end}"`);
  if (/\b(function|=>|if\s*\(|for\s*\()/.test(code(t).replace(/import[^;]*;/g, ""))) flag(f, 1, "SCN-2", "a scene file is data only: no logic");
}

/* PLOT-4: at most four series */
for (const f of walk(join(SRC, "plots"), [".ts"]).filter((f) => !f.endsWith("index.ts"))) {
  const n = (code(read(f)).match(/\brole:\s*"/g) ?? []).length;
  if (n > 4) flag(f, 1, "PLOT-4", `${n} series; more than four is small multiples`);
}

/* the posts */
const POSTS = [join(ROOT, "index.html"), ...walk(join(ROOT, "posts"), [".html"])];
const words = (html) => html.replace(/<[^>]+>/g, " ").replace(/&\w+;/g, " ").split(/\s+/).filter(Boolean).length;
const text = (html) => html.replace(/<[^>]+>/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

for (const f of POSTS) {
  const t = read(f);
  const isPost = f.includes(join(ROOT, "posts"));

  // ARCH-2: one script, main.ts (the inline theme line in <head> excepted)
  each(f, t, /<script\b([^>]*)>/g, (m, l) => {
    if (/src="\/src\/main\.ts"/.test(m[1])) return;
    if (!/src=/.test(m[1]) && /localStorage\.getItem\("theme"\)/.test(t.slice(m.index, m.index + 200))) return;
    flag(f, l, "ARCH-2", "a page loads only /src/main.ts");
  });
  // TOK-1, LAY-1: no inline styles
  each(f, t, /\sstyle="/g, (_m, l) => flag(f, l, "LAY-1", "inline style: use a width class or a token"));
  // A11Y-7
  if (!/<html lang="en">/.test(t)) flag(f, 1, "A11Y-7", '<html lang="en"> is missing');
  each(f, t, /<img\b(?![^>]*\balt=)[^>]*>/g, (_m, l) => flag(f, l, "A11Y-7", "an image without alt"));

  if (!isPost) continue;
  // TYPE-4: one h1, no h4 and below
  const h1 = (t.match(/<h1\b/g) ?? []).length;
  if (h1 !== 1) flag(f, 1, "TYPE-4", `${h1} h1 elements; a post has exactly one`);
  each(f, t, /<h[4-6]\b/g, (_m, l) => flag(f, l, "TYPE-4", "no h4: a section that needs one is two sections"));
  // READ-1: the header has a title, a dek and a meta line
  for (const cls of ["dek", "meta"]) if (!new RegExp(`class="${cls}"`).test(t)) flag(f, 1, "READ-1", `the post header has no .${cls}`);

  // FIG-3, FIG-4: figures are registered and captioned, in order
  each(f, t, /<hl-figure\b[^>]*name="([\w-]+)"/g, (m, l) => { if (!FIGS.has(m[1])) flag(f, l, "FIG-2", `no figure "${m[1]}" in src/figures/index.ts`); });
  each(f, t, /<hl-plot\b([^>]*)>/g, (m, l) => {
    const name = /name="([\w-]+)"/.exec(m[1])?.[1];
    if (!name || !PLOTS.has(name)) flag(f, l, "PLOT-1", `no plot "${name}" in src/plots/index.ts`);
    else if (plotHasControl(name) && !/\blive\b/.test(m[1])) flag(f, l, "LAY-5", `plot "${name}" has a control: add the live attribute`);
  });
  each(f, t, /<figure class="fig[^"]*"[^>]*>([\s\S]*?)<\/figure>/g, (m, l) => {
    if (!/<figcaption>\s*<span class="fig-n">Fig \d+<\/span>/.test(m[1])) flag(f, l, "FIG-4", "a figure needs a figcaption that starts with its number");
  });
  const nums = [...t.matchAll(/class="fig-n">Fig (\d+)</g)].map((m) => +m[1]);
  nums.forEach((n, i) => { if (n !== i + 1) flag(f, lineOf(t, t.indexOf(`Fig ${n}<`)), "FIG-4", `Fig ${n} where Fig ${i + 1} was expected`); });

  // CMP-9: key lines are rare: two per post, one per section, under 30 words
  const keys = [...t.matchAll(/<p class="key">([\s\S]*?)<\/p>/g)];
  if (keys.length > 2) flag(f, lineOf(t, keys[2].index), "CMP-9", `${keys.length} key lines; two per post at most`);
  for (const k of keys) if (words(k[1]) >= 30) flag(f, lineOf(t, k.index), "CMP-9", `key line of ${words(k[1])} words; under 30`);
  t.split(/<h2\b/).forEach((section) => {
    const n = (section.match(/<p class="key">/g) ?? []).length;
    if (n > 1) flag(f, lineOf(t, t.indexOf(section)), "CMP-9", `${n} key lines in one section; one at most`);
  });

  // CMP-1: code width by column
  each(f, t, /<figure class="code([^"]*)"[^>]*>\s*<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g, (m, l) => {
    const max = /\bwide\b/.test(m[1]) ? 88 : 66;
    text(m[2]).split("\n").forEach((line, i) => { if (line.length > max) flag(f, l + i, "CMP-1", `code line of ${line.length} columns; ${max} at most here${max === 66 ? " (or make the block .wide)" : ""}`); });
  });

  // spec/07: scrolly sections
  each(f, t, /<hl-scrolly\b[^>]*scene="([\w-]+)"[^>]*>([\s\S]*?)<\/hl-scrolly>\s*(<[^>]+>)?/g, (m, l) => {
    const sc = SCENES[m[1]];
    if (!sc) { flag(f, l, "SCN-2", `no scene "${m[1]}" in src/scenes/index.ts`); return; }
    if (!/class="scn-caption"/.test(m[3] ?? "")) flag(f, l, "FIG-4", "a scrolly section is followed by its .scn-caption");
    const steps = [...m[2].matchAll(/<div class="step"([^>]*)>([\s\S]*?)<\/div>/g)];
    if (steps.length < 4 || steps.length > 10) flag(f, l, "SCN-1", `${steps.length} steps; a scene has four to ten`);
    const nodeIds = new Set(sc.nodes.map((n) => n.id)), edgeIds = new Set(sc.edges.map((e) => e.id));
    for (const s of steps) {
      const sl = lineOf(t, m.index + m[0].indexOf(s[0])), attrs = s[1], body = s[2];
      const list = (k) => (new RegExp(`data-${k}="([^"]*)"`).exec(attrs)?.[1] ?? "").split(",").map((x) => x.trim()).filter(Boolean);
      for (const k of ["fit", "focus", "show"]) for (const id of list(k)) if (!nodeIds.has(id)) flag(f, sl, "SCN-3", `data-${k} names unknown node "${id}"`);
      for (const k of ["flow", "fail"]) for (const id of list(k)) if (!edgeIds.has(id)) flag(f, sl, "SCN-3", `data-${k} names unknown edge "${id}"`);
      const n = words(body);
      if (n < 25 || n > 120) flag(f, sl, "SCN-3", `step of ${n} words; 25 to 120`);
      // a step names, in words, what it focuses
      const said = text(body).toLowerCase();
      for (const id of list("focus")) {
        const node = sc.nodes.find((x) => x.id === id);
        const word = node?.label.split(/\s+/)[0].toLowerCase();
        if (node && word && !said.includes(word)) flag(f, sl, "SCN-3", `focuses ${id} ("${node.label}") but the text never names it`);
      }
    }
  });
}

if (findings.length) {
  console.log(findings.join("\n"));
  console.log(`\n${findings.length} finding(s)`);
  process.exit(1);
}
console.log("ok");
