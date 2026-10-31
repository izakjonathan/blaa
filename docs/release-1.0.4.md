# Blågårds Apotek 1.0.4

Baseline: 1.0.3 (GitHub commit 567ecf8).

Koncerter poster images now share the same left/right gutter as each event title, date and link. Move the existing copy padding to the event article so posters and copy align without double padding. This affects programme cards only.

Validation: npm run check (TypeScript, 44 tests, production build) and git diff --check. No device/browser visual verification performed.
