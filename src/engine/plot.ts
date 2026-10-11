import { clamp, r2 } from "../hairline/iso";
import { reducedMotion, spring, stepS } from "../hairline/motion";
import { disposer, mk, register } from "../hairline/stage";

/**
 * Plots (spec/08-plots.md): flat, to scale, in the line language. The svg's
 * viewBox is its own pixel size, so ticks stay 11.5px and strokes stay
 * hairlines at every width (PLOT-2). A live plot's one control drives a
 * spring, and the curves are sampled again on every frame it moves (PLOT-7).
 */

export type Role = "main" | "cmp" | "cmp2" | "ref";

export type Series = {
  id: string;
  /** The direct label at the right end (PLOT-4). */
  label: string;
  role: Role;
  /** y for x, given the control's current value. */
  fn: (x: number, p: number) => number;
  /** Past this y the series is drawn in signal: the part that crosses a limit. */
  limit?: number;
};

export type Axis = { min: number; max: number; ticks: number[]; unit: string; format?: (v: number) => string };

export type Annotation = { x: number; series: string; text: string };

export type Plot = {
  id: string;
  /** The accessible name: the finding, not the topic. */
  label: string;
  x: Axis;
  y: Axis;
  series: Series[];
  control?: { label: string; unit: string; min: number; max: number; step: number; value: number; format?: (v: number) => string };
  annotate?: (p: number) => Annotation;
  /** The read-out while hovering x. */
  read: (x: number, p: number) => string;
};

export const definePlot = (p: Plot): Plot => p;

const SAMPLES = 160;
const CLS: Record<Role, string> = { main: "s-main", cmp: "s-cmp", cmp2: "s-cmp2", ref: "s-ref" };

export type PlotHandle = { setParam(v: number): void; destroy(): void };

