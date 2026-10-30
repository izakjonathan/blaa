# Project Development Constitution

A permanent engineering handbook for long-running Next.js projects, based on the working methods developed across **Bar Ops** and **Shams for Humanity**.

This constitution governs how changes are investigated, designed, implemented, reviewed, versioned, packaged, and deployed.

## Core principle

> Preserve what works. Find the real cause. Make the smallest reliable correction. Verify the full system.

## Use

1. Read the engineering philosophy.
2. Read the chapters relevant to the task.
3. Read the project-specific chapter when applicable.
4. Use the release checklist before every version.
5. Use the task template when starting new work.

## Authority order

1. The user’s explicit task instruction.
2. The latest confirmed project brief and baseline.
3. The project-specific constitution.
4. This general constitution.
5. Framework conventions and common best practices.

Never use a generic best practice to override an intentional project decision.


---

# 00 — Engineering Philosophy

## Production-first thinking
Treat every project as a production system. The objective is not to produce the most code, but to improve the system while reducing future uncertainty.

## Preserve working systems
Do not replace working code merely because another approach appears cleaner in isolation. Identify what the current implementation solves, which routes depend on it, and whether prior regressions shaped its present form.

## Root-cause-first debugging
Never begin with a patch. Define the symptom, reproduce it, trace the responsible rule or lifecycle, and correct the mechanism producing the problem.

## Smallest reliable change
Preference order:
1. Correct an incorrect value.
2. Correct an incorrect selector or condition.
3. Reuse an existing abstraction or token.
4. Remove conflicting or obsolete code.
5. Narrow the affected scope.
6. Introduce a new abstraction only when repeated evidence justifies it.

## Evidence before certainty
Base decisions on rendered behaviour, source inspection, computed styles, runtime state, tests, browser-specific reproduction, and build output. Do not present assumptions as facts.

## Simplicity before cleverness
Avoid hidden coupling, surprising side effects, one-use abstractions, compensating CSS, scattered booleans, and arbitrary timing fixes.

## Stable identity
Do not normalize Bar Ops into a generic SaaS dashboard. Do not normalize Shams into a generic festival template.

## Definition of done
A task is complete only when the root cause is understood, the implementation is correct, regression risk has been checked, the build succeeds where possible, packaging is correct, and limitations are reported honestly.


---

# 01 — Next.js Architecture

## Structure
Follow the existing repository structure. Do not reorganize a working project during an unrelated task.

Recommended areas may include `app`, `components`, `features`, `hooks`, `lib`, `styles`, `types`, `providers`, `content`, `server`, and `tests`. Use only what the project needs.

## App Router
Use `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`, and `not-found.tsx` according to their intended responsibilities. Use route groups for organization. Use parallel or intercepting routes only when the interaction requires them.

## Server and client boundaries
Default to Server Components. Use `use client` only for browser APIs, local interaction state, effects, event handlers, or client-only libraries. Keep client boundaries low in the tree.

## Data access
Validate external data. Return typed domain objects. Keep secrets and privileged work server-side. Cache intentionally.

## Mutations
Every mutation must validate input, authorize the operation, handle failure, update or invalidate relevant data, and return a predictable result.

## Import direction
Prefer one-way flow: `app → features → components → lib/types`. Avoid circular dependencies and barrel files that hide them.

## Metadata and viewport
Define metadata intentionally. For mobile-heavy projects, verify `viewport-fit=cover`, theme colors, and explicit root canvas colors.

## States
Every data-dependent route must define loading, empty, success, recoverable error, unrecoverable error, and authorization states where relevant.


---

# 02 — React and TypeScript Standards

## Components
Each component should have one clear responsibility. Prefer composition over large prop matrices and duplicated variants.

## Props
Use explicit, narrow, semantic props. Avoid passing whole objects when only a few fields are needed.

## State
Store only state that cannot be derived. Avoid duplicated filtered lists, totals, labels, and boolean mirrors.

## Effects
Effects are for synchronization with external systems. Do not use effects to derive render data, repair state after render, or solve layout that CSS can express.

## Hooks
Custom hooks must encapsulate meaningful reusable behaviour, clean up subscriptions, and expose minimal state.

