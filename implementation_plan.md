# Frontend Lint Remediation Plan

## Goal

Resolve the current `frontend` lint failures while preserving the documented Clean Architecture boundaries.

## Checklist

- [x] Add business-facing model entrypoints for presentation-safe imports
- [x] Update presentation imports to consume business models instead of `data/api/*`
- [x] Remove redundant `try/catch` wrappers flagged by `no-useless-catch`
- [x] Replace empty blocks with explicit intent or safe fallbacks
- [x] Remove unused catch variables and unused parameters
- [x] Run `npm run lint` in `frontend` and fix any remaining issues
- [ ] Run `npm run build` in `frontend` to verify the changes compile
  Note: `npx.cmd tsc -b` passes, but `vite build` is blocked in this sandbox by `spawn EPERM` from `esbuild`.
