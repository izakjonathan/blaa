# Stylesheet ownership

The root layout imports each shared stylesheet once. Page-local financial detail and editor styles remain imported by their owning routes/components. Do not restore a global mobile patch sheet or append a new correction after the governing component rule.

| File | Responsibility |
| --- | --- |
| globals.css | Reset, fonts, document/palette/type tokens, canvas, base semantics and shared accessibility utilities |
| brand.css | Experience and Story section layouts, with responsive variants alongside their components |
| header.css | Floating controls, wordmark mask, scroll lock and covered navigation state |
| buttons.css | Public text-and-arrow action primitive |
| footer.css | Footer layout, signature, type and responsive behavior |
| typography.css | Shared editorial prose scale, distinct from finance and editor typography |
| motion.css | Menu, reveal, heading-line and icon motion; shared reduced-motion policy |
| landing.css | Hero, readiness-gated splash layers, hero arrivals and static splash preview |
| financial.css | Shared issued-forecast dashboard components and responsive layouts |
| financials-v2/forecast.css | Forecast-specific metrics, tables, context and source lists used by both financial views |
| image-treatment.css | Shared photographic wash, per-image off states and strength application |
| collection.css | Edge-to-edge brand photograph grid and menus/coasters composition |
| bottle-accents.css | Page-level vector bottle canvas and stroke treatment |
| brand-assets.css | Shared vector sizing and grain layer |
| admin/editor.css | Editor controls, cards, image preview, dialogs, palette and action dock |

Keep one selector owner per condition. `:root` may be shared by distinct token families. A responsive/state selector is an intentional variant; a second copy of a component's base rule is not. `100vh` followed by `100lvh` is a documented browser fallback, not an accidental overwrite. Accessibility motion overrides deliberately use `!important` to stop running animations. New ordinary rules must correct their scope/specificity instead.

First-paint splash protection and no-JavaScript recovery remain inline in `lib/intro-bootstrap.ts`: external CSS must not be required to prevent a flash or release a failed intro. Runtime palette and image-treatment variables remain server-rendered with live editor overrides. These are intentional data/state boundaries, not duplicate component styling.

`tests/css-architecture.test.ts` checks CSS parsing, selector ownership across files/media conditions, repeated declarations, keyframe names, ordinary !important usage and the gap-free image grid. It does not replace visual testing. Preserve dynamic classes created by motion code; source-only searches cannot establish complete runtime reachability.
