# 1.6.0 — editorial motion

Implements the agreed first group of Agrumea-inspired motion patterns in the Blågårds Apotek project, using original local code and existing content.

## Changes

- Shared editorial headings now reveal individual graphemes through masks. The original text still supplies layout, wrapping and accessible content. Font loading, width changes and draft text updates rebuild the visual layer; already-visible headings settle during resize. Large cascades are capped at 300ms. Default letter duration is 750ms with an 18ms stagger. Turning off Heading letters restores the existing line reveal. The home video's existing title sequence remains intact.
- Venue page titles now use the shared Heading component.
- Selected existing photo frames expand from an inset of 24px and an 18px corner radius to their existing full frame width. Expansion completes when their top reaches 35% of the viewport. This is tied directly to native scroll and reverses immediately. Selected frames are the wide homepage collection photo, first gallery photo and exhibition image. Their existing layout dimensions are preserved.
- Editorial photos gently settle from 1.05 scale over 1100ms. This uses individual CSS scale; the existing PhotoParallax controller retains exclusive ownership of transform. Fixed gradients, image focus and filters are preserved. Frames clip zoom even when parallax is disabled.
- The existing menu curtain gains drawn separators and rolling letter labels for fine-pointer hover and keyboard focus. The original accessible labels remain available; duplicates are hidden from assistive technology. Navigation still starts immediately and uses the existing prefetch and covered-close lifecycle.
- Fifteen registered controls are added under Admin → Animations → Heading letters / Photo frames / Menu details. All use existing draft preview, save, publish, restore and reset workflows. No storage migration or dependency addition is needed.
- Master motion, page-reveal, menu and individual switches retain their intended scopes. Device Reduce Motion disables the new effects immediately through CSS and controller subscriptions.

## Scope

No circular product wheel, pointer-following cursor, extra route curtain or gallery redesign is added. Concert posters, brand artwork and hero video are excluded from the new photo effects. Footer takeover, footer logo pulse, contrast sampling, neutral editor palette, overlay settings and all public media are retained.

## Verification

`npm run check` checks TypeScript, the full Node test suite and the Next.js production build. Added tests cover reversible bounded frame geometry, capped heading cascades, validated editor round trips, accessible rolling-label markup, independent photo switches, delayed zoom beneath menu coverage, and unmount cleanup preserving crop/parallax state. Existing tests cover menu navigation, footer scrolling, header contrast, parallax and content/storage contracts.

The managed preview failed because its isolated filesystem could not resolve the checkout's existing dependency symlink (`/site/node_modules/next/dist/bin/next` was missing there). Browser visual checks, real iPhone Safari, touch and device performance remain unverified. No visual approval, live deployment or production-storage test is claimed.

## Review in preview

1. Home: scroll to the large text headings and the wide collection photograph. Confirm letter descenders and accented letters remain intact.
2. Gallery: scroll down/up across the first photo; it should expand/retract without moving the grid or gradient. Remaining photos only have subtle zoom/parallax.
3. Open the menu, use hover and keyboard focus, then navigate from the footer and reverse scrolling.
4. In Admin, change individual controls, switch master motion off and replay preview. Confirm original crops and all content remain readable.
5. Turn on system Reduce Motion. Check immediate text, stationary photographs and the existing reduced-motion footer behaviour.

Packaged as a source ZIP; not committed or deployed.
