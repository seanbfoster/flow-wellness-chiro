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

## Lead Desk (internal CRM proof of concept)

`crm/index.html` is a UI-only proof of concept for the practice's lead desk: lead ingestion from Meta, Google and the website form, automated first-touch text, a lead journey path (New → Contacted → Engaged → Booked → Patient), a shared activity feed with text/email/call/note composer, and a Convert action that hands the lead to ChiroHD. No backend; demo data lives in the browser (localStorage) and can be reset from the sidebar.

Live: https://seanbfoster.github.io/flow-wellness-chiro/crm/
