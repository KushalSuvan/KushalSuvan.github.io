# Blog spec

The single source of truth for how this blog looks, moves and reads. It is written for whoever makes content here, human or agent. A new session reads `.private/OPERATING.md` first (local only: roles, repos, publishing, known traps), then this file, then the chapters its work touches.

The look descends from [hairline](https://github.com/lucasmarkes/hairline) (MIT, vendored unchanged in `src/hairline/`): isometric line drawings in one stroke and four ink weights, plates filled with the paper colour, motion on two clocks. This spec extends that language from ornament to a technical blog: prose, code, system diagrams that move with the text, and plots.

## How to use it

1. **Find the exhibit type** in the table below. It names the chapter and the working example.
2. **Read the chapter's rules.** Each rule has an ID (`LINE-3`), what to do, and what gets work rejected. A piece that breaks a rule is not finished.
3. **Copy the closest example**, never start from a blank file.
4. **Check it**: `pnpm check` (static rules), then `pnpm look <slug>` (screenshots and runtime checks). Open the PNGs and answer [checklist.md](checklist.md). Both must print `ok`.
5. **If a rule is wrong, change the spec in the same change** as the work, and say why in the commit. Do not quietly break it.

## Chapters

| # | Chapter | Covers |
| --- | --- | --- |
| 00 | [principles](00-principles.md) | The seven ideas every other rule comes from |
| 01 | [tokens](01-tokens.md) | Colour, ink weights, signal, light/dark, spacing, radii, z |
| 02 | [layout](02-layout.md) | The page grid, measure, widths, breakpoints, rhythm |
| 03 | [typography](03-typography.md) | Three voices, the scale, numerals, links |
| 04 | [line language](04-line-language.md) | Strokes, solids, the shape vocabulary for systems, edges |
| 05 | [motion](05-motion.md) | Two clocks, scroll, durations, reduced motion |
| 06 | [figures](06-figures.md) | Ornament and explainer figures, frames, captions, read-outs |
| 07 | [scrolly canvas](07-scrolly-canvas.md) | The pannable system-design canvas driven by the text |
| 08 | [plots](08-plots.md) | Static and live plots in the same line language |
| 09 | [components](09-components.md) | Code, sidenotes, callouts, tables, math, cross-references |
| 10 | [reading UX](10-reading-ux.md) | Post anatomy, navigation, index, end of post |
| 11 | [accessibility](11-accessibility.md) | Contrast, keyboard, screen readers, reduced motion, print, RSS |
| 12 | [architecture](12-architecture.md) | Files, custom elements, budgets, the check and look scripts, publishing, cleanup |
| — | [checklist.md](checklist.md) | What to answer before a post ships |
| — | [status.md](status.md) | Which rules the code enforces today, and which are still planned |

## Exhibit types

| You want to show | Exhibit | Element | Chapter | Example |
| --- | --- | --- | --- | --- |
| The post's mood, a section break, an empty state | Ornament figure | `<hl-figure>` | 06 | `src/figures/stack.ts` |
| One mechanism, one variable the reader can turn | Explainer figure | `<hl-figure>` | 06 | `src/figures/doubt.ts` |
| Text a machine writes, and how sure it is | Explainer figure with a text layer | `<hl-figure>` | 06 (FIG-7) | `src/figures/doubt.ts` |
| A system's parts and how a request moves through them, told step by step | Scrolly canvas | `<hl-scrolly>` | 07 | `src/scenes/request.ts` |
| A quantity across a variable, fixed | Static plot | `<hl-plot>` | 08 | `src/plots/fanout.ts` |
| A quantity the reader can steer | Live plot | `<hl-plot>` | 08 | `src/plots/queue.ts` |
| Source code | Code block | `<pre><code>` | 09 | `posts/specimen/index.html` |
| An aside that would break the sentence | Sidenote | `.sn` | 09 | same |
| The one sentence to leave a section with | Key line | `p.key` | 09 (CMP-9) | `posts/doubt/index.html` |
| What a model wrote, and how unsure it was at each token | Token heat | generated `div.tokens` | 08 (PLOT-9) | `posts/doubt/` Figs 2–3 |

`posts/specimen/` uses every exhibit type once. It is the reference page: if a change to the spec or the engine changes how the specimen looks, the change is reviewed on its screenshots.

## Vocabulary

- **Paper**: the page background. Plates in drawings are filled with it.
- **Ink**: the four stroke weights, `hi`, `edge`, `mid`, `lo`, from most to least present.
- **Signal**: the one hue, kept for what fails or is hot (`TOK-4`).
- **Rest**: how an exhibit looks before anyone touches or scrolls to it. Rest is the thumbnail, the print version and the reduced-motion version.
- **Read-out**: the short mono caption an interactive exhibit writes about what is under the pointer (`rest`, `ρ 0.80`).
- **Step**: one block of text in a scrolly section, bound to one camera and one focus on the canvas.
- **Machine layer**: everything the computer says (code, labels in diagrams, ticks, read-outs). It is always mono.
