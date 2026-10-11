import {
  circ, extremes, hull, open, poly, prism, ringAt, rings, rrect, run, seg,
  type Projector, type Ring, type Sample,
} from "../hairline/iso";

/**
 * The shape vocabulary for systems (spec/04-line-language.md, LINE-3). Each kind
 * is drawn from hairline's primitives as a list of paths, so the scene engine
 * only has to keep a pool of <path> elements per node. No DOM here.
 *
 * World units: one cell is 24. A node's footprint starts at `at` (its back
 * corner) and spans `size` cells. `g` is how far the node has grown, 0 to 1:
 * every height is multiplied by it, so a node that appears rises from its
 * footprint.
 */

export const CELL = 24;

export type Kind = "client" | "edge" | "service" | "worker" | "store" | "cache" | "queue" | "zone";

/**
 * Each kind's footprint in cells, unless a node says otherwise, and how tall
 * it stands in world units, which the camera frames (LINE-3). A new kind is a
 * row here, a case in `shape`, and a row in spec/04-line-language.md.
 */
export const KINDS: Record<Kind, { size: [number, number]; height: number }> = {
  client: { size: [2, 2], height: 22 },
  edge: { size: [2, 3], height: 14 },
  service: { size: [2, 2], height: 24 },
  worker: { size: [2, 2], height: 24 },
  store: { size: [2, 2], height: 30 },
  cache: { size: [2, 2], height: 20 },
  queue: { size: [3, 2], height: 20 },
  zone: { size: [1, 1], height: 0 },
};

/** One path to draw: its `d` and its classes (LINE-1). `sil` paths take the focus. */
export type Stroke = { d: string; cls: string };

/** What a shape needs: where it is in world units, and the camera as it is this frame. */
export type ShapeArgs = {
  P: Projector;
  front: (q: Sample) => boolean;
  x0: number; y0: number; x1: number; y1: number;
  g: number;
};

const sil = (s: { sil: string; crease: string }, out: Stroke[]) => {
  out.push({ d: s.sil, cls: "sil" });
  if (s.crease) out.push({ d: s.crease, cls: "nf lo" });
};

/** A ring of a circle, moved to (cx, cy). */
const disc = (cx: number, cy: number, r: number, n = 64): Ring =>
  circ(r, n).map((q) => ({ u: q.u + cx, v: q.v + cy, nu: q.nu, nv: q.nv }));

/** A cylinder: the hull of its two discs, a crease on the lid, and the front of a ring a third of the way down. */
function cylinder(P: Projector, front: (q: Sample) => boolean, cx: number, cy: number, r: number, z0: number, z1: number, band: boolean, out: Stroke[]) {
  const ring = disc(cx, cy, r), inner = disc(cx, cy, r - 1.6);
  out.push({ d: poly(hull(ringAt(P, ring, z1).concat(ringAt(P, ring, z0)))), cls: "sil" });
  out.push({ d: open(ringAt(P, run(inner, front), z1)), cls: "nf lo" });
  if (band && z1 - z0 > 6) out.push({ d: open(ringAt(P, run(ring, front), z0 + (z1 - z0) * 0.62)), cls: "nf" });
}

