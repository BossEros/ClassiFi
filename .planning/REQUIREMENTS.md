# Requirements: ClassiFi Light Mode Initiative

**Defined:** 2026-03-04
**Core Value:** Users can complete all current ClassiFi workflows in a clear, readable, and visually consistent light interface without losing existing functionality or brand familiarity.

## v1 Requirements

### Theme Foundation

- [ ] **THM-01**: First-time and signed-out users see light mode by default.
- [ ] **THM-02**: Users can switch between light and dark mode at any time via an explicit toggle.
- [ ] **THM-03**: User theme selection persists across reloads and sessions.
- [ ] **THM-04**: App startup avoids theme flash (no visible dark-to-light/unstyled flicker).
- [ ] **THM-05**: UI colors are driven by semantic theme tokens instead of page-level hard-coded color values.

### Visual Hierarchy and Color System

- [ ] **VIS-01**: Light theme uses a blue-forward accent palette with complementary neutral surfaces suitable for educational dashboard usage.
- [ ] **VIS-02**: Major surfaces (page background, panels/cards, nested containers) have clear tonal hierarchy in light mode.
- [ ] **VIS-03**: Primary actions are visually emphasized consistently while non-primary actions remain low-noise.
- [ ] **VIS-04**: Assignment/submission/status signaling remains clear in light mode using color plus text/icon cues (not color-only encoding).

### Accessibility and Readability

- [ ] **A11Y-01**: Primary and secondary text meet WCAG AA contrast thresholds in light mode.
- [ ] **A11Y-02**: Interactive states (hover, focus, active, disabled, error, success) meet WCAG AA contrast and are visually distinct.
- [ ] **A11Y-03**: Keyboard focus indicators remain clearly visible on all relevant light-mode surfaces.
- [ ] **A11Y-04**: Form fields and validation messaging remain readable and clearly associated in light mode.

### Shared Components and Route Coverage

- [ ] **COV-01**: Shared UI primitives (buttons, inputs, selects, cards, tables, tabs, modals, toasts, dropdowns) support light mode consistently.
- [ ] **COV-02**: Student, teacher, and admin route surfaces are migrated to the same light-mode visual system.
- [ ] **COV-03**: Dense data views (gradebook, submissions, admin lists) preserve table readability and row state clarity in light mode.
- [ ] **COV-04**: Notification surfaces (badge, dropdown, list page) preserve unread/read distinction and action clarity in light mode.
- [ ] **COV-05**: Code-oriented surfaces (Monaco/code preview/diff/test result panels) are readable and visually coherent in light mode.

### Quality and Consistency Gates

- [ ] **QLT-01**: Light mode preserves existing workflow behavior (no business logic/API regression).
- [ ] **QLT-02**: Light mode implementation preserves current brand identity and remains consistent with existing ClassiFi style.
- [ ] **QLT-03**: Visual consistency checks are applied across representative pages before completion.
- [ ] **QLT-04**: Dark mode parity is preserved after light mode becomes default.

## v2 Requirements

### Enhancements

- **ENH-01**: User can choose compact vs comfortable density in heavy table views.
- **ENH-02**: Urgency visuals progressively escalate (neutral → warning → error) based on context/time.
- **ENH-03**: Gradebook and plagiarism review pages support improved print-friendly styling.
- **ENH-04**: Theme visual-regression checks are enforced as part of CI policy.
- **ENH-05**: Optional role-aware emphasis tuning for student/teacher/admin specific priorities.

## Out of Scope

Explicitly excluded for this initiative.

| Feature | Reason |
|---------|--------|
| Backend/API behavior changes | This project targets presentation/theme quality, not business logic. |
| Information architecture or navigation redesign | Scope is visual hierarchy/theming within current structure. |
| Brand identity rewrite (logo/name/voice) | Must preserve recognizable existing brand identity. |
| User-defined custom palette builder | High complexity and consistency risk for v1. |
| Full component library replacement | Unnecessary for v1; tokenized migration is lower risk. |

## Traceability

Which phases cover which requirements. To be finalized in roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| THM-01 | TBD | Pending |
| THM-02 | TBD | Pending |
| THM-03 | TBD | Pending |
| THM-04 | TBD | Pending |
| THM-05 | TBD | Pending |
| VIS-01 | TBD | Pending |
| VIS-02 | TBD | Pending |
| VIS-03 | TBD | Pending |
| VIS-04 | TBD | Pending |
| A11Y-01 | TBD | Pending |
| A11Y-02 | TBD | Pending |
| A11Y-03 | TBD | Pending |
| A11Y-04 | TBD | Pending |
| COV-01 | TBD | Pending |
| COV-02 | TBD | Pending |
| COV-03 | TBD | Pending |
| COV-04 | TBD | Pending |
| COV-05 | TBD | Pending |
| QLT-01 | TBD | Pending |
| QLT-02 | TBD | Pending |
| QLT-03 | TBD | Pending |
| QLT-04 | TBD | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 0
- Unmapped: 22 ⚠️

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-04 after initial definition*
