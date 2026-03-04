# ClassiFi Integrations Map

## Integration Overview
- Frontend talks to backend REST APIs through `frontend/src/data/api/apiClient.ts` using `VITE_API_BASE_URL` from `frontend/.env.example`.
- Authentication and object storage are built around Supabase across both apps (`frontend/src/data/api/supabaseClient.ts`, `backend-ts/src/shared/supabase.ts`).
- Core relational data is in PostgreSQL via Drizzle (`backend-ts/src/shared/database.ts`, `backend-ts/src/models/index.ts`).
- Code execution is delegated to Judge0 (`backend-ts/src/services/judge0.service.ts`, `judge0/docker-compose.yml`).
- Semantic plagiarism scoring is delegated to a Python FastAPI sidecar (`backend-ts/src/modules/plagiarism/semantic-similarity.client.ts`, `semantic-service/main.py`).
- User notifications use DB-backed delivery records with email provider fallbacks (`backend-ts/src/modules/notifications/notification-queue.service.ts`, `backend-ts/src/services/email/fallback.service.ts`).

## External APIs and Services

### 1. Supabase (Auth + Storage)
- Frontend Supabase client initialization: `frontend/src/data/api/supabaseClient.ts`.
- Frontend auth session listener/adapter: `frontend/src/data/api/supabaseAuthAdapter.ts`.
- Backend service-role and anon clients: `backend-ts/src/shared/supabase.ts`.
- Backend auth operations (create/update/delete users, token checks): `backend-ts/src/services/supabase-auth.adapter.ts`.
- Backend storage operations (upload/download/delete/signed URL): `backend-ts/src/services/storage.service.ts`.
- Frontend avatar upload path uses Supabase storage bucket `avatars`: `frontend/src/data/repositories/userRepository.ts`.
- Config keys: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in `backend-ts/.env.example`; `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in `frontend/.env.example`.

### 2. Backend REST API (Frontend-consumed Service)
- Frontend API base URL defaults to `http://localhost:8001/api/v1` in `frontend/src/data/api/apiClient.ts`.
- API route registration and protected scopes are in `backend-ts/src/api/routes/v1/index.ts`.
- Backend app setup with CORS/multipart/docs is in `backend-ts/src/app.ts`.
- API docs are exposed by Swagger setup in `backend-ts/src/api/plugins/swagger.ts`.

### 3. Judge0 Code Execution
- Integration client and protocol mapping: `backend-ts/src/services/judge0.service.ts`.
- Judge0 URL configured from `JUDGE0_URL` in `backend-ts/src/shared/config.ts` and `backend-ts/.env.example`.
- Local self-hosted Judge0 topology (server/worker/db/redis): `judge0/docker-compose.yml`.
- Judge0 config template with Postgres/Redis credentials and limits: `judge0/judge0.conf.template`.

### 4. Semantic Similarity Sidecar (GraphCodeBERT)
- Backend HTTP client for semantic scoring: `backend-ts/src/modules/plagiarism/semantic-similarity.client.ts`.
- Plagiarism service consumes semantic scores: `backend-ts/src/modules/plagiarism/plagiarism.service.ts`.
- Sidecar API endpoints (`/health`, `/similarity`): `semantic-service/main.py`.
- Sidecar model loading and inference logic: `semantic-service/app/predictor.py`.
- Sidecar runtime/deployment config: `semantic-service/docker-compose.yml`, `semantic-service/Dockerfile`.
- Config keys: `SEMANTIC_SERVICE_URL`, `SEMANTIC_SIMILARITY_TIMEOUT_MS`, `SEMANTIC_SIMILARITY_MAX_RETRIES`, `SEMANTIC_SIMILARITY_MAX_CONCURRENT_REQUESTS` in `backend-ts/src/shared/config.ts`.

### 5. Email Delivery Providers
- Provider orchestration (SendGrid primary + SMTP fallback): `backend-ts/src/services/email/fallback.service.ts`.
- Provider factory and environment gating: `backend-ts/src/services/email/index.ts`.
- SendGrid implementation: `backend-ts/src/services/email/sendgrid.service.ts`.
- SMTP implementation via Nodemailer: `backend-ts/src/services/email/smtp.service.ts`.
- Config keys: `SENDGRID_API_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`, `EMAIL_FROM_NAME` in `backend-ts/.env.example` and validated in `backend-ts/src/shared/config.ts`.

## Databases and Persistence
- Primary app database is PostgreSQL via Drizzle/Postgres client in `backend-ts/src/shared/database.ts`.
- Table models are re-exported through `backend-ts/src/models/index.ts` and implemented under `backend-ts/src/modules/*/*.model.ts`.
- Notification delivery state persists in `notification_deliveries` model (`backend-ts/src/modules/notifications/notification-delivery.model.ts`).
- Notification and channel preferences persist in `backend-ts/src/modules/notifications/notification.model.ts` and `backend-ts/src/modules/notifications/notification-preference.model.ts`.
- Drizzle generation config is in `backend-ts/drizzle.config.ts` (configured output path `./drizzle`).

## Authentication Providers
- Single auth provider is Supabase Auth.
- Frontend signs in and tracks session via Supabase SDK in `frontend/src/data/api/supabaseAuthAdapter.ts`.
- Backend validates and manages auth users using Supabase Admin/Auth methods in `backend-ts/src/services/supabase-auth.adapter.ts`.
- Auth API endpoints are mounted under `/api/v1/auth` via `backend-ts/src/api/routes/v1/index.ts` and implemented in `backend-ts/src/modules/auth/`.

## Messaging, Queues, and Webhooks
- No third-party message broker (Kafka/RabbitMQ/SQS) is integrated in the application backend.
- Notification processing uses an internal DB-backed queue pattern in `backend-ts/src/modules/notifications/notification-queue.service.ts` with retry scheduling via timers.
- In-app notifications are persisted/read through notification repositories and APIs in `backend-ts/src/modules/notifications/`.
- Email notification dispatch is asynchronous through the queue + provider services (`backend-ts/src/modules/notifications/notification.service.ts`, `backend-ts/src/services/email/*`).
- Webhook integrations are not defined in route or service layers (no dedicated webhook controller observed under `backend-ts/src/modules/` or `backend-ts/src/api/routes/`).

## Deployment/Environment Integration Points
- Render deployment blueprint and environment mapping are in `render.yaml`.
- Backend CORS ties frontend origin integration via `FRONTEND_URL` and `ALLOWED_ORIGINS` (`backend-ts/src/shared/config.ts`, `backend-ts/.env.example`).
- Frontend and backend local integration defaults are `http://localhost:5173` and `http://localhost:8001` (`frontend/.env.example`, `backend-ts/.env.example`).
