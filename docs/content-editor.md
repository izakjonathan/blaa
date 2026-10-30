# Plaisir content editor

Open `/admin` directly. No links to the editor appear in public navigation. It has no login in this release, as requested, and sends noindex headers. Anyone who obtains the URL can edit and publish until authentication is added.

## Activate storage in Vercel

Neon Postgres and the private Blob store are connected to the Plaisir project. The steps below also apply when configuring another environment.

1. Open the **Plaisir** project in the **izakh-s-projects** team in Vercel.
2. In **Storage**, create/connect **Neon Postgres**, selecting the free plan where available. Connect it to this project for Production (and Preview/Development if needed). Vercel supplies `DATABASE_URL`; `POSTGRES_URL` is also supported. Do not paste credentials into the editor or GitHub.
3. Create/connect a **private Vercel Blob** store named `plaisir-images`. Connect it to this project so it receives `BLOB_READ_WRITE_TOKEN`, or the managed `BLOB_STORE_ID` with Vercel OIDC access. A public Blob store is not compatible with this implementation.
4. Redeploy the latest GitHub commit after connecting both resources.
5. Open `/admin` and select **Check connection**. On the first connected request, the application creates its own namespaced `plaisir_content`, `plaisir_media` and `plaisir_uploads` tables. No manual SQL migration is required.

Until the database is connected, the live website displays its original content. The editor clearly disables save/publish/upload; it does not pretend that a local draft has been saved to a database. Existing photographs can still be selected for an unsaved preview.

## Edit from an iPhone

Select a main page: all its section groups appear in one continuous editor. Change the heading, paragraph, button text or destination. Newlines preserve deliberate title breaks; `*italic*` and `**bold**` are supported without accepting HTML. Text and images are editable across Experience, Story, and the shared menu/footer. The legacy Numbers tab is removed; its registered field IDs remain valid for draft/history compatibility. Live financial copy, amounts and formulas are maintained in the reviewed source model.

For images, select **Change image**, then choose an existing photograph or **Upload a photo**. A regular `input type=file accept=image/*` opens the native iPhone Photo Library / Take Photo / Choose File chooser. It deliberately has no `capture` attribute forcing camera-only input. Exact option wording depends on iOS. Browser-decodable alternative formats are converted to JPEG; unreadable HEIC files receive a clear instruction to choose a JPEG/PNG.

Uploads go directly to the private Blob store, avoiding Vercel Function request-body limits. The server verifies and rasterizes them with Sharp, corrects EXIF orientation, removes metadata, caps dimensions at 2400 px, and writes a high-quality WebP. Accepted files are at most 25 MB / 80 megapixels. Media paths use random UUIDs and registered database records; original private storage URLs/tokens are never sent to the page. Uploaded image delivery uses `/media/<uuid>` with the existing Next Image responsive optimizer. Brand colors also contains the global image overlay strength. Each image can switch the overlay off or override its opacity, including zero; resetting its opacity restores global inheritance. Focus controls override the crop only when changed.

**Preview** displays the real page in an iframe and overlays unsaved content through same-origin postMessage. Preview URLs and editor/API routes are noindex. The splash is skipped in draft previews. **Save draft** leaves the live website unchanged. **Publish** updates published content without a GitHub commit. **Restore previous version** restores the preceding published content and the draft together. A single atomic revision-checked SQL update prevents stale devices from overwriting newer work; an unchanged repeated publish preserves useful history.

## Implementation & future authentication

`lib/content-fields.json` is the registry of editable fields and original content. `app/Content.tsx` renders safe text and responsive images. Neon Postgres holds draft/published/previous JSON documents and revision numbers. Blob holds private originals temporarily and processed images persistently. Files in the build's filesystem are never used as database storage.

Add authentication checks to every mutation/read editor API and the upload-token route when login is introduced. `requireSameOrigin` in `lib/editor-request.ts` is CSRF validation, not authentication. The no-login version includes bounded payload/type validation and a daily upload ceiling; it intentionally remains open to same-origin visitors.

Visual inspiration: Baros's compact operation cards, labelled fields, expandable controls and mobile action dock. No Baros credentials, staff data or business records were copied.

## Verification

`npm run check` covers TypeScript, automated tests, embedded Postgres save/publish/restore behavior, Sharp conversion and a production build. See [the current audit](audit-0.4.15.md) for actual verification and limits. Local database and image tests do not establish hosted Neon/Blob behavior or physical iPhone upload behavior.

## 0.4.1 — One title field

The opening title is edited in one multiline Heading field. Press Return for each new line. Existing separate-line drafts and published history remain readable through a compatibility fallback; no database migration or content reset is needed. Each title line keeps its staggered entrance animation. Asterisks remain reserved for italic/bold formatting.

## 0.4.2 — Line breaks in every text field

All text fields, including menu names, button labels and image descriptions, now use multiline controls. Return creates a line break. URL fields remain single-line. Existing newlines and newlines within italic/bold text are preserved by the safe text renderer.


## 0.4.3 — Connected Blob uploads

Replaced legacy `upload` / `handleUpload` (which requires `BLOB_READ_WRITE_TOKEN`) with `uploadPresigned` / `handleUploadPresigned` and pathname-scoped `issueSignedToken`. This supports the connected store’s `BLOB_STORE_ID` and Vercel OIDC credentials without adding a static secret. The 25 MB limit, allowed raster formats, 10-minute expiry, daily ceiling and private storage remain enforced. Finalization still runs through the existing assets route; no upload-completed webhook is required.

## Splash screen

The **Splash screen** tab controls its background photograph and crop, green overlay strength, wordmark and bottle size and visibility, display duration, and whether the intro is enabled. It uses the normal draft/save/publish/restore workflow. Existing documents inherit their current hero photograph until a separate splash image is chosen; **Use hero photograph** removes that override. Green and gold remain the brand colours. Cast shadows are removed.

The inline and dialog previews render the same splash layers immediately, including unsaved edits, without session storage or the public once-per-tab gate. Public home-page first-paint protection reads the published enabled setting on the server, so disabling the splash does not produce a covering frame before hydration. Return-visit, reduced-motion, deep-link and draft-page skips remain intact.