export function mountPlot(plot: Plot, box: HTMLElement, read: HTMLElement): PlotHandle {
  const bag = disposer();
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  box.appendChild(svg);
  bag.add(() => svg.remove());

  let W = 0, H = 0, hoverX: number | null = null, dirty = true;
  const p = spring(plot.control?.value ?? 0, { eps: 0.0005 });
  const fmt = (a: Axis, v: number) => (a.format ? a.format(v) : String(v));

  const clipId = "clip-" + plot.id;
  const defs = mk("defs", {}, svg), clip = mk("clipPath", { id: clipId }, defs), clipRect = mk("rect", {}, clip);
  const gridG = mk("g", {}, svg), axisL = mk("line", { class: "axis" }, svg);
  const seriesG = mk("g", { "clip-path": `url(#${clipId})` }, svg);
  const paths = plot.series.map((s) => ({ s, base: mk("path", { class: CLS[s.role] }, seriesG), sig: mk("path", { class: "s-sig" }, seriesG) }));
  const labelsG = mk("g", {}, svg);
  const lead = mk("path", { class: "lead" }, svg), annDot = mk("circle", { r: 3, class: "dot" }, svg), annText = mk("text", { class: "ann" }, svg);
  const rule = mk("line", { class: "rule" }, svg);
  const hoverDots = plot.series.map(() => mk("circle", { r: 2.5, class: "dot m" }, svg));

  // the plot area: y ticks sit inside it, the right margin holds the direct labels
  const area = () => {
    // room for the longest direct label: 12px mono runs about 7.3px a character
    const right = 14 + Math.max(...plot.series.map((q) => q.label.length)) * 7.3;
    return { l: 0, r: W - right, t: 34, b: H - 22 };
  };
  const sx = (x: number) => { const a = area(); return a.l + ((x - plot.x.min) / (plot.x.max - plot.x.min)) * (a.r - a.l); };
  const sy = (y: number) => { const a = area(); return a.b - ((y - plot.y.min) / (plot.y.max - plot.y.min)) * (a.b - a.t); };
  const ix = (px: number) => { const a = area(); return plot.x.min + ((px - a.l) / (a.r - a.l)) * (plot.x.max - plot.x.min); };

  function frame() {
    const a = area();
    svg.setAttribute("viewBox", `0 0 ${r2(W)} ${r2(H)}`);
    clipRect.setAttribute("x", String(a.l - 2)); clipRect.setAttribute("y", String(a.t - 2));
    clipRect.setAttribute("width", String(a.r - a.l + 4)); clipRect.setAttribute("height", String(a.b - a.t + 4));
    gridG.replaceChildren();
    // y: grid lines with their ticks just above them, inside the area; the unit after the top tick (PLOT-3)
    plot.y.ticks.forEach((v, i) => {
      const y = r2(sy(v));
      if (v !== plot.y.min) mk("line", { class: "grid", x1: a.l, x2: a.r, y1: y, y2: y }, gridG);
      const t = mk("text", { x: a.l, y: y - 5 }, gridG);
      t.textContent = fmt(plot.y, v) + (i === plot.y.ticks.length - 1 ? " " + plot.y.unit : "");
    });
    // x: ticks under the baseline, the unit after the last
    plot.x.ticks.forEach((v, i) => {
      const t = mk("text", { x: r2(sx(v)), y: a.b + 16, "text-anchor": i === 0 ? "start" : "middle" }, gridG);
      t.textContent = fmt(plot.x, v) + (i === plot.x.ticks.length - 1 ? " " + plot.x.unit : "");
    });
    axisL.setAttribute("x1", String(a.l)); axisL.setAttribute("x2", String(a.r));
    axisL.setAttribute("y1", String(r2(a.b))); axisL.setAttribute("y2", String(r2(a.b)));
  }

  function curves() {
    const a = area(), pv = p.x;
    const ends: { y: number; s: Series }[] = [];
    for (const { s, base, sig } of paths) {
      let d = "", ds = "", penS = false;
      for (let i = 0; i <= SAMPLES; i++) {
        const x = plot.x.min + ((plot.x.max - plot.x.min) * i) / SAMPLES, y = s.fn(x, pv);
        if (!Number.isFinite(y)) continue;
        const X = r2(sx(x)), Y = r2(clamp(sy(y), a.t - 40, a.b + 40));
        d += (d ? "L" : "M") + X + " " + Y;
        if (s.limit !== undefined && y > s.limit) { ds += (penS ? "L" : "M") + X + " " + Y; penS = true; } else penS = false;
      }
      base.setAttribute("d", d); sig.setAttribute("d", ds);
      const yEnd = s.fn(plot.x.max, pv);
      ends.push({ y: clamp(sy(Number.isFinite(yEnd) ? yEnd : plot.y.max), a.t + 4, a.b - 4), s });
    }
    // direct labels at the right ends, nudged apart by at least 14px
    ends.sort((m, n) => m.y - n.y);
    for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
    labelsG.replaceChildren();
    for (const e of ends) {
      const t = mk("text", { x: a.r + 8, y: r2(e.y + 4), class: "lbl" + (e.s.role === "main" ? " main" : "") }, labelsG);
      t.textContent = e.s.label;
    }
    // the one annotation (PLOT-6)
    if (plot.annotate) {
      const an = plot.annotate(pv), s = plot.series.find((q) => q.id === an.series)!;
      const X = sx(an.x), Y = sy(s.fn(an.x, pv)), up = Y > a.t + 60;
      const tx = X - 12, ty = up ? Y - 34 : Y + 40;
      annDot.setAttribute("cx", String(r2(X))); annDot.setAttribute("cy", String(r2(Y)));
      lead.setAttribute("d", `M${r2(X - 3)} ${r2(Y + (up ? -4 : 4))}L${r2(tx)} ${r2(ty + (up ? 4 : -14))}`);
      annText.setAttribute("x", String(r2(tx))); annText.setAttribute("y", String(r2(ty)));
      annText.setAttribute("text-anchor", "end");
      annText.textContent = an.text;
    }
  }

  function hover() {
    const a = area();
    if (hoverX === null) {
      rule.style.display = "none"; hoverDots.forEach((d) => (d.style.display = "none"));
      read.textContent = "rest";
      return;
    }
    const X = sx(hoverX);
    rule.style.display = "";
    rule.setAttribute("x1", String(r2(X))); rule.setAttribute("x2", String(r2(X)));
    rule.setAttribute("y1", String(a.t)); rule.setAttribute("y2", String(a.b));
    plot.series.forEach((s, i) => {
      const y = s.fn(hoverX!, p.x), d = hoverDots[i];
      const show = Number.isFinite(y) && y <= plot.y.max && y >= plot.y.min;
      d.style.display = show ? "" : "none";
      if (show) { d.setAttribute("cx", String(r2(X))); d.setAttribute("cy", String(r2(sy(y)))); }
    });
    read.textContent = plot.read(hoverX, p.x);
  }

  const B = register(box, (dt) => {
    const moving = stepS(p, dt);
    if (W < 40 || H < 40) return moving; // not laid out yet: the ResizeObserver will wake it
    if (dirty) { frame(); dirty = false; }
    curves(); hover();
    return moving;
  });
  bag.add(B.unregister);

  const ro = new ResizeObserver(() => {
    const r = box.getBoundingClientRect();
    W = r.width; H = r.height;
    dirty = true; B.wake();
  });
  ro.observe(box);
  bag.add(() => ro.disconnect());

  // hover snaps to the nearest x on the plot's own grid of samples (PLOT-7)
  const onMove = (e: PointerEvent) => {
    const r = box.getBoundingClientRect(), a = area();
    const px = clamp(e.clientX - r.left, a.l, a.r), step = (plot.x.max - plot.x.min) / SAMPLES;
    hoverX = plot.x.min + Math.round((ix(px) - plot.x.min) / step) * step;
    B.wake();
  };
  const onLeave = () => { hoverX = null; B.wake(); };
  bag.on(box, "pointermove", onMove);
  bag.on(box, "pointerdown", onMove);
  bag.on(box, "pointerleave", onLeave);

  return {
    setParam(v) { p.t = v; if (reducedMotion()) p.x = v; B.wake(); },
    destroy: bag.dispose,
  };
}
