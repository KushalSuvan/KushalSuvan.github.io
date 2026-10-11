import { clamp, facing, proj, r2, rad, type Camera, type Projector, type Vec2 } from "../hairline/iso";
import { reducedMotion, tdone, tset, tval, tween, type Tween } from "../hairline/motion";
import { disposer, flatDot, mk, place, register } from "../hairline/stage";
import { VIEW, framing, origin, snap, type View } from "./camera";
import { LINE_H, placer } from "./labels";
import { along, centre, cross, groundPath, heads, length, route, type Box, type Pt } from "./route";
import { CELL, KINDS, screenBox, shape, zoneAnchor, type Kind } from "./shapes";

/**
 * The scrolly canvas (spec/07-scrolly-canvas.md). A scene is data: nodes on a
 * grid of cells and edges between them. A step is a state: what is shown,
 * focused, flowing or failing, and what the camera frames from which view.
 * Changing step is a discrete input, so everything tweens on the 700ms lift
 * curve (MOT-3); packets on flowing edges are the only ambient motion (MOT-5).
 *
 * The svg's viewBox is the canvas's own pixel size, so strokes stay hairlines
 * and the HTML labels stay 12px at every zoom (SCN-6). The geometry lives in
 * route.ts, camera.ts, labels.ts and shapes.ts; this file keeps the state and
 * writes the DOM.
 */

export type { View } from "./camera";

export type SceneNode = {
  id: string;
  kind: Kind;
  /** The footprint's back corner, in cells. Zones use `from` and `to` instead. */
  at?: Pt;
  size?: Pt;
  from?: Pt;
  to?: Pt;
  label: string;
};

export type SceneEdge = {
  id: string;
  from: string;
  to: string;
  kind: "sync" | "async" | "repl";
  /** Elbow points, in cells; without them the edge goes along x first, then y. */
  via?: Pt[];
  /** Draw a chevron at both ends: a request that shows its answer. */
  both?: boolean;
};

export type Scene = { id: string; label: string; nodes: SceneNode[]; edges: SceneEdge[] };

export const defineScene = (s: Scene): Scene => s;

export type StepState = {
  fit: string[];
  view: View;
  focus: string[];
  flow: string[];
  fail: string | null;
  show: string[] | null;
};

export type SceneHandle = {
  /** Go to a step's state: tweened, or at once. */
  go(state: StepState, instant?: boolean): void;
  setExplore(on: boolean): void;
  /** Explore input: pan by screen pixels, zoom by a factor about a screen point. */
  pan(dx: number, dy: number): void;
  zoom(f: number, at: Vec2): void;
  destroy(): void;
};

/** Packets (MOT-5): world units a second, seconds between them, at most this many in flight per edge. */
const SPEED = 160, EVERY = 0.6, IN_FLIGHT = 3;
const STEP_MS = 700, FAR_MS = 900;
/** A node counts as there, for edges and labels, once it has grown this far. */
const GROWN = 0.6;

type NodeRt = Box & { n: SceneNode; h: number; grow: Tween; g: SVGGElement; pool: SVGPathElement[]; label: HTMLSpanElement };
type EdgeRt = { e: SceneEdge; path: SVGPathElement; head: SVGPathElement; pts: Pt[]; len: number; dots: SVGEllipseElement[]; cross: SVGPathElement };

const footprint = (n: SceneNode): Box => {
  const [a, b] = n.kind === "zone" ? n.from ?? [0, 0] : n.at ?? [0, 0];
  const [c, d] = n.kind === "zone" ? n.to ?? [1, 1] : [a + (n.size ?? KINDS[n.kind].size)[0], b + (n.size ?? KINDS[n.kind].size)[1]];
  return { x0: a * CELL, y0: b * CELL, x1: c * CELL, y1: d * CELL };
};

const inside = (n: Box, z: Box) => n.x0 >= z.x0 && n.x1 <= z.x1 && n.y0 >= z.y0 && n.y1 <= z.y1;

