# 11 · Accessibility

## A11Y-1 · Contrast

Text meets 4.5:1 against its background (`--ink`, `--ink-2` always do; `--ink-3` only for mono 11.5px+ read-outs and meta that repeat information found elsewhere). Strokes that carry meaning meet 3:1 (`--ink-3` and up). `mid` and `lo` never carry meaning alone.

## A11Y-2 · Names

- A figure is `role="img"` with an `aria-label` that says what it shows (the registry label). An interactive figure that is operable from the keyboard is `role="group"`.
- A plot is `role="img"`; its label states the finding, and a visually hidden table of its data follows it (planned, status.md).
- A scrolly canvas is `role="img"` with the scene's label; it is not live. The steps' text carries the content.

## A11Y-3 · Keyboard

Every control is reachable with Tab and has a visible focus ring: 1.5px `--ink` outline, 2px offset. Sliders are native `<input type="range">`. Explore mode (SCN-5) has full keyboard control and leaves with `Esc`. Nothing traps focus except explore on narrow screens, which returns it on exit.

## A11Y-4 · Pointer independence

Hover only ever adds detail. Every point an exhibit makes is visible at rest or reachable by scrolling or by keyboard.

## A11Y-5 · Reduced motion

See `MOT-7`. Checked by `pnpm look`, which shoots the specimen with reduced motion on.

## A11Y-6 · Print, RSS, no JavaScript

Every exhibit has a static form (`P-3`). Print: one column, black on white, sidenotes as numbered notes after their paragraph, each scrolly step followed by its static canvas, URLs of external links printed after them. (Partly planned, status.md.)

## A11Y-7 · Language and reading

`<html lang="en">`. Abbreviations expanded at first use. No text in images.
