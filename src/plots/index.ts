import type { Plot } from "../engine/plot";
import fanout from "./fanout";
import queue from "./queue";

/** Every plot a post can name in <hl-plot name="…"> (spec/08-plots.md, PLOT-1). */
export const PLOTS: Record<string, Plot> = { fanout, queue };
