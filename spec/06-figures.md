# 06 · Figures

A figure is one hairline object that answers the pointer, in a 400 × 320 box. Two kinds use the same engine.

| Kind | Purpose | Slider | Placement |
| --- | --- | --- | --- |
| Ornament | Mood, the post's hero, a section break, an empty state | none | `text` or the post header |
| Explainer | One mechanism with one variable the reader can turn | one, with a unit | `text` or `.wide` |

## FIG-1 · Hairline's ten rules apply

A figure obeys the ten rules of hairline's `hairline-create` skill: hit areas don't move, stagger by distance, clamp the reach, the stroke is the only highlight, rest is designed, construction stays honest, loops sleep offscreen, two clocks, round every corner, no words inside the figure. Our versions are `LINE-*` and `MOT-*`; where they differ, this spec wins.

## FIG-2 · The module

A figure is `src/figures/<name>.ts` exporting `mount: FigureMount` from `src/hairline/stage.ts`: `mount({ stage, svg, read }, value) → { set(value), destroy() }`, at most 200 lines, no state outside `mount`. Register it in `src/figures/index.ts` with its label, its rest read-out and its `range` (the figure's own value at intensity 0, 0.5 and 1).

## FIG-3 · Markup

```html
<figure class="fig" id="fig-stack">
  <hl-figure name="stack" intensity="0.5"></hl-figure>
  <figcaption><span class="fig-n">Fig 1</span> Nine slabs of a log …</figcaption>
</figure>
```

- `<hl-figure>` reserves the 5:4 box, mounts the figure when the element connects and destroys it when it disconnects.
- The read-out appears top right of the figure box, mono 11.5px `--ink-3`, and says `rest` at rest. An ambient figure, one that moves on its own, says its running quantity instead (`doubt 2.48 bits`, hairline's `rate 1.00×`).
- An explainer adds `control` (`<hl-figure name="gem" control="turn" unit="°">`): a range input under the figure, labelled with the variable and its current value in the figure's own unit, not 0–1.

## FIG-4 · Captions

Every figure, plot and scrolly section has a caption. It starts with the number in mono (`Fig 3`), then one or two sentences in the structure voice that say what to notice, not what it is. Numbering is per post, in order, across figures, plots and scenes.

- **Rejected when:** a caption describes the picture ("A diagram of…") instead of the point; a number is skipped or repeated.

## FIG-5 · Rest

The figure's rest pose is its thumbnail and the post's social image. Judge the rest pose at 240px wide before anything else: the object must be recognisable and one bright mark must say where to look.

## FIG-6 · One idea, one variable

A figure shows one mechanism. If the text needs a second variable, it needs a second figure or a plot.

## FIG-7 · Text as the subject

When what a figure shows is text a machine writes (tokens, log lines, a query), the text is the subject, not a label, and LINE-6's ban on words does not apply to it. It is set with `textLayer` (`src/engine/text-layer.ts`): mono 12px in an HTML layer over the drawing, positioned in viewBox points, never drawn as paths and never rotated. Its classes carry its state: `.ft` written (`--ink`), `.ft.next` being decided (600), `.ft.ghost` and `.ft.ghost.far` the rivals (`--ink-3`, `--ink-mid`).

Uncertainty is drawn with the ink weights, never with blur, opacity or filters: rivals set over the chosen text in fainter weights, offset by how uncertain it is, and a dashed (`dash`) outline for what is not yet decided. The example is `src/figures/doubt.ts`.

- **Rejected when:** text names a shape in the drawing (that is a label, and labels belong to scenes); a fuzzy look comes from `filter`, `opacity` or `text-shadow`; the text is too dense to read at the narrow width (judge `ex-narrow-*`).
