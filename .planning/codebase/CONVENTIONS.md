# Coding Conventions

**Analysis Date:** 2026-03-08

## Naming Patterns

**Files:**
- Frontend uses PascalCase for pages/components (`frontend/src/presentation/pages/auth/LoginPage.tsx`, `frontend/src/presentation/components/ui/Button.tsx`).
- Frontend hooks and utilities use camelCase (`frontend/src/presentation/hooks/shared/useZodForm.ts`, `frontend/src/shared/utils/assignmentFilters.ts`).
- Backend feature files are mostly kebab-case or dotted feature names (`backend-ts/src/modules/plagiarism/plagiarism-auto-analysis.service.ts`, `backend-ts/src/modules/classes/class.controller.ts`).
- Tests consistently use `*.test.ts` or `*.test.tsx` in dedicated test trees (`frontend/src/tests/unit/**`, `backend-ts/tests/**`).

**Functions:**
- camelCase for functions and methods across frontend/backend (`loginUser`, `getClassAssignmentsForStudent`, `sanitizeUserFacingErrorMessage`).
- Event handlers and UI callbacks follow `handle*` naming (`handleLoginSuccess`, `handleRegisterSubmit`, `handleNext`).
- Async functions do not use special prefixes; async intent is inferred from `async/await`.

**Variables:**
- camelCase for local variables and parameters (`parsedClassId`, `shouldFilterActiveOnly`, `validationResult`).
- UPPER_SNAKE_CASE for constants (`API_BASE_URL`, `ASSIGNMENT_INSTRUCTIONS_IMAGE_MAX_SIZE_BYTES`).
- Descriptive names are preferred over abbreviations (`userRegistrationData`, `submissionCountsByAssignment`).

**Types:**
- Interfaces and type aliases use PascalCase (`ApiRequestConfig`, `ValidatedRequest`, `CreateClassServiceDTO`).
- Domain DTO/model suffixes are common in backend (`*DTO`, `*RequestSchema`, `*ParamSchema`).
- `import type` is widely used to keep type-only imports explicit.

## Code Style

**Formatting:**
- Prettier is configured at repo root (`.prettierrc`) with: 2 spaces, `printWidth: 80`, double quotes, trailing commas, and no semicolons.
- TypeScript strict mode is enabled in both apps (`frontend/tsconfig.json`, `backend-ts/tsconfig.json`).
- Current codebase has mixed punctuation in legacy/touched files (many files follow no-semicolon style, but some still contain semicolons). New code should follow `.prettierrc`.

**Linting:**
- ESLint flat config is used in both apps (`frontend/eslint.config.js`, `backend-ts/eslint.config.js`).
- Frontend lint rules enforce architecture boundaries (presentation cannot import `@/data/*`; shared cannot import presentation/business).
- Backend lint rules enforce stricter type safety (`no-explicit-any` error by default, with narrow file/test exceptions).

## Import Organization

**Order:**
1. External packages
2. Internal alias imports (`@/...`)
3. Relative imports (when needed)
4. Type imports (`import type`) where applicable

**Grouping:**
- No strict alphabetical import ordering rule is enforced globally.
- Files typically group imports by domain concern (framework, shared utils, feature modules).

**Path Aliases:**
- Frontend: `@/* -> ./src/*` (`frontend/tsconfig.app.json`, `frontend/vitest.config.ts`).
- Backend: `@/* -> ./src/*` plus additional scoped aliases (`@api/*`, `@services/*`, `@repositories/*`, `@models/*`, `@shared/*` in `backend-ts/tsconfig.json`).

## Error Handling

**Frontend patterns:**
- Service/repository layers normalize errors and return typed failure responses instead of always throwing (`frontend/src/business/services/authService.ts`, `frontend/src/data/api/apiClient.ts`, `frontend/src/data/api/errorMapping.ts`).
- UI layers typically use `try/catch` around async calls and surface user-safe messages (`frontend/src/presentation/pages/auth/RegisterPage.tsx`).
- API errors are sanitized before display (`sanitizeUserFacingErrorMessage`).

**Backend patterns:**
- Domain-specific custom errors extend `ApiError` with HTTP codes (`backend-ts/src/shared/errors.ts`).
- Controllers/services throw typed errors; global Fastify handler centralizes response formatting (`backend-ts/src/api/middlewares/error-handler.ts`).
- Request validation uses Zod pre-handlers that return structured 400 responses (`backend-ts/src/api/plugins/zod-validation.ts`).

**Guideline to follow:**
- Throw typed errors in backend domain/service boundaries.
- Return user-facing normalized error payloads in frontend business/data boundaries.
- Avoid leaking internal stack traces outside development mode.

## Logging

**Backend:**
- Uses `pino` through an adapter (`backend-ts/src/shared/logger.ts`).
- Standard levels: `debug`, `info`, `warn`, `error`.
- Logging is structured and scoped via `createLogger("ScopeName")`.

**Frontend:**
- No centralized logger; occasional `console.warn/error` remains in UI/data flows (`frontend/src/data/api/apiClient.ts`, some page-level catch blocks).
- Preferred pattern for new code is to keep user-facing errors handled in UI and avoid noisy console logging unless diagnostic context is required.

## Comments and Documentation

**Patterns observed:**
- Many exported functions/classes include JSDoc-style comments, especially in services, helpers, and controllers.
- Route handlers often include endpoint comments in `METHOD /path` format (`backend-ts/src/modules/*/*.controller.ts`).
- Tests and test utilities use section comments to structure factories/fixtures and scenarios (`frontend/src/tests/utils/factories.ts`, `backend-ts/tests/utils/factories.ts`).

**Guideline to follow:**
- Keep comments focused on intent and business rules.
- Prefer self-documenting names and concise JSDoc on exported/public APIs.

## Function Design

**Common patterns:**
- Guard clauses for validation before main logic (both frontend business services and backend services).
- Layered delegation:
  - Frontend presentation -> business services -> repositories/API.
  - Backend controller -> service -> repository.
- Mapping functions (`to*DTO`, mapper utilities) are used to isolate transport/domain transformations.

## Module Design

**Frontend module style:**
- Clean Architecture layering is actively enforced by lint and folder structure (`presentation`, `business`, `data`, `shared`).
- Reusable hooks/utilities live in shared feature folders (`frontend/src/presentation/hooks/shared`, `frontend/src/shared/utils`).

**Backend module style:**
- Feature-first modules under `backend-ts/src/modules/*` with colocated controller/service/repository/schema/mapper files.
- DI tokens + `tsyringe` container are used for dependency wiring (`backend-ts/src/shared/di/tokens.ts`, route controllers resolving services via container).

---

*Convention analysis: 2026-03-08*
*Update when patterns change*
