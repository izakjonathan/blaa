# Blågårds Apotek 1.0.0

Baseline: user-supplied Plaisir v0.4.22 ZIP and Kroteket content extraction dated 30 October 2026. Destination: izakjonathan/blaa, main.

Retained Plaisir's fullscreen image hero, display typography, editorial section layouts, splash sequence, animated navigation, scroll reveals, image overlays and complete content editor. Replaced branding, text, photos and navigation with Blågårds Apotek content. Added the six supporting venue pages, concert programme, all 32 gallery images, exhibition and booking/contact information. Removed the investor routes, financial components/models and forecast assets. Added a permanent redirect from the old musician page `/1671-2`.

Content uses the homepage's winter hours consistently. The press email follows the visible source contact-page text. The unavailable gear-list download is omitted. Original logos are preserved; photographs/posters use local high-resolution WebP derivatives. No stock or Plaisir concept imagery remains. Database tables use a separate `blaa_*` namespace.

Verification: TypeScript, 45 passing automated regression tests (including PGlite draft/save/publish/restore and stale-revision checks), production Next.js build, and local asset-reference integrity. Browser inspection covers desktop homepage, menu, concert page and editor tabs. No physical iPhone/Safari test or live Neon/Blob deployment test was performed. New storage is required for persistent edits/uploads. Existing gallery/event items can be edited; adding/removing items uses source records.
