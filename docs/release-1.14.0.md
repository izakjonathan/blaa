# 1.14.0 — audit cycles, activity and order recommendations

## Workflow

1. In Products, enter name, product type, supplier, purchase size, purchase cost and ideal packs. New products start with an ideal of 7 packs; set zero to disable reorder suggestions. Changing a purchase size retains the target number of packs. Existing products retain their saved targets.
2. Tick Create a matching PLU to create product and till item together. Name defaults to the inventory name. Enter a serving amount in ml, grams or items and a selling price in DKK. Multiple serving sizes remain supported within the product card.
3. In Counts, use Start count for an initial baseline. Enter physical stock and finalize. No opening balance or sales/waste percentage is invented.
4. In Activity, post deliveries in purchase packs, including actual pack cost and an optional invoice reference. Post till-report quantities for each PLU. The tool has no live POS integration; there is no `pos_orders` feed to query.
5. Start the next count at its actual cutoff time. Opening stock carries from the preceding finalized count. Posted activity is loaded for start-inclusive/end-exclusive boundaries. Activity at the cutoff minute belongs to the next cycle. All times use Copenhagen wall-clock minutes; use unambiguous cutoffs such as 04:00 around daylight-saving transitions.
6. Enter physical closing stock, review linked sales and check both completeness confirmations. If activity changed, Refresh posted activity; this retains closing counts and clears confirmations. Finalizing rejects stale ledger totals. Older finalized counts must be reopened in reverse order so successors are not silently invalidated.
7. Order suggestions group by supplier and round deficits up to whole packs. Finalization saves a durable internal-email job alongside the count and audit revision when products are below ideal stock. No supplier order is placed.

## Calculations

Expected physical stock = opening + deliveries + transfers − PLU usage − recorded waste − complimentary usage. Difference since last count is closing minus opening; it is not a loss percentage. Ledger count rows show provisional figures immediately, labelled as based on posted activity until sales completeness is confirmed. Count rows show expected packs, balance shift, linked sales quantity, linked sales revenue and product COGS. Shared-recipe revenue belongs to the complete linked till item and must not be added across inventory products.

All PLU serving sizes and historical price/recipe snapshots are combined. Revenue is a list-price estimate; refunds, discounts and actual receipts are not imported. Unknown selling prices produce an unknown revenue total rather than an invented zero. Costs and selling prices must use one consistent VAT basis. Delivery costs and previous closing-stock cost produce a periodic weighted-average COGS estimate, not accounting-ledger reconciliation.

The live-stock estimate uses the latest finalized count, posted deliveries and posted consumption. Unposted sales and physical waste remain unknown until posted/count reconciliation. Editing activity before the latest finalized cutoff is blocked. Open-cycle activity can be removed/corrected and the open count refreshed. Existing manual custom periods are retained under Advanced.

## Storage and compatibility

Existing `blaa_stock_state` and `blaa_stock_audit` retain ownership of stock and immutable revisions. Products and PLUs are logically linked by validated product IDs in each recipe. Saving product plus PLU uses one optimistic-concurrency update; count, revision and mail job commit in one SQL statement. This avoids a destructive migration to unrelated inventory tables. Existing documents without prices, activity arrays or baseline flags remain readable. A new `blaa_stock_order_mail` table stores order snapshots, provider requests and status.

## Email activation

Email sending is off by default. The existing project does not implement an admin authentication gate: same-origin checks and noindex headers are not access control. Protect `/admin` and `/api/editor` through the venue's access layer before enabling emails or using this tool with sensitive production data. This release does not add or claim authentication.

Configure a verified Resend sending domain and these server-only environment variables:

- `RESEND_API_KEY`: sending API key.
- `STOCK_ORDER_FROM`: verified plain sender address.
- `STOCK_ORDER_TO`: one internal manager address.
- `STOCK_ORDER_EMAIL_ENABLED=true`: explicit activation after access protection.

Redeploy after configuration. Finalization triggers background delivery after the save response; an email failure cannot undo a saved count. Review queued jobs under History → Order email and use Check / retry queued emails. Configuration activates pending jobs from previous counts too. There is no scheduled retry worker in this ZIP: failed jobs retry on subsequent saves or by this button. Only three pending jobs are processed per invocation.

Provider request payloads are frozen on first attempt and retries reuse a stable count key. Resend retains idempotency keys for 24 hours; this implementation stops retrying ambiguous attempts after 23 hours and marks them for manual provider-history review. A reopened/refinalized count does not automatically send a second email for the same count ID; review corrections internally. See [Resend sending API](https://resend.com/docs/api-reference/emails/send-email) and [idempotency documentation](https://resend.com/docs/dashboard/emails/idempotency-keys).

## Validation

`npm run check` covers previous features, product/PLU creation, baseline and repeated counts, multiple serving sizes and prices, weighted delivery costs, exact interval boundaries, stale-count rejection, historical snapshots, whole-pack ordering, escaped email markup, duplicate retry prevention and atomic rollback when queue insertion fails. Email tests use a fake transport; no real email or POS account was used. Browser/device visual checks and live database/provider verification remain pending. No deployment is included.
