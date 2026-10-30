import { pageToMarkdown } from "./markdown.js";

const SITE = "www.flowwellnesschiro.com";
const ORIGIN = `https://${SITE}`;
const MOVED = {
  "/about-us": "/about.html",
  "/faq": "/faq.html",
  "/book-online": "/#reserve",
  "/contact": "/#reserve",
  "/privacy-policy": "/",
  "/accessibility-statement": "/",
  "/index.html": "/",
  "/index": "/",
};
const LONG_CACHE = /^\/assets\/fonts\//;
const DAY_CACHE = /^\/assets\/img\/|^\/favicon\.ico$/;

// Agents that ask for Markdown (Accept: text/markdown ahead of text/html) get it instead of HTML.
function wantsMarkdown(request) {
  const accept = request.headers.get("Accept") || "";
  const md = accept.indexOf("text/markdown");
  const html = accept.indexOf("text/html");
  return md >= 0 && (html < 0 || md < html);
}

function asset(env, path, request) {
  const url = new URL(path.endsWith("/") ? `${path}index.html` : path, ORIGIN);
  return env.ASSETS.fetch(request ? new Request(url, request) : url);
}

function markdown(body, headers = {}) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Vary": "Accept",
      ...headers,
    },
  });
}

async function pageMarkdown(env, path) {
  const response = await asset(env, path);
  if (!response.ok) return null;
  return pageToMarkdown(await response.text(), ORIGIN + path);
}

// llms-full.txt: the hand-written llms.txt, then every page in sitemap.xml as Markdown.
async function fullText(env) {
  const [intro, sitemap] = await Promise.all([asset(env, "/llms.txt"), asset(env, "/sitemap.xml")]);
  const paths = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  const pages = await Promise.all(paths.map((path) => pageMarkdown(env, path)));
  return `${(await intro.text()).trim()}\n\n# Every page in full\n\n${pages.filter(Boolean).join("\n\n")}`;
}

function finish(response, path) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (response.ok && LONG_CACHE.test(path)) headers.set("Cache-Control", "public, max-age=31536000, immutable");
  else if (response.ok && DAY_CACHE.test(path)) headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
  if ((headers.get("Content-Type") || "").startsWith("text/html")) headers.append("Vary", "Accept");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname !== SITE) {
      return Response.redirect(`${ORIGIN}${url.pathname}${url.search}`, 301);
    }
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const moved = MOVED[path] || (path.startsWith("/service-page/") ? "/#reserve" : null);
    if (moved) {
      return Response.redirect(`${ORIGIN}${moved}`, 301);
    }

    if (path === "/llms-full.txt") {
      return finish(markdown(await fullText(env), { "Content-Type": "text/plain; charset=utf-8" }), path);
    }
    // /about.md and /about.html.md (the llms.txt convention) are the Markdown copy of /about.html.
    const md = path.match(/^(\/[\w-]+?)(\.html)?\.md$/);
    if (md) {
      const page = md[1] === "/index" ? "/" : `${md[1]}.html`;
      const body = await pageMarkdown(env, page);
      if (body) return finish(markdown(body, { "X-Robots-Tag": "noindex" }), path);
    }

    let response = await asset(env, url.pathname, request);
    if (response.status === 404 && !/\.[a-z0-9]+$/i.test(path) && (await asset(env, `${path}.html`)).ok) {
      return Response.redirect(`${ORIGIN}${path}.html`, 301);
    }
    if (response.status === 404) {
      const page = await asset(env, "/404.html");
      response = new Response(page.body, { status: 404, headers: page.headers });
    } else if (response.ok && wantsMarkdown(request) && (response.headers.get("Content-Type") || "").startsWith("text/html")) {
      return finish(markdown(pageToMarkdown(await response.text(), ORIGIN + url.pathname)), path);
    }
    return finish(response, path);
  },
};
