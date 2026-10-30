// Turns one of the site's HTML pages into Markdown for AI agents (page.md and llms-full.txt).
// The pages are hand-written and well formed, so a small tag scanner is enough.

const SKIP_TAGS = new Set(["head", "header", "nav", "script", "style", "svg", "form", "button", "picture", "img", "noscript", "template", "iframe"]);
const SKIP_CLASSES = ["hidden", "skip", "brand", "num", "plus", "quote-nav", "foot-site"];
const RAW_TEXT = new Set(["script", "style"]);
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const BLOCK = new Set(["main", "section", "article", "div", "figure", "details", "ul", "ol", "address", "aside", "p", "fieldset"]);
const ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ldquo: "“", rdquo: "”", lsquo: "‘",
  rsquo: "’", hellip: "…", mdash: "—", ndash: "–", copy: "©", reg: "®", trade: "™", middot: "·", bull: "•",
};

function decode(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, name) => {
    if (name[0] === "#") {
      const code = name[1] === "x" || name[1] === "X" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      return String.fromCodePoint(code);
    }
    return ENTITIES[name.toLowerCase()] ?? all;
  });
}

function attrs(source) {
  const out = {};
  for (const m of source.matchAll(/([^\s=\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
    out[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? "");
  }
  return out;
}

function skipped(tag, a) {
  if (SKIP_TAGS.has(tag) || "hidden" in a || a["aria-hidden"] === "true") return true;
  const classes = (a.class || "").split(/\s+/);
  return SKIP_CLASSES.some((c) => classes.includes(c));
}

const inline = (text) => text.replace(/\s+/g, " ").trim();

// Keeps the spaces around an inline element outside its markers: " **bold** " not "** bold **".
function wrap(text, before, after = before) {
  const core = inline(text);
  if (!core) return text;
  const lead = /^\s/.test(text) ? " " : "";
  const trail = /\s$/.test(text) ? " " : "";
  return `${lead}${before}${core}${after}${trail}`;
}

function close(frame, parent, base) {
  const { tag, a } = frame;
  const text = frame.out;
  if (/^h[1-6]$/.test(tag)) return `\n\n${"#".repeat(Number(tag[1]))} ${inline(text)}\n\n`;
  if (tag === "summary") return `\n\n### ${inline(text)}\n\n`;
  if (tag === "a") {
    if (!inline(text) || !a.href) return text;
    return wrap(text.replace(/\s*\n\s*/g, ", "), "[", `](${new URL(a.href, base).href})`);
  }
  if (tag === "strong" || tag === "b") return wrap(text, "**");
  if (tag === "em" || tag === "i") return wrap(text, "*");
  if (tag === "q") return wrap(text, "“", "”");
  if (tag === "li") {
    if (inline(text).length === 0) return "";
    if (/\n\s*\n/.test(text.trim())) return `\n\n${text}\n\n`;
    const bullet = parent.tag === "ol" ? `${(parent.count = (parent.count || 0) + 1)}.` : "-";
    return `\n${bullet} ${inline(text)}`;
  }
  if (tag === "blockquote") {
    const lines = tidy(text).split("\n").map((line) => (line ? `> ${line}` : ">"));
    return `\n\n${lines.join("\n")}\n\n`;
  }
  if (tag === "figcaption") return `\n\n— ${inline(text)}\n\n`;
  if (tag === "footer") return `\n\n## Contact\n\n${text}\n\n`;
  if (BLOCK.has(tag)) return `\n\n${text}\n\n`;
  return text;
}

function tidy(text) {
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/([.?!:])\[/g, "$1 [")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function body(html, base) {
  const stack = [{ tag: "#root", a: {}, out: "" }];
  let skipDepth = 0;
  let skipTag = null;
  const tokens = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>|([^<]+)|</g;
  let m;
  while ((m = tokens.exec(html))) {
    const [all, slash, rawTag, rawAttrs, text] = m;
    if (all.startsWith("<!--")) continue;
    if (text !== undefined || all === "<") {
      if (!skipDepth) stack[stack.length - 1].out += decode(text ?? all).replace(/\s+/g, " ");
      continue;
    }
    const tag = rawTag.toLowerCase();
    if (!slash && RAW_TEXT.has(tag)) {
      const end = html.toLowerCase().indexOf(`</${tag}`, tokens.lastIndex);
      tokens.lastIndex = end < 0 ? html.length : end;
      continue;
    }
    if (skipDepth) {
      if (tag === skipTag && !VOID.has(tag) && !rawAttrs.endsWith("/")) skipDepth += slash ? -1 : 1;
      continue;
    }
    if (slash) {
      const index = stack.map((f) => f.tag).lastIndexOf(tag);
      if (index <= 0) continue;
      while (stack.length > index) {
        const frame = stack.pop();
        const parent = stack[stack.length - 1];
        parent.out += close(frame, parent, base);
      }
      continue;
    }
    const a = attrs(rawAttrs);
    if (skipped(tag, a)) {
      if (!VOID.has(tag) && !rawAttrs.endsWith("/")) {
        skipDepth = 1;
        skipTag = tag;
      }
      continue;
    }
    if (tag === "br") stack[stack.length - 1].out += "\n";
    else if (!VOID.has(tag)) stack.push({ tag, a, out: "" });
  }
  while (stack.length > 1) {
    const frame = stack.pop();
    stack[stack.length - 1].out += close(frame, stack[stack.length - 1], base);
  }
  return tidy(stack[0].out);
}

function meta(html, pattern) {
  const m = html.match(pattern);
  return m ? inline(decode(m[1])) : "";
}

export function pageToMarkdown(html, url) {
  const title = meta(html, /<title>([\s\S]*?)<\/title>/i);
  const description = meta(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
  const canonical = meta(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i) || url;
  const start = html.search(/<body[\s>]/i);
  const front = `---\ntitle: ${title}\ndescription: ${description}\nurl: ${canonical}\n---`;
  return `${front}\n\n${body(start < 0 ? html : html.slice(start), canonical)}\n`;
}