## Identity
Use stable domain identifiers for keys. Avoid array indexes when order can change.

## TypeScript
Preserve strict typing. Avoid `any`, unsafe assertions, broad index signatures, and non-null assertions without evidence. Validate runtime data.

## Memoization
Use memoization only when profiling or referential requirements justify it.

## Review
Confirm clear responsibility, minimal state, necessary effects, narrow props, justified client boundaries, semantic markup, and complete interaction states.


---

# 03 — CSS Architecture

## Diagnose first
Trace styling through component rules, parents, globals, utilities, variables, media queries, inherited values, inline styles, JavaScript classes, animation states, and browser defaults.

## Scope
Component-specific rules remain component-scoped. Global CSS is reserved for resets, root tokens, document-level typography, viewport behaviour, and intentionally shared primitives.

## Specificity
Keep selectors shallow and predictable. Avoid IDs and `!important`. Document any unavoidable third-party override.

## Tokens
Use tokens for semantic repeated decisions such as surfaces, text roles, spacing rhythm, radii, motion, and layout widths.

## Layout
Prefer normal flow, flexbox, and grid. Use absolute positioning for actual overlays. Avoid fixed content heights. Use `min-width: 0` when flex or grid text can overflow.

## Responsive design
Design fluidly first. Add breakpoints when layout meaningfully changes. Validate between target widths.

## Overflow
Treat unintended horizontal overflow as a defect. Investigate widths, transforms, positioned children, unbreakable content, and grid minimums. Do not hide overflow globally.

## Anti-patterns
Avoid duplicate selectors, compensating margins, arbitrary z-index escalation, broad descendant selectors, and timing-dependent styling.

## Correction hierarchy
1. Remove the incorrect rule.
2. Correct the governing declaration.
3. Correct selector scope.
4. Correct token usage.
5. Correct structure if CSS cannot express the layout cleanly.
6. Add narrowly scoped browser handling only after reproduction.


---

# 04 — Design Tokens and Typography

## Token principles
Tokens express meaning rather than implementation. Prefer semantic roles such as `--color-surface-primary`, `--space-section`, and `--duration-route`.

## Color
Define roles for canvas, surfaces, primary and muted text, borders, focus, success, warning, danger, and interactive states. Test real combinations.

## Spacing
Distinguish page padding, section spacing, component spacing, control spacing, and text spacing.

## Radius
Use a restrained set of roles: control, card, panel, pill, circular.

## Typography roles
Define display, page title, section title, card title, body, small body, label, caption, and data value. Each role should specify family, weight, size, line-height, and spacing.

## Responsive type
Use fluid scaling only where it benefits the design. Test compact devices and multiline titles.

## Rhythm
Control spacing around text through layout containers rather than scattered default margins.

## Fonts
Specify fallbacks, preload only critical files, prevent layout shift, and avoid unused weights.

## Token changes
Shared token changes are system-wide. Locate all uses and confirm the issue is truly global before editing.


---

# 05 — UI System

## Primitives
Create stable primitives only for recurring patterns: buttons, inputs, dialogs, cards, badges, tables, tooltips, empty states, and status messages.

## Buttons
Define default, hover, focus-visible, active, disabled, loading, and destructive states. Icon-only buttons require accessible names.

## Forms
Use visible or programmatically associated labels. Errors must identify the field, explain correction, and not rely on color alone.

## Cards
Cards represent meaningful grouped content. Keep padding, borders, radii, headings, actions, and responsiveness consistent.

## Tables
Use semantic tables. Choose responsive strategies intentionally: scroll, column prioritization, compact view, or mobile cards.

## Dialogs
Trap focus when modal, restore focus on close, support expected dismissal, prevent background interaction, preserve scroll, and avoid viewport clipping.

## Empty and loading states
Explain what is missing and what to do next. Preserve layout during loading.

## Status
Use one canonical status vocabulary and visual mapping across the product.

## Responsive contracts
Every component must define how it wraps, stacks, scrolls, truncates, collapses, and preserves priority.


---

# 06 — Motion Constitution

