# Blågårds Apotek 1.0.3

Baseline: 1.0.2 (GitHub commit 0a304b9).

Keep browser chrome black: declare a fixed black theme-color in the server-rendered viewport metadata and a black HTML canvas. Remove scroll-driven canvas colour and photo changes from useHeaderTone while preserving logo/menu contrast sampling. Browser tint is independent of editor palette colours and scroll position.

Validation: npm run check passed (TypeScript, 44 tests, production build). Confirmed the generated HTML declares one black theme-color. git diff --check passed. Real iOS Safari chrome was not available for verification.
