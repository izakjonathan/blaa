# Plaisir and Blågårds Apotek — comparison and implemented fixes

## Scope and baselines

Compared the two uploads supplied for this task: **Plaisir 0.4.22** (`plaisir-main 7.zip`) and **Blågårds Apotek 1.2.2** (`Blaa-v1.2.2-footer-overscan-image-overlays(1).zip`). Outputs are **Plaisir 0.5.0** and **Blågårds Apotek 1.3.0**. These are updated copies of those uploads, not exports of a newly fetched GitHub main. Nothing was committed, deployed, or written to a production database.

The comparison covered source structure, routes, registered content, local assets, typography, header/footer behaviour, splash/reveal/menu lifecycle, photo and artwork treatment, editor state/preview/upload flows, request validation, storage separation, financial provenance, tests and production builds.

## Overall finding

These are two applications derived from the same foundation. Most backend, editor, heading and animation code is already shared in substance. Their useful differences should be transferred selectively. Plaisir is a concept/investor site with source-backed forecasts and decorative bottle artwork; Blågårds is an operating venue site with Danish information, a concert programme, a gallery and a decorative hero video. Copying their entire interfaces into each other would lose those distinctions.

## Detailed comparison

| Area | Plaisir upload | Blågårds upload | Decision / implemented result |
|---|---|---|---|
| Public routes | Experience, Story, two financial views | Seven venue routes and a legacy redirect | Retained both route sets. Blågårds gained descriptions specific to each venue page, using its editable introduction instead of repeating one homepage description. |
| Font delivery | README said self-hosted, but Bricolage actually loaded from Google Fonts; only Agilera was bundled | Licensed variable Bricolage WOFF2 and Agilera bundled locally | Plaisir now bundles the same Bricolage WOFF2 and OFL licence and preloads it. Removed Google Fonts requests. Display font and existing typography scales retained. |
| Editorial typography | Shared statement scale plus specialised Story and financial text roles | Same statement scale plus readable venue prose and concert/contact roles | Retained both hierarchies. An actual local font is now available to Plaisir instead of silently falling back when the external request fails. |
| Header contrast | One sample at the menu position controlled both controls; detection considered direct main sections | Independent painted-surface sampling for logo/menu, including nested venue sections | Plaisir gained independent detection and page-restoration resampling. Its financial pages still start with dark controls and its own dynamic document-canvas treatment remains intact. |
| Footer | Compact concept footer with a concept-status caption and wordmark | Full-screen content panel with real background extension above the viewport and an interruptible arrival | Retained both designs. Plaisir's compact footer is not an error and was not forced into the venue footer design. Blågårds' background extension, reduced-motion handling and upward escape remain intact. |
| Hero and splash | Photo hero, vector bottle and separately animated marks | Original venue MP4, Safari MP4-image path and video fallback | Retained each. No unnecessary video was added to Plaisir, and no bottle imagery was reintroduced to Blågårds. |
| Photographs | Shared gradient/opacity logic, but Wine had an extra fixed brightness exception | Gallery/exhibition defaults and selectors already corrected in 1.2.2 | Removed Plaisir's fixed Wine brightness exception so the editor-controlled treatment governs it consistently. Preserved all per-image opacity/off preferences. |
| Artwork | Special transparent menu/coaster assets and direct vector bottle | Alpha-mask venue logo and illustrations; concert posters intentionally clear | Retained these roles and all original media bytes. Plaisir gained live wordmark/bottle colour samples in the Brand tab. Blågårds' gallery/exhibition images now explicitly use block layout, following Plaisir's image-grid convention and avoiding inline-image baseline gaps. |
| Editor chrome | Green-tinted text, borders, status and focus colours | Fixed charcoal/eggshell interface | Plaisir adopted neutral chrome. Both keep actual draft colours in swatches and content previews. |
| Photo preview colours | Could revert to the published/root palette after leaving Brand colours | Same inherited root-gradient problem | Fixed both with locally scoped gradient colour variables on each preview. Changing the draft palette and then returning to a photo tab now shows that draft colour. |
| Saving during editing | A successful response replaced the entire local document | Same behaviour | Fixed both with field-level reconciliation. Changes made after submission survive an acknowledgement; the saved snapshot and revision still match the server. Removing an image override during saving also survives. |
| Saving feedback | Could say “saved/published” after silently discarding newer edits | Same behaviour | Both now retain the newer edits and report that they remain unsaved. JSON validation remains inside the existing error-handling path. |
| Legacy fields | Old Numbers and other discontinued controls hidden but still registered for compatibility | Removed footer caption remained visible in the editor although no page rendered it | Applied Plaisir's compatibility pattern to Blågårds: hide the caption control, retain validation/history support. |
| Expandable source notes | Flex-contained notes could grow beyond their column; nested paragraphs used larger global body type | Notes are not part of the current venue page composition | Constrained Plaisir notes to the available width and inherited their disclosure type size; checked the opened premises note at mobile width. |
| Dialog accessibility | Native picker/preview dialogs lacked explicit dialog names | Same | Added accessible dialog names in both; retained their existing controls and native dialog behaviour. |
| Narrative/data reconciliation | Forecast tests were strong, but fallback Story prose still cited an obsolete $216,000 occupancy figure | Venue composition had no equivalent registry-consistency test | Plaisir fallback Story now distinguishes the earlier 500 sq ft/$6,000 proposal from the issued approximately 1,000 sq ft/$12,000 monthly/$144,000 Year 1 forecast. A note reads occupancy directly from the current model, including when saved older prose exists. Blågårds gained composition-versus-field tests. |
| Local setup | No root environment-variable example in the upload | Blank `.env.example` documents the editor storage variables | Added the same secret-free setup template to Plaisir. |
| Backend safeguards | Same-origin writes, bounded JSON, validation, optimistic revisions, private uploads and Sharp processing | Essentially the same, with separate blaa_* tables | No reason to copy/rewrite these equivalent mechanisms. Existing transaction/revision/media tests retained. Corrected a misleading “Plaisir database” fallback log in Blågårds. |
| Authentication | Intentionally direct-access editor | Intentionally direct-access editor | Preserved the explicit project decisions. Same-origin validation is not authentication. |

