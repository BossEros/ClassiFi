# Phase 1: Theme Runtime Foundation - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver runtime behavior for theme switching only: reliable light/dark toggle, persistent preference, and flash-free startup behavior. This phase does not redesign full page visuals or add new product capabilities.

</domain>

<decisions>
## Implementation Decisions

### Toggle availability and placement
- Theme switching will be available in two places: a quick control in the dashboard top bar and a persistent labeled control in Settings.
- The quick toggle is visible across all dashboard pages (student, teacher, and admin), not only on home dashboards.
- The top-bar quick control should be a compact sun/moon icon button.
- Top bar and Settings controls must read/write the same shared theme preference source.
- Theme switching behavior should feel instant with only subtle transition polish.

### Persistence behavior
- Phase 1 persistence scope is device-local only.
- If no saved preference exists, default to light.
- On logout, keep the local theme preference instead of resetting.
- No server-side theme sync in this phase.

### Startup behavior
- Prioritize no visible theme mismatch on startup (no dark/light flash).
- Startup theming behavior should be consistent across auth and dashboard routes.
- If saved preference cannot be read, fallback to light and continue load.
- Do not animate theme application on first load.

### Claude's Discretion
- Exact sun/moon icon treatment and active-state affordance.
- Exact transition timing values as long as switching remains effectively instant.
- Exact top-bar positioning relative to existing notification/profile controls.
- Exact wording for Settings theme label/help text.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/presentation/components/ui/Toggle.tsx`: Existing accessible switch component can be reused for the Settings theme control.
- `frontend/src/presentation/pages/shared/SettingsPage.tsx`: Existing preferences pattern and toggle-heavy section can host labeled theme control.
- `frontend/src/presentation/components/shared/dashboard/TopBar.tsx`: Shared top-bar composition point for dashboard-wide quick toggle.
- `frontend/src/presentation/components/shared/dashboard/DashboardLayout.tsx`: Shared shell used across dashboard pages, good for consistent quick-toggle coverage.

### Established Patterns
- Local persistence pattern already used through `localStorage` (for example `useAuthStore` and `DashboardLayout` sidebar collapse state), matching the Phase 1 device-local decision.
- Frontend styling is currently dark-first with hardcoded class usage in shared primitives (`Button.tsx`, `Card.tsx`) and dark token set in `index.css`.
- Shared UI is centralized in `frontend/src/presentation/components/ui`, which supports phased migration in later roadmap phases.

### Integration Points
- Add runtime theme bootstrap before React render in `frontend/src/main.tsx` (and/or early document bootstrap) to satisfy no-flash startup behavior.
- Expose shared theme state at app shell level (`frontend/src/app/App.tsx` and dashboard shell components) so top bar and Settings control the same source of truth.
- Add quick toggle UI hook into `useTopBar` output so all dashboard routes inherit it without per-page duplication.
- Keep Settings route as persistent user-facing control surface for theme preference management.

</code_context>

<specifics>
## Specific Ideas

- "Quick switch + Settings fallback" is preferred over single-location control.
- Startup should feel stable and non-jarring: no initial animation, no flicker, predictable light fallback.
- This phase should lock runtime behavior first so later visual-token/component phases can build on a stable theme engine.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 01-theme-runtime-foundation*
*Context gathered: 2026-03-04*