## Purpose
Motion communicates relationship, state change, direction, hierarchy, and continuity. Do not animate merely because animation is possible.

## Vocabulary
Use a restrained set of entrance, exit, route, menu, micro-interaction, and loading patterns.

## Duration and easing
Use semantic duration tokens and easing based on purpose. Never use duration to hide slow data or broken lifecycle logic.

## Ownership
One system should own each transition. Avoid mixing CSS transitions, React timers, browser events, and route events without a clear controller.

## Page transitions
Account for source state, trigger, cover or morph, destination readiness, scroll restoration, interruption, back navigation, and reduced motion.

## Overlays
Opening and closing should be symmetrical unless intentionally different. Keep backgrounds and safe areas visually continuous.

## Performance
Prefer opacity and transform. Avoid large blurred layers and expensive paint-heavy effects on mobile.

## Cleanup
Remove temporary classes, release scroll locks, restore focus, clear timers, and leave deterministic final styles.

## Verification
Test rapid activation, interrupted navigation, back navigation, reduced motion, Safari, orientation change, and scroll position.


---

# 07 — Safari and iOS Constitution

## Distinct runtime
Do not assume Chrome emulation reproduces iOS Safari. Use real-device evidence for Safari-specific issues where possible.

## Viewport units
Understand `vh`, `svh`, `lvh`, and `dvh`. Choose based on whether the layout should track the dynamic viewport or remain stable while browser chrome changes.

## Safe areas
Use safe-area insets only where needed. Avoid applying them twice through nested containers.

## Root canvas
Set explicit colors for `html`, `body`, app root, and transition layers. Safari may expose the document canvas above or below content.

## Fixed and sticky
Check transformed ancestors and test while scrolling, opening menus, rotating, collapsing browser chrome, and focusing inputs.

## visualViewport
Use only when CSS cannot reliably express the requirement. Scope listeners, clean them up, and avoid fighting CSS layout.

## Scroll locking
Preserve scroll position, page width, safe-area coverage, browser chrome behaviour, and restoration after close.

## Footer and document end
Do not assume exact document-end detection is stable. Test footer contact against the visual viewport when full-canvas coverage matters.

## Keyboard
Test dialogs, bottom sheets, fixed controls, and focused inputs with the software keyboard open.

## Workflow
Reproduce on device, record the exact state sequence, inspect root and overlay backgrounds, check viewport units and fixed ancestors, apply the narrowest workaround, document it, and verify other browsers remain unchanged.


---

# 08 — Accessibility Constitution

## Requirement
Accessibility affects structure, interaction, copy, motion, color, and testing from the beginning.

## Semantics
Use native elements first: buttons for actions, links for navigation, headings for structure, lists for lists, tables for tabular data, and labels for controls.

## Keyboard
Every interactive feature must be operable without a pointer. Define tab order, enter and space behaviour, escape behaviour, and focus restoration.

## Focus
Keep focus visible. Move it intentionally when dialogs open, validation fails, or content is revealed.

## Screen readers
Provide accessible names and announce meaningful asynchronous changes without excessive live regions.

## Contrast
Test actual combinations, including muted text, placeholders, borders, focus rings, disabled states, gradients, and text over imagery.

## Motion
Respect reduced-motion preferences and preserve comprehension.

## Forms
Associate errors with fields and communicate required status visually and programmatically.

## Verification
Perform keyboard-only, visible-focus, heading, label, contrast, reduced-motion, and basic screen-reader checks for critical flows.


---

# 09 — Performance Constitution

## Principle
Performance is user experience and must reflect real devices and networks.

## Priorities
Prioritize fast meaningful render, low layout shift, responsive interaction, stable navigation, efficient media, and limited client JavaScript.

## JavaScript
Default to server rendering. Every client component and dependency must justify its cost.

## Images
Use correct dimensions and formats, define intrinsic size, serve responsive assets, and preload only critical imagery.

## Fonts
Ship only used families and weights, use suitable fallbacks, and avoid blocking the initial render.

## Rendering
Place state well, avoid duplicated state, and profile before memoizing.

## Animation
Avoid expensive full-screen paint effects and verify transitions on mobile hardware.

