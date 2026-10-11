import { Cam, clamp, extremes, facing, fit, lerp, prism, proj, rad, rrect, seg, type Ring, type Vec3 } from "../hairline/iso";
import { spring, stepS, type Spring } from "../hairline/motion";
import { disposer, flatDot, mk, place, pointer, put, reflect, register, solid, type FigureMount, type Solid } from "../hairline/stage";

/**
 * Stack: nine thin rounded slabs floating over a plinth, tapering as they
 * rise and turned a little more each one, so at rest the tower is a slow
 * helix with a breath of space near its top. The pointer's height picks a
 * slab and the stack parts around it, the nearest gaps the widest; its x
 * twists the tower. Every number that moves is a spring. The slider is the
 * gap, in viewBox units.
 */

const N = 9, T = 2.4, FLOAT = 12, PB = 5, BASE = 62, TWIST = 38;
const half = (i: number) => lerp(38, 26, i / (N - 1));
/** The space under slab i at rest: even, but for a breath around the seventh. */
const pitch = (i: number) => 7 + 5 * Math.exp(-((i - 6) ** 2) / 1.4);
/** Each slab turns 5° on the one below it. */
const restA = (i: number) => 5 * i;

const REST_Z: number[] = [];
for (let i = 0, z = FLOAT; i < N; i++) { if (i) z += pitch(i) + T; REST_Z.push(z); }

/** A ring turned by a radians about the origin, normals and all. */
const turn = (ring: Ring, a: number): Ring => {
  const c = Math.cos(a), s = Math.sin(a);
  return ring.map((q) => ({ u: q.u * c - q.v * s, v: q.u * s + q.v * c, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c }));
};

/** How far slab i lifts, as a share of the gap, when slab a is chosen: the slabs above part from it, the widest gap nearest it. */
const part = (i: number, a: number) => (i <= a ? 0 : 1 - 0.3 ** (i - a));

type Slab = { ring: Ring; inner: Ring; z: Spring; a: Spring; el: Solid; drawn: string };

export const mount: FigureMount = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let gap = value, chosen = -1, twist = 0;

  const C = Cam(45, 0.5, 1.42);
  const top = REST_Z[N - 1] + T + 44;
  const pts: Vec3[] = [[-BASE, -BASE, -PB], [BASE, BASE, -PB], [BASE, -BASE, -PB], [-BASE, BASE, -PB], [0, 0, top]];
  fit(C, pts, 200, 160);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const plinth = rrect(-BASE, -BASE, BASE, BASE, 14, 10);
  reflect(svg, g, P, front, plinth, -PB, 14);
  put(solid(g), prism(P, front, plinth, rrect(-BASE + 2, -BASE + 2, BASE - 2, BASE - 2, 12, 10), -PB, 0));
  const drops = mk("path", { class: "nf dash" }, g);

  const slabs: Slab[] = [];
  for (let i = 0; i < N; i++) {
    const h = half(i);
    slabs.push({
      ring: rrect(-h, -h, h, h, 10, 10), inner: rrect(-h + 1.2, -h + 1.2, h - 1.2, h - 1.2, 8.8, 10),
      z: spring(REST_Z[i], { eps: 0.02 }), a: spring(restA(i), { eps: 0.02 }), el: solid(g), drawn: "",
    });
  }

  // The mark: a 3 × 3 of dots on the lid of the chosen slab, or the top one at rest,
  // moved in the paint order to just after it, so the slabs above still cover it.
  const mark = mk("g", {}, g), dots: SVGEllipseElement[] = [];
  for (let k = 0; k < 9; k++) dots.push(flatDot(mark, C, 0.75, k === 4 ? "dot" : "dot m"));
  let host = -1;

  function draw(i: number) {
    const s = slabs[i], key = s.z.x.toFixed(2) + " " + s.a.x.toFixed(2);
    if (key === s.drawn) return;
    s.drawn = key;
    const a = rad(s.a.x);
    put(s.el, prism(P, front, turn(s.ring, a), turn(s.inner, a), s.z.x, s.z.x + T));
    if (i === 0) drops.setAttribute("d", extremes(P, turn(s.ring, a)).map((q) => seg(P(q.u, q.v, s.z.x), P(q.u, q.v, 0))).join(""));
  }

  function drawMark() {
    const want = chosen < 0 ? N - 1 : chosen, s = slabs[want];
    if (want !== host) { host = want; s.el.g.after(mark); }
    const a = rad(s.a.x), c = Math.cos(a), sn = Math.sin(a), z = s.z.x + T;
    dots.forEach((el, k) => {
      const u = ((k % 3) - 1) * 4, v = (Math.floor(k / 3) - 1) * 4;
      place(el, P(u * c - v * sn, u * sn + v * c, z));
    });
  }

  const B = register(stage, (dt) => {
    let moving = false;
    slabs.forEach((s, i) => {
      if (stepS(s.z, dt)) moving = true;
      if (stepS(s.a, dt)) moving = true;
      draw(i);
    });
    drawMark();
    return moving;
  });
  bag.add(B.unregister);

  function retarget() {
    slabs.forEach((s, i) => {
      s.z.t = REST_Z[i] + (chosen < 0 ? 0 : gap * part(i, chosen));
      s.a.t = restA(i) + twist * (i / (N - 1));
      s.el.sil.classList.toggle("hi", i === (chosen < 0 ? N - 1 : chosen));
    });
    read.textContent = chosen < 0 ? "rest" : `slab ${String(chosen + 1).padStart(2, "0")} · ${twist >= 0 ? "+" : "−"}${Math.abs(Math.round(twist))}°`;
    B.wake();
  }

  // Picked from the rest pose: the slab whose resting centre is nearest the pointer's height.
  const restY = REST_Z.map((z) => P(0, 0, z + T)[1]);
  const pick = (y: number) => restY.reduce((b, ry, i) => (Math.abs(ry - y) < Math.abs(restY[b] - y) ? i : b), 0);

  bag.add(pointer(stage, {
    move: ([x, y]) => { chosen = pick(y); twist = TWIST * clamp((x - 200) / 150, -1, 1); retarget(); },
    leave: () => { chosen = -1; twist = 0; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());
  retarget();

  return { set: (v) => { gap = v; retarget(); }, destroy: bag.dispose };
};
