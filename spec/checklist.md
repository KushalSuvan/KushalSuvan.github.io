# Checklist

Answer every line yes or no from the screenshots in `shots/<slug>/` after `pnpm check` and `pnpm look <slug>` both print `ok`. A no is fixed before the work is done. Say which lines you could not answer and why.

## The page

1. **First screen** (`wide-light-top`, `narrow-light-top`): title, dek and hero are all visible, and nothing else competes with them. (READ-2)
2. **Three voices** (any picture): prose is serif, headings and captions sans, everything the machine says mono. (P-4, TYPE-1)
3. **Measure**: no prose line in `wide-light-full` runs past about 75 characters. (LAY-2)
4. **Rhythm**: gaps between blocks match LAY-4; nothing is jammed against an exhibit. (LAY-4)
5. **Both themes** (`*-dark-*`): nothing vanishes, nothing is left in a light-theme colour, signal is still the only hue. (TOK-3, TOK-4)
6. **Reduced motion** (`reduced-*`): the page reads the same; nothing is caught half-way. (MOT-7)

## Each exhibit (`ex-*`)

7. **Rest makes the point**: with no pointer, the exhibit already shows what its caption says. (P-3, FIG-5)
8. **One highlight**: one thing is `hi`; signal, if any, is on one thing and has a second cue. (LINE-1, TOK-4)
9. **Caption** says what to notice, not what the picture is. (FIG-4)
10. **Plots**: direct labels, no legend; ticks round; units after the last tick; the hovered read-out (`-hover`) has the right numbers. (PLOT-3, PLOT-4, PLOT-7)
11. **Narrow** (`ex-narrow-dark-*`): nothing is cut at the right edge; text is at least 11px. (TYPE-2, LAY-3)

## Each scrolly step (`step-*`)

12. **The camera frames what the text names**, and the focused node is the one the paragraph is about. (SCN-3, SCN-4)
13. **Labels** do not touch edges, nodes or each other; none sits on a zone's boundary. (SCN-6)
14. **The step's text stands alone**: read it without the picture; it still says what happens. (SCN-3, A11Y-6)
15. **Narrow**: the card is readable below the canvas and does not cover it. (LAY-6)
16. **Explore** (`explore-*`): the zoomed view is sharp, labels stay 12px, the button says `done`. (SCN-5)

## Content

17. Every number in the text, a table or a plot is either computed from a stated formula or cites a source. (PLOT-8)
18. Code runs as shown, or is marked as a sketch in the text.