## Caching
Define freshness, invalidation, personalization boundaries, and fallback behaviour. Never publicly cache sensitive data.

## Third parties
Every script must justify performance, privacy, maintenance, and failure costs.

## Verification
Use production builds and inspect bundle output, network waterfall, image sizing, layout shifts, interaction latency, and slow-device behaviour.


---

# 10 — Testing and Regression Strategy

## Layers
Use static analysis, unit tests, component tests, integration tests, end-to-end tests, and visual/device QA as appropriate.

## Automated checks
Run lint, TypeScript, unit tests, integration tests, production build, and end-to-end tests where available.

## Visual regression
Compare the target, previous baseline, neighbouring components, responsive widths, and interactive states.

## Responsive matrix
Check 320, 375, 390, 430, 768, 1024, and wide desktop. Add landscape for mobile-heavy interfaces.

## Content variation
Test short text, long text, empty content, missing optionals, many items, one item, and localization where relevant.

## State matrix
Verify default, hover, focus-visible, active, disabled, loading, success, error, empty, open, closing, and reduced motion.

## Browser matrix
Consider Safari iOS, Safari macOS, Chrome, Firefox, and Edge based on project support.

## Honesty
Report only what was actually tested. Do not claim Safari validation based solely on Chrome emulation.


---

# 11 — Debugging Constitution

## Define the symptom
Document environment, route, starting state, interaction sequence, current result, and expected result.

## Reproduce
Confirm the issue exists in the supplied baseline. If not, investigate baseline, browser, data, state sequence, caching, and deployment differences.

## Trace
For visual issues inspect element, parents, computed styles, layout mode, variables, media queries, transforms, overflow, JavaScript classes, animation state, and viewport.

## Hypotheses
Rank plausible causes by evidence. Do not edit several unrelated layers simultaneously.

## Correct the source
Remove or correct the mechanism producing the issue. Avoid compensating code elsewhere.

## Verify
Repeat the original sequence, then test adjacent sequences and states.

## Inspect changed files
Check syntax, duplicate selectors, stale imports, unused variables, global effects, invalid hooks, unhandled states, and debugging output.

## Root-cause report
Explain what produced the issue, why it appeared under certain conditions, and why the fix resolves it.

## Stop conditions
When evidence is insufficient, state what is missing rather than stacking speculative patches.


---

# 12 — Versioning and Release Process

## Baselines
Every task begins from an explicit latest working baseline. Record version, filename, date, purpose, and known limitations.

## Version scheme
Follow the existing project format. For semantic versioning: patch for fixes, minor for backward-compatible features, major for breaking change.

## Scope
A release should have one coherent purpose. Do not bundle unrelated cleanup without agreement.

## Version markers
Update package metadata, visible labels, release notes, filenames, and constants consistently.

## Changelog
Document added, changed, fixed, removed, known issues, and verification performed.

## Rollback
Keep the previous confirmed baseline. Avoid irreversible migrations without a rollback or forward-repair plan.

## Database changes
Create migrations, preserve data, test upgrade paths, document rollback limits, and update seeds or fixtures.

## Acceptance
A build is not user acceptance. Visual and product changes require confirmation.

## Handoff
Provide latest baseline, master brief, current phase, completed releases, unresolved issues, next step, and relevant constitution chapters.


---

# 13 — ZIP Packaging Constitution

## Purpose
A release ZIP must be immediately usable as a project baseline.

## Structure
The ZIP should open directly to project files unless a containing folder is explicitly requested. Avoid double nesting.

## Include
Source, configuration, package manifest, lockfile, public assets, migrations, required documentation, and version metadata.

## Exclude
`node_modules`, caches, temporary files, editor metadata, secrets, credential-bearing environment files, and unrelated old ZIPs.

## Lockfiles
Preserve the project’s package manager and lockfile.

## Verification
Inspect the root, run install/build checks where possible, confirm version references, verify changed files are included, inspect ZIP contents, and confirm secrets are absent.

## Filename
Use clear versioned names such as `project-name-v0.18.5.1-short-description.zip`.

## Integrity
Each ZIP represents exactly one release.