export function shape(kind: Kind, a: ShapeArgs): Stroke[] {
  const { P, front, x0, y0, x1, y1, g } = a;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = x1 - x0, d = y1 - y0;
  const out: Stroke[] = [];

  switch (kind) {
    case "zone": {
      out.push({ d: poly(ringAt(P, rrect(x0, y0, x1, y1, 10, 6), 0)), cls: "zone nf" });
      break;
    }
    case "client": {
      // a thin tile floating over its dashed footprint, a screen inset on its lid
      const lift = 16 * g, t = 3 * g;
      const [ring] = rings(x0 + 2, y0 + 2, x1 - 2, y1 - 2, 6, 1.2);
      const screen = rrect(x0 + 7, y0 + 7, x1 - 7, y1 - 7, 3, 4);
      if (g > 0.02) out.push({ d: extremes(P, ring).map((q) => seg(P(q.u, q.v, 0), P(q.u, q.v, lift))).join(""), cls: "nf dash" });
      sil(prism(P, front, ring, null, lift, lift + t), out);
      out.push({ d: poly(ringAt(P, screen, lift + t)), cls: "nf lo" });
      break;
    }
    case "edge": {
      // a low wide slab with three fins standing across it: a door with lanes
      const h = 8 * g;
      const [ring, inner] = rings(x0 + 2, y0 + 2, x1 - 2, y1 - 2, 6, 1.6);
      sil(prism(P, front, ring, inner, 0, h), out);
      for (let i = 0; i < 3; i++) {
        const fy = y0 + d * (0.28 + 0.22 * i);
        const [fr, fi] = rings(x0 + 8, fy - 1.6, x1 - 8, fy + 1.6, 1.4, 0.5);
        sil(prism(P, front, fr, fi, h, h + 7 * g), out);
      }
      break;
    }
    case "service":
    case "worker": {
      if (kind === "worker") out.push({ d: poly(ringAt(P, rrect(x0 - 3, y0 - 3, x1 + 3, y1 + 3, 9, 4), 0)), cls: "nf dash" });
      const [ring, inner] = rings(x0 + 2, y0 + 2, x1 - 2, y1 - 2, 6, 1.6);
      sil(prism(P, front, ring, inner, 0, 24 * g), out);
      break;
    }
    case "store": {
      cylinder(P, front, cx, cy, Math.min(w, d) / 2 - 3, 0, 30 * g, true, out);
      break;
    }
    case "cache": {
      // a thin round plate raised on a short stem
      const stem = 12 * g;
      cylinder(P, front, cx, cy, 3, 0, stem, false, out);
      cylinder(P, front, cx, cy, Math.min(w, d) / 2 - 4, stem, stem + 4 * g, false, out);
      break;
    }
    case "queue": {
      // four thin slabs standing on a shared base, in order
      const b = 3 * g;
      const [ring, inner] = rings(x0 + 2, y0 + 4, x1 - 2, y1 - 4, 4, 1.2);
      sil(prism(P, front, ring, inner, 0, b), out);
      const step = (w - 16) / 4;
      // back to front along x, so a nearer slab covers the one behind it
      for (let i = 0; i < 4; i++) {
        const sx = x0 + 8 + step * i + step / 2;
        const [sr, si] = rings(sx - 1.8, y0 + 9, sx + 1.8, y1 - 9, 1.4, 0.5);
        sil(prism(P, front, sr, si, b, b + 15 * g), out);
      }
      break;
    }
  }
  return out;
}

/** A node's box on screen, from its real outline: a circle for round kinds, the footprint otherwise, at its foot and its top. */
export function screenBox(kind: Kind, P: Projector, x0: number, y0: number, x1: number, y1: number, h: number): [number, number, number, number] {
  const round = kind === "store" || kind === "cache";
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, r = Math.min(x1 - x0, y1 - y0) / 2 - (kind === "cache" ? 4 : 3);
  const ground: [number, number][] = round
    ? Array.from({ length: 16 }, (_, k) => [cx + r * Math.cos((k / 16) * 2 * Math.PI), cy + r * Math.sin((k / 16) * 2 * Math.PI)])
    : [[x0 + 2, y0 + 2], [x1 - 2, y0 + 2], [x1 - 2, y1 - 2], [x0 + 2, y1 - 2]];
  let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
  for (const [x, y] of ground) for (const z of [0, h]) {
    const [px, py] = P(x, y, z);
    a = Math.min(a, px); b = Math.min(b, py); c = Math.max(c, px); d = Math.max(d, py);
  }
  return [a, b, c, d];
}

/** Where a zone's label goes: just inside its back corner, so it sits on the plate and never on the boundary (SCN-6). */
export const zoneAnchor = (P: Projector, x0: number, y0: number, inset: number) => P(x0 + inset, y0 + inset, 0);
