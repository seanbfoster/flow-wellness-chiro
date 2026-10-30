# Design

<!-- impeccable:design-schema 1 -->

## World
A polished, minimal evolution of the practice's original identity: Cormorant Garamond serif display, deep navy ink, teal accent, sand tones, and the sand-dune photograph as the only imagery beside the doctors. Centered composition, generous air, hairline rules. Nothing decorative that the content did not ask for.

## Palette (css/styles.css :root)
- Paper `#fcfbf9`, paper-2 `#f8f6f1` (form section, doctors band)
- Ink `#112f5b` (body emphasis, nav), ink-2 `#4b5b72` (body), ink-3 `#8a94a3` (placeholders only; too light for text on paper, so the footer legal line uses ink-2)
- Teal `#1eadbe` (brand), teal-tint `#ebf5f1` (home Services band, "common reasons" sections on service pages), teal-deep `#076676` (headings, logo wordmark, buttons, eyebrows, links, focus)
- Sand `#cbb492` (short rules, quote mark, link underlines), sand-tint `#f5f0e7` (testimonial band)
- Lines: ink at 14% / 8%

## Type
- Display: Cormorant Garamond 500 (italic 400 for the hero emphasis and testimonial). Hero clamp(3rem, 8vw, 6.4rem); section h2 clamp(2.2rem, 4.6vw, 3.6rem).
- Body: Jost 300/400, 1.0625rem / 1.7. Eyebrows, nav, buttons, labels: Jost 500, 0.7–0.8rem, 0.16–0.24em tracking, uppercase.
- Both self-hosted as latin woff2 subsets in assets/fonts.

## Components
- Sticky translucent header: serif wordmark + logo mark left, centered uppercase nav with 1px teal underline on hover/current, small square teal button right. Mobile: circular toggle, stacked centered menu with the Reserve button inside; Services is a tap-to-open item that reveals its three pages underneath.
- Hero: full-bleed dune photograph under a light paper gradient wash; centered eyebrow, serif headline with italic emphasis, light lede, primary + ghost buttons; small uppercase note at the bottom.
- Buttons: 2px radius, uppercase tracked, teal-deep fill (hover to ink); ghost variant with hairline border.
- Reserve section: paper-2 band, sticky serif copy on the left, form on the right with underline-only inputs, uppercase micro labels, square outlined choice chips (ink fill when selected), full-width submit, on-page success state. The fields mirror the practice's Google Form, which receives every submission.
- Purpose: centered serif body copy at 1.35–1.7rem under a 40px sand rule.
- Testimonials: sand-tint band, left-aligned eyebrow "In their words" + h2, then a horizontal scroll-snap row of paper cards (3 across desktop, 2 tablet, 84% width with the next card peeking on phones). Each card: small sand quote mark, italic serif quote trimmed to 9 lines with a fade and a "Read more" / "Show less" text button, em-dash uppercase cite pinned to the bottom. Footer row: "Ready to begin?" + ghost Reserve button left, round hairline prev/next buttons right (above the button on phones), disabled at the ends. No autoplay. Without JavaScript the row still scrolls and nothing is trimmed.
- Approach: five-column list under a hairline with Roman numerals in teal-deep serif.
- Services: full-width teal-tint band (the only teal background on the site) with three paper cards with small gaps between them (stacked on phones), thin-stroke glyphs, centered serif titles, and a text link pinned to the bottom of each card.
- Doctors: two 4:5 portraits, serif names, uppercase credential, short bio, sand-underlined text link. About page alternates image side.
- FAQ: native details/summary, serif questions, thin plus that rotates to a cross.
- Service pages (pediatric, prenatal, back and neck pain): page head on the dune photo under a deep teal wash (rgba(5, 72, 84) at 80–86%) with white text and a teal-tint eyebrow, then full-width sections that alternate paper-2 and paper (`.section.band`, `.band.alt`) with even top and bottom padding and no hairline dividers.
- Closing band: dune photograph washed to 62% paper, serif call to action. Footer: centered wordmark, contact links, uppercase nav, legal line.

## Motion
Hero children rise in sequence on load (1.2s, staggered 0.1s). Sections fade/rise once on scroll (1s). Respects prefers-reduced-motion.

## Responsive
Breakpoints 1080 (steps to 3 columns), 900 (single column everywhere, mobile nav), 560 (single-column form rows and steps, full-width hero buttons).
