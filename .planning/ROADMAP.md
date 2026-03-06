# Roadmap: ClassiFi Light Mode Initiative

## Overview

This roadmap delivers a full light-mode modernization for ClassiFi without changing existing business workflows. It sequences work from theme runtime behavior, to semantic visual system, to accessible shared components, to full route coverage, and ends with quality hardening plus default-light release readiness.

**Coverage validation:** 22/22 v1 requirements mapped to exactly one phase.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Theme Runtime Foundation** - Enable stable theme switching, persistence, and flash-free startup behavior.
- [ ] **Phase 2: Visual Token System** - Define and apply the blue-forward semantic light visual language.
- [ ] **Phase 3: Accessible Shared Components** - Make shared primitives consistently accessible and readable in light mode.
- [ ] **Phase 4: Cross-Role Surface Migration** - Roll the light system across student, teacher, and admin route surfaces.
- [ ] **Phase 5: Release Hardening and Default Flip** - Validate parity and quality gates, then ship light as default.

## Phase Details

### Phase 1: Theme Runtime Foundation
**Goal**: Users can switch themes reliably with persistent preference and no startup flicker.
**Depends on**: Nothing (first phase)
**Requirements**: THM-02, THM-03, THM-04
**Success Criteria** (what must be TRUE):
1. User can toggle between light and dark mode from the app and see the theme change immediately.
2. User theme choice persists after reload and after a new browser session.
3. User does not see dark-to-light or unstyled theme flash during app startup.
**Plans**: TBD

### Phase 2: Visual Token System
**Goal**: The app presents a coherent, brand-aligned light visual language driven by semantic tokens.
**Depends on**: Phase 1
**Requirements**: THM-05, VIS-01, VIS-02, VIS-03, QLT-02
**Success Criteria** (what must be TRUE):
1. Users see a blue-forward light palette with complementary neutral surfaces across the core app shell.
2. Users can clearly distinguish page background, cards/panels, and nested containers by tone.
3. Users consistently recognize primary actions as visually stronger than secondary actions.
4. Users experience consistent color behavior for repeated UI patterns across pages and roles.
5. Existing ClassiFi brand identity remains recognizable after visual modernization.
**Plans**: TBD

### Phase 3: Accessible Shared Components
**Goal**: Shared UI primitives are consistently readable, stateful, and keyboard-accessible in light mode.
**Depends on**: Phase 2
**Requirements**: A11Y-01, A11Y-02, A11Y-03, A11Y-04, COV-01
**Success Criteria** (what must be TRUE):
1. Users can read primary and secondary text on shared components without contrast-related strain.
2. Users can distinguish hover, focus, active, disabled, error, and success states on interactive elements.
3. Keyboard users can always find the visible focus position on navigable controls.
4. Users can read form fields and validation messages, and understand which message belongs to which field.
5. Shared primitives (buttons, inputs, selects, cards, tables, tabs, modals, toasts, dropdowns) appear visually consistent in light mode.
**Plans**: TBD

### Phase 4: Cross-Role Surface Migration
**Goal**: Student, teacher, and admin workflows render with the same light visual system, including dense and specialized surfaces.
**Depends on**: Phase 3
**Requirements**: VIS-04, COV-02, COV-03, COV-04, COV-05
**Success Criteria** (what must be TRUE):
1. Users in student, teacher, and admin routes see a consistent light-mode hierarchy and component language.
2. Users can read dense tables (gradebook, submissions, admin lists) and clearly understand row states.
3. Users can distinguish read/unread notifications and available actions in badge, dropdown, and notification list views.
4. Users can read code-oriented surfaces (Monaco, code preview/diff, test result panels) without visual mismatch or low contrast.
5. Users can interpret assignment, submission, and status signals through text/icon cues in addition to color.
**Plans**: TBD

### Phase 5: Release Hardening and Default Flip
**Goal**: Light mode becomes the default with verified workflow safety, visual consistency, and dark-mode parity.
**Depends on**: Phase 4
**Requirements**: THM-01, QLT-01, QLT-03, QLT-04
**Success Criteria** (what must be TRUE):
1. First-time and signed-out users land in light mode by default.
2. Users can complete existing role-based workflows in light mode without behavior regressions.
3. Reviewers can run representative visual consistency checks and confirm no release-blocking inconsistencies.
4. Users can still switch to dark mode and complete the same workflows with parity after the default changes to light.
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Theme Runtime Foundation | 0/TBD | Not started | - |
| 2. Visual Token System | 0/TBD | Not started | - |
| 3. Accessible Shared Components | 0/TBD | Not started | - |
| 4. Cross-Role Surface Migration | 0/TBD | Not started | - |
| 5. Release Hardening and Default Flip | 0/TBD | Not started | - |
