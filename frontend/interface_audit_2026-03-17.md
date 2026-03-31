# ClassiFi Frontend Interface Audit

Date: 2026-03-17

Scope: Shared UI primitives, dashboard shell, authentication flows, settings/modals, notifications, teacher submissions/similarity pages, and representative student surfaces.

Verification note: `npm run build` was attempted in `frontend/`, but the run was blocked by the sandbox at Vite/esbuild startup with `spawn EPERM`. No app-level TypeScript or UI build errors were surfaced before the environment failure.

## Anti-Patterns Verdict

Verdict: Fail

Several surfaces read as AI-generated or at least AI-influenced because they combine multiple high-signal tells from the frontend-design guidance:

- Gradient wordmark text in auth ([src/presentation/pages/auth/LoginPage.tsx](src/presentation/pages/auth/LoginPage.tsx))
- Global glassmorphism and glow utilities that do not match the shipped light dashboard ([src/index.css](src/index.css))
- Dark translucent default UI primitives overridden piecemeal on light pages ([src/presentation/components/ui/Card.tsx](src/presentation/components/ui/Card.tsx), [src/presentation/components/ui/Input.tsx](src/presentation/components/ui/Input.tsx), [src/presentation/components/ui/Button.tsx](src/presentation/components/ui/Button.tsx))
- Safe summary-card grids across dashboard pages ([src/presentation/components/ui/SummaryStatCard.tsx](src/presentation/components/ui/SummaryStatCard.tsx), [src/presentation/pages/teacher/TeacherDashboardPage.tsx](src/presentation/pages/teacher/TeacherDashboardPage.tsx))
- Developer-cliche code wallpaper and glow-heavy dark class cards ([src/presentation/components/shared/dashboard/ClassCard.tsx](src/presentation/components/shared/dashboard/ClassCard.tsx))
- One-off purple glass confirmation page that clashes with the rest of the product ([src/presentation/pages/auth/EmailConfirmationPage.tsx](src/presentation/pages/auth/EmailConfirmationPage.tsx))

## Executive Summary

- Total issues found: 16
- Critical: 3
- High: 5
- Medium: 5
- Low: 3
- Overall quality score: 58/100

Most critical issues:

1. Keyboard users cannot reliably operate core auth and form controls because important actions are removed from tab order or wrapped in click-only triggers.
2. Several major interactive surfaces use clickable `div` containers or interactive `Card` wrappers instead of semantic buttons/links, blocking keyboard access to core content.
3. Shared popover-based date/time controls rely on a click-only trigger wrapper, creating accessibility risk in scheduling and assignment flows.
4. Multiple dialogs behave like visual overlays instead of accessible modals because they do not trap focus or restore it consistently.
5. The theme system is fragmented, with dark glassmorphism primitives fighting a mostly light dashboard UI.

Recommended next steps:

1. Use `/harden` for keyboard access, semantic controls, dialog behavior, labels, and dead/placeholder links.
2. Use `/normalize` to align shared primitives and page themes to one token system.
3. Use `/arrange` and `/distill` to reduce dashboard/card monotony and fix responsive layout pressure points.
4. Use `/optimize` to remove `transition-all` overuse and reduce repaint-heavy patterns.

## Detailed Findings By Severity

### Critical Issues

#### 1. Auth helper actions are removed from keyboard navigation

- Location: `frontend/src/presentation/pages/auth/LoginPage.tsx:121`, `frontend/src/presentation/pages/auth/LoginPage.tsx:149`, `frontend/src/presentation/pages/shared/SettingsPage.tsx:1007`
- Severity: Critical
- Category: Accessibility
- Description: The `Forgot password?` button and the password visibility toggle on login use `tabIndex={-1}`, and the delete-account password visibility toggle in settings does the same. These actions are visually present but skipped by sequential keyboard navigation.
- Impact: Keyboard-only users cannot reach important account-recovery and password-visibility helpers, which blocks core login and security workflows.
- WCAG/Standard: WCAG 2.1.1 Keyboard, WCAG 2.4.3 Focus Order
- Recommendation: Keep helper actions in the normal tab order and ensure icon-only toggles expose accessible names.
- Suggested command: `/harden`

