# External Integrations

**Analysis Date:** 2026-03-08

## APIs & External Services

**Code Execution:**
- Judge0 (self-hosted or remote endpoint) - Executes student code and test cases.
  - SDK/Client: Native `fetch` calls in backend service (`backend-ts/src/services/judge0.service.ts`).
  - Auth: No API key configured in current integration surface; endpoint configured via `JUDGE0_URL`.
  - Endpoints used: `/about`, `/submissions`, `/submissions/batch`, `/submissions/{token}`.

**Semantic Similarity Inference:**
- Internal FastAPI semantic service - Computes semantic similarity scores for plagiarism pipeline.
  - Integration method: REST via `fetch` (`backend-ts/src/modules/plagiarism/semantic-similarity.client.ts`).
  - Auth: Service URL from `SEMANTIC_SERVICE_URL`.
  - Endpoints used: `/health`, `/similarity`.

**Email Delivery:**
- SendGrid (primary) + SMTP (fallback) - Transactional notification emails.
  - SDK/Client: `@sendgrid/mail` and `nodemailer` (`backend-ts/src/services/email/*.ts`).
  - Auth: `SENDGRID_API_KEY`, plus `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`.
  - Templates: Rendered in backend notification/email template modules (`backend-ts/src/services/email/templates.ts`, `backend-ts/src/modules/notifications/notification.types.ts`).

## Data Storage

**Databases:**
- PostgreSQL (Supabase-hosted in typical setup) - Primary relational datastore.
  - Connection: `DATABASE_URL` env var.
  - Client: `drizzle-orm` + `postgres` (`backend-ts/src/shared/database.ts`).
  - Migrations: Drizzle config and generated migration artifacts (`backend-ts/drizzle.config.ts`, `backend-ts/drizzle/**`).

**File Storage:**
- Supabase Storage - User avatars, submissions, assignment instruction images.
  - SDK/Client: `@supabase/supabase-js` in frontend and backend.
  - Auth: Service role key on backend (`SUPABASE_SERVICE_ROLE_KEY`), anon key on frontend (`VITE_SUPABASE_ANON_KEY`).
  - Buckets observed in code: `avatars`, `submissions`, `assignment-descriptions`, `assignment-descriptions-fallback`.

**Caching:**
- No dedicated cache layer in ClassiFi app code.
- Judge0 stack uses Redis internally when self-hosted (`judge0/docker-compose.yml`).

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Primary identity provider for login/session/token validation.
  - Frontend implementation: Supabase client with PKCE + persisted session (`frontend/src/data/api/supabaseClient.ts`).
  - Backend implementation: Supabase admin/user auth adapter (`backend-ts/src/services/supabase-auth.adapter.ts`).
  - Token flow: Frontend obtains access token from Supabase session, sends `Authorization: Bearer`, backend verifies via Supabase.

**OAuth Integrations:**
- No explicit third-party OAuth provider wiring in repository code; auth flows are Supabase-managed email/password and reset flows.

## Monitoring & Observability

**Error Tracking:**
- No explicit external error tracking SDK (for example Sentry) in active ClassiFi frontend/backend code.

**Analytics:**
- No product analytics SDK integration detected.

**Logs:**
- Structured backend logging via Pino (`backend-ts/src/shared/logger.ts`) to platform stdout/stderr.
- Operational logs available through hosting providers (Render/Vercel/GitHub Actions).

## CI/CD & Deployment

**Hosting:**
- Vercel - Frontend SPA hosting (`frontend/vercel.json`).
- Render - Backend web service hosting via Blueprint (`render.yaml`).

**CI Pipeline:**
- GitHub Actions - CI and security scans (`.github/workflows/ci.yml`, `.github/workflows/codeql.yml`).
  - CI runs backend lint/typecheck/tests and frontend lint/tests/build.
  - Optional deploy hook calls for Render and Vercel use repository secrets `RENDER_DEPLOY_HOOK_URL` and `VERCEL_DEPLOY_HOOK_URL`.

## Environment Configuration

**Development:**
- Required env groups:
  - Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`, optional assignment instructions bucket var.
  - Backend: Supabase keys, `DATABASE_URL`, `JUDGE0_URL`, semantic service vars, email provider vars.
  - Semantic service: `MODEL_PATH`/`PORT`/token length (Pydantic settings).
- Service orchestration:
  - Optional local Judge0 via Docker Compose.
  - Optional local semantic service via Docker Compose.

**Staging:**
- Backend supports `ENVIRONMENT=staging` in validated config.
- Separate service URLs/credentials expected through env-var substitution.

**Production:**
- Secrets expected in hosting dashboards/secrets stores (Render, Vercel, GitHub Actions secrets).
- Backend enforces strict env validation at startup (`backend-ts/src/shared/config.ts`).

## Webhooks & Callbacks

**Incoming:**
- No inbound third-party webhook endpoints detected in backend route modules.

**Outgoing:**
- CI deploy hook callbacks: GitHub Actions posts to Render/Vercel deploy hook URLs when configured (`.github/workflows/ci.yml`).
- Supabase password reset callback flow: backend triggers reset email with `redirectTo`, returning user to frontend reset path (`backend-ts/src/services/supabase-auth.adapter.ts`, frontend auth routes).

---

*Integration audit: 2026-03-08*
*Update when adding/removing external services*
