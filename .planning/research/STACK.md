# ClassiFi Light-Theme System Research (2026)

## Scope and Baseline
This research targets a robust, accessible light-theme system for the existing React + TypeScript + Tailwind v4 frontend, while preserving dark-mode toggle support and existing Clean Architecture boundaries.

Current baseline in this repo:
- Tailwind v4 is already active via Vite plugin (`frontend/vite.config.ts`, `frontend/package.json`).
- Global design tokens already exist in `@theme`, but values are dark-first (`frontend/src/index.css`).
- UI styling is mostly hardcoded dark utilities across layouts/pages/components (examples: `frontend/src/presentation/components/shared/dashboard/DashboardLayout.tsx`, `frontend/src/presentation/components/shared/dashboard/TopBar.tsx`, `frontend/src/presentation/pages/auth/LoginPage.tsx`, `frontend/src/presentation/pages/shared/SettingsPage.tsx`).
- Monaco is explicitly dark (`frontend/src/presentation/pages/shared/AssignmentDetailPage.tsx`, `frontend/src/presentation/components/teacher/forms/assignment/BasicInfoForm.tsx`, `frontend/src/presentation/components/teacher/plagiarism/monacoDarkTheme.ts`).
- Calendar custom CSS is hardcoded dark colors (`frontend/src/presentation/pages/shared/CalendarPage.css`).
- QA stack exists (Vitest + Playwright), but dedicated automated a11y tooling is not yet configured (`frontend/vitest.config.ts`, `frontend/playwright.config.ts`, `frontend/eslint.config.js`).

## Recommended 2026 Stack and Tooling

### 1) Design Tokens and CSS Variables
Recommendation:
- Keep Tailwind v4 `@theme` as the token source in `frontend/src/index.css`.
- Split tokens into 3 layers:
  - Primitive tokens: brand and neutral ramps (`--ref-*`).
  - Semantic tokens: surface/text/border/status/action (`--sys-*`).
  - Optional component alias tokens for complex widgets (`--cmp-*`).
- Bind utilities to semantic tokens, not raw palette values.

Why this fits ClassiFi:
- The codebase currently uses many raw `slate/white` classes; semantic tokens reduce wide refactors and centralize light/dark tuning.

Confidence: High

### 2) Theming Strategy (Light Default + Dark Toggle)
Recommendation:
- Use `data-theme` on `html` as the single runtime switch (`light` default, `dark` override).
- Define both token maps in CSS:
  - `:root, :root[data-theme="light"] { ...light values... }`
  - `:root[data-theme="dark"] { ...dark values... }`
- Keep Tailwind dark variant as selector-based (`@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));`) for incremental migration where needed.
- Set `color-scheme: light dark;` globally and narrow to active theme if browser-control rendering needs consistency.

Why this fits ClassiFi:
- Preserves explicit user toggle requirement from project goals while enabling light as default and minimizing churn.

Confidence: High

### 3) Theme Runtime State and FOUC Prevention
Recommendation:
- Add a small theme state module in shared layer (for example `frontend/src/shared/store/useThemeStore.ts`) and a bootstrap initializer invoked before React render in `frontend/src/main.tsx`.
- Resolution order:
  1. persisted user preference,
  2. system preference,
  3. app default (`light`).
- Apply `document.documentElement.dataset.theme` synchronously before app mount to avoid flash-of-wrong-theme.

Why this fits ClassiFi:
- Existing app already persists sidebar state in localStorage (`DashboardLayout.tsx`), so this approach matches established patterns.

Confidence: High

### 4) Styling Migration Strategy for Existing UI
Recommendation:
- For shared UI primitives first (`frontend/src/presentation/components/ui/Button.tsx`, `Card.tsx`, `Input.tsx`, `Textarea.tsx`, `Select.tsx`, `DropdownMenu.tsx`), replace raw dark classes with semantic token utilities.
- Then migrate shell/layout surfaces (`DashboardLayout.tsx`, `TopBar.tsx`, `Sidebar.tsx`) to tokenized backgrounds/borders/text.
- Then migrate high-density pages (`SettingsPage.tsx`, admin pages, auth pages) and calendar CSS (`CalendarPage.css`) by replacing hardcoded color literals with CSS variables.
- For Monaco editors, define paired themes (light/dark) and map by active theme state.

Why this fits ClassiFi:
- Touches highest-reuse files first, reducing repeated work and risk.

Confidence: High

### 5) QA and Accessibility Tooling
Recommendation:
- Keep current test stack (Vitest + Playwright) and add focused a11y tooling:
  - `@axe-core/playwright` for E2E accessibility checks on critical pages.
  - Playwright `colorScheme` coverage for both light and dark in key smoke flows.
  - Playwright ARIA snapshots (`toMatchAriaSnapshot`) for nav/forms/dialog regressions.
  - `eslint-plugin-jsx-a11y` in frontend lint config for static a11y guardrails.
