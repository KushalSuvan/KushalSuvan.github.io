import type { Vec2 } from "../hairline/iso";

/**
 * Label placement for the scrolly canvas (SCN-6), with no DOM. Each label
 * tries under its node, then right, above, left and the four diagonals, and
 * takes the first place that crosses no edge, no other node and no label
 * already placed; if none is free it goes under. Callers pass focused labels
 * first, so they choose first.
 */

/** A screen rectangle: left, top, right, bottom. */
export type Rect = [number, number, number, number];

export const LINE_H = 16;
const GAP = 8;

const overlaps = (a: Rect, b: Rect) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];

/** Whether a segment crosses a rectangle: their boxes overlap and the rectangle's corners are not all on one side of it. */
function crosses([a, b]: [Vec2, Vec2], r: Rect): boolean {
  if (Math.max(a[0], b[0]) < r[0] || Math.min(a[0], b[0]) > r[2] || Math.max(a[1], b[1]) < r[1] || Math.min(a[1], b[1]) > r[3]) return false;
  const side = (x: number, y: number) => Math.sign((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]));
  const s = [side(r[0], r[1]), side(r[2], r[1]), side(r[2], r[3]), side(r[0], r[3])];
  return !(s.every((v) => v > 0) || s.every((v) => v < 0));
}

/** The eight places a label of width w tries around a node's screen box, in order. */
function candidates([a, b, c, d]: Rect, w: number): Vec2[] {
  const mx = (a + c) / 2, my = (b + d) / 2, g = GAP / 2;
  return [
    [mx - w / 2, d + GAP], [c + GAP, my - LINE_H / 2], [mx - w / 2, b - GAP - LINE_H], [a - GAP - w, my - LINE_H / 2],
    [c + g, d + g], [a - g - w, d + g], [c + g, b - g - LINE_H], [a - g - w, b - g - LINE_H],
  ];
}

export type Placer = {
  /** The top-left corner for a node's label, and the label is then taken as placed. */
  place(node: Rect, w: number): Vec2;
};

/** A placer for one frame: the edges drawn this frame, and every node's box. */
export function placer(segments: [Vec2, Vec2][], nodes: Rect[]): Placer {
  const placed: Rect[] = [];
  return {
    place(node, w) {
      const others = nodes.filter((n) => n !== node);
      const free = (t: Vec2) => {
        const r: Rect = [t[0], t[1], t[0] + w, t[1] + LINE_H];
        return !segments.some((s) => crosses(s, r)) && !placed.some((p) => overlaps(p, r)) && !others.some((o) => overlaps(o, r));
      };
      const tries = candidates(node, w), at = tries.find(free) ?? tries[0];
      placed.push([at[0], at[1], at[0] + w, at[1] + LINE_H]);
      return at;
    },
  };
}
