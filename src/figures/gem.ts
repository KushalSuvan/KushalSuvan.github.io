import { Cam, circ, clamp, facing, fit, hull, lerp, open, poly, proj, rad, ringAt, rrect, run, seg, unproj, type Camera, type Ring, type Vec3 } from "../hairline/iso";
import { spring, stepS } from "../hairline/motion";
import { disposer, mk, pointer, register, type FigureMount } from "../hairline/stage";

/**
 * Gem: a cushion-cut stone floating over its own dashed footprint. It is convex, so its
 * silhouette is exactly the hull of its four rings (table, the girdle's two
 * edges, the culet), and every facet line is drawn only while the facet it
 * lies on faces the camera. The pointer's x turns the stone, its y tilts the
 * view, both on springs; the crown facet nearest the pointer catches the
 * light. The slider is how far the stone turns, in degrees.
 */

const N = 12;                       // samples round each corner; even, so a corner has a centre sample
const R = 44, RC = 17;              // girdle half-width and corner radius
const TB = 25, TR = 7;              // table half-width and corner radius
const CROWN = 15, GIRDLE = 2.6, PAV = 60, FLOAT = 24;
const ZC = FLOAT, Z0 = ZC + PAV, Z1 = Z0 + GIRDLE, ZT = Z1 + CROWN;
const HOME = 62;

/** A rounded square with the midpoint of each straight edge as a sample of its own, so table and girdle share anchors. */
function cushion(h: number, r: number): Ring {
  const ring = rrect(-h, -h, h, h, r, N), out: Ring = [];
  for (let j = 0; j < 4; j++) {
    const a = ring[j * (N + 1) + N], b = ring[((j + 1) % 4) * (N + 1)];
    out.push(...ring.slice(j * (N + 1), j * (N + 1) + N + 1));
    out.push({ u: (a.u + b.u) / 2, v: (a.v + b.v) / 2, nu: a.nu, nv: a.nv });
  }
  return out;
}
/** Eight anchors round the stone: each corner's centre and each edge's midpoint, in ring order. */
const ANCHORS = [0, 1, 2, 3].flatMap((j) => [j * (N + 2) + N / 2, j * (N + 2) + N + 1]);
const M = N + 2;
const span = (i: number) => { const a = ANCHORS[i], b = ANCHORS[(i + 1) % 8]; const out: number[] = []; for (let k = a; k !== b; k = (k + 1) % (4 * M)) out.push(k); out.push(b); return out; };

