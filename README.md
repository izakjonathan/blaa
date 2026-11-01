# Blågårds Apotek / Kroteket

Next.js website for Blågårds Apotek, based on the supplied Plaisir v0.4.22 project and the Kroteket content extraction dated 30 October 2026.

The original Plaisir layouts, Agilera display font, supporting typography, splash sequence, scroll motion, menu transitions, colour controls, image picker, crop controls, draft preview, publishing and version restore are retained. Kroteket supplies the navy (#1A1E3A), copper (#DB8C59), original logo, photography, concert posters, exhibition and Danish copy. Investor pages and financial models have been removed.

## Run and verify

Use Node.js 24 and npm.

```sh
npm ci
npm run dev
npm run check
```

Public pages: `/`, `/events`, `/om-os`, `/galleri`, `/spil-hos-os`, `/kunst`, `/kontakt`. The original `/1671-2` address permanently redirects to `/spil-hos-os`.

## Editor

Open `/admin`. Each public page has its own editing tab. All migrated text, photographs, concert details/posters and gallery photos are registered in `lib/content-fields.json`. Page composition is in `lib/venue-pages.json` and `app/[slug]/page.tsx`. Adding/removing programme or gallery items currently requires updating those records; existing items are editable.

The existing editor intentionally has no login, matching the supplied project. Its backend enforces same-origin writes, revision conflicts, validated document fields and private media uploads. Configure deployment access to match your intended editor audience.

Saving and publishing require `DATABASE_URL` (or `POSTGRES_URL`) for Neon Postgres. New uploads additionally require a private Vercel Blob store (`BLOB_READ_WRITE_TOKEN` or supported `BLOB_STORE_ID`/OIDC configuration). Never commit secrets. Without storage the public pages use the bundled content and the editor supports exploration and draft preview, with saving/uploads disabled and setup instructions shown.

The application creates independent `blaa_content`, `blaa_media` and `blaa_uploads` tables. Do not connect it to the Plaisir project's production storage.

## Content decisions

- Opening hours use the source homepage's winter hours consistently: Monday 12–00, Tuesday–Saturday 12–02, Sunday 14–00. Other source pages disagree; these hours remain editable.
- The visible contact-page press address is `zoe@kroteket.dk`; metadata in the package lists different addresses.
- All 32 gallery images and the extracted concert programme are included. Past September/October listings are retained as programme history, with their dates visible. Undated TBA posters remain undated.
- Poster names/dates follow the visually verified `events.json`, not misleading filenames.
- The source's empty gear-list download is omitted because no document was supplied.
- Original venue images are served locally as high-quality WebP derivatives; original transparent logo artwork is retained. The original hero video downloaded directly from www.kroteket.dk plays locally as a muted inline loop. Release 1.1.7 preserves the original 1920×1080 H.264 video stream at 25 fps and its full 14.56-second duration without re-encoding, removes the audio track, and moves MP4 metadata before the payload for fast loading. The versioned hero-original-v4.mp4 and matching first-frame hero-poster-v4.jpg avoid cached older recordings. A 240 ms fade blends the poster into playback. In `/admin` → Forside, edit Video overlay colour, Video overlay strength (0–100%) and Video saturation (0–200%). Preview, save draft and publish use the existing content workflow. Release 1.1.8 adds native MP4-as-image rendering through a picture/source/img element, as documented by Apple. Browsers that successfully decode the MP4 as an image remove the video player and show the animated image; browsers selecting the JPEG fallback retain the existing video renderer. Image decoding errors restore the video fallback. Cached image loads are checked after hydration. The editor overlay colour, strength and saturation apply to both renderers. The background video fallback autoplays without visible player controls. The hero attempts playback immediately on mount and media readiness, including when reduced motion is enabled as explicitly requested; the rest of the site retains its reduced-motion behaviour. Taps do not control the decorative video. If browser power/data policies block autoplay, the video remains transparent so Safari cannot expose a native play overlay; the poster stays visible and playback is retried on media readiness and returning to the page, without depending on a tap. The video becomes visible only on its playing event. Its layer remains renderable behind the splash, and playback is retried when the splash reveals the hero. Websites cannot override iOS Low Power Mode autoplay restrictions. The previous hero photograph remains the splash fallback.
- No third-party map embed or tracking scripts are loaded. Contact includes a direct Google Maps directions link and the venue's social links.

See `docs/release-1.0.0.md` for verification and remaining setup.

## Artwork colours

All interface logos use one alpha-mask renderer driven by the current editor document. The Brand colors tab previews the venue logo, music and art illustrations in both palette colours. The same colours apply to the header, footer, splash and draft previews. Inherited bottle artwork and its controls have been removed. Older saved bottle settings are accepted as hidden compatibility data and have no rendering effect.

## Typography

Release 1.1.9 restores the uploaded Plaisir reference’s public editorial text scale, tracking, line height and 32ch measure. Venue pages use the same statement style for introductions, a 56ch reading measure for longer information, and consistent display headings and metadata. Long Danish titles wrap naturally, with smaller mobile page titles. Agilera is unchanged; Bricolage Grotesque is now a bundled variable WOFF2 font with its OFL licence in public/fonts, so text no longer depends on Google Fonts loading. The editor keeps its own type scale.

## Closing hero and editor palette

Release 1.2.0 detects the background beneath each fixed header control independently, including nested venue sections and split photo/copy layouts. The footer is a full-height closing hero using the shared header logo and menu. Its content reveals at 5% viewport entry; after 28% has entered during downward scrolling, it settles smoothly with its top at the viewport top and briefly enlarges the header logo. Upward wheel, touch and keyboard input can interrupt the arrival. Reduced motion keeps normal scrolling without the automatic settle or logo pulse. Removed the duplicate footer logo, bottom caption and top link. Editor controls use fixed charcoal/eggshell tones independently of the editable site palette.

Release 1.2.1 fits the closing hero to the dynamic visible viewport (`100dvh`). Mobile details use two columns with a shared social row, and short screens use smaller type and spacing. The logo pulse is reduced to 10% over 650ms and the content entrance is softer. Content can still expand naturally when accessibility text sizing requires it.

Release 1.2.2 adds 140–240px of real background above a separate full-screen footer content panel. The arrival lands inside this background extension rather than aligning the footer's outer edge to the screen. Gallery/exhibition photos now share the editorial gradient and editor controls; their bundled overlay defaults are enabled. Concert posters remain clear. Saved individual overlay overrides remain available. Splash/video retain dedicated controls with the shared gradient shape.

## 1.3.0 cross-project review

See [the detailed comparison](docs/project-comparison-and-fixes.md) and [release verification](docs/release-1.3.0.md). This release was prepared from the uploaded baseline and has not been committed or deployed.

Release 1.3.1 replaces native footer smooth scrolling with a controlled 1.5-second ease-in/ease-out animation. It retains the same full-screen destination, background extension, reduced motion and interruption behaviour.

## Animation controls

Release 1.4.0 adds **Admin → Animations** with 39 controls for site motion, page reveals, menu/link transitions, hero text/video fade, footer scrolling/reveal/logo pulse and splash transition speed/easing. Each has safe limits and reset controls. Choose a page in Preview and use Replay preview to restart its motion; a separate splash replay is available. Save draft and Publish use the existing editor workflow. System Reduce Motion is always respected. Existing content and media remain compatible.

Release 1.4.1 preserves scrolling speed as the footer takes over and leaves ongoing user movement in control until the automatic path can continue. Brand colors → Image treatment now defaults to one uniform overlay across photos, splash and video, including images with old saved off switches. Individual photo overrides remain available through the mode selector. Concert posters and brand artwork remain clear.

## Photo parallax

Release 1.5.0 adds subtle photo movement inside stationary containers. Defaults are 20px total travel on mobile and 32px on desktop, with 120ms smoothing. Change these in **Admin → Animations → Photo parallax** and use Preview to review the draft. Posters, logos, the hero video and splash stay stationary. Reduce Motion and the animation master switch disable the effect. Overlays and crop settings are preserved.
