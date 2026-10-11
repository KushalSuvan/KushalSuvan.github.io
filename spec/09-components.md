# 09 · Components

Content components inside the prose. All are plain HTML with classes; no component needs JavaScript to be read.

## CMP-1 · Code blocks

```html
<figure class="code" data-file="retry.ts">
  <pre><code data-lang="ts">…</code></pre>
</figure>
```

- Mono 0.875rem/1.6, on `--paper-2`, `--radius-2`, padding `--s-4` `--s-5`, horizontal scroll inside the block only. Ligatures off; tab size 2.
- Highlighting by weight, not hue: keywords `--ink` weight 600; strings `--ink-2`; comments `--ink-3` italic serif (comments are the author's voice); numbers and literals `--ink`; punctuation `--ink-3`; everything else `--ink`.
- `data-file` shows a file name tab above the block, mono 12px `--ink-3`. `data-mark="3-5,9"` marks lines with a 2px `--ink` bar in the gutter and leaves the rest unchanged. Diffs mark lines with `+` and `−` in the gutter, never green and red.
- A copy button appears on hover and focus, top right, mono 11.5px: `copy` → `copied` for 1.5s.
- Width: in `text` up to 66 columns; longer code goes `.wide` (88 columns). Wrap nothing.

## CMP-2 · Inline code

Mono 0.88em, `--paper-2` fill, `--radius-1`, 0.15em × 0.35em padding. For identifiers, commands, values. Not for emphasis.

## CMP-3 · Sidenotes

```html
<p>Little's law<label class="sn-ref" for="sn-1"></label><input type="checkbox" id="sn-1" class="sn-toggle"><span class="sn">L = λW holds for any stable system.</span> says…</p>
```

- Numbered automatically by a CSS counter, the number in mono superscript.
- Wide: in the right margin, 15rem, top aligned with the line of its reference, `--ink-2` serif 0.875rem.
- Medium and narrow: hidden until its number is tapped, then shown inline below the line as an indented block with a `--ink-lo` left rule.
- One sentence or two. A sidenote with code or a figure is a section.

## CMP-4 · Callouts

Two kinds only, `note` and `warn`. A 1px left rule (`--ink-mid` for note, `--signal` for warn), the kind as a mono 11.5px label (`note`, `warning`) above the text, no fill, no icon. Use a callout at most twice per post.

## CMP-5 · Tables

Sans 0.875rem, header weight 600 `--ink-2`, horizontal rules only (`--ink-lo`, the header rule `--ink-mid`), numbers right aligned and tabular, units in the header. More than five columns go `.wide`; on narrow the table scrolls inside its own box.

## CMP-6 · Math

Inline math in serif italic for single variables (*λ*, *ρ*). Display formulas centred, serif, one per line, rendered at build time (planned: KaTeX, status.md). Until then a display formula is a `<p class="eq">` with Unicode (W = 1 / (μ − λ)).

## CMP-7 · Cross-references

`<a href="#fig-queue" class="xref">Fig 4</a>`. On hover or focus on wide screens, a preview of the target at rest appears beside the link (planned). Following the link scrolls to the exhibit and draws its silhouette strokes `hi` for 700ms.

## CMP-8 · Keys and terms

- `<kbd>`: mono 0.8em, 1px `--ink-mid` border, `--radius-1`.
- `<dfn>`: italic serif at first use. A glossary term later in the post may carry `<abbr title>`, dotted `--ink-mid` underline.

## CMP-9 · Key line

`<p class="key">…</p>`: the one sentence a reader should leave a section with, set apart so it is caught at a skim.

- The author's voice, louder: serif at the dek's size (1.3125rem → 1.1875rem), line height 1.4, `--ink`, `text-wrap: balance`.
- A 1px `--ink` rule hangs in the left margin (10px out on phones, 24px from 40rem), so the text keeps the column's edge. The rule is the only mark: no box, no fill, no quotation marks, no icon.
- `--s-6` above and below.
- One sentence, two at most, under 30 words, that stands alone without the paragraph before it. It states the finding; it does not tease it.
- At most one per section and two per post. A key line on every page is no key line.
- **Rejected when:** it repeats the paragraph next to it word for word; it is a quote (that is `blockquote`); more than two in a post (`pnpm check`).

