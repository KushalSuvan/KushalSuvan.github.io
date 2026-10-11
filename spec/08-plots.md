# 08 · Plots

Plots are the line language applied to numbers: flat, orthographic, to scale. Isometric depth is for things, never for quantities (`P-5`).

## PLOT-1 · The module

A plot is `src/plots/<name>.ts` exporting `definePlot({...})`, registered in `src/plots/index.ts`. It declares its axes, its series as functions or arrays, optional annotations, and, for a live plot, its one control. The engine (`src/engine/plot.ts`) draws it. Markup:

```html
<figure class="fig wide" id="fig-queue">
  <hl-plot name="queue" live></hl-plot>
  <figcaption><span class="fig-n">Fig 4</span> Waiting time explodes as load nears one.</figcaption>
</figure>
```

`live` is required when the plot has a control: it reserves the control's row before the script runs (`LAY-5`).

## PLOT-2 · Pixels, not viewBox

A plot's svg viewBox is its own pixel size, recomputed on resize, so ticks and labels stay 11.5px and strokes stay hairlines at every width. The plot reserves its ratio (`LAY-5`) before drawing.

## PLOT-3 · Axes

- No frame, no y axis line. The x axis is one `--ink-mid` line at the baseline.
- Grid: horizontal lines only, `--ink-lo`, at the y ticks. No vertical grid.
- Ticks: 4–6 per axis, round numbers, mono 11.5px `--ink-3`, tabular. The y ticks sit inside the plot area, left aligned, just above their grid line, so the plot uses its full width.
- Axis titles: none on the axes. The x unit goes after the last x tick (`0.8 ρ`); the y unit after the top y tick (`40 ms`). The caption says what the axes are.
- Log scales say so in the top y tick (`1000 ms log`), and tick at powers of ten.
- **Rejected when:** an axis is truncated without a break mark and a sentence in the caption; a y axis on a quantity that sums from zero does not start at zero.

## PLOT-4 · Series

Series are told apart by weight and dash, and named by direct labels at their right end, never by a legend. The right margin is sized from the longest label, so keep labels to a few words.

| Series | Stroke |
| --- | --- |
| The one the paragraph is about | `--ink`, 1.5px |
| A comparison | `--ink-3`, 1.25px |
| A second comparison | `--ink-3`, 1.25px, dashed `4 4` |
| A reference (a limit, a target, a model) | `--ink-mid`, 1px, dotted `1 3` |
| What fails or crosses a limit | `--signal`, only the part past the limit |

At most four series. More is small multiples: the same plot repeated, one series each, on shared axes.

## PLOT-5 · Marks

- Points: dots 2.5px radius, `dot` classes. Bars: outlined plates (`--ink-3` stroke, paper fill, `--radius-1` top corners), never solid fills.
- Areas (a band between p50 and p99): no fill; draw the two edge lines and a `lo` hatch only if the band itself is the point.

## PLOT-6 · Annotation

One annotation per plot carries the point: a short `--ink-mid` leader line to the mark, the words in mono 12px `--ink`, a few words long (`p99 = 4.6 × mean`). The highlight dot on the annotated point is `hi`.

## PLOT-7 · Live plots

A live plot has one control, a slider labelled with the variable and its value in its unit (`load ρ 0.80`). Moving it springs the dependent marks to their new values (`MOT-1`). Hovering the plot snaps a vertical `--ink-mid` rule to the nearest x and writes the values to the read-out, top right, mono: `ρ 0.80 · mean 5.0 · p99 23.0`. Rest shows the default value, chosen to make the caption's point.

## PLOT-8 · Data honesty

- Every plotted dataset that is not a formula names its source in the caption, with a link.
- A formula-driven plot shows the formula in the text or a sidenote.
- Numbers are rounded to the precision that is real; the read-out uses the same precision as the ticks plus one digit.

## PLOT-9 · Token heat

Text a model wrote, each token tinted by a quantity measured as it was written (its entropy, in nats). It is evidence, not illustration: the tokens and values are a run's real output.

- **Data:** a JSON file in `data/`, with the model, the decoding, the unit, and the paths of the run and the notebook that made it (`data/doubt-qa-entropy.json` is the example). Never retype values.
- **Markup:** generated, never hand-written: `node scripts/tokens.mjs data/<file>.json [indices] [--legend]` prints static HTML to paste inside a `figure.fig`. It reads without JavaScript, prints, and survives feeds.
- **Look:** mono (the machine's voice), the model's name above in 11.5px `--ink-3`, questions in `--ink-2` after a `q`, answers in `--ink` after an `a`, wrapped lines hanging under the text. Heat in 12 steps of half a nat, 6 nats and over full, from the signal scale (TOK-4). Line breaks are never tinted. A legend `entropy, nats 0 … 6` closes the exhibit.
- **Hover:** each token's tooltip gives its exact value, and the top alternatives when the run recorded them (`3.31 nats · have 14% · construct 9% · try 9%`).
- **Rejected when:** values are rounded into the text or retyped; the colour is set in the markup; a caption claims more than the values show (check "hottest", "as hot as" against the data).

