# Flow Wellness Chiropractic

Static front-end rebuild of flowwellnesschiro.com. Three pages (home with native lead form, About, FAQ), no build step, no backend.

- `index.html`, `about.html`, `faq.html`
- `css/styles.css` — tokens and all styling
- `js/main.js` — nav toggle, floor line, reveal, form validation and success state
- `assets/` — self-hosted Manrope, optimized images, logo mark
- `content/` — original site copy captured for reference
- `PRODUCT.md` / `DESIGN.md` — product truth and design system record

The lead form currently validates and shows an on-page confirmation only. Field set mirrors the practice's existing Google Form so it can be wired to a backend or the form endpoint later.

Preview locally: `python3 -m http.server 8000` and open http://localhost:8000
