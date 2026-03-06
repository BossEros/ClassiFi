# Light Mode Implementation Pitfalls (App-Wide)

## Pitfall 1: Token Bypass and Hardcoded Dark Styles
- Warning signs:
  - Frequent classes like `bg-slate-900`, `text-white`, `border-white/10` remain scattered in feature pages/components.
  - New light-mode changes require per-file overrides instead of centralized token updates.
  - Styling drift is worst in large files (for example admin/settings pages) where visual and logic concerns are mixed.
- Prevention strategy:
  - Define semantic theme tokens first (`surface`, `surface-muted`, `text-primary`, `text-secondary`, `border-subtle`, `accent`, `success`, `warning`, `danger`).
  - Replace direct color utilities with token-backed utilities/CSS variables, then enforce with lint/search checks for banned raw dark classes in presentation files.
  - Prioritize high-risk large files for token migration early to reduce long-tail inconsistency.
- Implementation phase: **Phase 1 - Theme Foundation and Token Migration Rules**.

## Pitfall 2: Accessibility Passing in Default State but Failing in Interaction States
- Warning signs:
  - Contrast looks acceptable at rest but hover/focus/disabled/error/success states are difficult to read.
  - Focus rings are low visibility on white/near-white surfaces.
  - Placeholder, helper text, and badge text become too faint after palette swap.
- Prevention strategy:
  - Build an explicit WCAG AA state matrix per semantic token pair, not just base text/background checks.
  - Define dedicated interactive-state tokens (`focus-ring`, `interactive-hover`, `interactive-active`, `interactive-disabled`) for light mode.
  - Add automated contrast checks and keyboard-focus walkthroughs for critical shared components.
- Implementation phase: **Phase 2 - Accessibility State System**.

## Pitfall 3: Theme Initialization Bugs (Flash/Mismatch) When Light Becomes Default
- Warning signs:
  - UI flashes dark before switching to light on initial load.
  - Users with saved dark preference get inconsistent results across tabs or after logout/login.
  - SSR/hydration or early mount renders with wrong theme attributes.
- Prevention strategy:
  - Set theme before React mounts using an early boot script or initial document attribute (`data-theme`).
  - Add a storage migration path for existing persisted theme values when default behavior changes.
  - Keep toggle logic centralized and covered by unit tests for precedence (user preference vs default vs system).
- Implementation phase: **Phase 1 - Theme Bootstrapping and Preference Migration**.

## Pitfall 4: Inconsistent Experience Across Roles and Legacy Pages
- Warning signs:
  - Student pages look updated while teacher/admin pages retain dark-era styling.
  - Shared components appear light in one route but dark in another due local overrides.
  - High-risk pages (large "god files") regress frequently during styling edits.
- Prevention strategy:
  - Use a route/role coverage matrix (student, teacher, admin) for every critical workflow listed in the project scope.
  - Migrate shared layout primitives first (cards, tables, forms, modals, nav), then apply page-level passes.
  - Add visual regression checkpoints per role on dashboard, class detail, assignment detail, settings, and admin management pages.
- Implementation phase: **Phase 3 - Role-Based Page Rollout and Consistency Sweep**.

## Pitfall 5: Third-Party UI Islands Ignore Global Theme Tokens
- Warning signs:
  - Monaco editor, calendar/event widgets, dropdown portals, or other embedded components stay dark or clash with light surfaces.
  - Component internals use separate theming APIs disconnected from app tokens.
  - Text selection, scrollbars, and code syntax colors become illegible in mixed-theme sections.
- Prevention strategy:
  - Create adapter wrappers that map app semantic tokens to each third-party theming API.
  - Standardize per-library light theme configs and treat them as part of shared UI infrastructure.
  - Add focused integration tests/screenshots for these high-variance components.
- Implementation phase: **Phase 2 - Shared Component and Third-Party Theme Integration**.

## Pitfall 6: Semantic Color Meaning Drift in Status/Feedback UI
- Warning signs:
  - Success/warning/error/info badges use arbitrary colors per feature.
  - Some statuses rely on color alone, failing accessibility expectations for meaning.
  - Blue-forward brand changes weaken distinction between primary actions and informational states.
- Prevention strategy:
  - Define status semantic tokens with contrast guarantees and non-color cues (icons/labels/patterns).
  - Document usage rules: brand accent vs state colors, including forbidden combinations.
  - Refactor shared status components first, then remove one-off status color implementations.
- Implementation phase: **Phase 2 - Semantic Feedback System Standardization**.

## Pitfall 7: Overlay and Layering Components Become Illegible in Light Mode
- Warning signs:
  - Modals, dropdowns, toasts, and tooltips retain dark translucent overlays designed for dark backgrounds.
  - Border/shadow tokens are too subtle, causing floating elements to blend into page surfaces.
  - Notification dropdown and settings modals show inconsistent depth cues.
- Prevention strategy:
  - Normalize elevation tokens (shadow, border, overlay opacity) for light mode across shared primitives.
  - Consolidate overlay styling into shared UI components instead of per-page styling.
  - Validate legibility in dense UIs (tables/forms/notification panels) with keyboard and screen-reader interaction.
- Implementation phase: **Phase 3 - Shared Overlay and Elevation Harmonization**.

## Pitfall 8: Verification Blind Spots Hide Theme Regressions Until Late
- Warning signs:
  - Build passes but contrast/focus/usability regressions are discovered manually after merge.
  - E2E coverage is browser-limited and misses rendering differences in Firefox/WebKit.
  - No light-vs-dark parity checks for core workflows and components.
- Prevention strategy:
  - Define a light-mode exit gate: required build/type checks plus targeted UI tests for critical flows.
  - Expand smoke coverage beyond one browser for theme-sensitive pages.
  - Add regression snapshots or scripted visual checks for shared primitives and role-critical pages.
- Implementation phase: **Phase 4 - Verification and Release Hardening**.

## Pitfall 9: Brand Drift During Rapid Styling Changes
- Warning signs:
  - Multiple shades of blue appear without clear hierarchy across buttons, links, badges, and charts.
  - Teams introduce ad-hoc arbitrary values to solve local issues.
  - Final UI feels "different app" instead of modernized ClassiFi.
- Prevention strategy:
  - Lock a documented blue-forward palette with clear role mapping (primary, secondary, subtle accent, informative).
  - Publish do/don't examples for component usage before page migration starts.
  - Require design review checkpoints on shared components before mass rollout.
- Implementation phase: **Phase 1 - Brand-Constrained Light Palette Definition**.

## Pitfall 10: Change Volume in Large Legacy Files Causes Regression Spikes
- Warning signs:
  - Massive PRs touch many unrelated concerns inside very large page files.
  - Repeated merge conflicts and inconsistent styling decisions across contributors.
  - Bug fixes reintroduce old dark classes because changes are hard to reason about.
- Prevention strategy:
  - Break migration into bounded slices (shared primitives -> route groups -> edge flows) with explicit ownership.
  - In high-risk large files, extract local presentation subcomponents before heavy theme edits when feasible.
  - Enforce checklist-driven reviews focused on token usage, state coverage, and role parity.
- Implementation phase: **Phase 3 - Controlled Migration Execution in High-Risk Pages**.
