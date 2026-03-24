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

## Global Styling Structure Cleanup

1. Audit `src/index.css` and confirm which global classes and tokens still have real consumers.
2. Keep `src/index.css` as the single CSS entrypoint, but split styling concerns into dedicated `src/styles/` files for tokens, base rules, and reusable global utilities.
3. Remove dead helper classes that are no longer referenced anywhere in the frontend.
4. Replace repeated inline Expletus wordmark styles with the shared `font-expletus` utility generated from the token layer.
5. Update frontend documentation so future UI decisions have a clear home and maintenance pattern.
6. Verify with the available frontend typecheck/build-safe commands.
