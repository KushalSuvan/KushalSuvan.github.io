import { definePlot } from "../engine/plot";

/**
 * Mean time in system for an M/M/c queue, in multiples of the service time,
 * against utilisation ρ. The control is the number of servers c; between two
 * whole numbers the curve is interpolated, so the spring can carry it smoothly.
 */

/** Erlang C: the chance an arrival waits, for c servers at offered load a = cρ. */
function erlangC(c: number, rho: number): number {
  const a = c * rho;
  let term = 1, sum = 1;
  for (let k = 1; k < c; k++) { term *= a / k; sum += term; }
  const last = (term * a) / c / (1 - rho);
  return last / (sum + last);
}

const whole = (c: number, rho: number) => (rho >= 1 ? Infinity : 1 + erlangC(c, rho) / (c * (1 - rho)));

const W = (c: number, rho: number) => {
  const lo = Math.floor(c), hi = Math.ceil(c), t = c - lo;
  return lo === hi ? whole(lo, rho) : whole(lo, rho) * (1 - t) + whole(hi, rho) * t;
};

const SLO = 4;

export default definePlot({
  id: "queue",
  label: "Waiting time stays flat until utilisation nears one, then explodes; more servers push the knee to the right.",
  x: { min: 0, max: 0.99, ticks: [0, 0.25, 0.5, 0.75, 0.99], unit: "ρ", format: (v) => (v === 0 ? "0" : v.toFixed(2).replace(/^0/, "")) },
  y: { min: 0, max: 10, ticks: [0, 2, 4, 6, 8, 10], unit: "× service" },
  series: [
    { id: "c", label: "c servers", role: "main", fn: (x, c) => W(c, x), limit: SLO },
    { id: "one", label: "one server", role: "cmp2", fn: (x) => W(1, x) },
    { id: "slo", label: "slo", role: "ref", fn: () => SLO },
  ],
  control: { label: "servers c", unit: "", min: 1, max: 8, step: 1, value: 4, format: (v) => String(Math.round(v)) },
  annotate: (c) => ({ x: 0.8, series: "c", text: `ρ .80 → ${W(c, 0.8).toFixed(1)}×` }),
  read: (x, c) => `ρ ${x.toFixed(2).replace(/^0/, "")} · c ${Math.round(c)} · ${Number.isFinite(W(c, x)) ? W(c, x).toFixed(2) : "∞"}×`,
});
