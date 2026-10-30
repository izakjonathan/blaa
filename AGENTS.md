# Blågårds Apotek development

Repository: izakjonathan/blaa. Preserve the Plaisir-derived design, editor controls and Kroteket branding. The user's explicit instructions govern scope. Use npm and the lockfile. Run `npm run check` before release and report only checks actually performed.

The public venue has seven pages; investor material is not part of this project. Original migrated content defaults are in `lib/content-fields.json`. Published editor content must never be overwritten for a code cleanup or test. Keep the independent `blaa_*` database tables and preserve revision checks, draft/publish/restore and upload validation. The editor intentionally retains the source template's lack of login; do not add authentication without instruction.

The homepage winter hours are the selected migration baseline because the old site had contradictory footer variants. Concert content is an editable snapshot, not a live external feed. Preserve original posters and external event destinations; never infer event names from filenames.

Read relevant chapters of `docs/development-constitution.md` for engineering guidance. No extra publication approval is implied by these files; follow the user's authorized workflow. Technical checks do not imply user acceptance of the visual design.
