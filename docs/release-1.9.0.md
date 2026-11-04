# 1.9.0 — backend tools hub and stock control

## Routes and appearance

- `/admin`: tools landing with Editor, SoMe Generator and Stock Control cards. It reuses the website's floating logo/menu navigation; its menu links to the tools and public site. The landing has no closing footer hero.
- `/admin/editor`: existing website content editor. Its content API, draft/publish/restore and preview workflows remain in place. Links return to All tools or open the SoMe Generator.
- `/admin/social-generator`: existing SoMe Generator, with its return link pointing to the hub.
- `/admin/stock`: new Stock Control workspace.
- **Editor → Brand colors → Backend → Tools landing background** sets the hub's background, defaulting to the existing navy. Stock Control and the other tool interfaces retain neutral charcoal/eggshell controls.

## Getting started

1. Open Stock Control → Settings. Add physical products, base units, purchase packs and pack costs in DKK. Add category, supplier, SKU, par target and alert threshold if useful. Archive products rather than deleting their history.
2. Add till menu items and ingredient quantities. Use one mapping for each sold serving size; multi-ingredient cocktails are supported. Save the settings.
3. Open Weekly input and create a period with exact count/till boundaries, labelled Europe/Copenhagen. Standard example: Monday 04:00 to following Monday 04:00. The system rejects overlapping periods.
4. Enter opening/closing counts. A blank count remains missing; zero must be entered explicitly. You can count in base units or purchase-pack equivalents; these are alternate views of the same count, not additive inputs. Add weekly received packs/loose quantities, known waste, complimentary usage absent from the till and signed transfers/returns. Record references and explanations in notes.
5. Enter quantities sold for each till item. Confirm complete till and movement inputs. Save drafts as you work. A draft can explicitly refresh product/recipe settings after changes in Settings.
6. Review Dashboard checks and variance. Close the period when complete. A new contiguous period can carry opening counts from this closed period's closing counts. Gaps require an explicit opening count.
7. Correct a closed period by entering a reason and reopening it first. Previously saved revisions remain available under History & backups.

## Dashboard definitions

Recorded waste is known waste entered by the user. Unexplained variance is actual usage minus theoretical till consumption, recorded waste and complimentary usage. Positive unexplained variance contributes to estimated total loss; negative variance is reported separately as an unexplained gain. This is an investigation signal, not evidence of theft or a diagnosis of its cause.

Percentages use actual usage as denominator. Combined rates are weighted by saved product costs so litres and individual products are not added together. Missing data is excluded, coverage is shown, zero usage gives an unavailable percentage and zero-cost products are flagged. Stock value is based on counts present in the selected period. Suggested ordering uses the fixed par target and rounds up to purchase packs; it does not place orders or account for open orders.

The workspace also offers ranked loss contributors, product alert thresholds, filters, a recent closed-period trend list, CSV reconciliation exports and JSON backups.

## Data and limits

Data uses the existing Neon connection and independent `blaa_stock_state` / `blaa_stock_audit` tables, created lazily. A revision check protects shared saves. Each successful save atomically updates the live state and writes an immutable audit snapshot. Closed reports keep their pack/cost/product/recipe snapshots; settings changes affect new periods unless a draft is explicitly refreshed.

This first version is a single-venue manual workflow. Deliveries and waste are weekly totals with notes, rather than dated invoice-line/event ledgers. Till entries are manual quantities; there is no automated POS feed or undocumented CSV parser. Costs are snapshot operational estimates, not formal inventory-accounting valuation. No real products/counts are invented. Schema limits are documented in the accompanying research; larger installations should separate historical records before reaching the document cap.

The existing editor access model is unchanged; no authentication system is introduced. Same-origin writes and bounded/validated requests follow the existing backend conventions. Backups and audit snapshots contain operational business data and should be retained by the venue through its existing deployment/access arrangements.

## Verification

Run `npm run check` for TypeScript, the complete automated suite and the production build. Added tests cover pack/portion conversion, waste versus unexplained variance, gains, mixed-unit cost weighting, blank counts and zero usage, impossible counts, invalid periods, references, snapshot carry-forward, closed-period protection, atomic audit saves and stale revisions. Database tests use PGlite, not production Neon.

Browser appearance, phone input and production persistence still require deployment verification. The environment previously could not resolve the checkout's dependency symlink inside the managed preview; no browser verification is claimed. This source ZIP has not been pushed or deployed by this task.

Detailed source-backed recommendations and formulas are in [stock-control-research.md](stock-control-research.md).
