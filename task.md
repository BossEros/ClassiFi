# School ID Rollback Checklist

- [x] Read `AGENTS.md`
- [x] Read `frontend/documentation.md`
- [x] Read `backend-ts/documentation.md`
- [x] Audit current `schoolId` touchpoints against the pre-feature baseline
- [x] Remove backend `schoolId` contracts, routes, lookups, and schema/model changes
- [x] Remove frontend `schoolId` types, registration/settings/table UI, and layout changes
- [x] Update tests and fixtures for the restored baseline
- [x] Delete local schema artifact `backend-ts/drizzle/0002_add_school_id.sql`
- [x] Run `rg -n "schoolId|school_id|School ID|Faculty ID"` across `backend-ts` and `frontend`
- [ ] Run `npm run typecheck` and `npm test` in `backend-ts`
- [ ] Run `npm run build` and `npm test` in `frontend`