## Delivery
State baseline used, output filename, purpose delivered, checks run, and limitations.


---

# 14 — Vercel Production Workflows

## Deployment model
Use preview deployments before production where possible. Promote from a known verified commit or artifact.

## Environment variables
Separate development, preview, and production. Validate required values. Never expose server secrets publicly.

## Build consistency
Align Node version, package manager, lockfile, framework version, and environment configuration between local and Vercel builds.

## Preview verification
Check routes, APIs, database, authentication, images, redirects, headers, environment behaviour, and mobile Safari where relevant.

## Caching
Classify content as static, revalidated, dynamic, or user-specific. Invalidate intentionally and avoid stale operational data.

## Functions
Choose runtimes based on dependencies and workload. Handle timeouts, retries, and idempotency for external operations.

## Observability
Use runtime logs, error tracking, deployment history, analytics where appropriate, and health checks. Never log secrets.

## Rollback
Know the last stable deployment and use rollback or promotion workflows instead of unreviewed emergency changes.

## Post-deploy
Load critical routes, verify authentication, test a key mutation, inspect logs, verify mobile layout, confirm version markers, and ensure the intended deployment is active.


---

# 15 — AI Collaboration Constitution

## Role
The AI acts as a senior engineer inside an existing codebase, not as a greenfield generator.

## Baseline discipline
Always use the latest confirmed baseline. Do not infer that a similarly named file is current.

## Read before writing
Inspect relevant components, parents, globals, responsive rules, types, state logic, tests, and configuration.

## No redesign without instruction
A bug fix must not become a visual reinterpretation. A refactor must not alter behaviour unless agreed.

## Evidence
Report root cause, files changed, why the fix belongs there, regression scope, checks performed, and unresolved uncertainty.

## Avoid guessing
Generated code can look convincing while being architecturally wrong. Inspect more evidence when uncertain.

## Preserve conventions
Follow naming, structure, CSS method, state approach, component patterns, motion architecture, and release process.

## Verification
Run available checks and never claim work that was not performed.

## Long-running projects
Maintain phase awareness, release history, accepted decisions, deferred scope, latest baseline, and project standards.

## Final standard
The result should feel like a careful continuation of the project, not an AI-generated replacement.


---

# 16 — Bar Ops Project Constitution

## Identity
Bar Ops is an operational system for real bar teams. It should feel practical, fast, dependable, and role-aware rather than generic or decorative.

## Workspaces
Evaluate features across owner, manager, bartender, and other relevant roles. A feature is incomplete if it works only in one workspace when shared access is required.

## Permissions
Centralize permissions. The UI should not expose unavailable actions, and the server must enforce the same rules.

## Operational clarity
Expose shift status, staffing gaps, open shifts, lateness, orders, stock movement, labour totals, and urgent alerts without unnecessary interaction.

## Density
Use readable operational density with consistent cards, tables, headings, status colors, and controls.

## Scheduling
Support draft and published states, open shifts, availability, conflicts, role coverage, week navigation, mobile use, and auditability.

## Ordering and stock
Distinguish current stock, par level, suggested order, final order, received quantity, and variance. Avoid hidden calculations.

## Reporting
Begin with trustworthy reports: hours worked, attendance, lateness, open shifts, stock movements, orders, and labour by week.

## Mobile
Prioritize current shift, urgent actions, readable day columns, compact headers, touch targets, and rapid navigation.

## Data integrity
Important changes should record actor, timestamp, previous value, new value, and reason where relevant.

## Release report
State affected workspaces, modules, permissions, data, responsiveness, and migrations.


---

# 17 — Shams for Humanity Project Constitution

## Identity
Shams for Humanity is an editorial, cultural, and festival experience. Preserve strong typography, deliberate color, immersive transitions, and controlled rhythm.

## Motion
Motion is part of the identity but must remain deterministic. Route, menu, and overlay transitions should share a coherent timing language and avoid competing controllers.

## Typography
Preserve compact heading line-height, editorial hierarchy, intentional wrapping, font-specific spacing, and contrast. Global changes require site-wide inspection.

