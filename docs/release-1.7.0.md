# 1.7.0 — branded page transitions

Adds the agreed short transition to the user-confirmed working 1.6.0 build.

## Behaviour

- Ordinary same-origin public page links use a blue/primary-brand curtain: 300ms cover with ease-in/out, then 400ms reveal with a soft settling curve.
- Destination data prefetch starts on click. Navigation commits after the panel becomes opaque, preventing the next page flashing through a partially closed curtain. After the destination commits, scroll resets beneath the panel; the panel then continues upwards to uncover it.
- Transition-end events advance the sequence. Duration-based fallbacks add 80ms if an event is missed. A slow navigation has an 8-second watchdog so the overlay cannot lock the page indefinitely.
- The existing menu is already a navigation cover. Menu links therefore bypass the extra curtain and use the configured reveal duration for their existing covered close. Ordinary manual menu opening/closing keeps the existing menu timing.
- Off-page anchors land at their target. Same-page links, modified/middle clicks, new tabs, downloads, external links, files and admin/API/media links retain native behaviour. The existing legacy page alias is normalised before selecting a transition.
- New page headings/photos wait for the covering layer to release them. Returning home through the curtain skips a second splash sequence. Footer auto-arrival pauses while a transition is active.
- Escape, browser history, reduced-motion changes and unmount clear timers, pending frames, inert state and scroll suppression. Repeated clicks do not enqueue extra navigations. Successful keyboard navigation focuses the new heading/anchor; cancellation restores the prior focus when it remains connected.

## Editor

Six controls under **Admin → Animations → Page transitions**:

1. Enable page transition curtain.
2. Cover duration (100–1000ms, default 300ms).
3. Reveal duration (100–1000ms, default 400ms).
4. Curtain colour: primary, accent or deep brand colour.
5. Cover easing.
6. Reveal easing.

All use the existing registered-field validation, live preview, save, publish, restore and reset workflows. No dependency addition or database migration is required. System Reduce Motion and the master motion switch bypass the curtain.

## Verification

Run `npm run check` for TypeScript, the complete Node test suite and the production build. Tests include the cover/wait/reveal state sequence, immediate prefetch, deferred route commit, repeated activation, missed events, history interruption, prefetch/navigation failure, timeout recovery, cleanup, link filtering, reduced motion and registered editor values. Existing tests continue to cover menu routing, splash, header tone, footer handoff, overlays and photo motion.

Visual browser and real iPhone Safari verification remain pending. The managed preview environment previously could not resolve this checkout's dependency symlink; no infrastructure change was made or visual check claimed. Production storage/publish were not exercised.

## How to see it

Deploy this ZIP using the established GitHub/Vercel workflow. Follow a page link in page content (or use the header logo to return home) to see the new curtain. Open the menu and choose another page to see the existing panel act as the cover, with the shorter configured reveal. Anchor links on the same page intentionally keep ordinary scrolling.

This release is supplied as a ZIP and has not been committed or deployed by this task.
