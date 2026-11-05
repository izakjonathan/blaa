# 1.15.1 — Brand-aware, simpler admin

Backend background is controlled by Brand colors → Backend → Backend background (landing and tools). The shared Content / accent colour controls backend text, icons and primary actions; muted text, borders and surfaces derive from those two colours. Publish the colours to apply them across tools. Public content colours continue to use the same shared accent.

Removed the bottom navigation dock completely. Tool Back links still return to the landing page; the landing has no Back link. Save actions now sit near the bottom edge, with content clearance and existing keyboard hiding preserved.

Removed title-card borders and outer content shells in Editor, Stock and SoMe. Fields, product groups, tables, statistics and useful content separators retain their boundaries. Font families and business workflows are unchanged.

Validation: TypeScript, all automated tests and production build. Live persistence and real-device keyboard checks remain deployment checks; no deployment was made.
