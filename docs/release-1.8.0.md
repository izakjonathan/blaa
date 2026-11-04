# 1.8.0 — editor Content Studio

Open **Admin → Content Studio · Social posts**, or `/admin/social-generator`.

## Workflow

1. Choose the square or story starter, or a saved/imported template.
2. Enter text and upload the required photos. Each photo slot has its own image. Text wraps and shrinks within the template's bounding boxes. Excess text produces a correction message and prevents export rather than silently producing a clipped post.
3. Open Layout & template designer to set a name, background colour and format (1080×1080, 1080×1350 or 1080×1920).
4. Add text, replaceable photo slots, fixed artwork or coloured overlay/shape layers. Set positions, dimensions, opacity, rotation and stack order. Upload backgrounds and transparent graphics as artwork; Fill canvas and Move down make them a background. Crop focus and cover/contain preserve image aspect ratio. Choose bundled Agilera/Bricolage, system Arial/Georgia, or upload a WOFF/WOFF2 font.
5. Select a layer and drag it on the preview while the designer is open, or use numeric placement controls. The selection guide is preview-only and is excluded from PNG exports.
6. Save the template to the editor, or export its portable JSON file. Saved template text becomes the default text; the newly uploaded post photos remain replaceable slots. Fixed artwork, geometry and font files are embedded in the template.
7. Download the high-resolution PNG. On iPhone, open the downloaded file and use the share sheet to save to Photos or share it.

An uploaded PNG/JPEG/WebP can be a fixed background or overlay. A flat image cannot supply editable typography or recover hidden positions; editable imports use the studio's versioned JSON format. Templates exported by the studio can be imported again with their embedded artwork and fonts.

## Persistence and architecture

Canvas rendering, fitting and PNG encoding run in the browser. No AI service, server-side canvas package or rendering API is used. Photos are resized locally; source images are not uploaded to a third-party service. Shared templates use the existing Neon connection in an independent `blaa_social_templates` table, created lazily. Each save checks its revision to reject stale overwrites. Saving is independent of website Publish and does not modify public site content.

When the database is unavailable, creating posts and importing/exporting template files still work; shared saves are disabled. Composition photos and unsaved edits are held in the current page session. Export the template or save it before leaving. The existing editor's access model is retained: this release does not introduce authentication. Templates use the same same-origin write check as the existing editor API.

Templates are capped at 3 MB, 30 layers and five embedded custom fonts. Font uploads are capped at 400 KB; raster uploads are bounded/resized and preserve PNG transparency. Remote image URLs, SVGs and executable asset URLs are rejected in imported templates. The new API has a separate bounded request size; the existing editor's 320 KB default remains unchanged.

## Verification

Use `npm run check` for TypeScript, the full test suite and the Next.js production build. New tests cover template round trips, invalid assets/geometry, multiline and overlong-word wrapping, request limits and database-backed save/reload/conflict handling. Database contract tests use PGlite, not production Neon. Browser canvas appearance, iPhone download/share behaviour and production persistence remain to be verified on the deployed build; no real-device verification is claimed.

The gallery upgrade is still outstanding. This release implements the subsequent Content Studio request on the confirmed-working 1.7.0 baseline. The source ZIP has not been pushed or deployed by this task.
