# Dashboard Mobile Sidebar Fix Checklist

- [x] Read `AGENTS.md`
- [x] Read `frontend/documentation.md`
- [x] Inspect the shared dashboard sidebar, top bar, and layout composition
- [x] Make the mobile drawer width and stacking behavior reliable across breakpoints
- [x] Add focused regression coverage for shared sidebar mobile behavior
- [x] Verify the frontend with the available commands
      `npm.cmd run typecheck` passed.
      `npm.cmd run test -- Sidebar` and `npm.cmd run build` are blocked in this sandbox by Vite/esbuild `spawn EPERM` while loading config files.

---

# Dashboard Mobile Shell Polish Checklist

- [x] Read `frontend/documentation.md`
- [x] Inspect the shared hamburger button, top bar, and dashboard page title patterns
- [x] Make the mobile hamburger explicitly square while preserving the new contrast treatment
- [x] Reduce shared mobile dashboard typography where it is currently too large
- [x] Verify the frontend with the available commands
      `npm.cmd run typecheck` passed.
      Shared dashboard title scan confirms the old oversized mobile title class is no longer used in the main dashboard surfaces.

---

# Mobile Sidebar Profile Dropdown Fix Checklist

- [x] Read `frontend/documentation.md`
- [x] Inspect the shared sidebar avatar row and profile dropdown positioning logic
- [x] Show the user name beside the avatar in the expanded mobile sidebar
- [x] Keep the mobile settings/logout menu fully visible within the sidebar viewport
- [x] Verify the frontend with the available commands
      `npm.cmd run typecheck` passed.
      Vitest remains blocked in this sandbox when Vite loads config because of the existing `spawn EPERM` issue.

---

# Similarity Graph Empty State Checklist

- [x] Read `AGENTS.md`
- [x] Read `frontend/documentation.md`
- [x] Inspect the similarity graph empty-state layout in `SimilarityGraphView`
- [x] Adjust the graph column and empty-state notice width so the message stays readable
- [ ] Verify the frontend with `npm run build` (blocked by sandbox `spawn EPERM` while Vite loads config)

---

# Assignment Module Edit Persistence Checklist

- [x] Read `frontend/documentation.md`
- [x] Read `backend-ts/documentation.md`
- [x] Trace `moduleId` from the teacher assignment edit form through the frontend and backend update flows
- [x] Update the assignment edit contracts so `moduleId` reaches the backend on save
- [x] Persist updated `moduleId` in the backend assignment service/repository path
- [x] Add regression coverage for assignment module reassignment
- [x] Verify the affected frontend and backend test/typecheck commands
      Frontend `npx.cmd tsc -b` passed.
      Backend `npm.cmd run typecheck` passed.
      Frontend `npm.cmd run build` and backend/frontend Vitest runs are blocked in this sandbox by Vite/esbuild `spawn EPERM` while loading config.

---

# Plagiarism Comparison Color Refinement Checklist

- [x] Read `frontend/documentation.md`
- [x] Inspect the shared plagiarism comparison components and existing Similarity Results usage
- [x] Refine match highlight states so hovered and selected fragments are easier to pinpoint
- [x] Tune Monaco diff inserted and removed colors for clearer token-level contrast
- [x] Add light-touch instructional copy only where it improves scan speed
- [x] Verify the frontend with available build commands
      `npx.cmd tsc -b` passed.
      `npm.cmd run build` is still blocked in this sandbox by Vite/esbuild `spawn EPERM` while loading `vite.config.ts`.

---

# Admin Class Detail Enrollment UI Refresh Checklist

- [x] Read `frontend/documentation.md`
- [x] Inspect the admin class detail page, its inlined enroll-student modal, and the shared admin enrollment modal patterns
- [x] Refresh the inlined enroll-student modal to a light design that matches the other admin modals

---

# Mobile Top Bar Back Pattern Checklist

- [x] Read `frontend/documentation.md`
- [x] Audit the shared top bar and the pages that currently pass breadcrumb trails
- [x] Keep desktop breadcrumbs unchanged while collapsing mobile trails into a shared `Back + title` pattern
- [x] Add focused unit coverage for mobile and desktop top bar breadcrumb behavior
- [x] Verify the frontend with the available commands
      `npm.cmd run typecheck` passed.
      `npm.cmd run test -- TopBar` is blocked in this sandbox by Vite/esbuild `spawn EPERM` while loading `vitest.config.ts`.

---

# Mobile Sidebar Close Control Alignment Checklist

- [x] Read `frontend/documentation.md`
- [x] Inspect the shared mobile sidebar trigger and header controls
- [x] Keep the outer trigger as a stable menu button and move the close action into the drawer header beside `ClassiFi`
- [x] Update the shared sidebar regression coverage for the new mobile close control
- [x] Verify the frontend with the available commands
      `npm.cmd run typecheck` passed.
      Sidebar Vitest coverage remains blocked in this sandbox when Vite loads config because of the existing `spawn EPERM` issue.

---

# Mobile Toast Position Fix Checklist

- [x] Read `frontend/documentation.md`
- [x] Inspect the shared toast container and its app-level mount point
- [x] Keep mobile toasts right-anchored with a bounded width instead of stretching between both viewport edges
- [x] Add focused coverage for the mobile toast container classes
- [x] Verify the frontend with the available commands
      `npm.cmd run typecheck` passed.
      `npm.cmd run test -- Toast` is blocked in this sandbox by Vite/esbuild `spawn EPERM` while loading `vitest.config.ts`.
- [x] Replace the custom debounce logic with the shared `useDebouncedValue` hook
- [x] Remove the fixed inner page width and widen the student search row beside the `Enroll Student` button
- [x] Verify the frontend with the available build commands
      `npx.cmd tsc -b` passed.
      `npm.cmd run build` is still blocked in this sandbox by Vite/esbuild `spawn EPERM` while loading `vite.config.ts`.

---

# Global Styling Structure Cleanup Checklist

- [x] Read `frontend/documentation.md`
- [x] Audit `frontend/src/index.css` and scan current style usage
- [x] Split global styling into `tokens.css`, `base.css`, and `utilities.css` while keeping `index.css` as the entrypoint
- [x] Remove dead global helper classes
- [x] Centralize Expletus wordmark styling via the shared token utility
- [x] Update frontend documentation for the new styling structure
- [x] Verify with the available frontend commands
      `npx.cmd tsc -b` passed.
      Dead-style scan confirmed the removed helper classes no longer have consumers.

---

# CI Frontend Failure Triage Checklist

- [x] Read `AGENTS.md`
- [x] Read `frontend/documentation.md`
- [x] Reproduce the frontend CI lint failure locally
- [x] Refactor the shared dashboard sidebar route-change behavior to satisfy the React hooks lint rule without changing the dashboard architecture
- [x] Re-run `npm run lint`
- [ ] Re-run `npm test`
- [ ] Re-run `npm run build`
      `npm.cmd test -- Sidebar` and `npm.cmd run build` are still blocked in this sandbox by Vite/esbuild `spawn EPERM`.

---

# Fair Similarity-Based Deduction for Assignments

- [ ] Read `frontend/documentation.md`
- [ ] Extend assignment and submission frontend types for similarity penalty metadata
- [ ] Add the assignment-form toggle and helper copy
- [ ] Add the student-facing policy notice on assignment detail
- [ ] Update score displays to surface raw score, effective score, and similarity deduction details
- [ ] Add focused frontend regression coverage
- [ ] Run `npm run build`
