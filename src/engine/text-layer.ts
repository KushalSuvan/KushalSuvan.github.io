import type { Vec2 } from "../hairline/iso";

/**
 * Text as a figure's subject (FIG-7): tokens, log lines, what a machine
 * writes. Set in mono, in an HTML layer over the drawing, never drawn as
 * paths. Positions are viewBox points (400 × 320) turned into percentages of
 * the box, so the layer needs no measuring and the text stays 12px at any
 * size.
 */
export type TextLayer = {
  /** A new span in the layer, with classes from `.ft` (exhibits.css). */
  span(cls?: string): HTMLSpanElement;
  /** Centres a span on a viewBox point, moved by a few pixels. */
  at(el: HTMLElement, p: Vec2, dx?: number, dy?: number): void;
  remove(): void;
};

export function textLayer(stage: HTMLElement): TextLayer {
  const layer = document.createElement("div");
  layer.className = "fig-text";
  layer.setAttribute("aria-hidden", "true");
  stage.appendChild(layer);
  return {
    span(cls = "") {
      const s = document.createElement("span");
      s.className = ("ft " + cls).trim();
      layer.appendChild(s);
      return s;
    },
    at(el, [x, y], dx = 0, dy = 0) {
      el.style.left = `${((x / 400) * 100).toFixed(3)}%`;
      el.style.top = `${((y / 320) * 100).toFixed(3)}%`;
      el.style.transform = `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px))`;
    },
    remove: () => layer.remove(),
  };
}
