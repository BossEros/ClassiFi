# ClassiFi Light Mode Feature Research (Dashboard-Heavy UX)

## Objective
Define expected product features and behaviors for a high-quality light mode in ClassiFi's dashboard-heavy experience. This document converts UX expectations into requirement-ready statements for implementation planning.

## Scope Inputs
- `.planning/PROJECT.md`: light mode initiative goals and constraints.
- `.planning/codebase/STRUCTURE.md`: repository/module topology.
- `frontend/documentation.md`: frontend architecture, routes, shared components, and workflows.

## Complexity Scale
- `S`: localized UI updates, no new patterns.
- `M`: cross-component refactor or shared token adoption.
- `L`: app-wide pattern changes, broad regression risk, and test expansion.

## Dependency Legend
- `Token System`: centralized theme tokens (colors, borders, spacing, elevation).
- `Shared UI`: `frontend/src/presentation/components/ui` and shared dashboard components.
- `Route Surfaces`: role dashboards/pages under `frontend/src/presentation/pages/**` and route groups.
- `Form Stack`: RHF + Zod forms and error states in presentation components/schemas.
- `A11y QA`: contrast checks, keyboard focus checks, and screen-reader semantics.
- `Visual QA`: screenshot/baseline checks for major workflows.

## 1) Table Stakes (Must-Have)
These are non-negotiable for production quality.

| ID | Feature | Requirement-ready behavior | Complexity | Dependencies |
| --- | --- | --- | --- | --- |
| TS-01 | Light Default + Toggle Persistence | The system shall load light mode as default for first-time and signed-out users. The system shall preserve user-selected theme across reloads and sessions without visual flash. Dark mode toggle shall remain available in settings/navigation. | M | Token System, Shared UI, Route Surfaces |
| TS-02 | Semantic Color Token System | The system shall define semantic tokens for `surface`, `text`, `border`, `accent`, `success`, `warning`, `error`, and `info` states. Components shall consume semantic tokens instead of hard-coded color utilities. | L | Token System, Shared UI |
| TS-03 | WCAG AA Contrast Compliance | All primary text, secondary text, iconography, controls, and data-state badges in light mode shall meet WCAG AA contrast targets for normal and interactive states (default, hover, active, disabled, focus). | L | Token System, Shared UI, A11y QA |
| TS-04 | Dashboard Surface Hierarchy | The system shall provide clear visual hierarchy for dashboard-heavy layouts using tiered surfaces (page background, panel/card, nested panel) and consistent border/elevation treatment. | M | Token System, Shared UI, Route Surfaces |
| TS-05 | Data Table Readability | The system shall ensure table headers, row separators, pagination controls, and status chips remain readable in dense views (gradebook, submissions, admin lists). Selected/hover/focus rows shall be visually distinct without reducing contrast. | M | Shared UI, Route Surfaces, A11y QA |
| TS-06 | Status Signal Clarity | The system shall preserve state clarity for assignment/submission statuses by combining color with text labels and icon cues (not color-only encoding). | M | Shared UI, Route Surfaces, A11y QA |
| TS-07 | Form and Validation States | All form controls shall present accessible light-mode states for idle, hover, focus, error, success, and disabled. Error messaging shall remain readable and visually associated with the correct fields. | M | Form Stack, Shared UI, A11y QA |
| TS-08 | Notification Legibility | Notification badge, dropdown, and full notification list shall use light-mode tokens with preserved unread/read distinction, timestamp readability, and action clarity. | M | Shared UI, Route Surfaces, Token System |
| TS-09 | Editor and Code Block Contrast | Monaco editor containers, output/test result cards, and code comparison surfaces shall be themed for light mode with readable syntax contrast and clear panel boundaries. | M | Route Surfaces, Shared UI, Token System |
| TS-10 | Empty/Loading/Error State Consistency | Every major dashboard surface shall include consistent light-mode placeholders and state messaging that preserve layout rhythm and avoid abrupt visual jumps. | S | Shared UI, Route Surfaces |
| TS-11 | Focus Visibility and Keyboard Navigation | Interactive elements shall expose visible focus rings in light mode on all key flows (dashboard navigation, tables, tabs, dropdowns, forms). Focus indicators shall remain distinct on both white and tinted surfaces. | M | Shared UI, A11y QA |
| TS-12 | Cross-Role Consistency | Student, teacher, and admin routes shall share one light-mode visual system so equivalent components (cards, tabs, modals, tables) behave consistently across roles. | M | Shared UI, Route Surfaces, Visual QA |

## 2) Differentiators (High-Value Quality Signals)
These increase product quality beyond baseline accessibility/compliance.

