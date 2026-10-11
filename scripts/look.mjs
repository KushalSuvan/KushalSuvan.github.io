#!/usr/bin/env node
/**
 * The look (spec/12-architecture.md, ARCH-5): builds the site, serves the
 * build, and for one page writes the screenshots the checklist is answered
 * from, plus the runtime checks a script can make.
 *
 *   pnpm look [slug] [--only wide,narrow,dark,reduced,steps,exhibits,print] [--no-build] [--still] [--out name]
 *
 * --still takes every picture under reduced motion, so nothing is caught
 * mid-flight and two runs of unchanged code give the same pictures; with
 * --out it is how a refactor is proven to change nothing (ARCH-6).
 *
 * Writes shots/<slug>/*.png. Exits 1 on a console error or warning, a page
 * error, horizontal overflow at any width, layout shift, a missing caption,
 * or a page over budget.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { parseArgs } from "node:util";
import { preview } from "vite";
import { chromium } from "playwright-core";

const ROOT = resolve(import.meta.dirname, "..");
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { only: { type: "string" }, "no-build": { type: "boolean" }, still: { type: "boolean" }, out: { type: "string" } },
});
const slug = positionals[0] ?? "specimen";
const only = values.only ? new Set(values.only.split(",")) : null;
const want = (k) => !only || only.has(k);
const pathFor = slug === "index" ? "/" : `/posts/${slug}/`;
const out = join(ROOT, "shots", values.out ?? slug);
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const BUDGET = { js: 60_000, css: 15_000, fonts: 220_000 };
const failures = [];
const note = (m) => console.log("  " + m);
const fail = (m) => { failures.push(m); console.log("✗ " + m); };

if (!values["no-build"]) {
  console.log("building…");
  execFileSync("pnpm", ["exec", "vite", "build", "--logLevel", "error"], { cwd: ROOT, stdio: "inherit", env: { ...process.env, BLOG_DRAFTS: "1" } });
}

/* budgets: the page's own JS and CSS from the build, gzipped (ARCH-4) */
const html = readFileSync(join(ROOT, "dist", slug === "index" ? "index.html" : `posts/${slug}/index.html`), "utf8");
const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
const gz = (f) => gzipSync(readFileSync(join(ROOT, "dist", f))).length;
const js = assets.filter((a) => a.endsWith(".js")).reduce((s, a) => s + gz(a), 0);
const css = assets.filter((a) => a.endsWith(".css")).reduce((s, a) => s + gz(a), 0);

const server = await preview({ root: ROOT, preview: { port: 4317, strictPort: true }, logLevel: "error" });
const base = "http://localhost:4317";
const browser = await chromium.launch({ channel: "chrome" });

