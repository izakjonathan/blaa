# Blågårds Apotek · Kroteket

Next.js website for Blågårds Apotek, built from the supplied Plaisir 0.4.22 project and the Kroteket content capture dated 30 October 2026. The template's typography, editorial layouts, fullscreen scenes, splash sequence, animated menu, responsive styling and image treatments are retained with the venue's navy/copper palette, original logo, guitar illustration and photography.

## Run

```sh
npm ci
npm run dev
npm run check
```

Use Node 24. `npm run check` runs TypeScript, automated tests and a production build.

## Pages

- `/` — home
- `/events` — recurring concerts and September–December 2026 posters
- `/om-os` — venue, history, drinks and nonprofit status
- `/galleri` — 32 photos with a keyboard-accessible image viewer
- `/spil-hos-os` — musician information; `/1671-2` permanently redirects here
- `/kunst` — exhibitions and artist enquiries
- `/kontakt` — contacts, directions and winter opening hours
- `/admin` — content editor

Investor pages, forecasts and downloads are removed. Concerts are an imported snapshot, with their original dates, posters and event links; they are not automatically synced with Facebook or the old site. Existing concert fields, gallery photos, copy, links, hero images, splash settings and brand colors can be changed in the editor.

## Editor storage

Deploy as a standard Next.js project, for example by importing this GitHub repository into Vercel. Connect a **new Neon Postgres database** and a **private Vercel Blob store** to this project. Set `DATABASE_URL` (or `POSTGRES_URL`) and `BLOB_READ_WRITE_TOKEN` (or the template's supported `BLOB_STORE_ID`/Vercel OIDC configuration). Redeploy after connecting storage. No secrets are included in the repository.

The editor retains the template's save draft, publish, restore previous version, live preview, image picker, upload, crop and overlay controls. Without storage, the public site renders the migrated defaults and the editor can explore/preview changes, but saving and uploads remain unavailable. The new tables are `blaa_content`, `blaa_media` and `blaa_uploads`; they do not read Plaisir's tables.

The supplied template's editor has no login; that behavior is retained. Configure deployment-level protection for `/admin` and `/api/editor` before exposing editing to others.

## Migration decisions

The extracted homepage's explicitly labelled **winter hours** are used consistently: Monday 12–00, Tuesday–Saturday 12–02, Sunday 14–00. The old site had contradictory footer blocks. These hours are editable under Menu & footer.

The contact page's press email is `zoe@kroteket.dk`; the extraction's `venue.json` listed older footer variants. No unavailable gear-list download or invented event dates/artist names have been added. Saturday's standard DKK 50 door price is described separately from special-event posters. Original Danish copy and Facebook destinations are preserved.

See `docs/verification.md` for checks and limitations.
