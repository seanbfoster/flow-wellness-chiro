# Design

<!-- impeccable:design-schema 1 -->

## World
Modern pediatric-hospital wayfinding: bright clinical white, one clean grotesk, flat colour zones, pictograms drawn in a single stroke weight, and a coloured floor line that leads the visitor to their destination (the intake form). No gradients, no drop shadows, no cards-as-structure.

## Palette (css/styles.css :root)
- Paper `#fbfaf7`, paper-2 `#f3f1ec` (alternating section grounds)
- Ink `#15242c`, ink-2 `#4a5961` (body), ink-3 `#7b878d` (placeholder)
- Teal `#0f7b8a` / deep `#0a5d69` / tint `#dcefef` — Method zone, form panel, focus
- Coral `#e2603f` / deep `#c24d2f` / tint `#fbe6de` — Care zone and the ONLY action colour (Reserve buttons)
- Sand `#d9b26a` / tint `#f7ecd3` — Doctors zone, testimonial sign
- Slate `#6f8aa3` — FAQ zone
- Lines: ink at 14% / 28%

## Type
Manrope (self-hosted variable woff2, 200–800). Display 600 weight, tracking -0.035em, clamp(2.6rem, 6.2vw, 5rem). Section h2 clamp(2rem, 4vw, 3.2rem). Body 1.0625rem / 1.6, tabular numerals on. Sign labels: 0.82rem, 700, 0.1em tracking, uppercase, preceded by a 34×3px zone-coloured bar.

## Components
- Zone strip (dark) + sticky translucent header with zone-dot nav and coral Reserve pill.
- Floor line: fixed 6px vertical rail in the left margin (desktop) or a 3px bar under the header (mobile); fills with scroll progress and recolours to the current zone; a "you are here" chip appears only ≥1500px.
- Sign label → heading → body pattern opens every section.
- Intake sign: teal-tint panel, pictogram tile, uppercase teal field labels, white inputs with 1.5px teal-alpha borders, pill segmented radios/checkboxes, coral full-width submit, on-page success state.
- Directory: numbered 5-step list under a 2px ink rule (numbers earned by sequence).
- Zone panels: tinted panels with solid pictogram tile, heading pinned to bottom, uppercase topic chips.
- Doctor cards / doctor-full: hard-cropped portraits (object-position center 20–22%), credential chips.
- FAQ: native details/summary, 2px ink top rule, circular plus that fills teal and rotates 45° when open.
- Contact footer on ink with coral emphasis and a labelled contact ledger.

## Motion
One reveal grammar (opacity + 18px rise, expo ease-out, staggered 70–90ms in lists), respects prefers-reduced-motion. Floor line is the signature: continuous, functional, colour follows the zone.

## Responsive
Breakpoints 1080 / 860 / 480. Hero and all two-column heads collapse to one column at 860; nav becomes a toggle menu; floor line becomes a horizontal progress bar under the header.