async function open({ width, height, scheme = "light", reduced = false, full = true }) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, colorScheme: scheme, reducedMotion: reduced || values.still ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  await page.addInitScript(() => {
    window.__cls = 0; window.__shifted = [];
    const name = (n) => n ? (n.tagName ? n.tagName.toLowerCase() + (n.id ? "#" + n.id : n.className && typeof n.className === "string" ? "." + n.className.split(" ")[0] : "") : n.nodeName) : "?";
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; for (const s of e.sources ?? []) window.__shifted.push(name(s.node)); }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(base + pathFor, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  return { ctx, page, errors, full };
}

const report = (name, errors) => { for (const e of new Set(errors)) fail(`${name}: ${e}`); };

/* 1. the full page at each width and theme */
const SHOTS = [
  ["wide-light", { width: 1440, height: 900 }],
  ["wide-dark", { width: 1440, height: 900, scheme: "dark" }, "dark"],
  ["narrow-light", { width: 390, height: 844 }, "narrow"],
  ["narrow-dark", { width: 390, height: 844, scheme: "dark" }, "dark"],
  ["reduced", { width: 1440, height: 900, reduced: true }, "reduced"],
];
for (const [name, opts, key] of SHOTS) {
  if (!want(key ?? "wide")) continue;
  const { ctx, page, errors } = await open(opts);
  // the first screen, then the whole page
  await page.screenshot({ path: join(out, `${name}-top.png`) });
  if (name === "wide-light") {
    const { cls, fontBytes, shifted, fontFiles } = await page.evaluate(() => ({
      cls: window.__cls,
      fontFiles: performance.getEntriesByType("resource").filter((r) => r.name.endsWith(".woff2")).map((r) => `${r.name.split("/").pop().replace(/-[\w-]{8}\.woff2$/, "")} ${((r.encodedBodySize || 0) / 1000).toFixed(1)} kB`),
      shifted: [...new Set(window.__shifted)].slice(0, 6),
      fontBytes: performance.getEntriesByType("resource").filter((r) => r.name.endsWith(".woff2")).reduce((s, r) => s + (r.encodedBodySize || 0), 0),
    }));
    note(`layout shift ${cls.toFixed(4)}`);
    if (cls > 0.001) fail(`layout shift ${cls.toFixed(4)} from ${shifted.join(", ")} (LAY-5: CLS must be 0)`);
    note(`js ${(js / 1000).toFixed(1)} kB · css ${(css / 1000).toFixed(1)} kB · fonts ${(fontBytes / 1000).toFixed(1)} kB (gzip / woff2)`);
    if (js > BUDGET.js) fail(`js ${js} B over budget ${BUDGET.js} (ARCH-4)`);
    if (css > BUDGET.css) fail(`css ${css} B over budget ${BUDGET.css} (ARCH-4)`);
    if (fontBytes > BUDGET.fonts) fail(`fonts ${fontBytes} B over budget ${BUDGET.fonts} (ARCH-4): ${fontFiles.join(", ")}`);

    // captions (FIG-4): every figure has one, every scrolly section is followed by one
    const missing = await page.evaluate(() => [
      ...[...document.querySelectorAll("figure.fig")].filter((f) => !f.querySelector("figcaption")).map((f) => f.id || "figure"),
      ...[...document.querySelectorAll("hl-scrolly")].filter((s) => !s.nextElementSibling?.classList.contains("scn-caption")).map(() => "hl-scrolly"),
    ]);
    for (const m of missing) fail(`no caption: ${m} (FIG-4)`);
    // figure numbers in order (FIG-4)
    const nums = await page.evaluate(() => [...document.querySelectorAll(".fig-n")].map((n) => n.textContent.trim()));
    nums.forEach((n, i) => { if (n !== `Fig ${i + 1}`) fail(`figure number "${n}" where "Fig ${i + 1}" was expected (FIG-4)`); });
  }
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); });
  await page.waitForTimeout(800);
  // which step is active after a scroll-through depends on timing; the step pictures cover each step, so --still masks them here
  await page.screenshot({ path: join(out, `${name}-full.png`), fullPage: true, mask: values.still ? [page.locator("hl-scrolly .scn-steps")] : [] });
  report(name, errors);
  await ctx.close();
}

/* 2. no horizontal scroll from 320px up (LAY-3) */
if (want("wide") || want("narrow")) {
  for (const width of [320, 390, 768, 1024, 1280, 1440, 1920]) {
    const { ctx, page, errors } = await open({ width, height: 900 });
    const over = await page.evaluate(() => {
      const w = document.documentElement.clientWidth;
      const wide = [...document.querySelectorAll("body *")].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > w + 1 && !e.closest("pre, .table, .scn-canvas"); });
      return { scroll: document.documentElement.scrollWidth - w, culprits: wide.slice(0, 3).map((e) => e.tagName.toLowerCase() + (e.className ? "." + String(e.className).split(" ")[0] : "")) };
    });
    if (over.scroll > 0) fail(`horizontal overflow of ${over.scroll}px at ${width}px: ${over.culprits.join(", ")} (LAY-3)`);
    // the prose column is the full width less two gutters, up to the measure (LAY-1, LAY-2)
    const col = await page.evaluate(() => {
      const p = document.querySelector(".post > p"), w = document.documentElement.clientWidth;
      const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--gutter")) || 16;
      const measure = parseFloat(getComputedStyle(document.documentElement).fontSize) * 38;
      return p ? { got: p.getBoundingClientRect().width, want: Math.min(measure, w - 2 * gutter) } : null;
    });
    if (col && col.got < col.want - 2) fail(`prose column ${col.got.toFixed(0)}px at ${width}px where ${col.want.toFixed(0)}px was expected (LAY-1)`);
    report(`${width}px`, errors);
    await ctx.close();
  }
}

