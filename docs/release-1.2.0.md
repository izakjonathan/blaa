# 1.2.0 — Header contrast and closing hero

Baseline: Blaa-v1.1.9-typography.zip. Original media and typography retained.

## Findings and changes

- The old header detector only searched direct main children, missing sections nested inside venue pages. A missing match left the prior footer tone in place while scrolling back up. It also applied one menu-position sample to both controls.
- Each control now hit-tests its own position, resolves the innermost semantic surface, and samples again on scroll, route/layout changes, resize and page restoration. This supports nested light sections and photo/copy split layouts.
- The closing hero has a minimum full stable viewport height, with top spacing reserved for the shared fixed header. Longer content on short screens can still grow and scroll normally.
- Footer content begins its own entrance when 5% of the viewport is exposed, independent of the general heading reveal observer. At 28% exposure on a downward approach, native smooth scrolling aligns the footer with the viewport top. The shared logo pulses from scale 1 to 1.22 and back over 800ms. No duplicate logo or footer bottom bar.
- Upward wheel, touch-start and upward keyboard input release an active arrival. The threshold only rearms after leaving the footer, avoiding repeated captures near the threshold. Reduced motion skips the automatic scroll and logo animation.
- Editor surfaces, text, borders, focus indicators, sliders and modal backdrops use fixed charcoal/eggshell neutrals. Brand swatches and content previews retain actual editable colours.

## Verification

- npm run check passed: TypeScript, 49 tests, production build. Two additional footer behaviour regression tests subsequently passed with the complete 51-test suite and TypeScript. No runtime changes after the production build.
- Chromium production checks covered all seven public routes at 320x568, 390x844 and 1440x1000 (21 page/viewport combinations). Confirmed header contrast going down and back up from the footer, full-height footer geometry, removed duplicate elements and no footer horizontal overflow.
- Desktop split-photo section confirmed independent logo/menu tones. Editor computed colours matched fixed charcoal and eggshell.
- Full motion checks at 390px and 1440px confirmed early reveal, threshold arrival within 2px of the viewport top, and free upward return. No browser runtime errors. Mobile/desktop footer and editor screenshots visually reviewed.
- Actual Safari/iPhone scrolling remains unverified. No remote commit, deployment or database write performed.