export const mount: FigureMount = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let reach = value, lit = -1;
  const girdle = cushion(R, RC), table = cushion(TB, TR), culet = circ(1.2, 8);
  const az = spring(HOME, { eps: 0.02 }), kk = spring(0.5, { eps: 0.0005 });

  const C = Cam(HOME, 0.5, 1.8);
  const pts: Vec3[] = [];
  for (let a = 0; a < 360; a += 15) { const c = Math.cos(rad(a)), s = Math.sin(rad(a)); pts.push([R * 1.1 * c, R * 1.1 * s, ZT], [R * 1.1 * c, R * 1.1 * s, 0]); }
  fit(C, pts, 200, 160);
  const ox = C.ox, oy = C.oy;

  const g = mk("g", {}, svg);
  const shadow = mk("path", { class: "nf dash" }, g);
  const drop = mk("path", { class: "nf dash" }, g);
  const stone = mk("path", { class: "sil" }, g);
  const pav = mk("path", { class: "nf lo" }, g), crown = mk("path", { class: "nf lo" }, g);
  const belt = mk("path", { class: "nf" }, g), top = mk("path", { class: "nf" }, g);
  const glint = mk("path", { class: "nf hi" }, g);

  /** The camera for an azimuth and elevation, offset as fitted, so turning and tilting keep the stone in place. */
  const cam = (a: number, k: number): Camera => ({ ...C, az: rad(a), k, ox, oy: oy + (k - 0.5) * 40 });

  function draw() {
    const K = cam(az.x, kk.x), P = proj(K), front = facing(K);
    const s = Math.sin(K.az), c = Math.cos(K.az), zf = Math.sqrt(1 - K.k * K.k);
    const toward = (i: number) => { const q = girdle[ANCHORS[i]]; return q.nu * s + q.nv * c; };

    shadow.setAttribute("d", poly(ringAt(P, girdle, 0)));
    drop.setAttribute("d", seg(P(0, 0, 0), P(0, 0, ZC)));
    stone.setAttribute("d", poly(hull([...ringAt(P, table, ZT), ...ringAt(P, girdle, Z1), ...ringAt(P, girdle, Z0), ...ringAt(P, culet, ZC)])));

    // A facet faces the camera when its normal, outward by the drop and up by the run, points toward the viewer.
    const crownSees = (i: number) => zf * CROWN * toward(i) + K.k * (R - TB) > 0;
    const pavSees = (i: number) => zf * PAV * toward(i) - K.k * R > 0;
    const cl: string[] = [], pl: string[] = [];
    for (let i = 0; i < 8; i++) {
      const t = table[ANCHORS[i]], q = girdle[ANCHORS[i]];
      if (crownSees(i)) cl.push(seg(P(t.u, t.v, ZT), P(q.u, q.v, Z1)));
      if (pavSees(i)) pl.push(seg(P(q.u, q.v, Z0), P(0, 0, ZC)));
    }
    crown.setAttribute("d", cl.join(""));
    pav.setAttribute("d", pl.join(""));
    belt.setAttribute("d", poly(ringAt(P, girdle, Z1)) + open(ringAt(P, run(girdle, front), Z0)));
    top.setAttribute("d", poly(ringAt(P, table, ZT)));

    // The lit facet: its table edge, its two ribs and its girdle edge, as one bright outline.
    const f = lit < 0 ? REST : lit, ks = span(f);
    glint.setAttribute("d", poly([...ks.map((k) => P(table[k].u, table[k].v, ZT)), ...ks.reverse().map((k) => P(girdle[k].u, girdle[k].v, Z1))]));
  }

  /** The rest mark: the crown facet that faces the viewer most at rest, a whole face rather than a sliver. */
  const REST = (() => {
    const s = Math.sin(rad(HOME)), c = Math.cos(rad(HOME));
    let best = 0, d = -Infinity;
    for (let i = 0; i < 8; i++) { const ks = span(i), q = girdle[ks[Math.floor(ks.length / 2)]], t = q.nu * s + q.nv * c; if (t > d) { d = t; best = i; } }
    return best;
  })();

  const B = register(stage, (dt) => {
    let m = stepS(az, dt);
    if (stepS(kk, dt)) m = true;
    draw();
    return m;
  });
  bag.add(B.unregister);

  // Picked against the target pose, never the turning one: the facet whose middle points nearest the pointer.
  function pick(p: [number, number]) {
    const K = cam(az.t, kk.t), [x, y] = unproj(K, p[0], p[1], ZT);
    if (Math.hypot(x, y) < TB * 0.6) return -1;
    let best = -1, d = Infinity;
    for (let i = 0; i < 8; i++) {
      const ks = span(i), q = girdle[ks[Math.floor(ks.length / 2)]];
      const e = Math.abs(Math.atan2(Math.sin(Math.atan2(y, x) - Math.atan2(q.v, q.u)), Math.cos(Math.atan2(y, x) - Math.atan2(q.v, q.u))));
      if (e < d) { d = e; best = i; }
    }
    return best;
  }

  const caption = () => {
    const t = Math.round(HOME - az.t), a = `${t < 0 ? "−" : "+"}${String(Math.abs(t)).padStart(2, "0")}`;
    read.textContent = lit < 0 && az.t === HOME ? "rest" : lit < 0 ? `table · ${a}°` : `facet ${lit + 1} · ${a}°`;
  };

  bag.add(pointer(stage, {
    move: (p) => {
      az.t = HOME - reach * clamp((p[0] - 200) / 160, -1, 1);
      kk.t = lerp(Math.sin(rad(38)), Math.sin(rad(24)), clamp(p[1] / 320, 0, 1));
      lit = pick(p);
      caption(); B.wake();
    },
    leave: () => { az.t = HOME; kk.t = 0.5; lit = -1; caption(); B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());
  caption();

  return { set: (v) => { reach = v; }, destroy: bag.dispose };
};
