# 1.5.0 — Subtle photo parallax

Baseline: Blaa-v1.4.1-smooth-handoff-uniform-overlays.zip.

Photos now move gently inside their existing fixed containers. The gradient, foreground copy and container layout stay stationary. The image is enlarged only enough to cover its total travel plus a small edge guard. Crop focus, global/per-image overlays and the existing reveal animations remain intact; no image wrapper or source asset is replaced.

## Editor

Open **Admin → Animations → Photo parallax**:

- Enable photo parallax: on by default.
- Mobile photo travel: **20px total**, adjustable from 0–80px.
- Desktop photo travel: **32px total**, adjustable from 0–120px.
- Parallax smoothing: **120ms**, adjustable from 0–400ms.

Travel is the full sweep, so a 20px setting moves from -10px to +10px over the photo's passage through the viewport. The photo moves against the container's on-screen movement for a slower visual drift. Higher settings crop more of the original image. Existing Save draft, Publish, Preview, Replay preview and reset controls apply to these registered settings.

Concert posters, logos/artwork, the hero video (including its Safari image renderer), splash and editor thumbnails are excluded. The effect is disabled by the site animation master switch, the photo-parallax switch or device Reduce Motion. A zero travel setting leaves the photos unscaled and stationary.

## Implementation

A single page controller tracks eligible direct photo children inside existing photo frames. Intersection observation limits animation work to photos near the viewport; resize/load handling recalculates overscan. Animation uses transforms only, with exponential follow smoothing and a bounded target. Container reveal transforms remain separate from bitmap transforms. No third-party animation library was added.

The controller cleans up frame/image attributes, custom properties, animation frames, observers and event listeners on route changes, setting changes, disablement and unmount. It does not remove crop or filter settings.

## Verification

- npm run check passed: TypeScript, **75 tests**, production build.
- Geometry tests cover minimum/large photo heights, mobile/desktop/maximum travel, edge coverage, bounded motion and reversal. Follow smoothing is verified for frame-rate independence and absence of overshoot.
- Component lifecycle tests verify actual controller activation, photo movement in both scroll directions while frame layout stays fixed, exclusion filtering, off/reduced-motion handling, preservation of crop/filter properties and complete resource/style cleanup.
- Existing overlay, footer handoff, editor, content, motion and backend tests still pass. Source comparison confirmed changes start from the delivered 1.4.1 baseline; media files remain untouched.
- Visual browser verification was unavailable in this session because the browser could not reach the local preview. Physical iPhone/Safari rendering, compositing and scrolling remain unverified. No commit, deployment or production content update performed.
