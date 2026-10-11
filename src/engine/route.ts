import { clamp, r2, rad, type Projector, type Vec2 } from "../hairline/iso";
import { CELL } from "./shapes";

/**
 * Edges on the ground plane (LINE-4), with no DOM: their route through
 * elbows, a point along them, and the paths that draw them.
 */

/** A point on the ground, in world units. */
export type Pt = [number, number];

/** A footprint on the ground, in world units. */
export type Box = { x0: number; y0: number; x1: number; y1: number };

export const centre = (b: Box): Pt => [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];

/** Centre to centre through the elbows (in cells), axis-aligned, x first, cut back to each footprint with a gap. */
export function route(a: Box, b: Box, via: Pt[] = []): Pt[] {
  const raw: Pt[] = [centre(a), ...via.map(([x, y]): Pt => [x * CELL, y * CELL]), centre(b)];
  const pts: Pt[] = [raw[0]];
  for (const q of raw.slice(1)) {
    const p = pts[pts.length - 1];
    if (p[0] !== q[0] && p[1] !== q[1]) pts.push([q[0], p[1]]);
    pts.push(q);
  }
  /** Moves `from` out of its footprint towards `to`, to the edge plus a gap. */
  const cut = (from: Pt, to: Pt, bx: Box, gap: number): Pt => [
    from[0] + Math.sign(to[0] - from[0]) * ((bx.x1 - bx.x0) / 2 + gap),
    from[1] + Math.sign(to[1] - from[1]) * ((bx.y1 - bx.y0) / 2 + gap),
  ];
  pts[0] = cut(pts[0], pts[1], a, 2);
  pts[pts.length - 1] = cut(pts[pts.length - 1], pts[pts.length - 2], b, 4);
  return pts;
}

export const length = (pts: Pt[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);

/** The point at distance s along a polyline. */
export function along(pts: Pt[], s: number): Pt {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (s <= l || i === pts.length - 1) { const t = l ? clamp(s / l, 0, 1) : 0; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
    s -= l;
  }
  return pts[pts.length - 1];
}

const pathOf = (pts: Vec2[]) => "M" + pts.map((q) => r2(q[0]) + " " + r2(q[1])).join("L");

/** A ground polyline, projected, each elbow rounded by r world units. */
export function groundPath(P: Projector, pts: Pt[], r = 6): string {
  const out: Vec2[] = [P(pts[0][0], pts[0][1], 0)];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], p = pts[i], b = pts[i + 1];
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const t = Math.min(r, la / 2, lb / 2);
    const p1 = [p[0] + ((a[0] - p[0]) / la) * t, p[1] + ((a[1] - p[1]) / la) * t];
    const p2 = [p[0] + ((b[0] - p[0]) / lb) * t, p[1] + ((b[1] - p[1]) / lb) * t];
    // a quadratic through the elbow, from p1 to p2
    for (let k = 0; k <= 4; k++) {
      const s = k / 4, w = 1 - s;
      out.push(P(w * w * p1[0] + 2 * w * s * p[0] + s * s * p2[0], w * w * p1[1] + 2 * w * s * p[1] + s * s * p2[1], 0));
    }
  }
  const last = pts[pts.length - 1];
  out.push(P(last[0], last[1], 0));
  return pathOf(out);
}

/** An open chevron at `tip`, pointing along the screen direction from `from`. */
export function chevron(tip: Vec2, from: Vec2, size = 5.5): string {
  const a = Math.atan2(tip[1] - from[1], tip[0] - from[0]), w = rad(30);
  const wing = (s: number): Vec2 => [tip[0] - size * Math.cos(a + s * w), tip[1] - size * Math.sin(a + s * w)];
  return pathOf([wing(1), tip, wing(-1)]);
}

/** The chevrons for an edge: at its end, and at its start too when it shows the answer. */
export function heads(P: Projector, pts: Pt[], both: boolean): string {
  const at = (i: number) => { const p = pts.at(i)!; return P(p[0], p[1], 0); };
  return chevron(at(-1), at(-2)) + (both ? chevron(at(0), at(1)) : "");
}

/** Two short strokes crossed at a screen point: where a failing request stops (LINE-4). */
export function cross(m: Vec2, s = 4.5): string {
  return pathOf([[m[0] - s, m[1] - s], [m[0] + s, m[1] + s]]) + pathOf([[m[0] + s, m[1] - s], [m[0] - s, m[1] + s]]);
}
