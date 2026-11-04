# 1.12.0 — till items inside product cards

After adding a product, its card opens with an integrated Till items section. Add, rename, link and remove till items without moving to another list. Existing mappings are shown inside each connected product; multi-ingredient recipes share one underlying record and explain this when editing. Removing a till item asks for confirmation and does not alter saved periods.

Serving amounts use ml for liquids, grams for weights and items for discrete stock. Existing litres/kilograms remain stored unchanged; conversions only affect the form. New liquid/weight mappings require an explicit serving quantity before saving. A one-item sale defaults to one item.

Save/Reload moves to a fixed bottom action bar with reserved page space so it no longer covers card tops. Buttons use separated action groups and useless disabled single-ingredient removal is omitted. Period creation splits date and time into contained native fields, with simpler helper text. Browser chrome remains black and the existing Back header remains.

Verification: npm run check, including till conversions, linked-item creation and automatic product-card expansion. Browser/device visual verification was unavailable. No deployment is included. Public media, stock report formulas and database schema are unchanged.
