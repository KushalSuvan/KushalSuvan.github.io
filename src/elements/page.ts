import { code } from "./code";

/**
 * Page behaviours that need a little script: heading anchors (TYPE-4), the
 * table of contents (READ-3), the theme toggle (TOK-3), cross-reference
 * flashes (CMP-7), and code blocks (code.ts). Every one of them leaves the
 * page readable without it.
 */

/* ---------- headings, contents (TYPE-4, READ-3) ---------- */

const slug = (s: string) => s.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

function headings() {
  const hs = [...document.querySelectorAll<HTMLElement>(".post > h2, .post > h3")];
  for (const h of hs) {
    if (!h.id) h.id = slug(h.textContent ?? "");
    const a = document.createElement("a");
    a.className = "anchor";
    a.href = "#" + h.id;
    a.textContent = "#";
    a.setAttribute("aria-label", `Link to this section`);
    h.prepend(a);
  }

  const h2s = hs.filter((h) => h.tagName === "H2");
  if (h2s.length < 3) return;
  const nav = document.createElement("nav");
  nav.className = "toc";
  nav.setAttribute("aria-label", "Contents");
  const ol = document.createElement("ol");
  const links = h2s.map((h) => {
    const li = document.createElement("li"), a = document.createElement("a");
    a.href = "#" + h.id;
    a.textContent = (h.textContent ?? "").replace(/^#/, "");
    li.appendChild(a); ol.appendChild(li);
    return a;
  });
  nav.appendChild(ol);
  document.body.appendChild(nav);

  // the current section is the last h2 above the top third of the viewport
  const update = () => {
    const line = innerHeight / 3;
    let cur = -1;
    h2s.forEach((h, i) => { if (h.getBoundingClientRect().top < line) cur = i; });
    links.forEach((a, i) => a.setAttribute("aria-current", String(i === cur)));
  };
  addEventListener("scroll", update, { passive: true });
  update();

  // the contents step aside while a full-bleed section is on screen
  const full = document.querySelectorAll(".post > .full, hl-scrolly");
  const seen = new Set<Element>();
  const io = new IntersectionObserver((es) => {
    for (const e of es) e.isIntersecting ? seen.add(e.target) : seen.delete(e.target);
    nav.classList.toggle("hidden", seen.size > 0);
  });
  full.forEach((f) => io.observe(f));
}

/* ---------- theme (TOK-3) ---------- */

function theme() {
  const root = document.documentElement;
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") root.dataset.theme = saved;
  } catch { /* storage may be unavailable */ }
  const btn = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
  if (!btn) return;
  const current = () => root.dataset.theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const label = () => { btn.textContent = current() === "dark" ? "light" : "dark"; };
  label();
  btn.addEventListener("click", () => {
    const next = current() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch { /* ignore */ }
    label();
  });
}

/* ---------- cross-references (CMP-7) ---------- */

function xrefs() {
  document.addEventListener("click", (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>("a.xref");
    if (!a) return;
    const target = document.querySelector(a.hash);
    if (!target) return;
    target.classList.add("flash");
    window.setTimeout(() => target.classList.remove("flash"), 700);
  });
}

export function page() {
  theme();
  code();
  headings();
  xrefs();
}
