# Blågårds Apotek 1.0.1

Remove all inherited bottle display slots, outline data, motion helpers and splash editor controls. Historical splash setting keys remain accepted but hidden, so existing saved content still validates. Existing splash timing and logo animation remain intact.

Header, footer, splash and draft-preview logos now use the same alpha-mask artwork component. Their colours come directly from the current editor document, including custom hex/HSL colours. The source guitar and painting illustrations use the same renderer whenever selected as content images. Photographs and concert posters retain their original artwork colours.

Verification: TypeScript, all 44 automated tests and the production build passed. Browser testing verified a custom accent colour on all six artwork samples, the public draft header/footer contrast colours, zero bottle nodes or SVG outlines in the draft homepage, and the absence of bottle splash controls. Test colours were not published. No physical iPhone/Safari verification was performed.
