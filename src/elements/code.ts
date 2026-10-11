/**
 * Code blocks (CMP-1): highlighting by weight, not hue, marked lines, and a
 * copy button. A small tokenizer is enough for the languages posts use; it is
 * replaced by build-time highlighting later (spec/status.md).
 */

const KEYWORDS: Record<string, string[]> = {
  ts: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "await", "async", "new", "throw", "try", "catch", "finally", "export", "import", "from", "type", "interface", "class", "extends", "of", "in", "break", "continue", "true", "false", "null", "undefined", "typeof"],
  go: ["func", "return", "if", "else", "for", "range", "var", "const", "type", "struct", "interface", "go", "defer", "select", "case", "chan", "package", "import", "nil", "true", "false", "err"],
  sql: ["select", "from", "where", "and", "or", "insert", "into", "values", "update", "set", "delete", "join", "on", "order", "by", "limit", "group", "create", "table", "index", "begin", "commit"],
  sh: ["if", "then", "fi", "for", "do", "done", "export", "echo", "cd"],
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function highlight(src: string, lang: string): string {
  const kw = new Set(KEYWORDS[lang] ?? []);
  const comment = lang === "sh" ? /#.*$/ : lang === "sql" ? /--.*$/ : /\/\/.*$/;
  const re = new RegExp(`(${comment.source})|("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\`(?:[^\`\\\\]|\\\\.)*\`)|(\\b\\d[\\d_.]*\\b)|([A-Za-z_][\\w]*)|([{}()[\\];,.:=<>+\\-*/!?&|])`, "gm");
  return src.replace(re, (m, c, s, n, w, p) => {
    if (c) return `<span class="c">${esc(m)}</span>`;
    if (s) return `<span class="s">${esc(m)}</span>`;
    if (n) return `<span class="n">${esc(m)}</span>`;
    if (w) return kw.has(lang === "sql" ? w.toLowerCase() : w) ? `<span class="k">${esc(m)}</span>` : esc(m);
    if (p) return `<span class="p">${esc(m)}</span>`;
    return esc(m);
  });
}

/** "3-5,9" → {3, 4, 5, 9} */
const ranges = (spec: string) => {
  const out = new Set<number>();
  for (const part of spec.split(",")) {
    const [a, b] = part.split("-").map(Number);
    for (let i = a; i <= (b || a); i++) out.add(i);
  }
  return out;
};

export function code() {
  for (const fig of document.querySelectorAll<HTMLElement>("figure.code")) {
    const el = fig.querySelector("code");
    if (!el) continue;
    const raw = (el.textContent ?? "").replace(/^\n/, "").replace(/\n\s*$/, "");
    const marks = ranges(fig.dataset.mark ?? "");
    const html = highlight(raw, el.dataset.lang ?? "")
      .split("\n")
      .map((line, i) => `<span class="ln${marks.has(i + 1) ? " mark" : ""}">${line || " "}</span>`)
      .join("");
    el.innerHTML = html;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy";
    btn.textContent = "copy";
    let reset = 0;
    btn.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(raw); btn.textContent = "copied"; }
      catch { btn.textContent = "select and copy"; }
      clearTimeout(reset);
      reset = window.setTimeout(() => (btn.textContent = "copy"), 1500);
    });
    fig.appendChild(btn);
  }
}
