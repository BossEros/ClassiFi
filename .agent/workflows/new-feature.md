---
description: Checklist for implementing a new full-stack feature (Model -> API -> UI)
---

# Implement New Full-Stack Feature

Use this checklist when adding a new module or major feature to ClassiFi.

## 1. Backend: Data Layer

- [ ] **Define Model**: Create/Update `backend-ts/src/models/<entity>.model.ts` using Drizzle schema.
- [ ] **Create Repository**: Add `backend-ts/src/repositories/<entity>.repository.ts`.
  - Recommended: Extend `BaseRepository` for standard CRUD operations.
- [ ] **Export Symbols**: Update `backend-ts/src/models/index.ts` and `repositories/index.ts`.

## 2. Backend: Business Logic

- [ ] **Create Service**: Add `backend-ts/src/services/<entity>.service.ts`.
  - Implement business rules and validation here.
- [ ] **Create Routes**: Add `backend-ts/src/api/<entity>.routes.ts`.
  - Use Fastify schema validation (Zod).
- [ ] **Register Plugin**: Import and register the new route file in `backend-ts/src/app.ts` (or `server.ts`).

## 3. Frontend: User Interface

- [ ] **Create Components**: Add reusable UI parts in `frontend/presentation/components/<feature>/`.
- [ ] **Create Page**: Build the main view in `frontend/presentation/pages/<Feature>Page.tsx`.
- [ ] **Add Route**: Register the new page in `frontend/presentation/App.tsx`.
- [ ] **Update Navigation**: Add link to `Sidebar.tsx` IF the feature requires top-level access.

## 4. Verification

- [ ] **Backend Test**: Run `cd backend-ts && npm run test` to verify API logic.
- [ ] **Frontend Build**: Run `cd frontend && npm run build` to ensure no type errors.
