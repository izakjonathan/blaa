# 1.1.6 — Replace corrupt hero video

Baseline: izakjonathan/blaa main, ffa9163c8ae2c3437987fa29615c9268e2792d58.

The bundled hero-v2.mp4 failed full decoding with invalid H.264 NAL units. Replaced it with a fresh encode of the recording supplied on 1 November 2026. The new file is hero-v3.mp4, with a matching versioned first-frame poster; the obsolete video and poster are removed. New URLs avoid cached corrupt media.

The replacement retains 898×512 resolution, 30 fps, all 517 frames and the full 17.233-second duration. It uses H.264/yuv420p, no audio, one-second keyframe intervals and fast-start metadata before the media payload. Size: 3,497,409 bytes.

Existing playback behaviour is preserved: immediate muted inline autoplay, continuous looping, no native controls, no pointer interaction, readiness/visibility/splash-reveal retries, and a poster until playback starts. Editor overlay colour, opacity and saturation remain available.

Verified:

- npm run check: TypeScript, all 47 tests, production build passed.
- Full replacement video decoded with ffmpeg -xerror without errors; 517 frames counted.
- MP4 atom order confirms moov precedes mdat.
- Production server returned HTTP 200 with byte-identical video and HTTP 206 with correct partial content.
- ZIP CRC and media SHA-256 verified after packaging.

Browser automation could not run because browser executables were unavailable. Real iOS playback has not been verified. Browser power/data policies can still block autoplay; the poster remains visible without a play button in that case.

No database, editor content or deployment changes.
