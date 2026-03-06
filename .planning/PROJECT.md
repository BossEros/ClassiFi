# ClassiFi UI Modernization: Light Mode Initiative

## What This Is

This initiative introduces a clean, minimal, and accessible light mode across the existing ClassiFi web application. The goal is to improve readability and visual hierarchy while preserving current branding, product structure, and user workflows for students, teachers, and admins. Light mode will become the default theme, with dark mode still available via user toggle.

## Core Value

Users can complete all current ClassiFi workflows in a clear, readable, and visually consistent light interface without losing existing functionality or brand familiarity.

## Requirements

### Validated

- ✓ Role-based authentication and session flows (login, register, reset, guarded routing) — existing
- ✓ Teacher class lifecycle and class management flows — existing
- ✓ Assignment creation, submission, and test-result workflows — existing
- ✓ Plagiarism/similarity analysis and teacher review interfaces — existing
- ✓ Gradebook and grading override workflows — existing
- ✓ Notifications and notification preference management — existing
- ✓ Admin user/class/enrollment management workflows — existing
- ✓ Shared calendar, dashboard, and assignment detail experience — existing

### Active

- [ ] Establish a blue-forward light color system with complementary neutrals suitable for ClassiFi context.
- [ ] Apply light mode styling across the whole app with consistent component/page hierarchy.
- [ ] Ensure WCAG AA-level contrast and readability across core UI states (default, hover, focus, disabled, error, success).
- [ ] Preserve current branding language while modernizing visual clarity and minimalism.
- [ ] Set light mode as default while preserving manual dark mode toggle behavior.

### Out of Scope

- Feature behavior changes in business logic or backend APIs — this initiative is UI/theming focused.
- Full layout/IA redesign of pages and workflows — keep existing structure unless hierarchy clarity requires minor non-structural adjustments.
- Rebranding (logo, naming, or core identity shift) — brand should remain recognizable.

## Context

ClassiFi is an existing multi-role education platform with established frontend/backend architecture and active feature coverage. The frontend uses React 19 + TypeScript + Tailwind with layered structure (Presentation → Business → Data). The current work is a brownfield UI modernization effort targeting visual quality rather than product capability expansion. The requested design direction is minimal, clean, and appropriate for educational/productivity usage, with strong hierarchy and harmonious colors.

## Constraints

- **Branding**: Preserve current brand identity strongly — visual updates must feel like ClassiFi.
- **Theme Strategy**: Light default + dark toggle retained — no light-only migration.
- **Scope**: Whole app in first pass — cover shared components and major pages consistently.
- **Quality**: Meet WCAG AA + visual consistency bar — readability is non-negotiable.
- **Architecture**: Work within existing frontend architecture and route/component structure.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Whole-app first pass | Avoid fragmented theme quality and inconsistent user perception across roles/pages | — Pending |
| Blue-forward accent palette | Trustworthy and readable for education workflows while staying clean/minimal | — Pending |
| Light default with dark toggle retained | Satisfies new visual direction without removing user choice | — Pending |
| Color + hierarchy updates (no full IA redesign) | Delivers meaningful quality gains while controlling risk/scope | — Pending |
| WCAG AA and consistency as done criteria | Ensures accessibility/readability and production-ready polish | — Pending |
| Preserve brand strongly | Maintain familiarity for current users while improving aesthetics | — Pending |

---
*Last updated: 2026-03-04 after initialization*
