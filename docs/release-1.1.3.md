# Blågårds Apotek 1.1.3 — Faster hero video

The previous 17.23-second, 898×512, 30 fps H.264 video was 9,110,644 bytes (4.23 Mbps). Re-encoded with libx264 preset slow, CRF 20, a 3 Mbps maximum rate / 3 Mbps buffer and one-second keyframe intervals. The replacement is 3,505,791 bytes, 61.5% smaller, with resolution, frame rate and duration retained. The MP4 metadata precedes media data (moov at byte 32, mdat at byte 6985), allowing playback before the full file downloads. The first keyframe is 33,320 bytes. No audio track.

The new versioned asset URL avoids reusing cached copies of the old video. A 240 ms opacity transition blends the poster into playback. Poster and video share the editor's saturation setting, while the overlay retains its own colour and strength. Muted inline autoplay, hidden controls, gesture retries and reduced-motion behaviour are retained.

Verification: npm run check passed (TypeScript, 47 tests, production build); git diff --check passed. FFmpeg SSIM comparison across all 517 frames: 0.992025. Visually compared source and encoded frames at 2 seconds. MP4 atom order and first packet size checked. Browser playback and real-device iOS were not verified: the browser runtime was unavailable and its download failed. Instant playback remains dependent on network and browser autoplay policies.

Reproduce the encode with FFmpeg:

```sh
ffmpeg -i source.mp4 -map 0:v:0 -an -c:v libx264 -preset slow -crf 20 -maxrate 3M -bufsize 3M -pix_fmt yuv420p -g 30 -keyint_min 30 -sc_threshold 0 -movflags +faststart -map_metadata -1 hero-v2.mp4
```
