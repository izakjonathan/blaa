# 1.2.1 — Fit the footer to the device viewport

Baseline: Blaa-v1.2.0-footer-header-editor.zip.

- Changed the footer minimum height from the smallest viewport to the dynamic visible viewport so it fills the screen as mobile browser controls collapse or expand.
- Reduced top/bottom spacing and gaps. Mobile contact/hours use two columns, with social links in a shared row. Short-screen layouts use smaller headings and detail type. Natural expansion is retained for accessibility text enlargement.
- Reduced the header logo pulse from 22%/800ms to 10%/650ms and softened the footer entrance from 24px to 12px over 550ms.
- Preserved background detection, upward-scroll interruption, reduced motion and neutral editor controls.

Verification: npm run check passed (TypeScript, all 51 tests, production build). Chromium production layout checks at 320x568, 375x667, 390x844, 430x932, 844x390 and 1440x1000 confirmed one-viewport footer height, visible content and no horizontal overflow. Actual iPhone/Safari viewport changes remain unverified.
