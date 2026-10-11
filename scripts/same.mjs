#!/usr/bin/env node
/**
 * Two sets of pictures from `pnpm look --still --out <name>`, compared file by
 * file (ARCH-6). A refactor is done when this prints `same`.
 *
 *   pnpm same before after
 *
 * Chrome encodes the same pixels to the same bytes, so equal files are equal
 * pictures. Exits 1 and names every picture that changed, appeared or went.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const [a, b] = process.argv.slice(2);
if (!a || !b) { console.error("usage: pnpm same <before> <after>   (folders under shots/)"); process.exit(2); }
const dir = (n) => resolve(import.meta.dirname, "..", "shots", n);
for (const n of [a, b]) if (!existsSync(dir(n))) { console.error(`no shots/${n}/: run pnpm look <slug> --still --out ${n}`); process.exit(2); }

const A = new Set(readdirSync(dir(a))), B = new Set(readdirSync(dir(b)));
const changed = [...A].filter((f) => B.has(f) && !readFileSync(join(dir(a), f)).equals(readFileSync(join(dir(b), f))));
const gone = [...A].filter((f) => !B.has(f)), added = [...B].filter((f) => !A.has(f));

for (const f of changed) console.log(`changed  ${f}`);
for (const f of gone) console.log(`gone     ${f}`);
for (const f of added) console.log(`new      ${f}`);
if (changed.length + gone.length + added.length) process.exit(1);
console.log(`same (${A.size} pictures)`);