/* 3. each scrolly step, as the reader sees it, at both layouts (SCN-8) */
if (want("steps")) {
  for (const [layout, opts] of [["wide", { width: 1440, height: 900 }], ["narrow", { width: 390, height: 844 }]]) {
    const { ctx, page, errors } = await open(opts);
    const count = await page.locator("hl-scrolly .step").count();
    if (!count) { await ctx.close(); break; } // a post without a scrolly section has no steps to take
    for (let i = 0; i < count; i++) {
      await page.evaluate(([i, layout]) => {
        const s = document.querySelectorAll("hl-scrolly .step")[i];
        const r = s.getBoundingClientRect();
        // wide: the step's middle on the middle of the viewport; narrow: the card just under the canvas
        scrollBy(0, layout === "wide" ? r.top + r.height / 2 - innerHeight / 2 : r.top - innerHeight * 0.58);
      }, [i, layout]);
      await page.waitForTimeout(1400);
      const read = await page.locator(".scn-canvas .readout").textContent();
      await page.screenshot({ path: join(out, `step-${layout}-${i + 1}.png`) });
      note(`step ${layout} ${i + 1}: ${read}`);
    }
    // explore: zoom in, then step back to the story
    await page.locator(".scn-explore").click();
    await page.mouse.move(opts.width * 0.7, opts.height * 0.4);
    if (layout === "wide") for (let k = 0; k < 4; k++) await page.mouse.wheel(0, -200);
    else { await page.keyboard.press("+"); await page.keyboard.press("+"); }
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(out, `explore-${layout}.png`) });
    await page.keyboard.press("Escape");
    report(`steps ${layout}`, errors);
    await ctx.close();
  }
}

/* 4. each exhibit close up, wide light and narrow dark, at rest and, for plots, hovered (FIG-5, PLOT-7) */
if (want("exhibits")) {
  for (const [layout, opts] of [["wide", { width: 1440, height: 900 }], ["narrow-dark", { width: 390, height: 844, scheme: "dark" }]]) {
    const { ctx, page, errors } = await open(opts);
    const exhibits = page.locator(".post > figure.fig, .post-head figure.fig, .post > .code, .post > .table, .post > .callout");
    const n = await exhibits.count();
    for (let i = 0; i < n; i++) {
      const el = exhibits.nth(i);
      const id = (await el.getAttribute("id")) ?? `${i + 1}`;
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(900);
      await el.screenshot({ path: join(out, `ex-${layout}-${id}.png`) });
      const plot = el.locator("hl-plot .hl-box");
      if (await plot.count()) {
        const box = await plot.boundingBox();
        await page.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.5);
        await page.waitForTimeout(500);
        await el.screenshot({ path: join(out, `ex-${layout}-${id}-hover.png`) });
        note(`${id} hover: ${await el.locator(".readout").textContent()}`);
        await page.mouse.move(0, 0);
      }
    }
    report(`exhibits ${layout}`, errors);
    await ctx.close();
  }
}

/* 5. print (A11Y-6) */
if (want("print")) {
  const { ctx, page, errors } = await open({ width: 900, height: 1200 });
  await page.emulateMedia({ media: "print" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(out, "print.png"), fullPage: true });
  report("print", errors);
  await ctx.close();
}

await browser.close();
await new Promise((r) => server.httpServer.close(r));

console.log(`\n${readdirSync(out).length} pictures in shots/${values.out ?? slug}/`);
if (failures.length) { console.log(`${failures.length} failure(s)`); process.exit(1); }
console.log("ok");
