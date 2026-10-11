import type { FigureMount } from "../hairline/stage";
import { mount as doubt } from "./doubt";
import { mount as gem } from "./gem";
import { mount as stack } from "./stack";

/**
 * Every figure a post can name in <hl-figure name="…"> (spec/06-figures.md, FIG-2).
 * `range` is the figure's own value at intensity 0, 0.5 and 1; the middle one is the default.
 */
export type FigureEntry = { mount: FigureMount; label: string; range: readonly [number, number, number] };

export const FIGURES: Record<string, FigureEntry> = {
  doubt: {
    mount: doubt,
    label: "A row of tokens a language model has written and a dashed slot for the next one, which flickers between candidates. Beside it, the logit layer: a field of pillars, one per token, as tall as its probability. The pointer over a pillar holds that token in the slot.",
    range: [0.35, 1, 2.2], // temperature
  },
  gem: {
    mount: gem,
    label: "A cushion-cut gem floating over its footprint. Moving across turns it, and the facet nearest the pointer catches the light.",
    range: [20, 45, 90], // turn, degrees
  },
  stack: {
    mount: stack,
    label: "Nine thin slabs stacked in a slow helix. The pointer's height picks a slab and the stack parts around it.",
    range: [8, 16, 28], // gap, viewBox units
  },
};

/** The figure's own value for an intensity: two straight lines that meet at 0.5, as hairline does. */
export function valueFor(range: readonly [number, number, number], intensity: number): number {
  const [lo, mid, hi] = range, i = Math.min(1, Math.max(0, Number.isFinite(intensity) ? intensity : 0.5));
  const v = i <= 0.5 ? lo + (i / 0.5) * (mid - lo) : mid + ((i - 0.5) / 0.5) * (hi - mid);
  return Math.round(v * 1000) / 1000;
}
