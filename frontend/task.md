# Frontend Refactor Checklist

## Completed
- [x] Checkpoint 1: App routes + role-based pages + toast context move
- [x] Checkpoint 2: Teacher component/hook colocation
- [x] Checkpoint 3: Shared/role component and hook structure

## Checkpoint 4: Boundary Fixes + Guardrails
- [x] Remove `presentation -> data/api/types` direct imports
- [x] Remove `shared -> business/presentation` upward imports
- [x] Add ESLint boundary rules
- [x] Run `npm run build`
- [x] Run `npm test`
- [ ] Commit checkpoint 4

## Checkpoint 5: Canonical Business Domain Types
- [ ] Define/normalize business model contracts
- [ ] Remove `business -> data/api/types` imports in non-test code
- [ ] Keep compatibility aliases only where needed
- [ ] Run `npm run build`
- [ ] Run `npm test`
- [ ] Commit checkpoint 5

## Checkpoint 6: Shared Cleanup
- [ ] Move business-only utils to business layer
- [ ] Move presentation-only utils to presentation layer
- [ ] Move data-only utils to data layer
- [ ] Remove dead runtime utility `scheduleUtils.ts`
- [ ] Run `npm run build`
- [ ] Run `npm test`
- [ ] Commit checkpoint 6

## Checkpoint 7: API Type File Decomposition
- [ ] Split `src/data/api/types.ts` by feature
- [ ] Keep temporary barrel for compatibility
- [ ] Update imports to feature type files
- [ ] Run `npm run build`
- [ ] Run `npm test`
- [ ] Commit checkpoint 7

## Checkpoint 8: Large File Decomposition
- [ ] Decompose large page/hook files into feature subcomponents/hooks
- [ ] Preserve behavior and route outputs
- [ ] Run `npm run build`
- [ ] Run `npm test`
- [ ] Commit checkpoint 8
