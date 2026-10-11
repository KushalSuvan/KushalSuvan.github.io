import { clamp, r2 } from "../hairline/iso";
import { reducedMotion, spring, stepS, tset, tval, tween, type Spring } from "../hairline/motion";
import { disposer, mk, register, type FigureMount } from "../hairline/stage";
import { textLayer } from "../engine/text-layer";
import { CELL_OF, CONTEXTS, START, VOCAB, entropy, logits, nextContext, sample, softmax, type Context } from "./doubt-model";

/**
 * Doubt, flat: a row of tokens a model has written, and a dashed slot for the
 * next one. To its right, the logit layer: one neuron per entry of a 49-token
 * vocabulary in a single column, each with a bar as long as its probability,
 * so the bars are the distribution the next token is drawn from. Every 0.12s
 * the model samples again: the slot flickers, its rivals sit over it in
 * fainter ink, and the sampled neuron and its line to the slot light up.
 * Every 2.4s the slot's token is written and a new distribution forms.
 * The model is a toy (doubt-model.ts); the text is the subject (FIG-7).
 */

const ROW_Y = 160, TILE_W = 36, TILE_H = 22, PITCH = 40, X0 = 10, SLOT = 5; // the row of tokens; the slot's place
const NX = 312, TOP = 40, BOTTOM = 302, R = 1.9;                             // the column of neurons
const BX = 318, BAR_H = 2.6, BAR_MAX = 78;                                   // the bars: start, thickness, length at p = 1
const FLICK = 0.12, DWELL = 2.4, GHOSTS = 3;                                 // seconds between samples and between commits

