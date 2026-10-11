# 00 · Principles

Every rule in this spec comes from one of these. When a case is not covered, decide by them, in this order.

## P-1 · The text leads, the exhibit answers

A post is an argument in prose. An exhibit exists because one paragraph needs it, sits next to that paragraph, and shows what that paragraph says. In a scrolly section the reader's scroll is the pointer: the paragraph they are reading moves the camera.

- **Rejected when:** an exhibit could be deleted without any sentence becoming harder to follow; an exhibit shows things the text never mentions.

## P-2 · One line, four weights

The drawing medium is a single hairline stroke in four ink weights (`hi`, `edge`, `mid`, `lo`) on paper. Emphasis is a change of weight, never a fill, glow, gradient or shadow. One hue, signal, exists for failure and heat, and is rare.

- **Rejected when:** colour carries meaning that a weight or a dash could have carried.

## P-3 · Rest is the thumbnail

Every exhibit is complete at rest: without a pointer, without scrolling, without JavaScript running, printed, in an RSS reader, under reduced motion. Interaction reveals more; it never reveals the point.

- **Rejected when:** the point of an exhibit can only be seen by hovering, dragging or animating.

## P-4 · Three voices

Serif is the author speaking (prose). Sans is the structure (titles, headings, navigation, captions). Mono is the machine (code, labels inside diagrams, ticks, read-outs). A piece of text is set in the voice of whoever is speaking.

- **Rejected when:** a label inside a diagram is serif; a heading is mono; prose is sans.

## P-5 · Honest geometry

Plates are opaque and painted back to front, so nothing shows through that should not. Quantities are drawn flat and to scale: isometric depth is for things, never for numbers. Hit areas test the rest or target pose, never the pose on screen.

- **Rejected when:** a 3D bar in a plot encodes a number; an axis is cut without saying so; a hover flickers.

In an explainer figure, heights may show a quantity (a probability, an activation) when the shape of the whole is the point and the read-out gives the exact number on hover. Heights are then linear in the quantity, never eased.

## P-6 · Two clocks, one loop

A discrete change (which step, which item) runs a 700ms ease-out tween. A continuous input (where the pointer is) follows a spring. Everything that moves joins the one shared frame loop, which sleeps offscreen and stops when everything is at rest.

- **Rejected when:** anything has its own timer, `requestAnimationFrame` or CSS animation; motion is linear; something moves forever without a reason.

## P-7 · Measured, not guessed

Rules that can be checked by a script are checked by a script (`pnpm check`, `pnpm look`). Rules that need eyes are checked on screenshots, every time, against [checklist.md](checklist.md).

- **Rejected when:** work is called done without the screenshots being looked at.
