# 1.3.1 — Slower footer arrival

Baseline: Blaa-v1.3.0-cross-project-fixes.zip.

The footer previously delegated automatic scrolling to the browser's native smooth-scroll implementation, which offered no duration/easing control. The arrival now runs over 1,500ms using a cosine ease-in/ease-out curve with zero velocity at its start and finish. Animation frames use immediate scroll positions so native CSS smoothing does not compete with the controlled curve.

The destination remains the content panel inside the footer's background extension and is remeasured while animating. Upward wheel/keyboard input, a new touch, menu opening, reduced motion and unmounting cancel the animation. The approach threshold and logo pulse are unchanged.

Verification: npm run check passed (TypeScript, all 59 tests and production build). Timing regression tests verify quarter/mid/three-quarter positions, completion at 1,500ms, cancellation, cleanup, rearming and reduced motion. Chromium production checks at 390px and 1440px measured completion at approximately 1.51 seconds, gentle acceleration/deceleration and final panel alignment within 1px. An upward wheel interruption stopped the automatic movement. Actual iPhone/Safari animation remains unverified.
