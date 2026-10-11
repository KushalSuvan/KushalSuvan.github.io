import { fit, proj, rad, type Camera, type Vec3 } from "../hairline/iso";
import type { Tween } from "../hairline/motion";
import type { Box } from "./route";

/**
 * Cameras, with no DOM: fitting a figure's drawing inside its frame, and for
 * the scrolly canvas (LINE-5, SCN-4) the two views, how a set of footprints
 * is framed, and where the world's origin lands on the canvas.
 */

/**
 * Scales a figure's camera so the bounding box of `pts` fills at most w × h
 * of the 400 × 320 frame, then centres it on (cx, cy) with hairline's `fit`.
 * Pass the points of the most extreme pose, so nothing leaves the frame (rule 03).
 */
export function fitInside(C: Camera, pts: readonly Vec3[], w: number, h: number, cx: number, cy: number) {
  C.ox = 0; C.oy = 0;
  const P = proj(C), q = pts.map((p) => P(p[0], p[1], p[2]));
  const bw = Math.max(...q.map((v) => v[0])) - Math.min(...q.map((v) => v[0]));
  const bh = Math.max(...q.map((v) => v[1])) - Math.min(...q.map((v) => v[1]));
  C.S *= Math.min(w / bw, h / bh);
  fit(C, pts, cx, cy);
}

export type View = "iso" | "plan";

/** iso is hairline's 2:1 at 45°; plan looks straight down, square to the grid. */
export const VIEW: Record<View, { az: number; k: number }> = {
  iso: { az: 45, k: 0.5 },
  plan: { az: 0, k: 0.999 },
};

/** The share of the canvas left clear on every side, and the room kept for the read-out at the top. */
const PAD = 0.12, TOP = 28;
/** The world sits this far below the canvas's centre, clear of the read-out. */
export const DROP = 10;

/** Something to frame: a footprint and how tall it stands. */
export type Solid = Box & { h: number };

/** The centre (screen units at scale 1) and the scale that frame these solids from a view on a W × H canvas. */
export function framing(solids: Solid[], view: View, W: number, H: number) {
  const v = VIEW[view], c = Math.cos(rad(v.az)), s = Math.sin(rad(v.az)), zf = Math.sqrt(1 - v.k * v.k);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const n of solids) for (const x of [n.x0, n.x1]) for (const y of [n.y0, n.y1]) for (const z of [0, n.h]) {
    const X = x * c - y * s, Y = (x * s + y * c) * v.k - z * zf;
    x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y);
  }
  const S = Math.min((W * (1 - 2 * PAD)) / Math.max(1, x1 - x0), (H * (1 - 2 * PAD) - TOP) / Math.max(1, y1 - y0));
  return { bx: (x0 + x1) / 2, by: (y0 + y1) / 2, S };
}

/** Where the world's origin lands: the framed centre on the canvas's centre, moved by explore's pan. */
export const origin = (W: number, H: number, S: number, bx: number, by: number, dx: number, dy: number): [number, number] =>
  [W / 2 + dx - S * bx, H / 2 + DROP + dy - S * by];

/** Puts a tween at a value now, with no motion: for explore input, instant steps and reduced motion. */
export function snap(tw: Tween, v: number) {
  tw.from = tw.to = v;
  tw.t0 = -1e9;
}
