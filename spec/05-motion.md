# 05 · Motion

All motion is in `src/hairline/motion.ts` (springs, tweens) and joins one frame loop (`register` in `src/hairline/stage.ts`).

## MOT-1 · Two clocks

| Input | Clock | Settings |
| --- | --- | --- |
| Discrete: which item, which step, a toggle | Tween | 700ms on `(.32, .72, 0, 1)` (`tween`, `tset`, `tval`) |
| Continuous: where the pointer is, a slider's value | Spring | k 100 · c 18 · m 1 (`spring`, `stepS`) |

- **Rejected when:** a tween follows a moving target; a spring animates a choice; any motion is linear; constants are changed without a reason written beside them.

## MOT-2 · Stagger by distance

When several parts respond to one choice, each waits `|i − chosen| × step`, step 30–60ms.

## MOT-3 · Scroll is a discrete input

Entering a scrolly step is a choice, not a position. The camera, focus and reveals tween to the step's state over 700ms when the step crosses the middle of the viewport. They are **not** scrubbed to scroll position: scrubbing ties the picture to the reader's thumb, stalls half-way and makes slow readers watch a half-moved scene.

- A camera move longer than two screen widths takes 900ms; nothing takes longer.
- Leaving a step backwards plays the same tween to the previous state.
- **Rejected when:** a scene's state is a function of `scrollY`; the reader can stop scrolling and leave the scene between two states.

## MOT-4 · UI motion

| What | Duration | Easing |
| --- | --- | --- |
| Stroke colour change in a drawing | `--dur-stroke` 260ms | `--ease-stroke` |
| Link underline, button states, toggles | `--dur-ui` 160ms | `--ease-stroke` |
| Disclosure (sidenote on narrow, TOC sheet) | `--dur-ui` | `--ease-lift` |

No page transitions, no parallax, no scroll-jacking, no entrance animations on prose.

## MOT-5 · Ambient motion

Only packets on active edges and figures whose idea is motion (a belt, a loop) move without input, and only while on screen. Packets travel at 160 world units a second, one every 0.6s per active edge, at most three in flight per edge.

## MOT-6 · One loop, asleep offscreen

Use `register(stage, tick)`; return `true` only while something is still moving; call `wake()` after input. The loop sleeps for exhibits more than 80px offscreen and stops when everything has settled.

- **Rejected when:** a figure, scene or plot calls `setTimeout`, `setInterval` or `requestAnimationFrame`, or uses a CSS animation (`pnpm check` enforces this).

## MOT-7 · Reduced motion

With `prefers-reduced-motion: reduce`, springs and tweens land in one step (the engine does this), camera moves cut, packets stand still at one third and two thirds of their edge, and ambient figures hold still. Every exhibit still answers the pointer and the scroll.
