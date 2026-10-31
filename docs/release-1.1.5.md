# 1.1.5 — Hero autoplay during the splash

Baseline: 1.1.4, commit `29706effb64b6d7670d8394b9c40f622fc81d09b`.

The intro's critical CSS hides `main`, which also hid the hero video during its initial autoplay attempt. Keep only the decorative video layer renderable behind the splash and retry playback when the splash releases the hero. Native controls remain disabled and pointer events remain disabled on both video and layer, so tapping cannot toggle playback.

Verification: `npm run check` passed (TypeScript, all 47 tests, production build); `git diff --check` passed. The playback regression test covers a rejected initial attempt followed by a splash reveal, plus media readiness, tab visibility and listener cleanup. Reviewed both changed React components using the React best practices checklist.

Browser verification was unavailable because the browser download returned an invalid archive. Real iPhone Safari playback has not been verified. Browser autoplay restrictions, including iOS Low Power Mode, can still block playback; the poster remains the fallback. No editor, database, media, palette or layout changes.
