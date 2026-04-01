## Dashboard Mobile Sidebar Fix

1. Inspect the shared dashboard shell to confirm why the mobile hamburger and sidebar become unreliable across breakpoints and collapsed desktop state.
2. Keep the existing dashboard architecture, but make the mobile drawer independent from desktop collapse width and ensure it closes cleanly on route changes, escape, and desktop resize.
3. Lock body scrolling while the mobile drawer is open and correct the stacking order so the sidebar and overlay sit above the top bar.
4. Add focused regression coverage for the shared sidebar behavior.
5. Verify the frontend with `npm run build`.

---

## Dashboard Mobile Shell Polish

1. Refine the shared mobile hamburger button so it has a clearly square footprint that matches common dashboard navigation patterns.
2. Reduce oversized mobile typography in the shared dashboard shell using existing theme constants before touching one-off page classes.
3. Reuse the shared dashboard title token across pages that still hardcode large desktop-first heading sizes.
4. Verify the frontend with the available typecheck/build-safe commands.

---

## Mobile Sidebar Profile Dropdown Fix

1. Inspect the shared sidebar avatar row and profile dropdown positioning logic to confirm why the mobile user label is hidden and why the dropdown overflows the right edge.
2. Keep the desktop collapsed behavior intact, but render the user identity text for the expanded mobile drawer.
3. Reposition the profile dropdown so mobile keeps the menu inside the sidebar viewport while desktop retains its current adjacent placement.
4. Verify the frontend with the available typecheck/build-safe commands.

---

## Admin Manual Enrollment Modal Refresh

1. Inspect the shared enrollment modal frame and the manual enrollment list cards to identify why the dialog overflows the viewport and lacks internal scrolling.
2. Update the modal shell so long content stays within the viewport, the body becomes scrollable, and the manual-enrollment header can render without a leading icon.
3. Strengthen the `Select Student` and `Select Class` cards with more visible surfaces, borders, and shadows so they lift clearly from the modal background.
4. Increase the visual prominence of both search bars with stronger borders, surface contrast, and shadow treatment that matches other elevated admin inputs.
5. Verify the frontend with `npm run build`.

---

## Teacher Modules View Toggle Bug

1. Inspect the assignments tab view-state logic to confirm why `Modules` cannot activate when a class has zero modules.
2. Remove the forced fallback that keeps the UI stuck in `List` mode and preserve a valid empty `Modules` state.
3. Add targeted unit coverage for switching to `Modules` when no modules exist.
4. Verify the frontend with a typecheck and a focused component test when the environment allows it.

---

## Similarity Graph Empty State Width Fix

1. Inspect the similarity graph empty state container and surrounding layout in `SimilarityGraphView`.
2. Replace the cramped message wrapper with a wider, centered notice panel that matches the graph surface.
3. Verify the frontend with `npm run build`.

---

## Assignment Module Edit Persistence Bug

1. Inspect the teacher assignment edit flow and confirm whether `moduleId` survives from the form payload into the frontend update service call.
2. Extend the frontend and backend assignment update contracts to include `moduleId`, reusing the existing create-flow patterns where possible.
3. Update the backend assignment service/repository logic so reassignment validates module ownership and persists the new module reference.
4. Add focused regression tests for the frontend update payload and backend assignment service update path.
5. Verify the affected frontend and backend typecheck/test commands.

---

## Plagiarism Comparison Color Refinement

1. Inspect the shared plagiarism comparison components to confirm where match and diff colors are defined and how the light review surface is applied.
2. Strengthen match-state hierarchy with a clearer hover and selected outline while keeping the shared-fragment signal neutral and readable.
3. Refine Monaco diff inserted and removed colors so whole-line context stays soft while character-level changes are easier to pinpoint.
4. Add lightweight explanatory UI copy only where it helps teachers interpret the updated match and diff emphasis faster.
5. Verify the frontend with `npm run build`.

---

