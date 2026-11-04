# 1.10.0 — unified backend design

Editor, SoMe Generator and every Stock Control tab now use the website display typeface, blue background and gold palette, shared floating logo/menu, pill controls, rounded fields and subtle bordered panels. The backend background still follows Brand colors → Backend; the shared ink follows the website gold setting. Social template artwork and exported image colours remain independently controlled by each template.

The menu links directly to all tools and the public website. Duplicate venue headings and crowded local link groups have been removed. Editor and Stock Control warn before menu/logo navigation with unsaved changes. The public site's photo and page reveal effects are excluded from the backend workspace.

Responsive rules cover phone, tablet and desktop: single-column studio controls, mobile preview placement, horizontal editor tabs, wrapping stock navigation, full-width mobile action groups, scrollable wide data tables and safe-area spacing for the editor action bar. Opening the menu hides the editor action bar.

Verification: TypeScript, 106 automated tests and production build via `npm run check`. Browser/device visual inspection was unavailable in this workspace; no deployment is included. Public media files are unchanged.