## Canvas
Page colors, legal-page colors, footer black, and transition canvases must remain continuous across the viewport and Safari safe areas. White or blue flashes are defects.

## Safari
Preserve known solutions for viewport continuity, footer contact, Liquid Glass regions, menus, route curtains, root backgrounds, and safe-area bleed.

## Gradients
Gradient controls must be centralized and must not alter unrelated section geometry.

## Artists and programme
Support mobile touch targets, accessible announcements, empty states, stable category navigation, real programme times, and long titles.

## Legal pages
Preserve intentional backgrounds, typography, close behaviour, return position, and navigation relationship.

## Admin
Prioritize validation, safe image handling, audit history, predictable publishing, and clear empty/error states.

## Release report
State whether public site, admin, typography, motion, Safari, content architecture, database, or accessibility are affected.


---

# 18 — Release Checklist

## Baseline
- [ ] Latest baseline identified.
- [ ] Version agreed.
- [ ] Scope understood.
- [ ] Deferred work excluded.

## Investigation
- [ ] Component inspected.
- [ ] Parent layout inspected.
- [ ] Global CSS inspected.
- [ ] Responsive rules inspected.
- [ ] JavaScript-controlled states inspected.
- [ ] Root cause identified.

## Implementation
- [ ] Smallest reliable change used.
- [ ] Existing conventions preserved.
- [ ] No unnecessary library added.
- [ ] No duplicate state introduced.
- [ ] No compensating CSS added.
- [ ] Accessibility considered.
- [ ] Safari considered where relevant.

## Quality
- [ ] Lint run.
- [ ] Type-check run.
- [ ] Tests run.
- [ ] Production build run.
- [ ] Changed files manually inspected.
- [ ] No debug output remains.
- [ ] No accidental global leakage.

## Visual regression
- [ ] 320, 375, 390, 430, 768, 1024, and desktop checked.
- [ ] Landscape checked where relevant.
- [ ] Long, short, empty, and error content checked.
- [ ] Hover, focus, opening, closing, and reduced motion checked.

## Browser
- [ ] Chrome checked.
- [ ] Safari checked where relevant.
- [ ] Real iOS checked for Safari-specific issues.

## Version and ZIP
- [ ] Version markers updated.
- [ ] Changelog written.
- [ ] Previous baseline preserved.
- [ ] Correct root structure.
- [ ] `node_modules`, secrets, caches, and unrelated files excluded.
- [ ] Lockfile preserved.
- [ ] ZIP contents inspected.

## Delivery
- [ ] Root cause reported.
- [ ] Files changed listed.
- [ ] Checks performed listed.
- [ ] Unverified areas stated honestly.
- [ ] Download link points to the actual artifact.


---

# 19 — Reusable Task Prompt Template

Use the attached project as the latest working baseline.

## Task
[Describe the exact feature, correction, or optimization.]

## Location
- Route:
- Component:
- Workspace or role:
- Interaction:

## Environment
- Device:
- Browser:
- Operating system:
- Viewport:
- Orientation:

## Reproduction
1.
2.
3.

## Current result
[Describe what happens now.]

## Expected result
[Describe the intended behaviour in measurable terms.]

## References
- Screenshot A:
- Screenshot B:
- Existing component to match:
- Behaviour that must remain unchanged:

## Constraints
- Preserve the existing architecture.
- Do not redesign unrelated UI.
- Do not introduce a new library unless approved.
- Do not add global overrides for a local issue.
- Do not use compensating CSS.
- Keep the change narrowly scoped.
- Preserve accessibility and responsiveness.

## Required process
1. Inspect the component.
2. Inspect its parent layout.
3. Inspect global CSS and tokens.
4. Inspect responsive rules.
5. Inspect JavaScript-controlled classes and state.
6. Identify the root cause.
7. Make the smallest reliable correction.
8. Run available lint, type-check, tests, and production build.
9. Inspect changed files for syntax errors, duplicate selectors, leakage, and unused code.
10. Package the result as the next versioned ZIP.

## Required report
- Root cause.
- Files changed.
- Exact correction.
- Why the fix belongs there.
- Regression checks performed.
- Anything not verified.
