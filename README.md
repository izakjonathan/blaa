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
- Original venue images are served locally as high-quality WebP derivatives; original transparent logo artwork is retained. The supplied hero video plays locally as a muted, inline loop, using a freshly encoded fast-start H.264 MP4, with its original 898×512 resolution, 30 fps and full duration retained and its audio removed. One-second keyframe intervals support quick decoding, and a 240 ms fade blends the matching first-frame poster into playback. The first frame is the loading poster. Release 1.1.6 replaces the corrupt hero-v2.mp4 with hero-v3.mp4 from the newly supplied recording and uses a versioned matching poster to avoid stale browser caches. In `/admin` → Forside, edit Video overlay colour, Video overlay strength (0–100%) and Video saturation (0–200%). Preview, save draft and publish use the existing content workflow. The background video autoplays without visible player controls. The hero attempts playback immediately on mount and media readiness, including when reduced motion is enabled as explicitly requested; the rest of the site retains its reduced-motion behaviour. Taps do not control the decorative video. If browser power/data policies block autoplay, the video remains transparent so Safari cannot expose a native play overlay; the poster stays visible and playback is retried on media readiness and returning to the page, without depending on a tap. The video becomes visible only on its playing event. Its layer remains renderable behind the splash, and playback is retried when the splash reveals the hero. Websites cannot override iOS Low Power Mode autoplay restrictions. The previous hero photograph remains the splash fallback.
- No third-party map embed or tracking scripts are loaded. Contact includes a direct Google Maps directions link and the venue's social links.

See `docs/release-1.0.0.md` for verification and remaining setup.

## Artwork colours

All interface logos use one alpha-mask renderer driven by the current editor document. The Brand colors tab previews the venue logo, music and art illustrations in both palette colours. The same colours apply to the header, footer, splash and draft previews. Inherited bottle artwork and its controls have been removed. Older saved bottle settings are accepted as hidden compatibility data and have no rendering effect.
