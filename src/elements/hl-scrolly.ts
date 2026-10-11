import { inject } from "../hairline/styles";
import { disposer, type Disposer } from "../hairline/stage";
import { mountScene, type SceneHandle, type StepState } from "../engine/scene";
import { SCENES } from "../scenes";
import { html, readout, svgRoot } from "./parts";

/**
 * <hl-scrolly scene> (spec/07-scrolly-canvas.md). Its child `.scn-steps`
 * holds the steps; this element adds the sticky canvas before it, reads each
 * step's data attributes as a scene state, and moves the scene when a step
 * crosses the reading line (MOT-3). The explore button unlocks pan and zoom
 * (SCN-5).
 */

const list = (v: string | undefined) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);

/** Each step's state (SCN-3). `data-show` carries forward until a later step changes it. Steps without an id get one. */
function readSteps(steps: HTMLElement[], scene: string): StepState[] {
  let show: string[] | null = null;
  return steps.map((s, i) => {
    if (s.dataset.show) show = list(s.dataset.show);
    if (!s.id) s.id = `${scene}-${i + 1}`;
    return {
      fit: list(s.dataset.fit),
      view: s.dataset.view === "plan" ? "plan" : "iso",
      focus: list(s.dataset.focus),
      flow: list(s.dataset.flow),
      fail: s.dataset.fail || null,
      show,
    };
  });
}

/** The canvas: the stage the scene draws in, its label layer, the read-out and the explore button. */
function buildCanvas(id: string, label: string) {
  const canvas = html("div", "scn-canvas");
  const stage = html("div", "scn-stage", { "data-hairline": id, role: "img", "aria-label": label });
  const svg = svgRoot();
  stage.appendChild(svg);
  const labels = html("div", "scn-labels", { "aria-hidden": "true" });
  const out = readout();
  const explore = html("button", "scn-explore", { type: "button", "aria-pressed": "false" });
  explore.textContent = "explore";
  canvas.append(stage, labels, out, explore);
  return { canvas, stage, svg, labels, out, explore };
}

type Canvas = ReturnType<typeof buildCanvas>;

/** Explore (SCN-5): drag, wheel and keys move the camera; leaving gives it back to the step. Returns the switch. */
function bindExplore({ canvas, stage, explore }: Canvas, scene: SceneHandle, bag: Disposer) {
  let exploring = false, drag: { x: number; y: number } | null = null;
  const set = (on: boolean) => {
    exploring = on;
    canvas.classList.toggle("exploring", on);
    explore.textContent = on ? "done" : "explore";
    explore.setAttribute("aria-pressed", String(on));
    scene.setExplore(on);
    if (on) canvas.tabIndex = 0; else canvas.removeAttribute("tabindex");
  };
  const local = (e: { clientX: number; clientY: number }): [number, number] => {
    const r = stage.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  bag.on(explore, "click", () => { set(!exploring); if (exploring) canvas.focus(); });
  bag.on(canvas, "pointerdown", (e) => {
    if (!exploring || e.target === explore) return;
    drag = { x: e.clientX, y: e.clientY };
    canvas.classList.add("dragging");
    canvas.setPointerCapture(e.pointerId);
  });
  bag.on(canvas, "pointermove", (e) => {
    if (!drag) return;
    scene.pan(e.clientX - drag.x, e.clientY - drag.y);
    drag = { x: e.clientX, y: e.clientY };
  });
  const end = () => { drag = null; canvas.classList.remove("dragging"); };
  bag.on(canvas, "pointerup", end);
  bag.on(canvas, "pointercancel", end);
  bag.on(canvas, "wheel", (e) => {
    if (!exploring) return;
    e.preventDefault();
    scene.zoom(Math.exp(-e.deltaY * 0.0015), local(e));
  }, { passive: false });

  const PAN = 40, ZOOM = 1.2;
  const keys: Record<string, () => void> = {
    ArrowLeft: () => scene.pan(PAN, 0), ArrowRight: () => scene.pan(-PAN, 0),
    ArrowUp: () => scene.pan(0, PAN), ArrowDown: () => scene.pan(0, -PAN),
    "+": () => scene.zoom(ZOOM, mid()), "=": () => scene.zoom(ZOOM, mid()),
    "-": () => scene.zoom(1 / ZOOM, mid()), _: () => scene.zoom(1 / ZOOM, mid()),
    Escape: () => { set(false); explore.focus(); },
  };
  const mid = (): [number, number] => { const r = stage.getBoundingClientRect(); return [r.width / 2, r.height / 2]; };
  bag.on(canvas, "keydown", (e) => {
    if (!exploring || !keys[e.key]) return;
    keys[e.key]();
    e.preventDefault();
  });

  return { set, get on() { return exploring; } };
}

export class HlScrolly extends HTMLElement {
  private bag: Disposer | null = null;

  connectedCallback() {
    const id = this.getAttribute("scene") ?? "";
    const scene = SCENES[id];
    if (!scene) { console.error(`hl-scrolly: no scene named "${id}" in src/scenes/index.ts`); return; }
    const steps = [...this.querySelectorAll<HTMLElement>(".scn-steps > .step")];
    if (!steps.length) { console.error(`hl-scrolly "${id}": no .step inside .scn-steps`); return; }

    const bag = (this.bag = disposer());
    const states = readSteps(steps, id);
    inject(document);
    const parts = buildCanvas(id, scene.label);
    this.prepend(parts.canvas);
    bag.add(() => parts.canvas.remove());
    const handle = mountScene(scene, parts.stage, parts.svg, parts.labels);
    bag.add(handle.destroy);
    const explore = bindExplore(parts, handle, bag);

    let current = -1;
    const activate = (i: number, instant = false) => {
      if (i === current) return;
      current = i;
      if (explore.on) explore.set(false);
      steps.forEach((s, k) => s.classList.toggle("active", k === i));
      parts.out.textContent = steps[i].dataset.read ?? `${i + 1} / ${steps.length}`;
      handle.go(states[i], instant);
      if (!instant && location.hash !== "#" + steps[i].id && this.inView()) history.replaceState(null, "", "#" + steps[i].id);
    };

    // the reading line: the middle of the viewport side by side, lower down when the canvas sits on top
    const wide = matchMedia("(min-width: 64rem)");
    let io: IntersectionObserver | null = null;
    const observe = () => {
      io?.disconnect();
      io = new IntersectionObserver((es) => {
        for (const e of es) if (e.isIntersecting) activate(steps.indexOf(e.target as HTMLElement));
      }, { rootMargin: wide.matches ? "-50% 0px -50% 0px" : "-70% 0px -29% 0px" });
      steps.forEach((s) => io!.observe(s));
    };
    observe();
    wide.addEventListener("change", observe);
    bag.add(() => { wide.removeEventListener("change", observe); io?.disconnect(); });

    // a deep link to a step puts the scene in that step's state at once (READ-5)
    const fromHash = steps.findIndex((s) => "#" + s.id === location.hash);
    activate(fromHash >= 0 ? fromHash : 0, true);
  }

  private inView() {
    const r = this.getBoundingClientRect();
    return r.top < innerHeight && r.bottom > 0;
  }

  disconnectedCallback() {
    this.bag?.dispose();
    this.bag = null;
  }
}
