# 1.1.7 — Original Kroteket hero video

Baseline: izakjonathan/blaa main, f1499b6494bee0a4b94e247efe3b2be2e8d0b615.

Downloaded the source referenced by the video element on https://www.kroteket.dk/ on 1 November 2026:

https://usercontent.one/wp/www.kroteket.dk/wp-content/uploads/2021/05/Blågårds-Apotek.1-1.mp4

Original download SHA-256: 5db5bb1291ae8ea4a4b048c8418f756592ae23893eb18b2d35588b8ccb40a29d.

Replaced the screen recording with the original 1920×1080 H.264 stream, at 25 fps, 364 frames and 14.56 seconds. Stream-copy remuxing preserves the video without generation loss, removes audio and places metadata before the media payload. Bundled file: public/kroteket/hero-original-v4.mp4 (6,004,325 bytes). A matching first-frame poster uses the versioned hero-poster-v4.jpg path. Removed obsolete v3 assets and updated both component and CSS references.

Encoded video packet SHA-256 matches between the original download and bundled file: c3ebe1dce05a0d5ca4edd83d24d91b68dfb1e32c642bd73be41a7e108a05a76d.

The existing muted inline autoplay, loop, non-interactive video, editor overlay controls and splash behaviour are retained. The proposed Safari MP4-as-image approach is deferred to the next step.

Verification: original and bundled video fully decoded with ffmpeg -xerror; 364 video frames counted; MP4 metadata precedes media data. npm run check passed (TypeScript, 47 tests, production build). Production HTTP checks returned byte-identical video (200), correct partial content (206), and homepage references to the new video/poster. ZIP contents, CRC and bundled video bytes verified during packaging. Real iPhone playback is not verified by this release.
