# ClassiFi Light-Default Theme Architecture Research

## Objective
Define a low-risk architecture to make light mode the default while preserving a user dark-mode toggle in the existing React 19 + Tailwind v4 frontend without violating current Clean Architecture boundaries.

## Current-State Findings (From Codebase)
- Theme is currently dark-first and mostly hard-coded in Presentation layer classes (`text-white`, `bg-slate-900`, `border-white/10`, etc.) across pages/components.
- Tailwind v4 tokens exist in `frontend/src/index.css` via `@theme`, but values are currently dark-oriented and not split by theme scope.
- No global theme state/store exists today (only `useAuthStore` and `useToastStore` in `frontend/src/shared/store`).
- No startup theme bootstrap is present in `frontend/index.html` or `frontend/src/main.tsx`, so no anti-flash mechanism currently exists.
- Some high-risk surfaces are hard-coded to dark rendering:
  - Monaco editors use `theme="vs-dark"` or custom dark theme definitions.
  - React Big Calendar CSS (`CalendarPage.css`) is dark-specific with literal color values.

## 1) Theme Token Boundaries

### 1.1 Boundary Rule
Keep theme definition in the styling boundary (`frontend/src/index.css` + optional dedicated theme CSS files) and keep token consumption in Presentation components only. Do not push theme decisions into Business or Data layers.

### 1.2 Token Layers (Recommended)
- `Reference tokens` (raw palette): brand hues and neutral scales (`--ref-blue-600`, `--ref-slate-900`, etc.).
- `Semantic tokens` (UI meaning): `--color-surface-page`, `--color-surface-card`, `--color-text-primary`, `--color-border-default`, `--color-accent-primary`, status tokens.
- `Component alias tokens` (optional): only for complex third-party zones (editor/calendar) to reduce direct literals.

This separation avoids per-page color drift and supports both themes with one semantic contract.

### 1.3 Theme Scoping Strategy
Use a single root attribute on `html`:
- `html[data-theme="light"]` for light tokens.
- `html[data-theme="dark"]` for dark tokens.

All semantic tokens should resolve inside these scopes. Components should not directly branch on theme in JSX unless unavoidable for third-party libraries (Monaco theme name selection).

### 1.4 Allowed vs Disallowed
- Allowed:
  - `text-[var(--color-text-primary)]`, `bg-[var(--color-surface-card)]`, utility classes mapped to semantic variables, shared class utilities.
  - centralized CSS for vendor components (calendar/editor containers).
- Disallowed:
  - new hard-coded per-route color literals.
  - direct `white/slate` literals in new component work unless tokenized alias exists.

## 2) Theme Data Flow And State Ownership

### 2.1 Ownership
- Primary owner: frontend shared UI infrastructure (`frontend/src/shared/store` + app bootstrap), not business services.
- State type:
  - `ThemePreference = "light" | "dark" | "system"` (preferred for forward compatibility).
  - `ResolvedTheme = "light" | "dark"` (actual applied mode).

### 2.2 Store Placement
Create `frontend/src/shared/store/useThemeStore.ts` (Zustand) as a cross-cutting UI concern, consistent with existing store patterns.

Responsibilities:
- Hold `preference` and `resolvedTheme`.
- Expose `setPreference`.
- Persist preference to `localStorage` (e.g., `classifi-theme`).
- React to OS changes only when preference is `system`.

### 2.3 Bootstrap Flow (Anti-Flash)
Implement pre-React initialization to avoid theme flash:
1. In `index.html`, inline minimal script before app mount:
   - read `classifi-theme` from `localStorage`;
   - resolve with `matchMedia('(prefers-color-scheme: dark)')` if needed;
   - set `document.documentElement.dataset.theme`.
2. In `main.tsx`, hydrate `useThemeStore` and attach listeners.
3. In UI toggle surface (TopBar/Settings), update store preference only.

This keeps initial paint aligned with final React state.

### 2.4 UI Integration Points
- Toggle entry points:
  - Settings page (existing natural location with toggles).
  - Optional quick toggle in top bar later (not required for first safe release).
- Rendering:
  - Components consume semantic tokens via classes/CSS.
  - Monaco and similar components read `resolvedTheme` to choose `"vs"` or `"vs-dark"`/custom mapped theme.

### 2.5 Architecture Compliance
- Presentation layer: reads theme state and renders styles.
- Shared layer: owns theme store and bootstrapping helpers.
- Business/Data layers: unchanged (no theme coupling).