## Shared editor-state fix in detail

Before the fix, save/publish performed a request and then applied the returned draft wholesale. Text fields remain editable while that request is running, so a later server response could replace newer local typing. The new reconciliation starts from the acknowledged server draft, then reapplies text/image changes made since the submitted snapshot. Fields deliberately removed after submission remain removed. The server revision and saved snapshot update normally; newer local changes remain dirty and can be saved next.

The same reconciliation protects an initial content load if editing begins before that response arrives. Existing server-side revision conflict detection remains the authority for writes from other devices. This change does not bypass conflicts or silently combine independently published versions.

## Financial/source correction boundaries

The issued forecast uses $144,000 of Year 1 occupancy, or $12,000 per month. The previous Story fallback referenced $216,000 and a $144,000 difference from a $72,000 annual historical proposal. The corrected difference is $72,000. The approximately 1,000 sq ft assumption is already stated by the existing financial views.

Only bundled fallback narrative and the explanatory Story note changed. **The forecast calculations, historical calculation modules, issued PDFs/XLSX and existing stored drafts/published documents were not rewritten.** Actual lease, permissions, capacity and complete occupancy terms still require confirmation; the site remains a concept. If production has older saved prose, review those fields in the editor before publishing revised text.

## Verification

- Baseline tests passed: **52 Blågårds**, **60 Plaisir**.
- Updated TypeScript and tests passed: **57 Blågårds**, **65 Plaisir**.
- Production builds passed for both applications after the runtime changes.
- Added tests for pending text/image edits, removal of an image override while saving, accepting a clean acknowledgement, venue content-field reconciliation, legacy caption compatibility, Plaisir header/financial tone behaviour, and Story/forecast occupancy reconciliation.
- Chromium production browser checks covered all 11 public routes at 320, 390, 768 and 1440px: **44 layouts**, with no page overflow or runtime errors. Confirmed local font loading with external HTTPS requests blocked, downward/upward header contrast, desktop split-control contrast, per-project neutral editor palettes, save-while-typing retention and draft preview colours after changing tabs.
- Browser editor responses were intercepted local test fixtures, not production writes. Both the interrupted first save and the subsequent clean save were checked.
- Additional mobile checks exercised opening the menu from the document bottom, choosing another route and returning home, plus the Plaisir premises note.
- All registered default image paths exist in both supplied projects.
- Byte comparison preserved **all 68 existing Blågårds public assets** and **all 54 existing Plaisir public assets**. Plaisir adds only the licensed local font and licence to public assets.
- All issued Plaisir forecast documents and calculation-source modules are byte-identical to the upload.

## Limits and follow-through

Physical iPhone/Safari scrolling and autoplay, native iPhone photo selection, screen-reader sessions, live private-Blob uploads and production Neon integration were not certified by local browser tests. Automated viewport checks do not reproduce Safari browser chrome. The existing test suites exercise validation, image processing and storage revision behaviour locally. No new dependency, authentication scheme, production schema or external service was introduced.

Event listings were preserved rather than automatically inventing current programme dates. Blågårds' winter hours remain its registered source copy. Plaisir's unconfirmed premises/lease decisions and funding assumptions remain explicit rather than being presented as settled commercial facts.
