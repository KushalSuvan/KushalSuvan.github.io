# 07 · Scrolly canvas

The canvas is how this blog explains systems. One world holds the whole system; the text is a sequence of steps; each step moves the camera to the part it talks about, focuses the parts it names, and runs the flows it describes. The reader scrolls; the picture follows. When they want to look around, they unlock it and pan.

## SCN-1 · When to use it

Use a canvas when a section walks through a system in four to ten steps and every step points at a different part of the same picture. Under four steps, use a figure or a static diagram. Over ten, split the section: two scenes, or two posts.

- **Rejected when:** steps do not change the camera, the focus or the flow; the canvas is used for a picture that never moves.

## SCN-2 · The scene file

A scene is `src/scenes/<name>.ts`, data only, exported through `src/scenes/index.ts`:

```ts
export default defineScene({
  id: "request",
  label: "A read request from a browser to the database and back.",  // the accessible name
  nodes: [
    { id: "client", kind: "client",  at: [0, 4],  label: "browser" },
    { id: "lb",     kind: "edge",    at: [5, 4],  label: "load balancer" },
    { id: "api",    kind: "service", at: [10, 2], label: "api ×3" },
    { id: "db",     kind: "store",   at: [16, 4], label: "postgres" },
    { id: "vpc",    kind: "zone",    from: [4, 0], to: [19, 9], label: "us-east-1" },
  ],
  edges: [
    { id: "c-lb",   from: "client", to: "lb",  kind: "sync" },
    { id: "api-db", from: "api",    to: "db",  kind: "sync", via: [[14, 3]] },
  ],
});
```

- `at` is the footprint's back corner, in cells (24 world units). Sizes come from the kind (`LINE-3`); `size: [w, d]` overrides the footprint for one node.
- `via` lists elbow points in cells; edges otherwise route with one elbow, x first.
- Labels are lowercase identifiers or short noun phrases, what an engineer would write on a whiteboard: `api ×3`, `redis`, `orders queue`.
- **Rejected when:** a scene file contains logic, colours, or text longer than 24 characters in a label.

## SCN-3 · Steps

Steps are written in the post, inside the element, as plain HTML. The text is the content; the attributes drive the canvas.

```html
<hl-scrolly scene="request" class="full">
  <div class="scn-steps">
    <div class="step" data-fit="client,lb" data-view="plan" data-focus="client" data-flow="c-lb">
      <p>It starts in the browser…</p>
    </div>
    …
  </div>
</hl-scrolly>
<p class="scn-caption"><span class="fig-n">Fig 2</span>Solid lines wait for an answer…</p>
```

The steps sit inside `.scn-steps`; the element adds the canvas before it. The caption is the paragraph right after the element.

| Attribute | Value | Default |
| --- | --- | --- |
| `data-fit` | Node ids the camera frames | all shown nodes |
| `data-view` | `iso` or `plan` (`LINE-5`) | `iso` |
| `data-focus` | Node ids drawn `hi`, labels at full weight | none |
| `data-flow` | Edge ids with packets running | none |
| `data-fail` | One edge id: drawn `sig`, its packets stop half-way | none |
| `data-show` | Node ids that exist from this step on; the rest are not drawn yet | all |
| `data-read` | The read-out for this step, a few mono words | `n / total` |

- One step is one paragraph, two at most, 25–120 words: enough to say one thing, short enough to read before the camera has landed. It names, in words, everything it focuses.
- **Rejected when:** a step focuses something its text does not name; a step's text only makes sense while looking at the canvas (it must survive print, `A11Y-6`).

## SCN-4 · Camera

The camera frames the `data-fit` nodes with 12% padding, zoom clamped between 0.5× and 3× of the scene's overview scale. It tweens camera centre, zoom and elevation together on the discrete clock (`MOT-3`). A node that appears with `data-show` grows up from its footprint over the same 700ms.

## SCN-5 · Explore

A button in the canvas's bottom-right corner, `explore`, unlocks the canvas:

- drag pans, the wheel or a pinch zooms about the pointer, the arrow keys pan and `+` / `−` zoom;
- page scroll is not captured while exploring on desktop; on narrow screens explore takes the whole viewport, and `done` or `Esc` gives it back;
- leaving explore, or scrolling to another step, tweens the camera back to the step.

Explore never changes what is focused or flowing; it only moves the camera.

## SCN-6 · Labels

Labels are an HTML layer over the drawing, positioned from the projection every frame, so they stay 12px mono at any zoom and are selectable text.

- A node's label tries, in order, under its node, right, above, left and the four diagonals, 8px clear of the node's real outline, and takes the first place that crosses no edge, node or other label. Focused labels choose first. A zone's label sits on the plate just inside its back corner.
- Focused labels are `--ink` at weight 600; the others `--ink-2` at 450.
- A label that would land outside the canvas is hidden, not moved.

## SCN-7 · Chrome

Top left: the step read-out, mono 11.5px `--ink-3`. Bottom right: `explore`. Nothing else is drawn over the canvas: no legend (the shape vocabulary is the legend, taught once in the post's first scene caption), no title, no step dots.

## SCN-8 · Static versions

Every step has a static form: the canvas as it rests at that step. Today this is produced by `pnpm look` as one PNG per step. Planned: prerendered SVG per step for print, RSS and no-JS (see [status.md](status.md)).
