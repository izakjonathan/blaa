# Stock control for Blågårds Apotek

Research and implementation decisions, 4 November 2026.

## What the established systems agree on

WISK describes physical consumption as opening inventory plus received deliveries minus closing inventory. It maps each till item to the ingredients and quantities consumed by a sale. This is the necessary bridge between a till's sale quantities and physical stock such as bottles or litres. [WISK overview](https://help.wisk.ai/en/articles/4615788-wisk-bar-overview).

Backbar's variance report uses two inventory sessions, receipts, adjustments/transfers and sales within the same period. It identifies count mistakes, missing or incorrectly dated receipts and incorrect till mappings as possible reasons for variance. A shortage therefore needs investigation before it can be assigned a cause. [Backbar variance documentation](https://www.getbackbar.com/support/inventory-variance-report).

Lightspeed supports counting by location and explicitly distinguishes skipping a product from counting zero. Its workflow includes review before submission and retaining submitted counts for investigation. These are valuable safeguards against misleading reports. [Lightspeed stock-count documentation](https://o-series-support.lightspeedhq.com/hc/en-us/articles/31329410458395-Performing-stock-counts).

The remaining recommendations below are our design decisions for this venue, rather than claims about these vendors' exact implementation or a universal industry benchmark.

## Recommended operating method

### 1. Count consistently

Use one weekly count boundary when the venue is quiet, for example Monday at 04:00, and use a till report with exactly the same boundary. The tool accepts explicit opening and closing timestamps labelled Europe/Copenhagen. Treat the start as inclusive and the end as exclusive. Do not combine a Sunday calendar-day till report with a count taken after Sunday night's trading without reconciling the difference. Avoid ambiguous daylight-saving clock-change times; 04:00 is a practical standard.

Count every location: cellar, back bar, fridges, service areas, opened bottles and connected kegs. A stock move within the venue is not a transfer out of the venue. The first release records the venue total and allows location details in notes; a dedicated location-by-location count sheet is a sensible later addition.

Use the same measurement method each week. A fractional open-bottle estimate may be sufficient for low-value spirits; scales or calibrated volume estimates can improve consistency for valuable products. Partial keg estimates should be treated as less precise than sealed stock. Recount surprising results before changing an operational process.

### 2. Define stable physical products

Each product needs its own ID, optional SKU, category, supplier, base unit, purchase pack size, purchase pack cost, target/par and loss alert threshold. Archive discontinued products instead of removing their history. When the base unit changes, create a new product once the old one has been used in counts.

Use litres for liquids, individual units for packaged goods and kilograms for weighed ingredients. Examples:

| Product | Base unit | Purchase pack | Till consumption |
| --- | --- | --- | --- |
| Draught beer | L | 30 L keg | 0.4 L or 0.5 L per specific till item |
| Spirit | L | 0.7 L bottle | 0.02 L / 0.04 L shot |
| Wine | L | 0.75 L bottle | Measured glass size or 0.75 L per bottle sale |
| Bottled beer | each | Case of 24 | 1 each per bottle sale |

Keep refundable deposits outside beverage purchase costs. Use the same cost basis across all products and periods. These are operational estimates, not statutory accounting or tax reports.

### 3. Map the till before interpreting losses

A till menu item is different from a physical stock product. Separate a small beer from a large beer, and a glass of wine from a bottle of wine. Give cocktails multiple ingredient lines; a gin-and-tonic, for example, consumes both gin and tonic. Enter the quantity of each ingredient in its product's base unit.

Sales inputs are counts of menu items, not turnover in kroner. Revenue alone cannot identify litres or bottles consumed. The first release uses manual till quantities and supports multi-ingredient recipes. An automated integration requires the venue's actual till provider, item codes and report format; these must not be guessed.

Zero-priced drinks already counted as till sales must not also be entered as complimentary usage. Otherwise they are deducted twice. Supplier returns and genuine transfers between venues go into the signed transfer/return field with an explanation. This release uses nonnegative sales quantities; reconcile refunds with the till and physical movement instead of entering a negative sale without understanding what returned to stock.

### 4. Record received stock, not purchase orders

Enter quantities actually received during the period. Purchase packs are converted through the saved pack size; loose quantities are added separately. Keep invoice/delivery references in notes. Do not include undelivered orders or deliveries arriving after the closing count.

The first release accepts weekly delivery totals per product. A dated receipt ledger with invoice attachments, supplier returns and invoice-line costs would be the next extension for a busier operation. Until then, retain the invoices and reconcile their totals with the input sheet.

### 5. Separate known waste from unexplained usage

Record spillages, spoiled beer, line cleaning, breakages and other known losses as recorded waste in base units, with the reason. Record complimentary/staff usage that is not already included in till quantities separately. Do not reclassify all unexplained differences as waste, overpouring or theft.

The implemented arithmetic is:

- Actual usage = opening + delivered packs × pack size + loose deliveries + signed transfers − closing.
- Theoretical sold usage = sum of till item quantities × ingredient quantity.
- Unexplained variance = actual usage − theoretical sold usage − recorded waste − unrecorded-in-till complimentary usage.
- Estimated loss quantity = recorded waste + max(unexplained variance, 0).
- Unexplained gain quantity = max(−unexplained variance, 0).

Positive variance means more stock disappeared than these records explain. Negative variance means stock or sales records indicate an unexplained gain; investigate it separately. Gains must not hide shortages on other products.

### 6. Use a clearly labelled denominator

Individual loss % = estimated loss quantity / actual usage quantity × 100. Recorded waste % = recorded waste quantity / actual usage quantity × 100. No usage means the percentage is unavailable, not automatically zero.

Across the venue, litres, items and kilograms cannot be added. Use cost-weighted percentages: sum of recorded waste costs / sum of actual usage costs, and sum of estimated loss costs / sum of actual usage costs. Unit cost is snapshotted purchase-pack cost / snapshotted pack size. Products with zero purchase cost do not influence these weighted rates and are flagged. Missing count/sales data is excluded and coverage is shown.

Example: 30 L opening + 30 L delivered − 10 L closing gives 50 L actual usage. Eighty sales of 0.5 L give 40 L sold usage. With 2 L recorded waste and 3 L complimentary usage, 5 L remains unexplained. Recorded waste is 4%; estimated total loss is 14%. This does not mean all 14% is confirmed waste.

### 7. Show action-oriented dashboard information

Implemented: recorded waste %, estimated total loss %, loss value at snapshot cost, actual usage cost, closing stock value, unexplained gains, data completeness, ranked loss contributors, configurable product alerts, category/search filters, closed-period trends and suggested purchase packs to reach a fixed par level.

Ordering suggestion = ceiling(max(par − closing, 0) / pack size). It is a simple suggestion based on the last count, not a live order or a demand forecast. Check open orders, forthcoming events, seasonality and supplier lead times before ordering. No automatic orders are sent.

A useful review order is: missing data → wrong counts/units → receipt totals → till mappings → known waste/comps → operational causes. Prioritise by loss value as well as percentage: a large percentage on a tiny quantity may be less important than a smaller percentage on the main draught product. The default 5% product alert is an editable starting value, not a claimed acceptable industry norm.

### 8. Preserve the accounting context of each period

New periods snapshot products, recipes, pack sizes and costs. Changing a product's price or portion size later must not rewrite a closed report. A draft can explicitly refresh its product/recipe settings. Opening stock carries forward only from a closed period whose end exactly matches the new period's start. Gaps and new products require an explicit opening count.

The close action checks counts, movement confirmation, sales confirmation, impossible stock availability and explained transfers. Closed periods are locked. Reopening requires a reason; every saved revision retains an immutable database snapshot. Concurrent changes are rejected rather than silently overwritten.

### 9. Start with disciplined manual input

For the first month, use this workflow with a small, representative selection—draught beer, main spirits and wine—while maintaining the complete product list. Verify pack sizes and till recipes against actual service. Save a baseline count, then compare the next complete period with invoices and till quantities. Investigate both unusually high shortages and large gains.

The tool supports one venue, manual weekly counts/movements and manual till quantities. It does not claim a live till feed, automatic invoice recognition, automatic receipt matching, formal COGS, sales margin or VAT reporting. CSV report exports and JSON backups are available.

### 10. Sensible next extensions

After validating the weekly process: structured location subtotals; dated receipt/waste logs; report-specific CSV till imports with mapping review; invoice costs and weighted-average valuation; purchase-order tracking and lead-time based pars; staff roles and named approvals under the venue's chosen access system; and separately stored per-period records for larger datasets.

The first implementation uses one revision-controlled document in the existing database, with immutable audit snapshots. It has explicit limits (500 product definitions, 1,000 till mappings, 260 period records, 2.9 MB total document). These are safety caps, not a promise that all maxima fit simultaneously. Larger/longer-running installations should migrate historical periods into independently stored records before reaching that cap. Historical deletion is deliberately not offered as a workaround.

## Validation to perform on deployment

Automated tests exercise conversion, variance, missing data, gains, cost weighting, recipe references, snapshots, period boundaries, locking, reopen rules, database transactions and revision conflicts. Those checks do not establish that the real till mappings, real count measurements or production database permissions are correct. Verify a complete real week and recount suspicious items before relying on the dashboard for operational decisions.
