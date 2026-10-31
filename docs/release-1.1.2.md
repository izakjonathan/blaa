# Blågårds Apotek 1.1.2 — Safari native play overlay

The screenshot shows Safari's native start button and the yellow Low Power Mode battery indicator. WebKit documents that Low Power Mode blocks autoplay and forces this button even without controls: https://bugs.webkit.org/show_bug.cgi?id=219889.

The video now starts transparent and becomes visible only on its `playing` event. Pause and error return it to transparent so the existing poster and editor-controlled colour wash remain visible instead of a native start button. The video remains mounted and playback is requested as before. Touch-end, click and keyboard gestures now also retry playback, since Safari may require a qualifying user gesture.

No website can guarantee video autoplay when iOS blocks it. This change preserves the poster fallback and reduced-motion handling rather than claiming to override operating-system policy.

Validation: `npm run check` passed (TypeScript, all 47 tests, production build). The playback lifecycle test checks initial hidden state, playing/pause/error visibility state, touch-end retry and subscription cleanup. `git diff --check` passed. No real-device iOS/Safari verification was available.
