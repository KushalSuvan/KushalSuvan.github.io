# 02 · Layout

One grid with named lines carries every page. Content picks a width by class; nothing positions itself.

## LAY-1 · The grid

```
| gutter | margin |      text (38rem)      | margin | gutter |
         [wide-start ------------------------- wide-end]   (54rem)
[full-start ------------------------------------------ full-end]
```

`main.post` is a CSS grid with columns `[full-start] minmax(var(--gutter),1fr) [wide-start] minmax(0,8rem) [text-start] minmax(0,var(--measure)) [text-end] minmax(0,8rem) [wide-end] minmax(var(--gutter),1fr) [full-end]`. Every child sits in `text` unless it has a width class.

| Class | Columns | For |
| --- | --- | --- |
| (none) | `text` | Prose, lists, small figures, code under 72 columns |
| `.wide` | `wide` | Explainer figures, plots, long code, tables with many columns |
| `.full` | `full` | Scrolly sections, and nothing else |

- **Rejected when:** an element sets its own `max-width`, `margin: auto` or negative margin to escape the grid (sidenotes excepted, `CMP-3`).

## LAY-2 · The measure

`--measure: 38rem` (608px). With the body at 18px Source Serif this is about 68 characters a line. At 17px on phones the column is the viewport minus two gutters.

- **Rejected when:** a prose line runs past 75 characters at any width.

## LAY-3 · Breakpoints

Four, named by what changes, not by device.

| Name | Query | What changes |
| --- | --- | --- |
| narrow | `< 40rem` (640px) | Gutter 16px. Body 17px. Sidenotes collapse inline. Scrolly stacks: canvas on top, text below. |
| medium | `40rem – 73.75rem` | Gutter 24px. Sidenotes still inline. Scrolly goes side by side from 64rem (1024px). |
| wide | `≥ 73.75rem` (1180px) | Sidenotes move to the right margin. |
| wider | `≥ 85rem` (1360px) | The table of contents appears left of the wide column. Below this it would overlap `.wide` exhibits. |

- **Rejected when:** the page scrolls horizontally at any width from 320px up (`pnpm look` fails on this).

## LAY-4 · Vertical rhythm

The prose column is a flow: each block sets only its top margin.

| Between | Space |
| --- | --- |
| Paragraph and paragraph | `1.1em` |
| Anything and `h2` | `--s-7` (48px), `--s-8` above the first `h2` after a full-bleed section |
| `h2` and what follows | `0.6em` |
| `h3` above / below | `2em` / `0.5em` |
| Prose and a figure, plot or code block | `--s-6` (32px), both sides |
| Prose and a `.wide` exhibit | `--s-7` both sides |
| Prose and a `.full` section | `--s-9` both sides |

## LAY-5 · Aspect ratios reserve space

Every exhibit reserves its box before its script runs, so nothing shifts (`PERF-2`).

| Exhibit | Ratio |
| --- | --- |
| Figure | 5:4 (hairline's 400 × 320) |
| Plot | 16:9 on `.wide`, 4:3 in `text` and on narrow |
| Scrolly canvas | The sticky viewport box (`LAY-6`) |

## LAY-6 · The scrolly section

A `.full` section with two areas:

- **≥ 64rem:** text column `26rem` on the left (from `wide-start`), canvas sticky on the right, `top: 0; height: 100svh`. Each step is at least `85svh` tall with its text vertically centred, so one step is read at a time.
- **< 64rem:** canvas sticky at the top, `height: 55svh`; steps scroll over the lower part as cards on `--paper-2` with a 1px `--ink-lo` border, each at least `70svh` apart. The card never covers the canvas's upper 55svh.

Before the first step and after the last, the section has `--s-9` of paper so the canvas enters and leaves cleanly.
