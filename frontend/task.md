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
- [x] Replace the custom debounce logic with the shared `useDebouncedValue` hook
- [x] Remove the fixed inner page width and widen the student search row beside the `Enroll Student` button
- [x] Verify the frontend with the available build commands
  `npx.cmd tsc -b` passed.
  `npm.cmd run build` is still blocked in this sandbox by Vite/esbuild `spawn EPERM` while loading `vite.config.ts`.
