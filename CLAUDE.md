# Blog

A research blog, a series on metacognition and doubt in language models, drawn in hairline's line language: line figures, token heat, a scrolly canvas and plots, all from one set of tokens. This repo is public and deploys to https://kushalsuvan.github.io/.

## Before you make or change anything

1. Read `.private/OPERATING.md`: who does what (Kushal writes the words; you build what he asks, exactly that), where the repos, accounts and vault are, how research becomes a post, how to publish and seal it, and the traps already found. It is local only and never committed, because this repo is public; if it is missing, ask Kushal for it.
2. Read `spec/README.md`: the design spec's index. Read the chapters for the exhibit you are making each time; do not rely on memory of them.

## The loop

1. Copy the closest example (the exhibit table in `spec/README.md`; `posts/specimen/` uses every exhibit once).
2. `pnpm check` — static rules. Must print `ok`.
3. `pnpm look <slug>` — builds, serves, and writes screenshots to `shots/<slug>/`, plus runtime checks. Must print `ok`. Use `--only steps,exhibits --no-build` while iterating.
4. Open the screenshots and answer `spec/checklist.md`. Do not call work done without looking.
5. If a rule turned out to be wrong, change the spec in the same change, say why, and update `spec/status.md`.

## Keep it clean

Run a cleanup pass (spec/12-architecture.md, ARCH-6) after a batch of content work, or when a file passes ~250 lines, code is duplicated, or something is unused. Refactor freely, but prove nothing changed: `pnpm look specimen --still --out before`, refactor, `--out after`, then `pnpm same before after` must print `same`.

## Hard rules

- `src/hairline/` is vendored (MIT) and never edited; extend in `src/engine/`.
- Colours exist only in `src/styles/tokens.css`. Drawings set classes, never colours or widths.
- No timers, `requestAnimationFrame` or CSS animations in exhibits or the engine: join the shared loop.
- Every exhibit makes its point at rest, with a numbered caption that says what to notice.

## Commands

`pnpm dev` (http://localhost:5173/posts/specimen/) · `pnpm build` · `pnpm check` · `pnpm look [slug]` · `pnpm same <a> <b>`