export function mountScene(scene: Scene, stage: HTMLElement, svg: SVGSVGElement, labels: HTMLElement): SceneHandle {
  const bag = disposer();
  const C: Camera = { az: rad(45), k: 0.5, S: 1, ox: 0, oy: 0 };
  let W = 1, H = 1;

  /* ---------- the drawing's parts, made once ---------- */

  const zonesG = mk("g", {}, svg), edgesG = mk("g", {}, svg), nodesG = mk("g", {}, svg), dotsG = mk("g", {}, svg);
  const byId = new Map<string, NodeRt>();
  const nodes: NodeRt[] = scene.nodes.map((n) => {
    const label = document.createElement("span");
    label.className = "scn-label" + (n.kind === "zone" ? " zone" : "");
    label.textContent = n.label;
    labels.appendChild(label);
    const rt: NodeRt = { ...footprint(n), n, h: KINDS[n.kind].height, grow: tween(1), g: mk("g", {}, n.kind === "zone" ? zonesG : nodesG), pool: [], label };
    byId.set(n.id, rt);
    return rt;
  });
  const solids = nodes.filter((n) => n.n.kind !== "zone");
  const edges: EdgeRt[] = scene.edges.map((e) => {
    const pts = route(byId.get(e.from)!, byId.get(e.to)!, e.via);
    return {
      e, pts, len: length(pts), dots: [],
      path: mk("path", { class: "edge nf " + e.kind }, edgesG),
      head: mk("path", { class: "edge nf" }, edgesG),
      cross: mk("path", { class: "nf sig", d: "" }, dotsG),
    };
  });

  /* ---------- state ---------- */

  // camera tweens: centre (screen units at S = 1), scale, azimuth, elevation; explore's pan and zoom on top
  const cam = { bx: tween(0), by: tween(0), S: tween(1), az: tween(45), k: tween(0.5), dx: tween(0), dy: tween(0), zf: tween(1) };
  let state: StepState = { fit: [], view: "iso", focus: [], flow: [], fail: null, show: null };
  let failed: string | null = null, exploring = false, flowT0 = performance.now(), dirty = true;

  /** A node exists in this step when it is shown; a zone, when anything shown stands inside it. */
  const exists = (n: NodeRt) => !state.show
    || (n.n.kind === "zone" ? state.show.some((id) => { const m = byId.get(id); return !!m && m.n.kind !== "zone" && inside(m, n); }) : state.show.includes(n.n.id));

  /* ---------- drawing ---------- */

  function aimCamera(now: number): Projector {
    const zf = tval(cam.zf, now);
    C.az = rad(tval(cam.az, now)); C.k = tval(cam.k, now); C.S = tval(cam.S, now) * zf;
    [C.ox, C.oy] = origin(W, H, C.S, tval(cam.bx, now), tval(cam.by, now), tval(cam.dx, now), tval(cam.dy, now));
    return proj(C);
  }

  function drawNodes(P: Projector, now: number) {
    const front = facing(C), sa = Math.sin(C.az), ca = Math.cos(C.az);
    // back to front by the depth of their centres
    const depth = (n: NodeRt) => { const [x, y] = centre(n); return x * sa + y * ca; };
    [...solids].sort((p, q) => depth(p) - depth(q)).forEach((n) => nodesG.appendChild(n.g));

    for (const n of nodes) {
      const g = tval(n.grow, now), vis = g > 0.001;
      const focus = state.focus.includes(n.n.id), sig = n.n.id === failed;
      n.g.style.display = vis ? "" : "none";
      n.label.classList.toggle("focus", focus && !sig);
      n.label.classList.toggle("sig", sig);
      if (!vis) continue;
      const strokes = shape(n.n.kind, { P, front, x0: n.x0, y0: n.y0, x1: n.x1, y1: n.y1, g });
      strokes.forEach((s, i) => {
        const el = n.pool[i] ?? (n.pool[i] = mk("path", {}, n.g));
        const cls = s.cls === "sil" ? (sig ? "sil sig" : focus ? "sil hi" : "sil") : s.cls;
        if (el.getAttribute("d") !== s.d) el.setAttribute("d", s.d);
        if (el.getAttribute("class") !== cls) el.setAttribute("class", cls);
        el.style.display = "";
      });
      for (const el of n.pool.slice(strokes.length)) el.style.display = "none";
    }
  }

  const edgeVisible = (ed: EdgeRt, now: number) => Math.min(tval(byId.get(ed.e.from)!.grow, now), tval(byId.get(ed.e.to)!.grow, now)) > GROWN;

  function drawEdges(P: Projector, now: number) {
    for (const ed of edges) {
      const vis = edgeVisible(ed, now), mode = state.fail === ed.e.id ? " sig" : state.flow.includes(ed.e.id) ? " on" : "";
      ed.path.setAttribute("class", "edge nf " + ed.e.kind + mode);
      ed.head.setAttribute("class", "edge nf" + mode);
      ed.path.style.display = ed.head.style.display = vis ? "" : "none";
      if (!vis) continue;
      ed.path.setAttribute("d", groundPath(P, ed.pts));
      ed.head.setAttribute("d", heads(P, ed.pts, !!ed.e.both));
    }
  }

  // label widths are measured once, and again on resize and when the mono face arrives
  const widths = new Map<HTMLSpanElement, number>();
  const widthOf = (el: HTMLSpanElement) => {
    let w = widths.get(el) ?? 0;
    if (!w) { el.style.display = ""; w = el.offsetWidth; if (w) widths.set(el, w); }
    return w;
  };

  function drawLabels(P: Projector, now: number) {
    const segments: [Vec2, Vec2][] = edges.filter((ed) => edgeVisible(ed, now))
      .flatMap((ed) => ed.pts.slice(1).map((p, i): [Vec2, Vec2] => [P(ed.pts[i][0], ed.pts[i][1], 0), P(p[0], p[1], 0)]));
    const grown = solids.filter((n) => tval(n.grow, now) > GROWN);
    const boxes = new Map(grown.map((n) => [n, screenBox(n.n.kind, P, n.x0, n.y0, n.x1, n.y1, n.h * tval(n.grow, now))]));
    const place = placer(segments, [...boxes.values()]);
    const ranked = [...nodes].sort((a, b) => Number(state.focus.includes(b.n.id)) - Number(state.focus.includes(a.n.id)));

    for (const n of ranked) {
      const el = n.label;
      if (tval(n.grow, now) <= GROWN) { el.style.display = "none"; continue; }
      const w = widthOf(el);
      let x: number, y: number;
      if (n.n.kind === "zone") {
        // seen from above the corner is square, so the label reads from it; in iso the plate opens as a wedge, so it sits centred further in
        const plan = C.k > 0.9;
        [x, y] = zoneAnchor(P, n.x0, n.y0, plan ? 14 : 36);
        if (!plan) x -= w / 2;
      } else [x, y] = place.place(boxes.get(n)!, w);
      // a label that would leave the canvas is hidden, not moved
      el.style.display = x > 4 && x + w < W - 4 && y > 28 && y + LINE_H < H - 8 ? "" : "none";
      el.style.transform = `translate(${r2(x)}px, ${r2(y)}px)`;
    }
  }

  /** Packets: up to three in flight per flowing edge, one every 0.6s; standing at thirds under reduced motion. Returns whether any edge flows. */
  function drawPackets(now: number): boolean {
    const P = proj(C), t = (now - flowT0) / 1000;
    for (const ed of edges) {
      const sig = state.fail === ed.e.id, on = sig || state.flow.includes(ed.e.id);
      const stop = sig ? ed.len / 2 : ed.len, pos: number[] = [];
      if (on && reducedMotion()) pos.push(stop / 3, (2 * stop) / 3);
      else if (on) {
        const travel = stop / SPEED, period = Math.max(travel, EVERY * IN_FLIGHT);
        for (let k = 0; k < IN_FLIGHT; k++) { const age = (((t - k * EVERY) % period) + period) % period; if (age < travel) pos.push(age * SPEED); }
      }
      while (ed.dots.length < IN_FLIGHT) ed.dots.push(flatDot(dotsG, C, 2.4, "dot"));
      ed.dots.forEach((el, i) => {
        el.style.display = i < pos.length ? "" : "none";
        if (i >= pos.length) return;
        el.setAttribute("class", sig ? "dot sig" : "dot");
        el.setAttribute("rx", "2.6"); el.setAttribute("ry", String(r2(2.6 * Math.max(C.k, 0.5))));
        place(el, P(...along(ed.pts, pos[i]), 0));
      });
      ed.cross.setAttribute("d", sig ? cross(P(...along(ed.pts, stop), 0)) : "");
    }
    return state.flow.length > 0 || !!state.fail;
  }

  const B = register(stage, (_dt, now) => {
    const moving = Object.values(cam).some((tw) => !tdone(tw, now)) || nodes.some((n) => !tdone(n.grow, now));
    if (moving || dirty) {
      const P = aimCamera(now);
      drawNodes(P, now); drawEdges(P, now); drawLabels(P, now);
      dirty = false;
    }
    const flowing = drawPackets(now);
    return moving || (flowing && !reducedMotion());
  });
  bag.add(B.unregister);

  /* ---------- moving between steps ---------- */

  /** Sends the camera and every node's growth towards the current step: tweened, or at once. */
  function aim(instant: boolean) {
    const now = performance.now(), v = VIEW[state.view];
    const fit = state.fit.length ? state.fit.map((id) => byId.get(id)!).filter(Boolean) : nodes.filter(exists);
    const f = framing(fit, state.view, W, H), overview = framing(nodes.filter(exists), state.view, W, H).S;
    const S = clamp(f.S, overview * 0.5, overview * 3);
    const far = Math.hypot((f.bx - tval(cam.bx, now)) * S, (f.by - tval(cam.by, now)) * S) > 2 * W;
    const set = (tw: Tween, to: number) => {
      if (instant || reducedMotion()) snap(tw, to);
      else { tw.dur = far ? FAR_MS : STEP_MS; tset(tw, to, now, 0); }
    };
    set(cam.bx, f.bx); set(cam.by, f.by); set(cam.S, S); set(cam.az, v.az); set(cam.k, v.k);
    if (!exploring) { set(cam.dx, 0); set(cam.dy, 0); set(cam.zf, 1); }
    for (const n of nodes) set(n.grow, exists(n) ? 1 : 0);
  }

  const redraw = () => { dirty = true; B.wake(); };

  const ro = new ResizeObserver(() => {
    const r = stage.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    widths.clear();
    svg.setAttribute("viewBox", `0 0 ${r2(W)} ${r2(H)}`);
    aim(true); redraw();
  });
  ro.observe(stage);
  bag.add(() => ro.disconnect());
  document.fonts?.ready.then(() => { widths.clear(); redraw(); });
  bag.add(() => { svg.replaceChildren(); labels.replaceChildren(); });

  return {
    go(next, instant = false) {
      if (next.flow.join() !== state.flow.join() || next.fail !== state.fail) flowT0 = performance.now();
      state = next;
      failed = state.fail ? edges.find((e) => e.e.id === state.fail)?.e.to ?? null : null;
      aim(instant); redraw();
    },
    setExplore(on) {
      exploring = on;
      if (!on) aim(false);
      B.wake();
    },
    pan(dx, dy) {
      const now = performance.now();
      snap(cam.dx, tval(cam.dx, now) + dx); snap(cam.dy, tval(cam.dy, now) + dy);
      redraw();
    },
    zoom(f, at) {
      // keep the world point under the pointer where it is: solve the new pan for the new scale
      const now = performance.now(), S = tval(cam.S, now), bx = tval(cam.bx, now), by = tval(cam.by, now);
      const zf0 = tval(cam.zf, now), zf1 = clamp(zf0 * f, 0.5, 4);
      const [ox, oy] = origin(W, H, S * zf0, bx, by, tval(cam.dx, now), tval(cam.dy, now));
      const X = (at[0] - ox) / (S * zf0), Y = (at[1] - oy) / (S * zf0);
      const [ox1, oy1] = origin(W, H, S * zf1, bx, by, 0, 0);
      snap(cam.zf, zf1); snap(cam.dx, at[0] - S * zf1 * X - ox1); snap(cam.dy, at[1] - S * zf1 * Y - oy1);
      redraw();
    },
    destroy: bag.dispose,
  };
}
