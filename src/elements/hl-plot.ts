import { mountPlot, type PlotHandle } from "../engine/plot";
import { PLOTS } from "../plots";
import { html, readout, slider } from "./parts";

/**
 * <hl-plot name [live]> (spec/08-plots.md). Draws the registered plot at
 * pixel size in its reserved box, and for a live plot adds its one control.
 * `live` on the element reserves the control's row before the script runs.
 */
export class HlPlot extends HTMLElement {
  private handle: PlotHandle | null = null;
  private parts: HTMLElement[] = [];

  connectedCallback() {
    const name = this.getAttribute("name") ?? "";
    const plot = PLOTS[name];
    if (!plot) { console.error(`hl-plot: no plot named "${name}" in src/plots/index.ts`); return; }
    if (plot.control && !this.hasAttribute("live")) console.warn(`hl-plot "${name}" has a control: add the live attribute so its row is reserved (LAY-5)`);

    const box = html("div", "hl-box", { role: "img", "aria-label": plot.label }), out = readout();
    out.textContent = "rest";
    box.appendChild(out);
    this.appendChild(box);
    this.parts.push(box);
    this.handle = mountPlot(plot, box, out);

    const c = plot.control;
    if (c) {
      const row = slider({
        label: c.label, min: c.min, max: c.max, step: c.step, value: c.value,
        show: (v) => (c.format ? c.format(v) : String(v)) + c.unit,
        onInput: (v) => this.handle?.setParam(v),
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