#### 2. Shared date/time pickers rely on a click-only popover trigger

- Location: `frontend/src/presentation/components/ui/Popover.tsx:60`, `frontend/src/presentation/components/ui/DatePicker.tsx:170`, `frontend/src/presentation/components/ui/TimePicker.tsx:162`
- Severity: Critical
- Category: Accessibility
- Description: `Popover` toggles open state through a clickable wrapper `div`, and both `DatePicker` and `TimePicker` feed their trigger through that wrapper. The wrapper is not focusable, not semantic, and not announced as a control.
- Impact: Keyboard and assistive-technology users may not be able to discover or activate date/time pickers reliably, which affects class scheduling and deadline entry.
- WCAG/Standard: WCAG 2.1.1 Keyboard, WCAG 4.1.2 Name, Role, Value
- Recommendation: Make the popover trigger a real button or fully semantic control that owns the expanded state.
- Suggested command: `/harden`

#### 3. Major clickable surfaces are implemented as non-semantic containers

- Location: `frontend/src/presentation/components/ui/Card.tsx:13`, `frontend/src/presentation/pages/shared/NotificationsPage.tsx:77`, `frontend/src/presentation/pages/student/StudentGradesPage.tsx:240`
- Severity: Critical
- Category: Accessibility
- Description: Shared `Card` can become “interactive” via click styling while still rendering a `div`, and important surfaces such as notification cards and class-grade cards use click-only containers instead of links or buttons.
- Impact: Keyboard users cannot activate these surfaces consistently, and screen readers do not get reliable control semantics for major navigation targets.
- WCAG/Standard: WCAG 2.1.1 Keyboard, WCAG 4.1.2 Name, Role, Value
- Recommendation: Render interactive cards as semantic buttons or links with visible focus states and keyboard activation.
- Suggested command: `/harden`

### High-Severity Issues

#### 4. Several dialogs do not trap focus or restore focus on close

- Location: `frontend/src/presentation/pages/shared/SettingsPage.tsx:209`, `frontend/src/presentation/pages/shared/SettingsPage.tsx:506`, `frontend/src/presentation/pages/teacher/AssignmentSubmissionsPage.tsx:98`
- Severity: High
- Category: Accessibility
- Description: Many dialogs set `role="dialog"` and lock body scroll, but unlike `DeleteModuleModal` and `GradeOverrideModal`, they do not trap focus, set initial focus, or restore focus on close.
- Impact: Keyboard focus can move behind the modal, increasing confusion and making destructive or account-management flows harder to use safely.
- WCAG/Standard: WCAG 2.4.3 Focus Order, WCAG 2.1.2 No Keyboard Trap, WAI-ARIA Dialog Pattern
- Recommendation: Standardize dialogs on one accessible modal pattern with focus trap, initial focus, and focus restoration.
- Suggested command: `/harden`

#### 5. Settings avatar controls are click-only `div` elements

- Location: `frontend/src/presentation/pages/shared/SettingsPage.tsx:300`, `frontend/src/presentation/pages/shared/SettingsPage.tsx:1230`
- Severity: High
- Category: Accessibility
- Description: The avatar drop zone and the profile-photo trigger are implemented as clickable `div` containers without button semantics or keyboard handlers.
- Impact: Uploading or changing a profile picture is much harder or impossible for keyboard and screen-reader users.
- WCAG/Standard: WCAG 2.1.1 Keyboard, WCAG 4.1.2 Name, Role, Value
- Recommendation: Convert these surfaces to semantic buttons or labeled file-input triggers.
- Suggested command: `/harden`

#### 6. Fixed widths and minimum widths create mobile overflow pressure

