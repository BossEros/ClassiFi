# ClassiFi Code Conventions (Observed)

## 1) Architecture and Layer Boundaries
- Backend follows controller -> service -> repository separation under `backend-ts/src/modules/*`.
- Route handlers are thin and delegate business logic to services, e.g. `backend-ts/src/modules/auth/auth.controller.ts`.
- Service classes are the orchestration layer with injected dependencies, e.g. `backend-ts/src/modules/submissions/submission.service.ts`.
- Data access and query logic stay in repositories (not controllers), e.g. `backend-ts/src/modules/classes/class.repository.ts`.
- Frontend follows Presentation -> Business -> Data layers, e.g. `frontend/src/presentation/pages/auth/LoginPage.tsx` -> `frontend/src/business/services/authService.ts` -> `frontend/src/data/repositories/authRepository.ts`.
- UI components/pages do not call `apiClient` directly in normal flow; repositories do, e.g. `frontend/src/data/repositories/classRepository.ts`.

## 2) Module and File Organization
- Backend feature files are colocated per module (`*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.schema.ts`, `*.mapper.ts`), see `backend-ts/src/modules/classes/`.
- Backend DI bindings are centralized through tokens in `backend-ts/src/shared/container.ts` and `backend-ts/src/shared/di/tokens.ts`.
- Frontend separates schemas/hooks/utils/types by layer and feature, e.g. `frontend/src/presentation/schemas/auth/authSchemas.ts` and `frontend/src/presentation/hooks/shared/useZodForm.ts`.
- Shared utilities are explicit and reused, e.g. `frontend/src/presentation/utils/formErrorMap.ts` and `backend-ts/src/shared/utils.ts`.

## 3) Naming Conventions
- Functions are verb-first and specific (`loginUser`, `getClassAssignmentsForStudent`, `validateRegistrationData`) in `frontend/src/business/services/authService.ts` and `backend-ts/src/modules/classes/class.service.ts`.
- Variables are often descriptive and domain-scoped (`parsedClassId`, `normalizedFeedback`, `shouldIncludeHiddenDetails`) in `backend-ts/src/modules/submissions/submission.controller.ts`.
- DTO and response naming uses intent suffixes (`CreateClassRequestSchema`, `SubmissionDTO`, `AuthResult`) in `backend-ts/src/modules/classes/class.schema.ts` and `backend-ts/src/modules/auth/auth.service.ts`.
- Boolean naming uses `is/has/should` patterns (`isAuthenticated`, `shouldReturnLatestOnly`) in `frontend/src/shared/store/useAuthStore.ts` and `backend-ts/src/modules/submissions/submission.controller.ts`.

## 4) TypeScript and Typing Patterns
- Strong typing is used at module boundaries with `type`/`interface` exports, e.g. `frontend/src/presentation/schemas/auth/authSchemas.ts`.
- Zod schemas pair with inferred TS types (`z.infer`) in both stacks, e.g. `backend-ts/src/modules/classes/class.schema.ts`.
- Backend request typing often uses `request.validatedBody/validatedQuery/validatedParams` from custom plugin in `backend-ts/src/api/plugins/zod-validation.ts`.
- Fastify request augmentation is used for authenticated user context in `backend-ts/src/api/middlewares/auth.middleware.ts`.
- DI classes use `@injectable()` and constructor injection via tokens, e.g. `backend-ts/src/modules/users/user.service.ts`.

## 5) Validation Conventions
- Backend validates request payloads with pre-handlers (`validateBody`, `validateParams`, `validateQuery`) in controllers like `backend-ts/src/modules/class` and `backend-ts/src/modules/submissions/submission.controller.ts`.
- Backend schemas use coercion/refinement for URL/query and cross-field rules (`z.coerce.number()`, `.refine`) in `backend-ts/src/modules/classes/class.schema.ts`.
- Frontend uses dual validation style:
- UI schemas with Zod + RHF for form UX (`frontend/src/presentation/schemas/auth/authSchemas.ts` + `frontend/src/presentation/hooks/shared/useZodForm.ts`).
- Business-level guard functions returning messages or throwing errors (`frontend/src/business/validation/authValidation.ts`, `frontend/src/business/validation/commonValidation.ts`).

## 6) Error Handling and Logging
- Backend favors domain-specific error classes extending `ApiError` in `backend-ts/src/shared/errors.ts`.
- Global Fastify error handling standardizes output shape `{ success: false, message, error? }` in `backend-ts/src/api/middlewares/error-handler.ts`.
- Services log operational failures and continue where cleanup is best-effort, e.g. file cleanup in `backend-ts/src/modules/classes/class.service.ts` and `backend-ts/src/modules/users/user.service.ts`.
- Frontend services/repositories normalize failures to user-safe messages and `Error` throws, e.g. `frontend/src/data/api/apiClient.ts` and `frontend/src/business/services/assignmentService.ts`.

## 7) Response and API Shape Conventions
- Successful API responses commonly include `success`, `message`, and a named payload key (`class`, `submissions`, `data`) in backend controllers (example: `backend-ts/src/modules/submissions/submission.controller.ts`).
- Validation failures return `success: false`, top-level message, and field-level list in `backend-ts/src/api/plugins/zod-validation.ts`.
- Frontend repository methods usually validate `apiResponse.error`, `data.success`, and required payload before returning typed entities in `frontend/src/data/repositories/classRepository.ts`.

## 8) Formatting and Style Observations
- Most backend code follows no-semicolon style with grouped import blocks and short JSDoc docblocks, e.g. `backend-ts/src/modules/auth/auth.service.ts`.
- Frontend style is mostly no-semicolon in shared/business/data layers (e.g. `frontend/src/data/api/apiClient.ts`), but some auth pages currently use semicolons/inlined component comments (e.g. `frontend/src/presentation/pages/auth/LoginPage.tsx`).
- Comments are pragmatic and purpose-driven (intent, constraints, or edge cases), e.g. timeout race explanation in `backend-ts/src/modules/submissions/submission.controller.ts`.

## 9) Practical Rules To Follow When Editing
- Keep business logic in services; keep controllers/pages thin (`backend-ts/src/modules/*/*.service.ts`, `frontend/src/business/services/*`).
- Add/extend Zod schemas close to feature modules (`backend-ts/src/modules/*/*.schema.ts`, `frontend/src/presentation/schemas/*`).
- Reuse existing utility helpers before adding new ones (`frontend/src/presentation/utils/formErrorMap.ts`, `frontend/src/business/validation/commonValidation.ts`).
- Throw/use domain errors on backend instead of ad-hoc strings (`backend-ts/src/shared/errors.ts`).
- Use existing response envelopes and naming patterns in new route handlers (`backend-ts/src/modules/*/*.controller.ts`).
