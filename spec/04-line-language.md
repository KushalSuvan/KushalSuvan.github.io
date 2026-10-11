# 04 · Line language

How everything is drawn, from a decorative figure to a system diagram. The maths is hairline's (`src/hairline/iso.ts`); read its header comment once.

## LINE-1 · The stroke classes are the whole palette

Drawings set classes, never colours or widths.

| Class | Stroke | Meaning |
| --- | --- | --- |
| `sil` | `edge` (`--ink-3`) | A solid's silhouette |
| `hi` | `--ink` | The one highlight: what is chosen, focused, or where the eye starts |
| (none) | `mid` | Every other line |
| `lo` | `lo` | Creases, guides, what recedes |
| `nf` | — | No fill (open lines) |
| `dash` | dotted `1 3` | Construction: footprints, drop lines |
| `dot`, `dot m`, `dot off` | filled `hi`, `edge`, `lo` | Dots: counters, codes, packets |
| `sig` | `--signal` | Failure or heat (`TOK-4`) |

- **Rejected when:** a drawing sets `stroke`, `fill`, `opacity`, `stroke-width` or `filter` itself; two unrelated things are `hi` at once.

## LINE-2 · Solids are two rings and one crease

A solid is the hull of its top and base rings (`prism`); its only inner line is a dim crease inset on the lid. Vertical corner lines are never drawn, no corner is sharp, and plates are filled with paper and painted back to front.

- **Rejected when:** a box shows twelve edges; a far edge shows through a near solid; a dashed guide crosses its own plate.

## LINE-3 · Shape vocabulary for systems

System diagrams use these shapes and no others, so that a reader who has seen one post can read the next one. Each shape is a function in `src/engine/shapes.ts`.

| Kind | Shape | Why it reads |
| --- | --- | --- |
| `client` | A thin floating tile with a smaller inset tile (a screen) | Outside the system, held in the hand |
| `edge` (load balancer, gateway) | A low wide slab with three short fins on top | A door with lanes |
| `service` | A rounded prism, footprint 2 × 2 cells, height 1 | The workhorse block |
| `worker` | A `service` with a dotted footprint under it (a pool) | Many of the same, unseen |
| `store` (database) | A cylinder: two circular rings, a crease ring one third down | The classic drum |
| `cache` | A thin round plate, raised on a short stem | Fast, shallow, near |
| `queue` | A row of four thin slabs on a shared base | Messages waiting in order |
| `zone` (region, VPC, cluster) | A dashed rounded plate on the ground, under its members | A boundary, not a thing |

- **Do:** keep footprints on the 1-cell grid (one cell is 24 world units); leave at least one cell between solids so edges have room.
- **Rejected when:** a component is drawn as a shape outside this table without the table being extended in the same change; a zone is drawn as a solid.

## LINE-4 · Edges

Edges run on the ground plane (z = 0), in orthogonal segments with rounded elbows, from footprint to footprint. They are painted before the solids, so a solid always covers the edge going under it.

| Edge kind | Stroke | Meaning |
| --- | --- | --- |
| `sync` | solid | A request that waits for its answer |
| `async` | dashed `4 4` | A message sent and not waited for |
| `repl` | dotted `1 3` | Replication or background copy |

An arrowhead is an open chevron, 5px each side, drawn in the edge's stroke at the receiving end. A `sync` edge that shows the answer gets a chevron at both ends.

- **Active edge:** `hi`. A packet (a dot) travels along it while its step is on screen (`MOT-5`).
- **Failing edge:** `sig`, the packet stops at the failure point and turns into a `dot` cross of two short `sig` strokes.

## LINE-5 · Cameras

| Camera | Elevation | k (sin el) | Use |
| --- | --- | --- | --- |
| `iso` | 30° | 0.5 | Default: things with height, layers, tiers |
| `plan` | 90° | 1.0 | Topology: who talks to whom, routing; labels read flat |

Azimuth stays at 45°. A scene may move between `iso` and `plan` from one step to the next (the camera tweens, `MOT-3`): **raise to explain layers, flatten to explain flow**.

- **Rejected when:** a camera uses another azimuth or elevation without a stated reason in the scene file.

## LINE-6 · No words inside the geometry

Words never become paths. Names live in the label layer (`SCN-6`) or the read-out. Identity inside the drawing is geometry: a dot code, a fin, a punch, a bright edge.
