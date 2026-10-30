# Blågårds Apotek 1.0.2

Baseline: 1.0.1, commit 0b4f88f.

Event titles, dates and links now use the page gutter (20–24px on mobile), while concert posters stay full width. The edge-to-edge media rule previously left event copy flush against the viewport.

Removed emoji-capable arrow characters from action labels and restored the missing SVG used by the existing line-arrow button style. Footer external arrows explicitly request text presentation.

Validation: npm run check passed (TypeScript, 44 tests, production build); git diff --check passed. Reviewed changed React markup for accessibility, stable keys and unchanged editor bindings. No real-device or browser visual verification performed. No data or editor changes.