| ID | Feature | Requirement-ready behavior | Complexity | Dependencies |
| --- | --- | --- | --- | --- |
| DF-01 | Role-Aware Emphasis Model | The system should prioritize visual emphasis by role context: deadlines and pending work for students, review/triage actions for teachers, and operational controls for admins while retaining a shared design language. | M | Route Surfaces, Shared UI |
| DF-02 | Priority-Driven Accent Usage | The system should reserve strongest accent intensity for primary actions and urgent academic states, reducing visual noise in high-density dashboards. | M | Token System, Shared UI |
| DF-03 | Density Modes for Heavy Tables | The system should provide a compact and comfortable density option for high-row tables (submissions, gradebook, user lists) while preserving tap/click targets and contrast. | L | Shared UI, Route Surfaces, Visual QA |
| DF-04 | Attention-Safe Urgency Pattern | The system should implement urgency patterns that escalate from neutral to warning to error progressively (timeline-aware), avoiding constant high-alert red surfaces. | M | Token System, Route Surfaces |
| DF-05 | Glare-Reduced Background Strategy | The system should use soft neutral page backgrounds and subtle sectional tinting to reduce eye strain compared with full pure-white canvases in long dashboard sessions. | S | Token System, Shared UI |
| DF-06 | Visual Regression Contract for Themes | The frontend should enforce theme-quality regression checks on representative pages/components to prevent accidental reintroduction of dark-only or low-contrast styles. | L | Visual QA, Route Surfaces, Shared UI |
| DF-07 | Print-Friendly Light Surfaces for Academic Records | Gradebook and plagiarism review screens should degrade cleanly to print/export-friendly light styling (minimal ink-heavy fills, legible tables, clear headings). | M | Route Surfaces, Shared UI |

## 3) Anti-Features (Must Avoid)
These behaviors degrade quality and should be explicitly rejected.

| ID | Anti-feature | Requirement-ready rejection criteria | Risk if accepted | Complexity to avoid |
| --- | --- | --- | --- | --- |
| AF-01 | Low-contrast gray-on-white text | The product must not ship light-mode text or icon combinations that fail WCAG AA on core routes/components. | Accessibility failure, poor readability | M |
| AF-02 | Pure-white everywhere | The product must not use unlayered `#FFFFFF` backgrounds for every surface in dense dashboards; hierarchy requires tonal separation. | Glare, weak information hierarchy | S |
| AF-03 | Color-only status encoding | The product must not communicate assignment/submission status using color alone without text/icon redundancy. | Misinterpretation, accessibility issues | S |
| AF-04 | Accent over-saturation | The product must not apply high-saturation blue accents to most controls/cards simultaneously; accent is reserved for priority actions/states. | Visual noise, reduced task focus | S |
| AF-05 | Per-page ad hoc theme overrides | The product must not introduce route-specific hard-coded colors that bypass shared semantic tokens. | Inconsistency, maintenance cost | M |
| AF-06 | Invisible focus indicators | The product must not remove or visually hide keyboard focus states in light mode. | Keyboard/a11y regression | S |
| AF-07 | Heavy decorative motion in work surfaces | The product must not add distracting animation patterns to table-heavy review/grading views. | Slower task completion, cognitive load | S |
| AF-08 | Theme flash on load | The product must not display dark-to-light or unstyled flashes during app initialization and route changes. | Perceived instability, poor polish | M |
| AF-09 | Dark-mode parity breakage | The product must not break existing dark mode behavior while making light mode default. | User trust loss, support burden | M |
| AF-10 | Layout/IA rewrite disguised as theming | The product must not perform broad navigation or workflow structure redesign under the light-mode initiative. | Scope creep, delivery risk | L |

## 4) Deferred / Out-of-Scope for This Initiative
Items below should be deferred unless separately approved.

| Item | Decision | Reason |
| --- | --- | --- |
| Backend/API contract changes | Out of scope | Initiative is visual/theming quality, not business logic changes. |
| Full information architecture redesign | Out of scope | Conflicts with `PROJECT.md` constraint to preserve workflows. |
| Brand identity rewrite (logo, naming, core voice) | Out of scope | Must preserve recognizable ClassiFi branding. |
| Per-user custom theme builder (custom palettes) | Deferred | High complexity with limited first-pass value; risks inconsistency. |
| New charting/data-viz platform adoption | Deferred | Not required for initial light-mode quality baseline. |
| Full component library replacement | Deferred | High migration cost; prefer tokenized refactor of current components. |
| Advanced motion system overhaul | Deferred | Lower ROI versus readability/accessibility hard requirements. |
| Mobile-first layout re-architecture | Deferred | Current initiative focuses on visual theming consistency, not structural redesign. |

## 5) Requirement Packaging Recommendations
To make implementation planning executable, each selected feature should be converted into tickets with:
- Explicit acceptance criteria (`Given/When/Then` or measurable checks).
- Targeted component/page list (shared first, then role-specific pages).
- A11y verification checklist (contrast, focus, keyboard, state visibility).
- Regression checklist for dark mode parity and no-theme-flash startup behavior.

## 6) Suggested First-Pass Delivery Order
1. Establish semantic tokens and light-default boot behavior (`TS-01`, `TS-02`, `TS-08`).
2. Refactor shared primitives and dashboard shells (`TS-04`, `TS-05`, `TS-07`, `TS-11`).
3. Sweep high-traffic role routes and feature-heavy pages (`TS-06`, `TS-09`, `TS-12`).
4. Add quality differentiators with high ROI (`DF-02`, `DF-04`, `DF-05`).
5. Gate with visual/a11y regression checks (`TS-03`, `DF-06`) before declaring completion.
