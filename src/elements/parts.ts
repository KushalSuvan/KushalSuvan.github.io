/**
 * The small pieces of DOM the exhibit elements share: an element maker, the
 * read-out (FIG-3) and the one labelled slider an exhibit may have (FIG-3,
 * PLOT-7).
 */

/** An HTML element with a class and attributes. */
export function html<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, attrs: Record<string, string> = {}): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

export const svgRoot = (attrs: Record<string, string> = {}) => {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("aria-hidden", "true");
  for (const k in attrs) s.setAttribute(k, attrs[k]);
  return s;
};

/** The read-out: mono, top right of its box, seen and not read (the figure's label is what is read). */
export const readout = () => html("span", "readout", { "aria-hidden": "true" });

let ids = 0;

export type SliderOptions = {
  label: string;
  min: number; max: number; step: number; value: number;
  /** What the output shows for a value: the exhibit's own number and unit, not 0 to 1. */
  show: (v: number) => string;
  onInput: (v: number) => void;
};

/** One labelled slider with its value beside it, in a `.hl-control` row. */
export function slider(o: SliderOptions): HTMLDivElement {
  const id = `ctl-${++ids}`;
  const row = html("div", "hl-control");
  const label = html("label", "", { for: id });
  label.textContent = o.label;
  const input = html("input", "", { id, type: "range", min: String(o.min), max: String(o.max), step: String(o.step) });
  input.value = String(o.value);
  const output = html("output", "", { for: id });
  const sync = () => { const v = Number(input.value); output.textContent = o.show(v); return v; };
  sync();
  input.addEventListener("input", () => o.onInput(sync()));
  row.append(label, input, output);
  return row;
}
