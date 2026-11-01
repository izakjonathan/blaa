# 1.1.9 — Plaisir typography alignment

Baseline: Blaa-v1.1.8-safari-mp4-image.zip. Reference: user-uploaded plaisir-main 7.zip. This release preserves the hero implementation and original media from 1.1.8.

## Findings

The Agilera font files are byte-identical between the projects, and the display heading styles already largely match. Blaa's typography.css, however, contained only a comment, so Plaisir's editorial paragraph rules were missing. The mobile baseline used 17px text, 28.05px leading and normal tracking instead of the reference's statement tokens. The baseline browser also failed to load the externally hosted Bricolage font.

## Changes

- Restored the reference's editorial paragraph treatment on public pages: statement scale, 1.125 leading, -0.025em tracking, pretty wrapping and 32ch maximum measure. At 390px the result is 20.007px text / 22.508px leading.
- Added shared reading tokens for longer venue information: 18–24px text, 1.45 leading and a 56ch measure. Introductions use the same statement scale as the home page.
- Harmonised concert and contact headings, dates, paragraph spacing and footer information. Opening hours use the reading style rather than the display statement style.
- Adjusted mobile venue page titles and long Danish heading wrapping; single-title concert section headings can use the available width instead of an empty second grid column.
- Bundled the original Bricolage Grotesque family as a variable WOFF2 with weight, optical-size and width axes. Removed external font requests and preloaded the local font. OFL licence included. Source: https://github.com/google/fonts/tree/main/ofl/bricolagegrotesque. Agilera and the existing editor type scale remain unchanged.

## Verification

- npm run check: TypeScript, all 48 tests and production build passed.
- Chromium production browser checks: seven public routes at 320, 375, 390, 430, 768, 1024 and 1440px (49 views), with no text overflow detected. External HTTPS requests were blocked during these checks to verify local font availability.
- Inspected home, information and concert page renders at 390px and 1440px.
- A timing-sensitive font observation on the first 320px About load was rechecked after waiting for font registration: bundled Bricolage loaded successfully. Editor also passed that font check.
- ZIP CRC, version, font assets and preserved hero source/media checked when packaging.

Real Safari/iPhone rendering has not been verified. No text content, database or deployment changes.
