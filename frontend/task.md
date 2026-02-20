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
- [x] Commit checkpoint 4

## Checkpoint 5: Canonical Business Domain Types
- [x] Define/normalize business model contracts
- [x] Remove `business -> data/api/types` imports in non-test code
- [x] Keep compatibility aliases only where needed
- [x] Run `npm run build`
- [x] Run `npm test`
- [x] Commit checkpoint 5

## Checkpoint 6: Shared Cleanup
- [x] Move business-only utils to business layer
- [x] Move presentation-only utils to presentation layer
- [x] Move data-only utils to data layer
- [x] Remove dead runtime utility `scheduleUtils.ts`
- [x] Run `npm run build`
- [x] Run `npm test`
- [x] Commit checkpoint 6

## Checkpoint 7: API Type File Decomposition
- [x] Split `src/data/api/types.ts` by feature
- [x] Keep temporary barrel for compatibility
- [x] Update imports to feature type files
- [x] Run `npm run build`
- [x] Run `npm test`
- [x] Commit checkpoint 7

## Checkpoint 8: Large File Decomposition
- [ ] Decompose large page/hook files into feature subcomponents/hooks
- [ ] Preserve behavior and route outputs
- [ ] Run `npm run build`
- [ ] Run `npm test`
- [ ] Commit checkpoint 8
