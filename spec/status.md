# Status

What enforces each rule today, and what is still planned. Update this file in the same change that implements or enforces a rule. As of 2026-10-07.

## Enforced by `pnpm check`

| Rule | What it catches |
| --- | --- |
| ARCH-2 | Edits to `src/hairline/` (against `SHA256SUMS`); pages loading scripts other than `src/main.ts` |
| TOK-1 | Hex, `rgb()`, `hsl()`, `oklch()` colours outside `tokens.css` |
| LINE-1 | Exhibits or the engine setting stroke, fill, opacity, width or filter directly |
| MOT-6 | `setTimeout`, `setInterval`, `requestAnimationFrame`, keyframes in exhibits or the engine |
| LINE-6, FIG-1 | Text elements in figure or scene drawings; figures measuring the DOM or adding pointer listeners |
| FIG-2 | Figures over 200 lines; posts naming unregistered figures |
| LINE-3, SCN-2 | Unknown node kinds, labels over 24 characters, edges to unknown nodes, logic in scene files |
| SCN-1, SCN-3 | Step count outside 4–10; step text outside 25–120 words; unknown ids in step attributes; a focused node its text never names |
| PLOT-1, PLOT-4, LAY-5 | Unregistered plots; more than four series; a plot with a control and no `live` |
| FIG-4 | Figures without a numbered caption; numbers out of order; scrolly sections without `.scn-caption` |
| TYPE-4, READ-1 | Not exactly one `h1`; any `h4`; a post header without dek or meta |
| CMP-1 | Code lines over 66 columns in `text`, 88 in `.wide` |
| CMP-9 | More than two key lines in a post, more than one in a section, or one of 30 words or more |
| LAY-1, A11Y-7 | Inline styles; images without `alt`; a missing `lang` |

## Enforced by `pnpm look`

| Rule | What it catches |
| --- | --- |
| LAY-3 | Horizontal overflow at 320, 390, 768, 1024, 1280, 1440 and 1920px |
| LAY-1, LAY-2 | A prose column narrower than the viewport less two gutters (up to the measure), at the same widths |
| LAY-5 | Any layout shift on load, with the elements that moved |
| ARCH-4 | JS, CSS and font bytes over budget, naming the font files that loaded |
| FIG-4 | Missing captions and figure numbers out of order, in the rendered page |
| P-7 | Console errors and warnings, page errors, in every picture |

## Built into the engine

MOT-1, MOT-3, MOT-5, MOT-6, MOT-7 (clocks, scroll as a discrete input, packets, one loop, reduced motion); SCN-4 to SCN-7 (camera, explore, label placement, chrome); PLOT-2 to PLOT-7 (pixel viewBox, axes, direct labels, annotation, hover read-out, spring on the control); LINE-4, LINE-5 (edges, iso and plan cameras).

## Checked by eye

Everything in [checklist.md](checklist.md), from the screenshots.

## Planned, not built

| Rule | What is missing |
| --- | --- |
| SCN-8, A11Y-6 | Static SVG per scrolly step, prerendered at build, for print, RSS and no-JS. Today a reader without JS sees the step text and no canvas. |
| A11Y-6 | A print stylesheet. `look` takes a print picture, but nothing is styled for print yet. |
| A11Y-2 | A visually hidden data table after each plot. |
| PLOT-1 | Plots rendered without JS. Today a plot is an empty reserved box without JS. |
| CMP-1 | Highlighting at build time. Today a small in-browser highlighter covers ts, go, sql and sh. |
| CMP-6 | KaTeX at build time. Today display formulas are Unicode in `.eq`. |
| CMP-7 | Hover previews of cross-referenced exhibits. The flash on arrival works. |
| READ-6 | Social images from the hero's rest pose; the RSS feed (not linked until it exists). |
| READ-4 | The archive link (the index is the only list of posts so far). |
| FIG-6 | More explainer figures. `doubt` is the first real one; `gem` and `stack` are placeholders from the prototype. New ones follow hairline's `hairline-create` rules and FIG-1. |
