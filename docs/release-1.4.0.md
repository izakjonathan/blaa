# 1.4.0 — Animation editor

Baseline: Blaa-v1.3.1-slower-footer-scroll.zip.

Open **/admin → Animations**. The new section has 39 registered controls, grouped by purpose. Values use the existing draft, live preview, publish, revision and restore workflow; no database schema or new dependency is required. Older documents inherit the new defaults.

| Group | Controls |
|---|---|
| General | Master animation switch. Device Reduce Motion remains authoritative. |
| Scroll reveals | Enable/disable, movement/fade durations, travel distance, viewport trigger, block staggering, heading line duration/stagger and easing. |
| Menu | Enable/disable, panel duration/easing, link duration and initial/stagger delays. |
| Hero text | Enable/disable, line duration/delay/stagger, button duration/delay and easing. |
| Hero video | Poster-to-video fade duration/easing. Colour and saturation remain in Forside. Autoplay behaviour is unchanged. |
| Footer scroll | Enable/disable, 300–5,000ms duration, visible-footer trigger from 10–80%, and four easing curves. Default remains 1,500ms with smooth ease-in/ease-out. |
| Footer content | Enable/disable reveal, duration, travel distance and easing. |
| Footer logo | Enable/disable pulse, duration, 0–40% enlargement and easing. |
| Splash transition | 50–200% transition speed and easing. Hold time, visibility and artwork settings remain in Splash screen. |

Each field has Reset. Reset all animation settings removes only motion overrides, leaving copy, colours, images and splash content intact. The Animations preview lets you choose any public page or the splash, and Replay preview reloads its motion state. The splash preview uses the same sequence as the real intro without consuming visitor session state.

## Implementation

- Content schema adds registered select options and range units; invalid options/ranges are rejected server-side.
- Shared animation settings produce whitelisted easing functions and validated numeric CSS tokens. Public CSS, measured heading lines, hero text and JavaScript footer scrolling consume those settings.
- Page reveal observers use the configured trigger/stagger. Disabled reveals remain readable. The master switch also suppresses the splash and is reflected in initial server HTML when published off.
- Footer scrolling retains background overscan, destination measurement, upward/touch cancellation, menu cancellation and cleanup. Pulse and automatic scrolling can be disabled independently.
- Device reduced motion is never overridden by the editor. A master-off choice disables transitions even on devices without a reduced-motion preference.

## Verification

- npm run check passed: TypeScript, all 65 tests and production build.
- Tests cover legacy defaults, all registered animation defaults, range/option validation, round-trip settings, master/individual switches, custom footer duration/easing/trigger, interruption, cleanup and existing application behaviour.
- Chromium production editor checks at 390px verified changing multiple controls, save/reload persistence through local API fixtures, unsaved live draft previews, a 1.2-second menu transition, configured 2.5-second cubic footer arrival, logo scale, replay, reset, master-off behaviour, splash replay and device reduced motion. No browser runtime errors. Editor render visually checked.
- Editor write responses in the browser test were local fixtures. No production content, remote deployment or database update was performed. Live Neon/Blob integration and actual iPhone/Safari remain unverified.
