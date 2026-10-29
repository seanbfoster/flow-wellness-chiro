const SITE = "www.flowwellnesschiro.com";
const MOVED = {
  "/about-us": "/about.html",
  "/faq": "/faq.html",
  "/book-online": "/#reserve",
  "/contact": "/#reserve",
  "/privacy-policy": "/",
  "/accessibility-statement": "/",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname !== SITE) {
      return Response.redirect(`https://${SITE}${url.pathname}${url.search}`, 301);
    }
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const moved = MOVED[path] || (path.startsWith("/service-page/") ? "/#reserve" : null);
    if (moved) {
      return Response.redirect(`https://${SITE}${moved}`, 301);
    }
    const asset = new URL(url);
    if (asset.pathname.endsWith("/")) {
      asset.pathname += "index.html";
    }
    const response = await env.ASSETS.fetch(new Request(asset, request));
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
