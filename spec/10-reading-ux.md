# 10 · Reading UX

## READ-1 · Post anatomy

In this order, nothing else:

1. Site header: the site name (sans 600, links home), and on the right `archive`, `rss` and the theme toggle, mono 12px. Not sticky.
2. Post header in `text`: the series (mono 12px `--ink-3`, `series · part 2 of 4`, only if part of one), the title (`h1`), the dek (one sentence, what the reader will understand by the end), the meta line (`7 Oct 2026 · 14 min · 3 figures`), then the hero figure (`FIG-5`): an ornament, or the post's main explainer when the whole post is about one mechanism. A hero explainer may carry its slider.
3. The body.
4. The end: a `--ink-lo` rule, the series navigation if any (previous / next as titles), "Notes" with any footnotes that could not be sidenotes, and the reply line (`mail · rss`).

- **Rejected when:** the header carries tags, author photos, share buttons or a newsletter box; anything interrupts the body (no inline promos).

## READ-2 · The dek and the first screen

The title, dek and hero fit in the first viewport at 1440 × 900 and at 390 × 844. The dek is a promise the post keeps; the hero figure is the post's single image of what it is about.

## READ-3 · Table of contents

From 85rem (1360px), for posts with three or more `h2`s, a TOC sits fixed left of the wide column, never over it: `h2`s only, sans 0.8125rem `--ink-3`, the current section `--ink` with a 1px `--ink` rule beside it. It is the progress indicator; there is no progress bar. Below 85rem there is no TOC. It hides while a full-bleed section is on screen.

## READ-4 · The index page

No title and no dek: the page is the series. Each series is a group, newest series first, under its name as a small mono label (`doubt`), and its parts follow, newest first. A visually hidden `h1` names the site for screen readers. Each part is a row: date (mono, tabular, `--ink-3`), title (sans 600), dek (serif `--ink-2`), and each post's hero figure at rest, 160px wide, at the right. Hovering a row lets its figure answer the pointer. No pagination under 50 posts; then by year.

## READ-5 · Deep links

Every heading, figure, plot and scrolly step has an `id`. Loading a URL with a step's hash scrolls to that step and puts the canvas in that step's state immediately (no tween).

## READ-6 · Social and feeds

The social image is the hero figure's rest pose on paper, with the title in sans 600 beside it (planned, status.md). The RSS feed carries full text with each exhibit's static form (`A11Y-6`).
