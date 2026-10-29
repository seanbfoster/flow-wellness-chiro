# Flow Wellness Chiropractic website

The site at https://www.flowwellnesschiro.com. Plain HTML, CSS and JavaScript: no build step, no
framework, no packages. Cloudflare serves it straight from the `main` branch of this repo.

## Publishing

- Every push goes live. A push to `main` is on www.flowwellnesschiro.com in about a minute.
  A push to a `claude/...` branch goes live too: a GitHub Action merges it into `main` first.
- When a change is done, commit it and push it. Don't open a pull request or wait for a review.
  Then say what changed and that it will be live in about a minute.
- To undo a change, revert its commit and push.
- Before pushing, check that every file, image and link you touched exists at the path you used.
  Preview locally with `python3 -m http.server 8000` and open http://localhost:8000.

## Where things are

| What | File |
|---|---|
| Home page: hero, reserve form, purpose, testimonials, approach, services, doctors, FAQ preview, closing | `index.html` |
| Doctor bios | `about.html` |
| Full FAQ | `faq.html` |
| Service pages: pediatric, prenatal, back and neck pain (listed under Services in the menu) | `pediatric-chiropractic.html`, `prenatal-chiropractic.html`, `back-and-neck-pain.html` |
| All styling (colors and fonts are variables at the top) | `css/styles.css` |
| Menu, testimonials, reserve form | `js/main.js` |
| Photos and logo | `assets/img/` |
| Fonts | `assets/fonts/` |
| Design system: colors, type, layout, components | `DESIGN.md` |
| Who the practice is, audience, voice, terms | `PRODUCT.md` |
| Copy from the old Wix site, for reference only | `content/` |

## Rules

- Read `PRODUCT.md` and `DESIGN.md` before changing wording or layout. Match the existing look:
  reuse the classes in `css/styles.css` instead of adding new colors, fonts or one-off styles.
- The header, footer, phone, email and social links repeat on every page. When one changes,
  change it in every `.html` file.
  The phone, email, address, social links and doctors are also in the business details for
  Google (`application/ld+json`) in the `<head>` of `index.html`; update them there too.
- Every page footer ends with the `sfostr.com` link (`.foot-site`). Keep it.
- A new page copies the `<head>`, header and footer of `about.html`, gets its own title,
  description and canonical link, goes in the nav and footer of every page, and goes in
  `sitemap.xml`.
- Photos: WebP, at most 2000px wide and about 300 KB, with `width`, `height` and real `alt` text.
- The reserve form sends to the practice's Google Form. Don't change the form address, the
  `entry.` numbers in `js/main.js`, or the form field names, or submissions stop arriving. A new
  field has to be added to the Google Form first, then mapped to its `entry.` number.
- Canonical links and `og:` tags use full `https://www.flowwellnesschiro.com/...` addresses.
- Leave `worker.js`, `wrangler.jsonc`, `.assetsignore` and `.github/` alone unless asked to change
  hosting or redirects. `worker.js` redirects the old Wix addresses and the bare domain to www.
- Files ending in `.md`, files starting with `.`, and `content/` are not published.
- Commit messages say what changed on the site in plain words.
