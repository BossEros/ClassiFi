# Phase 1 Research: Theme Runtime Foundation

## Purpose
This document captures what must be understood before planning Phase 1 so the plan is aligned with the existing code, current decisions, and the phase success criteria.

## Scope Alignment
Phase 1 is runtime behavior only: light/dark toggle, persistence, and flicker-free startup. It must satisfy THM-02, THM-03, THM-04 and avoid scope from THM-05+ (token system and component migration).

## Requirements Mapping (Phase 1)
- THM-02: Users can switch between light and dark via explicit toggle.
- THM-03: Theme selection persists across reloads and sessions.
- THM-04: No visible theme flash during startup.

## Locked Decisions From Context
- Toggle surfaces: dashboard top bar (icon button) and Settings page (labeled control). Both must use the same source of truth.
- Persistence: device-local only (localStorage), default to light if unset, and keep preference on logout.
- Startup behavior: avoid visible flash, apply to both auth and dashboard routes, no animation on first load.

## Current Implementation Baseline
- Theme state exists: `frontend/src/shared/store/useThemeStore.ts`.
  - Uses `classifi-theme` in localStorage.
  - `toggleTheme` and `setTheme` update `document.documentElement` classes for `light` and `dark`.
  - Cross-tab sync via `storage` event.
  - Initializes DOM class on module load.
- There is no early bootstrap in `frontend/index.html`; the only entry is `main.tsx` (React render).
- No Settings toggle exists yet in `SettingsPage.tsx`.
- No top-bar toggle exists yet in `TopBar.tsx` (top bar currently shows notification badge and profile).
- `DashboardLayout` is the shared shell for all dashboard routes and is the correct injection point for a universal top-bar control.
- Current UI is dark-first with explicit Tailwind classes, not semantic tokens.

## Gaps Against Phase 1 Goal
- No UI control for theme switch in either required surface.
- Current theme initialization happens after bundle load, which can cause a flash (THM-04 risk).
- No explicit initial-load transition suppression (requirement says no animation on first load).
- Theme switching will not visually change most screens unless minimal light-mode overrides are introduced, because current classes are hardcoded for dark. This is a Phase 1 risk: THM-02 says users should see a change immediately.

## Planning Considerations
- Early bootstrap should set `document.documentElement` class before CSS and app render. This likely requires an inline script in `index.html` (or Vite entry prelude) that reads localStorage and toggles `light`/`dark` class.
- Transition suppression on first paint is needed (for example, add a `no-transition` class during bootstrap and remove it after initial render).
- The toggle UI should read/write `useThemeStore` only (single source of truth) and reuse existing `Toggle` component for Settings.
- Top bar icon toggle should be added in `useTopBar` output so it renders across dashboard pages without per-page duplication.
- Because Phase 2 owns semantic tokens, Phase 1 should keep visual deltas minimal and explicit. If a visible change is required, it should be limited to global/background defaults and clearly flagged as temporary.

## Files and Integration Points
- `frontend/src/shared/store/useThemeStore.ts` (source of truth and persistence)
- `frontend/index.html` (bootstrap script for no-flash)
- `frontend/src/main.tsx` (ensure bootstrap happens before render)
- `frontend/src/presentation/components/shared/dashboard/TopBar.tsx` (quick toggle control)
- `frontend/src/presentation/pages/shared/SettingsPage.tsx` (labeled toggle control)
- `frontend/src/presentation/components/ui/Toggle.tsx` (reusable settings control)

## Risks and Mitigations
- Flicker risk: without early bootstrap, a dark-to-light flash is likely on refresh. Mitigate with inline script before CSS.
- Visibility risk: no apparent theme change because of hardcoded dark classes. Mitigate with minimal root-level overrides or a temporary class-based background/text swap.
- Consistency risk: if top bar and settings are wired separately, they can drift. Mitigate with single store usage and shared handler.

## Validation Architecture
Concrete validation notes for Nyquist:

- Automated checks
  - Unit: add tests for `useThemeStore` verifying `toggleTheme` and `setTheme` update localStorage and set `document.documentElement` classes.
  - Unit: add a small bootstrap test (or utility test) that simulates the inline bootstrap logic and asserts class selection when localStorage has `light`, `dark`, or empty.
  - Integration: render a Settings page test that toggles the switch and asserts the store updates and the DOM root class changes.
  - Integration: render top-bar toggle and assert it updates the same store state and class.

- Manual validation
  - Cold refresh on `/login` and `/dashboard` with stored theme set to `light` and `dark` confirms no visible flash and correct initial theme.
  - Toggle from both top bar and Settings confirms immediate visual change and persistence after reload.

- Evidence artifacts
  - Record the localStorage key and root class in a short validation log or test output.
  - Capture a brief checklist in `task.md` confirming success criteria per route.

- Acceptance mapping
  - THM-02: Top bar icon and Settings toggle both flip root theme class and update store.
  - THM-03: localStorage persistence confirmed via reload and new session.
  - THM-04: inline bootstrap ensures correct class before React render, no visible flash.

## Open Planning Questions
- What minimal visual change is acceptable in Phase 1 to make the toggle perceptible without stepping into Phase 2 token work?
- Should a `data-theme` attribute be added alongside classes to simplify CSS selectors later?

---
*Phase: 01-theme-runtime-foundation*
*Research updated: 2026-03-05*
