# Blågårds Apotek 1.1.0 — hero video

Baseline: uploaded `blaa-main 2.zip`, package version 1.0.4, archive commit 3e3e3622736549edd2da32679dafdf2f2ad99252. Release date: 31 October 2026.

The home hero now plays the supplied 17.23-second video in a muted, inline loop. The original H.264 video stream is preserved without re-encoding; audio and metadata are removed and the MP4 header is moved forward for progressive playback. The first frame is included as a loading poster. The full-bleed cover layout, text, typography and splash sequence remain in place.

Open `/admin` → Forside → Forside & hero:

- Video overlay colour: independent colour picker (default navy #1A1E3A).
- Video overlay strength: 0–100%, default 45%; zero disables the colour wash.
- Video saturation: 0–200%, default 100%; zero makes the footage greyscale.

These fields use existing validation, unsaved draft preview, save, publish and restore. Existing saved documents acquire defaults automatically without a database migration. The previous hero image is retained as a splash fallback photograph and is labelled accordingly in the editor. Changes to it do not replace the video.

A public pause/play button is available. System reduced-motion preference and background-tab visibility pause playback; returning to the page does not undo an explicit manual pause. Browser power/data/autoplay restrictions can block automatic playback; the poster and Play video button remain available. A production device check on iOS is still recommended.

Verification: `npm ci --no-audit --no-fund`; `npm run check` (TypeScript, 47 passing tests, production build). Added tests cover old-document defaults, validation, settings round-trip, rejected autoplay, reduced motion, visibility and explicit pause. No live database, Blob storage, real-device or visual browser verification was performed. No deployment is included in this ZIP-only task.

Rollback: redeploy the original supplied ZIP. No database schema or stored-image format changes are introduced.
