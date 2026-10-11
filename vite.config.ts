import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

/**
 * Every page: the index and posts/<slug>/index.html (ARCH-2). Reference pages
 * (the specimen) are built only for checks, with BLOG_DRAFTS=1, and never published.
 */
const REFERENCE = new Set(["specimen"]);
const posts = Object.fromEntries(
  readdirSync(resolve(import.meta.dirname, "posts"))
    .filter((slug) => process.env.BLOG_DRAFTS === "1" || !REFERENCE.has(slug))
    .map((slug) => [slug, resolve(import.meta.dirname, "posts", slug, "index.html")]),
);

/** The four Latin font files every page uses, preloaded so text does not reflow when they arrive (ARCH-4, LAY-5). */
const FONTS = [/source-serif-4-latin-wght-normal/, /source-serif-4-latin-wght-italic/, /inter-latin-wght-normal/, /jetbrains-mono-latin-wght-normal/];

const preloadFonts = (): Plugin => ({
  name: "preload-fonts",
  apply: "build",
  transformIndexHtml: {
    order: "post",
    handler(_html, ctx) {
      const files = Object.keys(ctx.bundle ?? {}).filter((f) => f.endsWith(".woff2") && FONTS.some((re) => re.test(f)));
      return files.map((f) => ({ tag: "link", attrs: { rel: "preload", as: "font", type: "font/woff2", href: "/" + f, crossorigin: "" }, injectTo: "head-prepend" }));
    },
  },
});

export default defineConfig({
  plugins: [preloadFonts()],
  build: { rollupOptions: { input: { index: resolve(import.meta.dirname, "index.html"), ...posts } } },
});
