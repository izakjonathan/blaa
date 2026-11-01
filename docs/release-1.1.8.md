# 1.1.8 — Native MP4 image hero

Baseline: Blaa-v1.1.7-original-hero-video.zip. Uses the original Kroteket 1920×1080 video and matching poster introduced in that release, without media re-encoding.

The hero now offers the MP4 through a native picture/source/img element, following Apple's MP4-as-image guidance:

https://developer.apple.com/documentation/webkit/delivering-video-content-for-safari

Browsers supporting MP4 image decoding select the MP4 source. When the image has loaded successfully, the picture becomes visible and React removes the video player. The animated image has no player controls or tap handlers. Browser capability selection uses currentSrc and successful decoding rather than browser-name detection. A mount-time check covers image loads that finish before hydration.

Browsers selecting the JPEG source retain the existing muted inline autoplay video. An image decoding error restores that fallback and resets playback visibility. The poster remains underneath both renderers. Overlay colour, opacity, saturation, hero framing and splash behaviour remain in place.

This is an experimental Safari compatibility change. Successful real-iPhone animation, looping and Low Power Mode behaviour must still be verified; no universal autoplay guarantee is made.

Verification: npm run check passed (TypeScript, 48 tests and production build). The added component regression test covers native image selection, cached load, removal of video-player playback, JPEG selection, failed image decode and regular-video recovery. Browser automation could not run: WebKit was downloaded but required system libraries could not be installed; Chromium download also failed. Production HTTP checks confirmed the native picture markup, autoplay video fallback, byte-identical MP4 delivery and correct 206 partial content. ZIP CRC, version, new renderer source and unchanged original media bytes verified during packaging.

No deployment or database changes.