/** A rounded rectangle as a path. */
const rect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${r2(x + r)} ${r2(y)}H${r2(x + w - r)}A${r} ${r} 0 0 1 ${r2(x + w)} ${r2(y + r)}V${r2(y + h - r)}A${r} ${r} 0 0 1 ${r2(x + w - r)} ${r2(y + h)}H${r2(x + r)}A${r} ${r} 0 0 1 ${r2(x)} ${r2(y + h - r)}V${r2(y + r)}A${r} ${r} 0 0 1 ${r2(x + r)} ${r2(y)}Z`;

const tileX = (j: number) => X0 + j * PITCH;
const rowOf = (v: number) => TOP + (CELL_OF[v] / (VOCAB.length - 1)) * (BOTTOM - TOP);

type Neuron = { v: number; y: number; fan: SVGPathElement; dot: SVGEllipseElement; bar: SVGPathElement; sp: Spring; drawn: number };

export const mount: FigureMount = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const words = textLayer(stage);
  bag.add(words.remove);
  let T = value;

  // the model's state: context, distribution, what it has written
  let ctx: Context = CONTEXTS[START.context], z = logits(ctx), p = softmax(z, T);
  const written: string[] = [...START.tokens];
  const shift = tween(0);

  const g = mk("g", {}, svg);
  const slotEnd: [number, number] = [tileX(SLOT) + TILE_W + 4, ROW_Y];

  // the layer: a fan from every neuron to the slot (painted first, under all), the neurons, their bars
  const fans = mk("g", {}, g);
  const neurons: Neuron[] = VOCAB.map((_, v) => {
    const y = rowOf(v);
    return {
      v, y,
      fan: mk("path", { class: "nf lo", d: `M${slotEnd[0]} ${slotEnd[1]}L${NX - R - 1} ${r2(y)}` }, fans),
      dot: mk("ellipse", { cx: NX, cy: r2(y), rx: R, ry: R, class: "sil" }, g), // an ellipse: hairline styles ellipses, not circles
      bar: mk("path", { class: "sil" }, g),
      sp: spring(0, { eps: 0.0005 }), drawn: NaN,
    };
  });

  // the slot, dashed: nothing is written there yet; then the written tiles, which slide out of it
  mk("path", { d: rect(tileX(SLOT), ROW_Y - TILE_H / 2, TILE_W, TILE_H, 5), class: "sil dash" }, g);
  const tiles = Array.from({ length: SLOT + 2 }, () => ({ el: mk("path", { class: "sil" }, g), text: words.span("tok") }));
  const ghosts = Array.from({ length: GHOSTS }, (_, k) => words.span(k ? "tok ghost far" : "tok ghost"));
  const main = words.span("tok next");
  const slotMid: [number, number] = [tileX(SLOT) + TILE_W / 2, ROW_Y];

  let shown = 0, sinceSample = 1e9, sinceCommit = 0;

  function retarget() {
    p = softmax(z, T);
    neurons.forEach((n) => { n.sp.t = p[n.v]; });
  }
  retarget();
  for (const n of neurons) n.sp.x = n.sp.t; // the first distribution stands at once

  function commit(now: number) {
    const token = VOCAB[shown];
    written.push(token);
    if (written.length > SLOT + 2) written.shift();
    ctx = CONTEXTS[nextContext(ctx, token)];
    z = logits(ctx);
    retarget();
    shift.from = shift.to = 1; tset(shift, 0, now, 0); // the written token slides out of the slot into the row
  }

  function drawRow(now: number) {
    const off = tval(shift, now);
    tiles.forEach((t, k) => {
      const w = written.length - 1 - k, j = SLOT - 1 - k + off, vis = w >= 0 && j > -1;
      t.el.style.display = vis ? "" : "none";
      t.text.style.display = vis && j > -0.25 ? "" : "none";
      if (!vis) return;
      t.el.setAttribute("d", rect(tileX(j), ROW_Y - TILE_H / 2, TILE_W, TILE_H, 5));
      t.text.textContent = written[w].trim();
      words.at(t.text, [tileX(j) + TILE_W / 2, ROW_Y]);
    });
  }

  function drawLayer() {
    for (const n of neurons) {
      // a bar as long as the probability; one too short to see is not drawn, so it never reads as a second neuron
      const lit = n.v === shown, len = BAR_MAX * clamp(n.sp.x, 0, 1);
      if (len !== n.drawn) {
        n.drawn = len;
        n.bar.style.display = len < BAR_H * 1.5 ? "none" : "";
        n.bar.setAttribute("d", rect(BX, n.y - BAR_H / 2, Math.max(len, BAR_H), BAR_H, BAR_H / 2));
      }
      n.dot.setAttribute("class", lit ? "dot" : "sil");
      n.bar.classList.toggle("hi", lit);
      n.fan.setAttribute("class", lit ? "nf hi" : "nf lo");
    }
  }

  function drawSlot(H: number) {
    main.textContent = VOCAB[shown].trim();
    words.at(main, slotMid);
    // rivals: more of them, and further off, the more doubt there is; none when the answer is near certain
    const spread = H < 0.4 ? 0 : clamp(H / 3, 0, 1) * 10, still = reducedMotion();
    const order = p.map((v, k) => [v, k]).sort((a, b) => b[0] - a[0]).map((e) => e[1]).filter((k) => k !== shown);
    ghosts.forEach((el, k) => {
      el.style.display = spread ? "" : "none";
      if (!spread) return;
      const rival = still ? order[k] : sample(p, Math.random());
      el.textContent = VOCAB[rival === shown ? order[k] : rival].trim();
      const a = still ? k * 2.1 : Math.random() * Math.PI * 2, r = spread * (still ? 0.7 : 0.4 + 0.6 * Math.random());
      words.at(el, slotMid, Math.cos(a) * r * 1.6, Math.sin(a) * r);
    });
  }

  const B = register(stage, (dt, now) => {
    let moving = false;
    for (const n of neurons) if (stepS(n.sp, dt)) moving = true;
    const still = reducedMotion();
    sinceSample += dt; sinceCommit += dt;
    const resample = still || sinceSample >= FLICK;
    if (still) shown = p.indexOf(Math.max(...p));
    else if (resample) { shown = sample(p, Math.random()); sinceSample = 0; }
    if (!still && sinceCommit >= DWELL) { commit(now); sinceCommit = 0; }
    const H = entropy(p);
    drawRow(now); drawLayer();
    if (resample) drawSlot(H);
    read.textContent = `doubt ${H.toFixed(2)} bits`;
    return still ? moving : true;
  });
  bag.add(B.unregister);
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { T = v; retarget(); B.wake(); }, destroy: bag.dispose };
};
