import { definePlot } from "../engine/plot";

/**
 * The tail at scale: a request that fans out to N servers is slow if any one
 * of them is. With each server slow 1% of the time, the chance is 1 − 0.99^N.
 */

const pct = (p: number, n: number) => 100 * (1 - Math.pow(1 - p, n));

export default definePlot({
  id: "fanout",
  label: "Fanning a request out to a hundred servers makes its p99 the common case: 63% of requests wait for a slow server.",
  x: { min: 1, max: 100, ticks: [1, 25, 50, 75, 100], unit: "servers" },
  y: { min: 0, max: 100, ticks: [0, 25, 50, 75, 100], unit: "%" },
  series: [
    { id: "p99", label: "p99 slow", role: "main", fn: (n) => pct(0.01, n) },
    { id: "p999", label: "p99.9 slow", role: "cmp", fn: (n) => pct(0.001, n) },
  ],
  annotate: () => ({ x: 100, series: "p99", text: "63% at 100" }),
  read: (n) => `n ${Math.round(n)} · p99 ${pct(0.01, Math.round(n)).toFixed(1)}% · p99.9 ${pct(0.001, Math.round(n)).toFixed(1)}%`,
});
