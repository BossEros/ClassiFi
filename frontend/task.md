# Frontend Refactor Checklist

- [x] Create `frontend/implementation_plan.md`
- [x] Create `frontend/task.md`
- [x] Add `src/app/routes/*` route modules
- [x] Move pages into role-based folders under `src/presentation/pages`
- [x] Move `ToastContext` to `src/presentation/context/ToastContext.tsx`
- [x] Update imports and path aliases after moves
- [x] Run `npm run build` in `frontend`
- [ ] Commit checkpoint 1

## Checkpoint 2 (Next)
- [ ] Move role-specific components into `presentation/components/{student,teacher,admin,shared}`
- [ ] Move role-specific hooks into `presentation/hooks/{student,teacher,admin,shared}`
- [ ] Run `npm run build` and `npm test`
- [ ] Commit checkpoint 2