## 3) Migration / Build Order By Phase

### Phase 0: Safety Foundations
- Add `data-theme` bootstrap script in `index.html`.
- Introduce `useThemeStore` and a small `ThemeInitializer` mounted once from `App` or `main.tsx`.
- Keep dark visual output initially to prove no regressions before color migration.

Exit criteria:
- Dark mode unchanged by default behavior (temporarily), no flash on load, toggle state persists.

### Phase 1: Token Contract Expansion
- Refactor `frontend/src/index.css` into semantic light/dark token scopes.
- Define minimum semantic set used across app:
  - page/surface/background tiers
  - text hierarchy
  - border/divider
  - accent/action
  - feedback states
  - focus ring

Exit criteria:
- Both `data-theme` values produce complete token maps with no undefined fallbacks.

### Phase 2: Shared Primitive Refactor
- Migrate shared UI primitives first:
  - `Button`, `Card`, `Input`, `Select`, `Textarea`, `Toggle`, modal shells, dropdown shells.
- Replace hard-coded dark literals with semantic token usage.

Exit criteria:
- Shared primitives render correctly in both themes and remain API-compatible.

### Phase 3: Layout Shell + High-Traffic Routes
- Migrate dashboard shell/top bar/sidebar/auth shell backgrounds and text.
- Then high-traffic pages (dashboard, classes, assignment list/detail, settings, notifications).

Exit criteria:
- Core daily workflows are readable in light theme and parity-tested in dark.

### Phase 4: Complex Surfaces
- Calendar:
  - convert `CalendarPage.css` to semantic token usage under `[data-theme]` scopes.
- Monaco:
  - introduce light Monaco theme mapping and runtime selection by `resolvedTheme`.
  - keep current dark theme definitions; add light equivalent.

Exit criteria:
- Calendar and code/editor screens pass readability checks in both themes.

### Phase 5: Default Flip
- Change first-time default to light (`ThemePreference` default behavior).
- Preserve explicit user dark preference from storage.

Exit criteria:
- New/cleared-storage users start in light mode.
- Returning users keep chosen theme.

### Phase 6: Hardening
- Remove newly redundant literals and dead classes.
- Add regression guards (lint/query checks + UI tests/snapshots) for token-only styling policy.

Exit criteria:
- No critical route has hard-coded dark-only styling in maintained surfaces.

## 4) Risk Controls And Rollback Strategy

### 4.1 Primary Risks
- Wide regression surface due to high count of hard-coded dark classes.
- Theme flash if bootstrap and store hydration are inconsistent.
- Accessibility regressions (contrast/focus) in light mode.
- Third-party surface mismatch (Monaco/Calendar) causing unreadable text.
- Dark parity regressions while flipping default.

### 4.2 Controls
- Incremental phases with clear exit criteria (do not combine token redesign + default flip in one step).
- Keep dark token map intact during migration; only flip default after parity checks.
- Add a temporary runtime feature flag (e.g., `VITE_LIGHT_DEFAULT_ENABLED`) to control default selection without code rollback.
- Create test matrix for both themes on core routes:
  - Auth, Dashboard, Classes, Assignment Detail, Settings, Notifications, Admin lists, Gradebook, Similarity screens.
- Enforce contrast/focus checks on key components and forms.
- For Monaco/calendar, validate separately with dedicated visual checks.

### 4.3 Rollback Levels
- Level 1 (soft rollback): disable light-default flag; app reverts to dark default while keeping new token architecture.
- Level 2 (partial rollback): keep theme store/bootstrap, revert only affected route/component token mappings that regress.
- Level 3 (hard rollback): restore previous CSS/theme commit if severe production regression (rare if phased correctly).

### 4.4 Operational Rollback Checklist
1. Flip default flag off (dark default restored).
2. Verify login/dashboard render and no JS/theme bootstrap errors.
3. Verify persisted dark users unaffected.
4. Re-run frontend build and critical tests.
5. Patch forward route-by-route instead of full revert when possible.

## Recommended Architectural Decision
Adopt a token-first, root-attribute scoped theming architecture with shared-state ownership (`useThemeStore`) and startup bootstrap in `index.html`. Migrate in phases from shared primitives to route surfaces, then flip default to light only after dark parity and accessibility checks pass. This is the safest path that preserves existing architecture boundaries and allows fast rollback.
