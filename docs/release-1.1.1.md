# Blågårds Apotek 1.1.1 — background video playback

The hero video uses muted, inline, looping autoplay without a visible Play/Pause button or native controls. DOM mute and inline properties are set before requesting playback. Playback is retried when video data loads, on return to a visible tab, and on a page tap if browser autoplay restrictions initially block it. Already playing video is left alone. Reduced motion continues to pause playback, and event subscriptions are removed on unmount.

The editor's overlay colour, opacity and saturation settings, poster, cover layout and splash sequence are preserved. Obsolete button state and styles are removed.

Validation: `npm ci --offline`, `npm run check` (TypeScript, all 47 tests and production build), and `git diff --check` passed. The playback lifecycle test covers rejected autoplay, gesture retries, reduced motion, hidden tabs and cleanup. No real-device iOS/Safari verification was performed. Browser power/data policies can still prevent autoplay; the loading poster remains available.