## Admin Class Detail Enrollment UI Refresh

1. Inspect the admin class detail page layout and the inlined enroll-student modal to confirm why the page width and modal theme diverge from the other admin surfaces.
2. Reuse existing admin light-modal patterns and shared hooks so the class-detail enrollment flow matches the rest of the dashboard without introducing one-off behavior.
3. Remove the extra page-width constraint that prevents the class detail page from expanding with the sidebar layout.
4. Widen the enrolled-student search row so the search field remains usable beside the `Enroll Student` action.
5. Verify the frontend with the available build commands.

---

## Mobile Top Bar Back Pattern

1. Audit the shared dashboard top bar and confirm which pages currently pass breadcrumb trails into the shared shell.
2. Keep desktop breadcrumbs intact, but collapse mobile breadcrumb trails into a `Back + title` pattern derived from the existing breadcrumb data.
3. Reuse the shared mobile viewport hook so the behavior stays centralized in `TopBar` instead of adding page-specific conditionals.
4. Add focused unit coverage for mobile `Back + title` behavior and desktop breadcrumb preservation.
5. Verify the frontend with the available typecheck/build-safe commands.

---

## Mobile Sidebar Close Control Alignment

1. Inspect the shared mobile sidebar trigger and header controls to confirm why the open-state trigger swaps to an `X` instead of reusing the drawer header affordance.
2. Keep the outer mobile trigger as a stable open-menu button, then move the close action into the expanded drawer header beside the `ClassiFi` wordmark.
3. Reuse the existing panel-close iconography so mobile and desktop sidebar controls feel consistent without adding a second close pattern.
4. Update the shared sidebar regression coverage to assert the new mobile open and close controls.
5. Verify the frontend with the available typecheck/build-safe commands.

---

## Mobile Toast Position Fix

1. Inspect the shared toast container and confirm why mobile toasts stretch across the viewport and appear left-biased instead of right-anchored.
2. Keep the shared toast component intact, but tighten the mobile toast container to a capped width anchored from the right edge only.
3. Preserve the desktop toast placement while ensuring mobile still leaves a small viewport gutter and keeps the stack readable.
4. Add focused unit coverage for the mobile toast container positioning classes.
5. Verify the frontend with the available typecheck/build-safe commands.

---

## Global Styling Structure Cleanup

1. Audit `src/index.css` and confirm which global classes and tokens still have real consumers.
2. Keep `src/index.css` as the single CSS entrypoint, but split styling concerns into dedicated `src/styles/` files for tokens, base rules, and reusable global utilities.
3. Remove dead helper classes that are no longer referenced anywhere in the frontend.
4. Replace repeated inline Expletus wordmark styles with the shared `font-expletus` utility generated from the token layer.
5. Update frontend documentation so future UI decisions have a clear home and maintenance pattern.
6. Verify with the available frontend typecheck/build-safe commands.

---

## Frontend CI Lint Failure in Shared Sidebar

1. Inspect the shared dashboard sidebar route-change behavior and confirm why it now violates `react-hooks/set-state-in-effect`.
2. Replace the effect-driven mobile-close behavior with a render-safe state model that still closes the drawer when the route changes.
3. Preserve existing explicit close paths such as nav clicks, overlay clicks, escape handling, and desktop breakpoint transitions.
4. Re-run the frontend CI commands: `npm run lint`, `npm test`, and `npm run build`.

---

## Fair Similarity-Based Deduction for Assignments

1. Extend frontend assignment and submission models with the new similarity-penalty contract while keeping existing service boundaries intact.
2. Add the assignment create/edit toggle beside the existing submission-policy controls and keep the v1 UI to a single switch plus helper copy.
3. Show a student-facing policy notice in the shared assignment detail page before submission when the toggle is enabled.
4. Update teacher and student score displays to show effective score with raw-grade and similarity-penalty context where appropriate.
5. Add focused frontend regression coverage and verify with `npm run build`.
