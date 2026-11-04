# 1.13.0 — compact Stock Control design

Stock Control now owns its layout in one stylesheet, using shared brand colours without inheriting the larger editor/studio spacing. This removes competing style layers instead of accumulating further overrides.

The stock header is shorter, titles are smaller and left-aligned, tabs fit in one row, and section headings use the interface typeface. Cards, grids, helper text, tables and history rows have consistent compact spacing. Inputs stay at 16px to prevent iPhone focus zoom, with 44px minimum control touch targets. Product names span the form grid; related size/price and serving fields use two columns where space allows. Date/time controls remain contained.

The bottom bar shows a short status, Save and Reload in one row with page clearance. It hides during soft-keyboard editing, including WebViews that resize innerHeight, and returns on blur. The new-product button is shortened to Add product, the save hint points to the bottom bar, and no-period/loading states omit empty selectors and premature setup instructions.

Product/till relationships, drafts, closed-period snapshots, calculations, import/export and audit data remain unchanged. Public pages and media are unchanged. The Editor and SoMe Generator retain their shared theme.

Validation: npm run check, including simulated keyboard visibility and listener cleanup. Browser/device visual verification was unavailable; real phone keyboard and layout checks remain pending. No deployment is included.