- Location: `frontend/src/presentation/pages/teacher/TeacherDashboardPage.tsx:201`, `frontend/src/presentation/components/shared/dashboard/NotificationDropdown.tsx:94`, `frontend/src/presentation/components/ui/Toast.tsx:89`, `frontend/src/presentation/pages/teacher/SimilarityResultsPage.tsx:353`, `frontend/src/presentation/pages/teacher/AssignmentSubmissionsPage.tsx:717`
- Severity: High
- Category: Responsive
- Description: The UI uses fixed widths and minimum widths in core surfaces such as the teacher tasks table (`min-w-[760px]`), notification dropdown (`w-96`), toast stack (`min-w-[320px]`), and page containers (`max-w-[1600px]`).
- Impact: Mobile users get horizontal scrolling, clipped overlays, or controls that crowd each other on narrower screens.
- WCAG/Standard: WCAG 1.4.10 Reflow
- Recommendation: Replace hard minimums with fluid/container-aware layouts and mobile-specific adaptations.
- Suggested command: `/arrange`

#### 7. Theme primitives and shipped pages are pulling in opposite directions

- Location: `frontend/src/index.css:47`, `frontend/src/index.css:120`, `frontend/src/presentation/components/ui/Card.tsx:16`, `frontend/src/presentation/components/ui/Input.tsx:18`, `frontend/src/presentation/components/ui/Textarea.tsx:15`
- Severity: High
- Category: Theming
- Description: The root “design system” defaults to a dark, glow-heavy, glassmorphic palette, while most current pages are light surfaces that override those defaults manually.
- Impact: The app feels visually inconsistent, and every new screen has to fight shared primitives instead of inheriting a stable theme.
- WCAG/Standard: Internal consistency / design-system integrity
- Recommendation: Pick one primary product theme direction and align tokens plus shared primitives to it.
- Suggested command: `/normalize`

#### 8. Two outlier screens strongly signal AI-slop and break visual continuity

- Location: `frontend/src/presentation/pages/student/StudentGradesPage.tsx:107`, `frontend/src/presentation/pages/auth/EmailConfirmationPage.tsx:81`
- Severity: High
- Category: Theming
- Description: `StudentGradesPage` still looks like an older dark-glass screen inside a light dashboard shell, while `EmailConfirmationPage` uses purple/indigo glassmorphism and gradient icon bubbles unrelated to the rest of the product.
- Impact: The product feels stitched together rather than intentionally designed, weakening trust and polish.
- WCAG/Standard: Design anti-pattern / brand consistency
- Recommendation: Bring these pages back into the same surface, spacing, and typography system as the rest of the app.
- Suggested command: `/quieter`

#### 9. Notification and menu surfaces do not manage focus robustly when opened

- Location: `frontend/src/presentation/components/shared/dashboard/NotificationDropdown.tsx:91`, `frontend/src/presentation/components/ui/DropdownMenu.tsx:53`
- Severity: High
- Category: Accessibility
- Description: Dropdowns expose visible content, but they do not move focus into the menu, provide roving keyboard support, or clearly restore focus to the trigger afterward.
- Impact: Keyboard users can open these overlays and then lose context or skip menu items unintentionally.
- WCAG/Standard: WCAG 2.1.1 Keyboard, WCAG 2.4.3 Focus Order
- Recommendation: Standardize dropdown/menu focus behavior and keyboard interaction patterns.
- Suggested command: `/harden`

### Medium-Severity Issues

#### 10. Styling is heavily hard-coded instead of token-driven

- Location: `frontend/src/presentation/constants/authTheme.ts:3`, `frontend/src/presentation/pages/shared/CalendarPage.css:16`, `frontend/src/presentation/components/shared/dashboard/Sidebar.tsx:171`
- Severity: Medium
- Category: Theming
- Description: The frontend contains roughly 300 hex color literals and many one-off shadows/background recipes across auth, calendar, dashboard shell, and page-specific class strings.
- Impact: Theme changes become expensive, visual bugs are harder to fix systematically, and consistency drifts over time.
- WCAG/Standard: Design-system maintainability
- Recommendation: Replace one-off colors/shadows with semantic tokens and a smaller set of shared surface recipes.
- Suggested command: `/normalize`

#### 11. `transition-all` is overused across the UI