- Optional but strong addition for component governance:
  - Storybook + `@storybook/addon-a11y` for isolated component checks and visual review.

Why this fits ClassiFi:
- Reuses current CI-friendly tools and closes the largest missing gap: automated accessibility regression detection.

Confidence:
- High for `@axe-core/playwright`, Playwright color-scheme/ARIA coverage, jsx-a11y linting.
- Medium for adding Storybook now (valuable but adds operational overhead).

## Keep / Use / Avoid Decisions

| Decision | Keep | Use | Avoid | Rationale |
|---|---|---|---|---|
| Tailwind integration | `@tailwindcss/vite` + Tailwind v4 | `@theme` + semantic CSS vars | Replacing with CSS-in-JS stack | Existing stack is modern and sufficient; migration risk is lower with current setup. |
| Token model | Existing token file location (`frontend/src/index.css`) | Layered tokens (`--ref`, `--sys`, optional `--cmp`) | Flat mixed-purpose token names | Layered tokens improve maintainability for whole-app theme rollout. |
| Theme switching | Dark mode support requirement | `data-theme` on `html` + persisted preference + system fallback | Per-component theme flags | Single root switch prevents drift and simplifies QA. |
| Component styling | Existing UI component architecture | Token-first classes in shared UI primitives | Raw `bg-slate-*`, `text-white`, hex literals in page files | Hardcoded dark values are the biggest blocker to light-theme consistency. |
| Accessibility QA | Vitest + Playwright base | `@axe-core/playwright`, ARIA snapshots, `eslint-plugin-jsx-a11y` | Manual-only accessibility checks | Automated checks are required for robust WCAG-level consistency at scale. |
| Visual QA | Existing Playwright setup | Screenshot baselines for core pages in both themes | Theme rollout without visual regression tests | Light-theme regressions are mostly visual and easy to miss manually. |
| Monaco theming | Monaco usage already established | Dual Monaco themes selected by app theme | Forcing `vs-dark` everywhere | Editors must align with app theme to avoid contrast/context mismatch. |

## Confidence by Recommendation
- Tailwind v4 + CSS variable semantic tokens: High
- `data-theme` root strategy with light default: High
- Pre-render theme bootstrap in `main.tsx`: High
- Shared UI-first migration sequencing: High
- Playwright + axe + ARIA snapshot accessibility gate: High
- Storybook addon-a11y adoption in this initiative: Medium
- Full token automation pipeline (Style Dictionary) immediately: Medium

## Concrete Project File References (Where Recommendations Apply)
- `frontend/src/index.css`: current token source; convert to layered light/dark semantic token maps.
- `frontend/src/main.tsx`: add synchronous theme bootstrap before render.
- `frontend/src/presentation/components/shared/dashboard/DashboardLayout.tsx`: app shell background currently dark gradient.
- `frontend/src/presentation/components/shared/dashboard/TopBar.tsx`: dark-first shell/header styles.
- `frontend/src/presentation/components/shared/dashboard/Sidebar.tsx`: dark-first nav states and focus ring offsets.
- `frontend/src/presentation/components/ui/Button.tsx`: shared button variants currently dark-biased.
- `frontend/src/presentation/pages/auth/LoginPage.tsx`: auth surface/background currently dark-only.
- `frontend/src/presentation/pages/shared/SettingsPage.tsx`: dense settings UI with hardcoded dark values.
- `frontend/src/presentation/pages/shared/CalendarPage.css`: hardcoded calendar colors; ideal for variable conversion.
- `frontend/src/presentation/pages/shared/AssignmentDetailPage.tsx`: Monaco set to `vs-dark`.
- `frontend/src/presentation/components/teacher/forms/assignment/BasicInfoForm.tsx`: Monaco set to `vs-dark`.
- `frontend/src/presentation/components/teacher/plagiarism/monacoDarkTheme.ts`: dark-only Monaco theme definition.
- `frontend/playwright.config.ts`: add theme matrix and accessibility helper integration.
- `frontend/vitest.config.ts` and `frontend/src/tests/setup.ts`: optional a11y helper wiring for component-level tests.
- `frontend/eslint.config.js`: add jsx-a11y plugin/rules for static accessibility checks.

## Practical Rollout Order (Stack-Oriented)
1. Establish root theme runtime (`data-theme`, bootstrap, preference store).
2. Finalize semantic token contract in `index.css` (light first, dark parity).
3. Migrate shared UI primitives to semantic tokens.
4. Migrate layout shell and top navigation.
5. Migrate page-level hardcoded styles (auth, settings, admin/student/teacher pages).
6. Align Monaco and calendar styles with theme tokens.
7. Enforce QA gates (Playwright + axe + ARIA + visual diffs, jsx-a11y lint).
