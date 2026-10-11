# 03 · Typography

## TYPE-1 · Three voices

| Voice | Family | Token | Used for |
| --- | --- | --- | --- |
| Author | Source Serif 4 (variable weight) | `--font-text` | Prose, dek, sidenotes, quotes |
| Structure | Inter (variable) | `--font-ui` | Post title, headings, captions, navigation, buttons, table headers |
| Machine | JetBrains Mono (variable) | `--font-mono` | Code, labels inside diagrams, plot ticks, read-outs, figure numbers, kbd |

Self-hosted from `@fontsource-variable/*` (`wght` builds), `font-display: swap`. The serif's optical-size build is 2.4× larger (122 kB against 51 kB for the Latin roman) and is not used. No other family, no other weight axis, no italic for Inter or the mono.

- **Rejected when:** a fourth family appears; a label inside a diagram or plot is not mono (`P-4`).

## TYPE-2 · The scale

| Role | Voice | Size (wide → narrow) | Line height | Weight | Other |
| --- | --- | --- | --- | --- | --- |
| Title (`h1`) | ui | `clamp(2rem, 1.3rem + 2.6vw, 3rem)` | 1.08 | 650 | tracking −0.022em, `text-wrap: balance` |
| Dek | text | 1.3125rem → 1.1875rem | 1.45 | 400 | `--ink-2` |
| `h2` | ui | 1.5rem → 1.375rem | 1.25 | 600 | tracking −0.012em |
| `h3` | ui | 1.1875rem | 1.35 | 600 | |
| Body | text | 1.125rem → 1.0625rem | 1.65 | 400 | `text-wrap: pretty`, hyphens auto on narrow |
| Sidenote, footnote | text | 0.875rem | 1.5 | 400 | `--ink-2` |
| Caption | ui | 0.875rem | 1.45 | 400 | `--ink-2`; the figure number in mono |
| Meta (date, reading time) | ui | 0.8125rem | 1.4 | 450 | `--ink-3`, tabular numbers |
| Code block | mono | 0.875rem → 0.8125rem | 1.6 | 400 | ligatures off |
| Inline code | mono | 0.88em | inherit | 400 | `--paper-2` fill, `--radius-1` |
| Diagram label | mono | 12px | 1.3 | 450, 600 when focused | never scales with zoom |
| Tick, read-out | mono | 11.5px | 1 | 400 | `--ink-3`, tracking 0.04em, lowercase |

Sizes inside drawings are fixed pixels, not rems, and do not scale with the drawing: labels are an HTML or pixel-viewBox layer (`SCN-6`, `PLOT-2`).

- **Rejected when:** a size that is not in this table appears; text inside an exhibit renders under 11px at any width.

## TYPE-3 · Numerals

- Prose: proportional old-style (`font-variant-numeric: oldstyle-nums proportional-nums`), so numbers sit in the sentence.
- Tables, plots, read-outs, meta, anything compared or aligned: tabular lining (`lining-nums tabular-nums`).
- Units: a thin non-breaking space between a number and its unit (`40 ms`, `3.2 GB`). The multiplication sign is `×`, the minus is `−` (U+2212), ranges use an en dash (`10–20`).

## TYPE-4 · Headings

- One `h1` per page: the post title. Sections are `h2`, subsections `h3`. No `h4`: a section that needs one is two sections.
- Every `h2` and `h3` gets an `id` and a hover anchor (`#`, `--ink-3`, in the left margin on wide).
- Headings are sentences in sentence case, without a final full stop.

## TYPE-5 · Links

- Underlined, `text-decoration-thickness: 1px`, `text-underline-offset: 0.2em`, colour `--ink-mid`; on hover and focus, `--ink`. The text itself stays `--ink`.
- External links get no icon. A link to a figure or section (`Fig 3`, `§ Retries`) is a cross-reference (`CMP-7`).

## TYPE-6 · Emphasis

Italic serif for emphasis and for terms at first definition. Bold only for the term in a definition list or a warning's first words. Never underline for emphasis, never all caps in prose. Small caps are not used.
