# 1.2.2 — Footer background overscan and consistent image overlays

Baseline: Blaa-v1.2.1-device-screen-footer.zip.

## Footer correction

The earlier footer ended with its top exactly at the viewport boundary. A dynamic viewport height alone did not create any background above that boundary. The footer now contains a separate full-viewport content panel with 140–240px of actual background above it. The automatic arrival targets the panel rather than the footer's outer edge. At document end, the footer background extends above the screen while its content occupies one visible viewport. This uses normal document geometry rather than a fixed overlay, and retains upward-scroll interruption and reduced-motion behaviour. The browser's own chrome remains outside page control; actual Safari safe-area coverage is not claimed.

## Image correction

- Gallery and exhibition surfaces were missing from the shared treatment selectors; their 33 bundled image defaults also explicitly disabled overlays. Both causes are corrected.
- Gallery and exhibition photographs now use the same responsive gradient, brightness treatment, brand colour and global opacity as the other editorial photographs.
- Per-image off/opacity/crop preferences remain supported and round-trip through the editor workflow. An explicitly saved off preference is preserved; the corrected bundled defaults enable overlays.
- Splash and video use the shared gradient geometry while retaining their existing dedicated strength/colour/saturation controls. The photo-specific Wine brightness exception was removed.
- Concert posters remain unfiltered and without overlays. Their editor previews are clear and no longer offer ineffective gradient controls.

## Verification

- npm run check passed: TypeScript, all 52 tests and production build. Added a regression test for enabled photograph defaults and clear concert posters. Updated the footer regression check to assert a target inside its background extension.
- Production Chromium checks at 320x568, 375x667, 390x844, 430x932, 844x390 and 1440x1000: the footer begins 140–200px above the viewport, ends at the viewport bottom, and its content panel occupies exactly one visible screen. All contact/heading/link content remains visible.
- Full-motion downward arrival at 390px landed with the outer footer at -168px and the content panel within 1px of the viewport top. Upward scrolling remained free. Footer screenshot reviewed.
- Gallery and exhibition computed gradients matched the venue hero. Live draft messages changed the shared colour and opacity to 25%; per-image disabling removed the gradient and brightness filter for both image types.
- All 20 concert posters remained free of gradient and brightness filters. No browser runtime errors.
- No actual iPhone/Safari test, remote commit, deployment or database mutation performed.
