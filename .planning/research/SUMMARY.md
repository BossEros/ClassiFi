# Project Research Summary

**Project:** ClassiFi UI Modernization: Light Mode Initiative
**Domain:** Brownfield frontend theming modernization for a multi-role education web app
**Researched:** 2026-03-04
**Confidence:** HIGH

## Executive Summary

ClassiFi is a dashboard-heavy education product with established student, teacher, and admin workflows. The research converges on a token-first theming approach used by mature teams for brownfield UI modernization: centralize semantic design tokens, keep runtime theme state at the app shell, and migrate shared primitives before role-specific pages. The target is light mode as default while retaining dark mode parity and user preference persistence.

The recommended implementation is to use a single `html[data-theme]` switch, semantic CSS variables in `frontend/src/index.css`, and a pre-React bootstrap to prevent theme flash. Shared UI primitives and layout shells should be migrated first, followed by dense route surfaces (tables, forms, notifications, editor, calendar). Monaco and calendar are explicit third-party theming islands and need dedicated adapters rather than ad hoc page overrides.

Main risks are style-token bypass, accessibility regressions in interactive states, inconsistent role coverage, and late discovery of visual defects. Mitigation is phased rollout with strict exit criteria, WCAG AA state-matrix validation, dual-theme regression gates (Playwright + axe + ARIA + screenshots), and a soft rollback switch for default-theme behavior.

## Key Findings

### Recommended Stack

The stack recommendation is evolutionary, not replacement-based: keep React 19 + TypeScript + Tailwind v4 and re-architect styling around semantic tokens and root-scoped theme switching. This minimizes migration risk while giving full control over light and dark parity.

Critical technical pattern is synchronized theme initialization (before React mount), centralized theme preference/resolution store, and tokenized shared primitives to avoid route-level color drift.

**Core technologies:**
- React 19 + Vite + TypeScript: existing frontend foundation, no framework migration risk.
- Tailwind v4 (`@tailwindcss/vite`) with `@theme` and semantic CSS variables: centralized token governance and low-churn migration.
- `html[data-theme="light|dark"]` + shared theme store (`ThemePreference`/`ResolvedTheme`): deterministic runtime theming with persistence and system fallback.
- Playwright + `@axe-core/playwright` + ARIA snapshots + `eslint-plugin-jsx-a11y`: accessibility and visual regression enforcement.
- Monaco dual themes (`vs` + dark/custom) and tokenized calendar CSS: closes third-party theming gaps.

### Expected Features

Research defines clear table stakes for production readiness and a smaller differentiator set for quality lift.

**Must have (table stakes):**
- Light mode default with persistent toggle and no theme flash (`TS-01`).
- Semantic token system used by components instead of hard-coded colors (`TS-02`).
- WCAG AA contrast across default and interactive states (`TS-03`).
- Consistent dashboard hierarchy, readable dense tables, and clear status signals (`TS-04`, `TS-05`, `TS-06`).
- Form state accessibility, notification legibility, editor/code contrast, and focus visibility (`TS-07` to `TS-11`).
- Cross-role consistency across student/teacher/admin surfaces (`TS-12`).

**Should have (competitive):**
- Priority-driven accent usage and attention-safe urgency patterns (`DF-02`, `DF-04`).
- Glare-reduced background strategy for long dashboard sessions (`DF-05`).
- Theme visual regression contract in CI (`DF-06`).

**Defer (v2+):**
- Per-user custom theme builder.
- Full component library replacement.
- New charting platform adoption.
- Advanced motion system overhaul.
- Mobile layout re-architecture.

### Architecture Approach

Architecture remains Clean-Architecture-compliant: theme logic is a shared UI infrastructure concern, token consumption stays in Presentation, and Business/Data layers remain untouched.

**Major components:**
1. Theme bootstrap + shared store (`useThemeStore`) - resolve preference, apply `data-theme`, persist and sync behavior.
2. Semantic token contract in global CSS - define light/dark token maps and interactive state tokens.
3. Shared UI primitives and layout shell migration - `Button`, `Card`, `Input`, modals, sidebar/topbar, dashboard scaffolds.
4. Route surfaces and third-party adapters - role pages, tables/forms/status UI, Monaco, and calendar token bridging.
5. QA enforcement layer - accessibility checks, dual-theme visual regression, and policy checks against hard-coded dark literals.

### Critical Pitfalls

1. **Token bypass from hard-coded dark classes** - prevent with semantic token contract plus lint/search guardrails for banned literals.
2. **Accessibility failures in hover/focus/error states** - prevent with state-level WCAG matrix and explicit focus/interactive tokens.
3. **Theme flash and preference mismatch** - prevent with pre-mount bootstrap and single-source toggle precedence logic.
4. **Role inconsistency across student/teacher/admin pages** - prevent with shared-first migration and route-role coverage matrix.
5. **Third-party components ignoring app theme** - prevent with dedicated Monaco/calendar adapters and targeted integration snapshots.