- Location: `frontend/src/index.css:188`, `frontend/src/presentation/pages/shared/SettingsPage.tsx:638`, broad pattern across `frontend/src/presentation`
- Severity: Medium
- Category: Performance
- Description: The codebase contains about 151 instances of `transition-all`, including width animation on the password-strength meter and broad hover/focus transitions on many components.
- Impact: `transition-all` invites accidental layout/property animation, increases repaint risk, and makes motion behavior harder to reason about.
- WCAG/Standard: Motion/performance best practice
- Recommendation: Transition only the properties that need animation and avoid animating layout-affecting values where possible.
- Suggested command: `/optimize`

#### 12. Several touch targets fall below the recommended 44x44 size

- Location: `frontend/src/presentation/components/ui/Toggle.tsx:44`, `frontend/src/presentation/components/ui/DatePicker.tsx:313`, `frontend/src/presentation/pages/teacher/ClassFormPage.tsx:437`, `frontend/src/presentation/pages/shared/SettingsPage.tsx:228`
- Severity: Medium
- Category: Responsive
- Description: Toggles, calendar day cells, schedule day chips, and multiple close/icon buttons are visually smaller than recommended mobile touch targets.
- Impact: Mobile and motor-impaired users get harder-to-hit controls and more accidental misses.
- WCAG/Standard: WCAG 2.5.5 Target Size (AAA), mobile usability best practice
- Recommendation: Increase hit areas even when icons or labels remain visually compact.
- Suggested command: `/arrange`

#### 13. Safe card-grid repetition weakens hierarchy and visual distinctiveness

- Location: `frontend/src/presentation/components/ui/SummaryStatCard.tsx:45`, `frontend/src/presentation/pages/teacher/TeacherDashboardPage.tsx:149`, `frontend/src/presentation/pages/teacher/SimilarityResultsPage.tsx:384`
- Severity: Medium
- Category: Anti-patterns
- Description: Multiple dashboards and analysis pages repeat the same bordered-card and summary-stat layout pattern with only color/icon swaps.
- Impact: Important information becomes visually monotonous, and the interface feels templated rather than intentional.
- WCAG/Standard: Design anti-pattern
- Recommendation: Reduce repeated “metric card” scaffolding and create stronger visual hierarchy between summary, action, and content sections.
- Suggested command: `/distill`

#### 14. The non-dashboard class card uses developer-dashboard cliches

- Location: `frontend/src/presentation/components/shared/dashboard/ClassCard.tsx:147`
- Severity: Medium
- Category: Anti-patterns
- Description: The dark variant uses code wallpaper, blur badges, gradient avatar chips, and teal hover haze.
- Impact: It looks louder and less trustworthy than the cleaner light variant, and it reinforces the “AI-generated dashboard” feel.
- WCAG/Standard: Design anti-pattern
- Recommendation: Simplify the class card and remove decorative code-wallpaper treatment unless it serves a real information purpose.
- Suggested command: `/quieter`

### Low-Severity Issues

#### 15. Toast positioning can crowd small screens

- Location: `frontend/src/presentation/components/ui/Toast.tsx:89`, `frontend/src/presentation/components/ui/Toast.tsx:129`
- Severity: Low
- Category: Responsive
- Description: Toasts are fixed to the top-right corner with `min-w-[320px]`.
- Impact: On smaller screens, they can overlay primary content or feel oversized.
- WCAG/Standard: Mobile usability best practice
- Recommendation: Use narrower mobile sizing and consider a bottom-stack presentation on small screens.
- Suggested command: `/arrange`

#### 16. The dashboard shell blends mismatched aesthetics

- Location: `frontend/src/presentation/components/shared/dashboard/DashboardLayout.tsx:32`, `frontend/src/presentation/components/shared/dashboard/Sidebar.tsx:171`, `frontend/src/presentation/components/shared/dashboard/TopBar.tsx:35`
- Severity: Low
- Category: Theming
- Description: The shell pairs a dark blurred sidebar, a pale canvas, and a near-white top bar without a clear bridge between them.
- Impact: The UI still works, but the app feels less cohesive than it could.
- WCAG/Standard: Design consistency
- Recommendation: Define one shell-level theme story and express it through shared tokens instead of local hex values.
- Suggested command: `/normalize`

