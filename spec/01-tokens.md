# 01 · Tokens

Every colour, size, duration and radius used anywhere comes from `src/styles/tokens.css`. No other file contains a hex colour, an `rgb()` or a raw duration. `pnpm check` enforces this (`TOK-1`).

## TOK-1 · One file of tokens

- **Do:** add a token to `tokens.css`, with a light and a dark value, before using a new value.
- **Rejected when:** a hex, `rgb()`, `hsl()` or named colour appears outside `tokens.css`; a figure or scene sets a colour, opacity or stroke width of its own.

## TOK-2 · Paper and ink

| Token | Role | Light | Dark | Contrast on paper (light / dark) |
| --- | --- | --- | --- | --- |
| `--paper` | Page and plate fill | `#ffffff` | `#08090a` | — |
| `--paper-2` | Code blocks, the scrolly text cards on mobile | `#f7f7f8` | `#111214` | — |
| `--ink` | Body text, `hi` strokes, the one highlight | `#232327` | `#d0d6e0` | 15.7 / 13.6 |
| `--ink-2` | Secondary text: dek, captions, sidenotes | `#5f5f68` | `#9a9ca4` | 6.3 / 7.3 |
| `--ink-3` | Read-outs, ticks, meta; the `edge` stroke | `#8a8a93` | `#6f717a` | 3.4 / 4.1 |
| `--ink-mid` | `mid` strokes: every other line | `#c3c3c9` | `#3e3e44` | 1.8 / 1.9 |
| `--ink-lo` | `lo` strokes: creases, grid lines, rules | `#e0e0e4` | `#29292d` | 1.3 / 1.4 |

The four stroke weights map onto hairline's theme properties in `tokens.css` (`--hairline-hi: var(--ink)`, `--hairline-edge: var(--ink-3)`, and so on). Our `edge` is darker than hairline's own (`#a4a4ac`, 2.5:1) so that silhouettes reach 3:1 against paper, the WCAG minimum for graphics that carry meaning (`A11Y-1`).

- **Do:** use `--ink-3` or darker for any stroke or text a reader must see to understand the exhibit. `mid` and `lo` are for construction, creases and what recedes.
- **Rejected when:** information rests only on a `mid` or `lo` stroke; text is set in `--ink-3` below 11px or `--ink-mid` at any size.

## TOK-3 · Theme

Light is the default. Dark applies when the page's `color-scheme` is dark (via `prefers-color-scheme`) unless `<html data-theme="light">`, and always under `<html data-theme="dark">`. The toggle in the site header writes `data-theme` and remembers it.

- **Rejected when:** anything is unreadable or the wrong weight in either theme (checked by `pnpm look`, which shoots both).

## TOK-4 · Signal: the one hue

| Token | Light | Dark |
| --- | --- | --- |
| `--signal` | `#c4391d` | `#ff7a5c` |
| `--heat` | `#c4391d` | `#a12d18` |
| `--heat-max` | `85%` | `85%` |

Signal marks what fails, what is saturated or what is hot: a dropped request, a timed-out edge, the p99 that blew up, the overloaded node. It is never decoration and never "the brand colour".

- **Do:** use it on at most one thing per frame (a node and its edge count as one thing). Pair it with a second cue that survives greyscale: a dash, a dot, a word in the read-out.
- **Rejected when:** two unrelated things are signal at once; signal is the only cue; signal is used for "active" or "selected" (that is `--ink`).

**Signal as a scale.** One exhibit may use the hue as a sequential scale for one quantity that means heat (token entropy, PLOT-9): `--heat` mixed into `--paper`, up to `--heat-max`. `--heat` is the signal in light mode and a deeper `#a12d18` in dark, so `--ink` text on the hottest step keeps at least 4.5:1 in both themes (at 85%: light about 4.9, dark about 5.5; estimated by mixing in linear light, so recheck after changing either colour). Nothing else in that exhibit is signal, and the exhibit carries its legend.

## TOK-5 · Spacing

A 4px base. Use only these steps:

| Token | px | Typical use |
| --- | --- | --- |
| `--s-1` | 4 | Icon gaps, tick offsets |
| `--s-2` | 8 | Inside controls |
| `--s-3` | 12 | Caption to figure |
| `--s-4` | 16 | The mobile gutter; paragraph gap in sidenotes |
| `--s-5` | 24 | Between list items with paragraphs |
| `--s-6` | 32 | Between figure and the next paragraph |
| `--s-7` | 48 | Before an `h2` |
| `--s-8` | 64 | Around wide exhibits |
| `--s-9` | 96 | Around full-bleed sections |
| `--s-10` | 128 | Page top and bottom |

## TOK-6 · Radii and lines

- `--radius-1: 4px` (inline code, kbd), `--radius-2: 8px` (code blocks, controls, cards). Nothing is fully rounded except dots.
- UI hairlines (rules, borders, underlines) are `1px` in `--ink-lo`, or `--ink-mid` when they must be seen. Drawings use `--hairline-stroke` (0.9px, non-scaling) and never set their own width.

## TOK-7 · Motion tokens

Defined here, explained in [05-motion](05-motion.md).

| Token | Value |
| --- | --- |
| `--ease-lift` | `cubic-bezier(.32,.72,0,1)` |
| `--ease-stroke` | `cubic-bezier(.5,0,.1,1)` |
| `--dur-ui` | `160ms` |
| `--dur-stroke` | `260ms` |
| `--dur-lift` | `700ms` |