## Implications for Roadmap

Based on combined research, use this phase structure:

### Phase 1: Theme Foundation and Bootstrap
**Rationale:** Dependency root for all later work; avoids flash and state drift early.
**Delivers:** `data-theme` runtime, preference persistence (`light|dark|system`), anti-flash bootstrap, rollback switch.
**Addresses:** `TS-01`, `TS-08` baseline behavior.
**Avoids:** Pitfall 3 (initialization bugs), Pitfall 1 (ad hoc per-page theming).

### Phase 2: Semantic Token Contract and Shared Primitive Refactor
**Rationale:** Shared primitives multiply impact and reduce downstream rework.
**Delivers:** Complete light/dark semantic token maps, shared component migration, interactive-state tokens.
**Addresses:** `TS-02`, `TS-04`, `TS-07`, `TS-11`, `TS-12`.
**Uses:** Tailwind v4 token system and shared component architecture.
**Avoids:** Pitfall 1 (token bypass), Pitfall 2 (state contrast failures), Pitfall 7 (overlay illegibility).

### Phase 3: Role Surface Rollout and Third-Party Integration
**Rationale:** Highest user impact after primitives stabilize; handles known hard zones.
**Delivers:** Student/teacher/admin page sweep, dense tables/status harmonization, Monaco + calendar light-theme integration.
**Addresses:** `TS-05`, `TS-06`, `TS-09`, `TS-10`, `TS-12`, plus `DF-05`.
**Implements:** Route-surface migration and vendor-theme adapter pattern.
**Avoids:** Pitfall 4 (cross-role drift), Pitfall 5 (third-party islands), Pitfall 10 (legacy file regression spikes).

### Phase 4: Accessibility and Visual Hardening, Then Default Flip
**Rationale:** Flip to light-default only after parity evidence.
**Delivers:** WCAG AA verification matrix, dual-theme Playwright/axe/ARIA/screenshot gates, final default switch to light.
**Addresses:** `TS-03`, `DF-06`, with quality uplift from `DF-02` and `DF-04`.
**Avoids:** Pitfall 8 (verification blind spots), Pitfall 9 (brand drift), Pitfall 6 (status meaning drift).

### Phase Ordering Rationale

- Ordering follows hard dependencies: bootstrap first, then token contract, then shared primitives, then page-level rollout, then release hardening and default flip.
- Grouping aligns to architecture boundaries: shared infra and primitives before route-specific presentation.
- This sequencing minimizes rollback blast radius and catches accessibility/visual issues before changing end-user default behavior.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3:** Monaco syntax-color token mapping and React Big Calendar theming details need focused implementation research.
- **Phase 4:** Visual regression strategy (browser matrix, baseline governance, flaky-test controls) needs tactical planning.
- **Optional differentiator follow-up:** Density modes (`DF-03`) and print-friendly surfaces (`DF-07`) need separate scope validation.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Theme bootstrap, persistence, and `data-theme` root switching are established patterns.
- **Phase 2:** Semantic token layering and shared primitive refactor are well-understood brownfield theming practices.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Codebase-grounded recommendations with explicit file-level applicability and conservative stack evolution. |
| Features | HIGH | Requirement-ready feature catalog with complexity/dependency mapping and clear anti-features. |
| Architecture | HIGH | Phased migration pattern is coherent with existing Clean Architecture boundaries and known hotspots. |
| Pitfalls | HIGH | Risks are concrete, observed in current code patterns, and paired with prevention controls. |

**Overall confidence:** HIGH

### Gaps to Address

- Final blue-forward palette values and state-level contrast thresholds need explicit design-token sign-off before full rollout.
- Exact CI policy for theme regression gates (required pages, tolerated diff thresholds, browser set) needs team agreement.
- Scope decision needed for `DF-03` density modes and `DF-07` print-friendly support to avoid unplanned expansion.
- Legacy large-page extraction opportunities should be decided per route to reduce conflict/regression during migration.

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` - stack, token strategy, runtime theme model, tooling recommendations.
- `.planning/research/FEATURES.md` - table stakes, differentiators, anti-features, and delivery order.
- `.planning/research/ARCHITECTURE.md` - architecture boundaries, theme data flow, phased migration plan, rollback controls.
- `.planning/research/PITFALLS.md` - top risk catalog with prevention strategies and phase alignment.
- `.planning/PROJECT.md` - initiative scope, constraints, and success criteria.

### Secondary (MEDIUM confidence)
- Existing repository implementation references cited in research docs (current dark-first class usage, Monaco/calendar hotspots).

### Tertiary (LOW confidence)
- None identified in current research set.

---
*Research completed: 2026-03-04*
*Ready for roadmap: yes*
