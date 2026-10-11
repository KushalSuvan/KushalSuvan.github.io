import { inject } from "../hairline/styles";
import type { FigureHandle, Readout } from "../hairline/stage";
import { FIGURES, valueFor } from "../figures";
import { html, readout, slider, svgRoot } from "./parts";

/**
 * <hl-figure name intensity control unit label> (spec/06-figures.md, FIG-3).
 * Mounts the registered figure into a 5:4 box with its read-out top right,
 * and, for an explainer, one slider that shows the figure's own value in its
 * unit.
 */
export class HlFigure extends HTMLElement {
  private handle: FigureHandle | null = null;
  private parts: HTMLElement[] = [];

  connectedCallback() {
    const name = this.getAttribute("name") ?? "";
    const entry = FIGURES[name];
    if (!entry) { console.error(`hl-figure: no figure named "${name}" in src/figures/index.ts`); return; }

    const box = html("div", "hl-box", { "data-hairline": name, role: "img", "aria-label": this.getAttribute("label") ?? entry.label });
    const svg = svgRoot({ viewBox: "0 0 400 320" }), out = readout();
    box.append(svg, out);
    this.appendChild(box);
    this.parts.push(box);
    const root = this.getRootNode();
    inject(root instanceof ShadowRoot ? root : document);

    // the engine writes its caption every frame; only a change reaches the page
    const read: Readout = { get textContent() { return out.textContent; }, set textContent(v) { if (out.textContent !== v) out.textContent = v ?? ""; } };
    const intensity = Number(this.getAttribute("intensity") ?? 0.5);
    this.handle = entry.mount({ stage: box, svg, read }, valueFor(entry.range, intensity));
    if (!out.textContent) out.textContent = "rest";

    const control = this.getAttribute("control");
    if (control) {
      const unit = this.getAttribute("unit") ?? "";
      const row = slider({
        label: control, min: 0, max: 1, step: 0.01, value: intensity,
        // one decimal for small values (a temperature of 1.0), none for large ones (a gap of 16)
        show: (i) => { const v = valueFor(entry.range, i); return `${v.toFixed(v < 10 ? 1 : 0)}${unit}`; },
        onInput: (i) => this.handle?.set(valueFor(entry.range, i)),
      });
      this.appendChild(row);
      this.parts.push(row);
    }
  }

  disconnectedCallback() {
    this.handle?.destroy();
    this.handle = null;
    this.parts.forEach((p) => p.remove());
    this.parts = [];
  }
}
