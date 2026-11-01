# 1.4.1 — Continuous footer handoff and uniform image overlays

Baseline: Blaa-v1.4.0-animation-editor.zip.

## Footer handoff

The previous ease-in/out animation always began with zero velocity and used its first animation frame only to set the start time. Taking over during a moving gesture therefore introduced a stop before moving again.

The footer now samples recent scroll velocity, starts its animation clock at the takeover frame and adjusts the selected curve's first Bezier handle to inherit the incoming speed. The end remains stationary, the path is monotone and the configured duration is retained. If human scrolling or inertia is still moving, it owns that frame; the automatic path rebases to it rather than stopping it or pulling it backwards. Active finger dragging is left alone. A downward touch release can finish the arrival even if the footer's outer edge is already above the viewport but the content panel has not reached its final position. Upward input, a fresh touch, reduced motion, menu opening and unmounting retain cancellation behaviour.

## Uniform overlays

Earlier fixes changed bundled image defaults, but saved records with overlay:false or overlayOpacity:0 could still bypass the global gradient. **Uniform mode is now the default**, including for older documents without the new mode field. It applies the global colour and opacity to photographs, the splash and the hero video; old per-image off/opacity overrides are retained but inactive. Concert posters and brand artwork remain clear. Video saturation remains independently editable.

In **Admin → Brand colors → Image treatment**:

- Photo overlay mode: one shared overlay, or individual photo overrides.
- Photo overlay colour: follows the current primary brand colour until separately edited.
- Global overlay / gradient opacity: controls the shared strength. A deliberately saved global value of 0 still disables the overlay.

In uniform mode, per-image and dedicated legacy splash/video overlay controls show the effective global value and are disabled, with explanatory text. Choosing individual mode reactivates saved per-image preferences and the dedicated splash/video overlay settings. No stored image record or publication history is destructively migrated.

## Verification

- npm run check passed: TypeScript, all 70 tests, production build.
- New tests verify velocity continuity, stationary finishes, monotone/no-overshoot paths across curves and speeds, configured duration retention, immediate first-frame movement, touch release inside the background extension and uniform mode overriding legacy off/zero settings without rewriting them.
- Production Chromium trace of a moving approach showed uninterrupted frame-to-frame scrolling through takeover (12–13px sampled increments), with no stationary or backward frame in the tested handoff. Active-touch control was checked.
- Browser tests injected old off/zero-opacity image records across all seven public routes. All 48 checked page photo elements used the shared 80% red gradient; the hero video overlay also matched. All 20 concert posters stayed clear. Individual mode restored the off preferences.
- Editor browser checks verified effective uniform-mode controls/previews, switching back to individual controls, saving the mode and retaining original image preferences. Browser writes were local API fixtures, not production changes. No runtime errors in those checks.
- No remote commit, deployment or production database mutation. Actual iPhone/Safari handoff and live stored content remain unverified.
