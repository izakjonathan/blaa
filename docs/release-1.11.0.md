# 1.11.0 — simpler stock control

Product creation is a separate draft with Add and Cancel. It no longer inserts an unfinished product into saved stock. The main fields are name, purchase size and optional price. Presets cover single items, cases of 24, 70/75 cl bottles and 20/30 L kegs; Other size supports custom items, litres and kilograms. Category, supplier, product code, target stock and loss alerts sit under Optional details. Targets are entered in purchase packs and stored in the existing base units.

Existing products have searchable summaries with size and price, and inactive products are hidden by default with a Show inactive option. Unit changes remain locked after counting. Product validation names the field to correct. Drafts survive switching stock tabs, block saving incomplete setup and trigger existing leave warnings. Add to products remains local until Save changes, stated beside the action.

Navigation reads Overview, Weekly counts, Products & till, History. The empty dashboard explains the three setup steps and links to them. Weekly count cards show opening stock, closing stock and deliveries in purchase packs first; alternative unit counts, waste and adjustments are folded away. Quantities still use each period's saved product size. The save bar stays available while scrolling.

No data migration, report formula, audit or closed-period behaviour changes. Inactive products linked to till recipes remain in new counts, explained in the product settings.

Verification: npm run check, including preset conversion and existing reconciliation/snapshot tests. Browser/device visual verification was unavailable. No deployment is included.
