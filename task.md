# Student Grade Calculation Checklist

- [x] Read `AGENTS.md`
- [x] Read `frontend/documentation.md`
- [x] Inspect the existing student grade summary implementation
- [x] Define the current-grade calculation rules for overdue missing, pending review, and future work
- [x] Extract reusable student grade metrics helper
- [x] Update student-facing summaries and PDF labels to use current grade
- [x] Add focused frontend unit tests
- [ ] Run `npm run build` in `frontend`
- [ ] Run `npm test` in `frontend`

Verification note: `npm.cmd run typecheck` passed. `npm.cmd run build` and `npm.cmd test` were attempted but Vite/Vitest are blocked in this sandbox by a Windows `spawn EPERM` during config loading.
