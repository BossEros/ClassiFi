# Cross-Class Temporal Analysis Plan

## Goal

Expose submission timestamps through the cross-class result-details flow so the shared pair comparison and diff views can show the same temporal analysis cues already available in the intra-class experience.

## Checklist

- [x] Inspect the existing intra-class temporal analysis wiring and the cross-class result-details pipeline
- [x] Extend the backend cross-class contextual query and DTOs with submission timestamps
- [x] Update frontend cross-class API types and detail mapping to pass `submittedAt` into the shared pair view
- [x] Add regression coverage for the backend result-details response and frontend cross-class service types
- [ ] Run `backend-ts` typecheck/tests and `frontend` build/tests to verify the change
  Note: `backend-ts` typecheck and full backend test suite passed. `frontend` build and `tsc -b` passed. `frontend` Vitest remains blocked in this environment by `spawn EPERM` while loading `vitest.config.ts` through Vite/esbuild.
