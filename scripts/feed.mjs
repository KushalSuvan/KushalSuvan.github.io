/**
 * The RSS feed (spec/10-reading-ux.md, READ-6), built from the posts themselves
 * so it can never disagree with the site. The Vite build emits it as /rss.xml.
 *
 * Each item carries the post's full text. What a feed reader cannot run is
 * replaced, not dropped: an interactive figure becomes a link to it on the
 * site (its caption stays), a sidenote becomes an inline parenthesis, and
 * every link is made absolute. Reference pages (the specimen) are never in it.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const SITE = "https://kushalsuvan.github.io";
const TITLE = "kronos";
const DESCRIPTION = "A research series on metacognition and doubt in language models.";
const REFERENCE = new Set(["specimen"]);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const pick = (html, re) => (re.exec(html) ?? [])[1];

/** A date as RSS wants it (RFC 822), at midnight UTC. */
const rfc822 = (iso) => new Date(`${iso}T00:00:00Z`).toUTCString().replace("GMT", "+0000");

/** The post's body, rewritten for a reader that runs no script and loads no stylesheet. */
function body(html, url) {
  let main = pick(html, /<main class="post">([\s\S]*?)<\/main>/) ?? "";
  main = main.replace(/<header class="post-head">[\s\S]*?<\/header>/, ""); // the reader shows the title itself
  const link = (id) => `<p><a href="${url}#${id}">Interactive figure: open it on the site.</a></p>`;
  // a scrolly section is a drawing driven by the text; the steps stay, the canvas becomes a link
  main = main.replace(/<hl-scrolly\b[^>]*>([\s\S]*?)<\/hl-scrolly>/g, (_m, steps) => `${link("")}${steps}`);
  // figures and plots: the element becomes a link to that figure; its caption stays
  main = main.replace(/<figure class="fig[^"]*" id="([\w-]+)">([\s\S]*?)<\/figure>/g, (m, id, inner) =>
    /<hl-(figure|plot)\b/.test(inner) ? `<figure>${link(id)}${inner.replace(/<hl-(figure|plot)\b[^>]*><\/hl-\1>/g, "")}</figure>` : m);
  // token heat: the text survives, its colour does not (readers drop the stylesheet), so it links to the coloured version
  main = main.replace(/<figure class="fig[^"]*" id="([\w-]+)">(\s*<div class="tokens">)/g, (_m, id, rest) =>
    `<figure id="${id}"><p><a href="${url}#${id}">This figure is colour-coded by entropy: open it on the site to see the colours.</a></p>${rest}`);
  // sidenotes: the checkbox pattern means nothing in a reader; the note goes inline
  main = main.replace(/<label class="sn-ref"[^>]*><\/label><input[^>]*class="sn-toggle"[^>]*\/?><span class="sn">([\s\S]*?)<\/span>/g, " ($1)");
  // links and sources become absolute
  main = main.replace(/(href|src)="\/(?!\/)/g, `$1="${SITE}/`).replace(/href="#/g, `href="${url}#`);
  return main.trim();
}

/** Every published post, newest first. */
export function posts(root) {
  const dir = join(root, "posts");
  return readdirSync(dir)
    .filter((slug) => !REFERENCE.has(slug) && existsSync(join(dir, slug, "index.html")))
    .map((slug) => {
      const html = readFileSync(join(dir, slug, "index.html"), "utf8");
      const url = `${SITE}/posts/${slug}/`;
      const date = pick(html, /<p class="meta"><time datetime="([\d-]+)"/);
      if (!date) throw new Error(`posts/${slug}: no <time datetime> in its meta line, so it has no date for the feed`);
      return {
        slug, url, date,
        title: unesc(pick(html, /<title>([\s\S]*?)<\/title>/) ?? slug),
        description: unesc(pick(html, /<meta name="description" content="([^"]*)"/) ?? ""),
        content: body(html, url),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** The feed as RSS 2.0. */
export function feed(root) {
  const items = posts(root).map((p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${p.url}</link>
      <guid isPermaLink="true">${p.url}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <description>${esc(p.description)}</description>
      <content:encoded><![CDATA[${p.content.replaceAll("]]>", "]]]]><![CDATA[>")}]]></content:encoded>
    </item>`);
  const latest = posts(root)[0]?.date;
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${TITLE}</title>
    <link>${SITE}/</link>
    <description>${esc(DESCRIPTION)}</description>
    <language>en</language>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />${latest ? `\n    <lastBuildDate>${rfc822(latest)}</lastBuildDate>` : ""}
${items.join("\n")}
  </channel>
</rss>
`;
}

// `node scripts/feed.mjs` prints the feed, for a look without building
if (import.meta.url === `file://${process.argv[1]}`) process.stdout.write(feed(join(import.meta.dirname, "..")));
