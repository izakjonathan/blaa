# 1.15.0 — EventOS admin design

The Editor, SoMe Generator and Stock Control now share the uploaded EventOS project's night-theme visual system. The public site and current admin landing layout are retained. The landing header no longer has a Back button.

## Design

- Black backgrounds, white text/actions and muted grey labels and borders.
- EventOS card, subcard, field, button and statistic styles, with compact label hierarchy and consistent spacing.
- Narrow mobile workspace and wider desktop layout; editor fields, product cards and the studio use columns where space allows.
- Bottom tool navigation with an active state, plus save actions above the dock. Unsaved-change confirmation is retained when switching tools. Keyboard-aware hiding of fixed controls is preserved.
- Existing Agilera and Bricolage font families remain. Display fonts do not use synthetic bold. Editable artwork, photographs, colour swatches and generated posts keep their own colours.
- Tool styling is scoped to admin subpages. The landing page and public-site palette remain independent. Brand colours still control public content and the landing page; tool chrome now follows the EventOS reference.

Only EventOS's `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `components/ui/AppShell.tsx`, and relevant excerpts of `components/StaffManagement.tsx` and `lib/theme.ts` were inspected. No EventOS business logic or dependencies were copied.

## Validation

TypeScript, the complete automated suite and the production build pass. Navigation tests cover the landing header, existing public menu, and confirmation/cancellation of unsaved dock navigation. Desktop browser checks covered the landing page, stock overview/products, Editor and SoMe preview; fixed navigation and action bars occupy separate rows.

The local preview has no configured database, so live saving, uploads and email delivery were not exercised. Existing product-creation code uses `crypto.randomUUID`, which is unavailable at the HTTP preview host; that flow requires the normal HTTPS deployment. Real-device touch, safe-area and keyboard behaviour should be checked on the deployment before release. No deployment or production data changes were made.

Public assets, fonts, landing styles and stock calculation/persistence modules are unchanged from 1.14.0. No database migration or dependency installation is needed beyond the existing `npm ci` workflow.
