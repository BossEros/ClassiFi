# Frontend Refactor Checklist

- [x] Create `frontend/implementation_plan.md`
- [x] Create `frontend/task.md`
- [x] Add `src/app/routes/*` route modules
- [x] Move pages into role-based folders under `src/presentation/pages`
- [x] Move `ToastContext` to `src/presentation/context/ToastContext.tsx`
- [x] Update imports and path aliases after moves
- [x] Run `npm run build` in `frontend`
- [x] Commit checkpoint 1

## Checkpoint 2 (Next)
- [x] Move role-specific components into `presentation/components/{student,teacher,admin,shared}`
- [x] Move role-specific hooks into `presentation/hooks/{student,teacher,admin,shared}`
- [x] Run `npm run build` and `npm test`
- [x] Commit checkpoint 2

## Checkpoint 3
- [x] Move shared components into `presentation/components/shared/*`
- [x] Split legacy `components/forms` into `auth`, `student`, `teacher`, and `shared` form folders
- [x] Move reusable hooks into `presentation/hooks/shared/*`
- [x] Update imports and internal references after moves
- [x] Run `npm run build` and `npm test`
- [x] Commit checkpoint 3
