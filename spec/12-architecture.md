# 12 · Architecture

## ARCH-1 · Stack

Vite, TypeScript, plain HTML posts, custom elements. No UI framework: the exhibits are custom elements, which work the same in a later MDX or Astro setup if posts outgrow hand-written HTML (status.md).

## ARCH-2 · Files

```
spec/                     this spec
posts/<slug>/index.html   one post; posts/specimen/ is the reference page
data/<name>.json          a run's real output a post shows, with its provenance (PLOT-9)
index.html                the index page (READ-4)
src/main.ts               the one entry every page loads: fonts, styles, elements
src/styles/tokens.css     every token (TOK-1); the only file with colours
src/styles/base.css       reset, grid, typography, header, footer, contents, index
src/styles/exhibits.css   the figure frame, <hl-figure>, <hl-plot>, the scrolly section
src/styles/prose.css      code, sidenotes, callouts, tables, math, cross-references
src/hairline/             hairline's core, vendored unchanged (MIT) — never edit; SHA256SUMS guards it
src/engine/shapes.ts      the system shape vocabulary and the KINDS table (LINE-3)
src/engine/route.ts       edges on the ground: routes, points along them, their paths (LINE-4)
src/engine/camera.ts      fitting a figure in its frame; the scrolly views, framing, origin (LINE-5, SCN-4)
src/engine/text-layer.ts  text as a figure's subject (FIG-7)
src/engine/labels.ts      label placement (SCN-6)
src/engine/scene.ts       the scrolly canvas: state and drawing, on the four above (07)
src/engine/plot.ts        the plot engine (08)
src/elements/             <hl-figure>, <hl-plot>, <hl-scrolly>; parts.ts (shared DOM); code.ts; page.ts
src/figures/<name>.ts     one figure each + index.ts registry (06)
src/scenes/<name>.ts      one scene each + index.ts registry (07)
src/plots/<name>.ts       one plot each + index.ts registry (08)
scripts/check.mjs         static rule checks
scripts/look.mjs          screenshots and runtime checks
scripts/same.mjs          compares two sets of screenshots (ARCH-6)
scripts/tokens.mjs        token heat markup from a data file (PLOT-9)
scripts/feed.mjs          the RSS feed, emitted by the build as /rss.xml (READ-6)
vite.config.ts            the pages, and the plugin that preloads the four Latin fonts
```

The engine keeps geometry pure: `route.ts`, `camera.ts`, `labels.ts` and `shapes.ts` touch no DOM, so they can be reasoned about, and later tested or prerendered, alone. DOM writes live in `scene.ts`, `plot.ts` and the elements.

Every page's `<head>` has one inline line before the module script: it reads the saved theme from `localStorage` so the page never paints in the wrong theme. It is the only inline script allowed.

- **Rejected when:** a file in `src/hairline/` is edited (extend in `src/engine/` instead); a post loads a script other than `src/main.ts`.

## ARCH-3 · Elements

| Element | Attributes | Does |
| --- | --- | --- |
| `<hl-figure>` | `name`, `intensity`, `control`, `unit`, `label` | Mounts a registered figure, adds the read-out and the optional slider |
| `<hl-scrolly>` | `scene` | Builds the sticky canvas beside its `.step` children and binds steps to scene states |
| `<hl-plot>` | `name` | Draws a registered plot at pixel size, with hover read-out and its control |

Elements mount on connect and destroy everything on disconnect. They reserve their box in CSS, before they are defined.

## ARCH-4 · Budgets

| What | Budget (gzip) |
| --- | --- |
| JavaScript per page | ≤ 60 kB |
| CSS per page | ≤ 15 kB |
| Fonts per page | ≤ 220 kB woff2: four Latin files (serif roman and italic, sans, mono) and the small Greek subsets a post's symbols pull in (ρ, λ, μ) |
| Layout shift | CLS 0: exhibits reserve their box in CSS, and the four Latin fonts are preloaded so text does not reflow when they arrive |

`pnpm look` reports the page's transfer sizes and fails over budget.

## ARCH-5 · The loop for making content

1. Write or change the post, figure, scene or plot.
2. `pnpm check` — must print `ok`.
3. `pnpm look <slug>` — builds, serves the build, and writes `shots/<slug>/*.png`: the first screen and the full page in wide light, wide dark, narrow light, narrow dark and reduced motion; every scrolly step at both layouts; explore; each exhibit close up, with plots hovered; print. It prints the read-outs it saw and runtime findings. `--only steps,exhibits` limits it while iterating. It exits non-zero on console errors, horizontal overflow, layout shift, missing captions or budgets.
4. Open the PNGs. Answer [checklist.md](checklist.md).
5. Commit the work with any spec change it needed.

## ARCH-6 · Cleanup passes

The code is refactored on purpose, regularly, not only when something breaks. A cleanup pass is due after a batch of content work, or as soon as any of these is true:

- a source file passes about 250 lines, or one function does more than one job;
- the same few lines appear in two places;
- a name no longer says what the thing does, or a comment explains what the code could say;
- code, a style or a file nothing uses.

A pass changes structure, never behaviour, and proves it:

1. `pnpm look specimen --still --out before` — before touching anything. `--still` takes every picture under reduced motion, so unchanged code gives the same pictures.
2. Refactor. Keep the pure modules pure (ARCH-2); move shared DOM into `src/elements/parts.ts`.
3. `pnpm check`, `pnpm build`, then `pnpm look specimen --still --out after`.
4. `pnpm same before after` must print `same`. A changed picture means behaviour changed: find out why, then fix the refactor, or split the behaviour change into its own commit with its own screenshots.
5. Update this chapter's file list and spec/status.md if files moved.

Behaviour changes found during a pass (a bug, a better rule) are noted and done after the pass, never inside it.

## ARCH-7 · Publishing

The site is published to GitHub Pages from the public repo `KushalSuvan/KushalSuvan.github.io` by `.github/workflows/deploy.yml` on every push to `main`: `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm build`, upload `dist/`.

- **Reference pages are never published.** `posts/specimen/` is built only with `BLOG_DRAFTS=1`, which `pnpm look` sets; the production build leaves it out, and the index does not list it.
- **Nothing private.** This repo is public. Data files say where a run came from only as "the private research repository"; paths, notebook names, experiment IDs, the research repo's name and its account stay private. `pnpm check` scans every tracked file and fails on them. Notes that need them live in `.private/` (git-ignored).
- **No dead links.** A link to something not yet built (the feed, a mail address) is left out, not stubbed.