#### 17. Registration includes a dead placeholder legal link

- Location: `frontend/src/presentation/pages/auth/RegisterPage.tsx:581`
- Severity: Low
- Category: Accessibility
- Description: The “Terms and Conditions” link points to `#`.
- Impact: Users encounter a navigable control that does not go anywhere, which is a small trust and UX issue.
- WCAG/Standard: Usability / link expectation
- Recommendation: Replace placeholder links with a real destination or non-link text until the destination exists.
- Suggested command: `/harden`

## Patterns & Systemic Issues

- Hard-coded visual values are widespread: roughly 300 hex color literals were found across `frontend/src/presentation` and `frontend/src/index.css`.
- Motion is overly broad: roughly 151 uses of `transition-all` appear in the frontend.
- Glass/gradient styling is still deeply embedded: roughly 81 blur/gradient/glass-related matches were found.
- Arbitrary minimum widths are common: roughly 56 `min-w-[...]` usages were found in presentation code.
- The codebase contains both good and bad modal patterns. `DeleteModuleModal` and `GradeOverrideModal` show the desired focus-management direction, while many other dialogs do not.
- The app is drifting toward a light dashboard system, but shared primitives still encode a dark “starter theme,” forcing ad hoc overrides.

## Positive Findings

- `frontend/src/presentation/components/shared/modules/DeleteModuleModal.tsx` shows strong modal accessibility discipline with focus capture, focus trap, and focus restoration.
- `frontend/src/presentation/components/teacher/gradebook/GradeOverrideModal.tsx` also uses robust modal focus handling.
- `frontend/src/presentation/components/ui/Toast.tsx` correctly uses `role="alert"` / `role="status"` and `aria-live`.
- `frontend/src/presentation/constants/dashboardTheme.ts` is a healthy step toward a reusable light-surface system.
- `frontend/src/presentation/components/student/grades/StudentClassGradesContent.tsx` and `frontend/src/presentation/components/shared/dashboard/AssignmentCard.tsx` show better theming discipline via explicit variants.

## Recommendations By Priority

### Immediate

1. Restore keyboard access to auth helpers and icon-only password toggles.
2. Replace click-only container triggers on popovers, cards, and upload surfaces with semantic controls.
3. Standardize dialog focus behavior across all modals.

### Short-Term

1. Remove fixed-width/mobile-overflow pain points in teacher tables, dropdowns, toast layout, and wide analysis screens.
2. Align shared primitives (`Card`, `Button`, `Input`, `Textarea`, `Select`) to the actual product theme direction.
3. Fix high-visibility visual outliers such as `StudentGradesPage` and `EmailConfirmationPage`.

### Medium-Term

1. Reduce hard-coded colors, one-off shadows, and duplicated page-specific styling.
2. Replace broad `transition-all` usage with property-specific transitions.
3. Increase small hit areas to mobile-friendly target sizes.

### Long-Term

1. Rework summary-card-heavy dashboard layouts to create stronger hierarchy and less template repetition.
2. Consolidate shell, auth, and feature theming into one coherent design language.
3. Re-run `/audit` after the first accessibility and theming pass.

## Suggested Commands For Fixes

- `/harden`: Best first pass for keyboard access, semantic buttons/links, accessible dialogs, proper labels, and broken placeholder links.
- `/normalize`: Best first pass for token cleanup, shared-primitives alignment, and shell/theme consistency.
- `/arrange`: Best follow-up for reflow issues, cramped breakpoints, touch targets, and toast/dropdown behavior on small screens.
- `/optimize`: Best follow-up for `transition-all`, layout-affecting animations, and heavy style churn.
- `/distill`: Best follow-up for card-grid repetition and hierarchy cleanup.
- `/quieter`: Best follow-up for auth/confirmation outliers, dark-glass leftovers, and “AI-looking” decorative excess.
