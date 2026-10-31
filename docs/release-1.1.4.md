# 1.1.4 — Hero autoplay without tap controls

Baseline: fd91997 (1.1.3).

The decorative hero now attempts muted inline playback immediately on mount and on media readiness, independently of the system reduced-motion setting as requested. It resumes when the page becomes visible or an unexpected pause occurs while visible. Site-wide reduced-motion handling is otherwise preserved.

The video ignores pointer input, has no player controls or tap handlers, and retains its existing poster, fade, loop and editor treatment. Readiness and visibility events replace document-wide gesture retries. Browser power/data restrictions can still block autoplay; the poster remains visible in that case.

Verification: npm ci; npm run check passed (TypeScript, 47 tests, production build). The playback regression test covers immediate autoplay, blocked play promises, readiness retry, visibility changes, pause recovery, cleanup and absence of tap controls. Real iOS/Safari verification was not available. Browser playback verification could not run because the Chromium download was unavailable.
