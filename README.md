# Flow Wellness Chiropractic

The site at https://www.flowwellnesschiro.com. Six pages (home with the reserve form, About, FAQ and three service pages), no build step, no backend.

- `index.html`, `about.html`, `faq.html`, `pediatric-chiropractic.html`, `prenatal-chiropractic.html`, `back-and-neck-pain.html`, `404.html`
- `llms.txt` — summary for AI assistants; `robots.txt`, `sitemap.xml` for search engines
- `css/styles.css` — tokens and all styling
- `js/main.js` — nav toggle, testimonials, form validation and submit
- `assets/` — self-hosted fonts, optimized images, logo mark
- `content/` — original site copy captured for reference
- `PRODUCT.md` / `DESIGN.md` — product truth and design system record
- `CLAUDE.md` — rules for editing and publishing

The reserve form posts from the browser to the practice's Google Form, which receives every submission.

## Hosting

Cloudflare Worker `flow-wellness-chiro` serves the repo as static assets. Workers Builds deploys every push to `main`, and `.github/workflows/publish.yml` merges any pushed `claude/...` branch into `main`. `worker.js` sends flowwellnesschiro.com and flowwellness.sfostr.com to www, redirects the old Wix paths, `index.html` and addresses without `.html`, serves `404.html` for missing pages, and adds security and cache headers. With `markdown.js` it also serves every page as Markdown for AI assistants: `/about.html.md`, any page requested with `Accept: text/markdown`, and `/llms-full.txt` (`llms.txt` plus every page in `sitemap.xml`). `.github/workflows/indexnow.yml` tells Bing and the other IndexNow search engines which pages changed after each push. `.assetsignore` keeps docs, config and `content/` off the site.

Preview locally: `python3 -m http.server 8000` and open http://localhost:8000
