# ClassiFi Backend (TypeScript)

A TypeScript/Fastify backend implementation for the ClassiFi platform, following the controller-service-repository pattern.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Architecture](#architecture)
4. [Configuration](#configuration)
5. [API Reference](#api-reference)
6. [Database Models](#database-models)
7. [Services](#services)
8. [Repositories](#repositories)
9. [Middleware & Plugins](#middleware--plugins)
10. [Error Handling](#error-handling)
11. [Testing](#testing)
12. [Development Guidelines](#development-guidelines)

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Supabase project (for auth & storage)

### Installation

```bash
cd backend-ts
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and configure:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Application
APP_NAME=ClassiFi API
APP_VERSION=1.0.0
DEBUG=true
ENVIRONMENT=development
PORT=8001

# CORS
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# API
API_PREFIX=/api
```

### Running the Server

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

### Frontend Redirect Configuration

`FRONTEND_URL` is also used when generating authentication email redirects:

- Signup confirmation emails redirect to `${FRONTEND_URL}/login`
- Password reset emails redirect to `${FRONTEND_URL}/reset-password`

For hosted environments, set `FRONTEND_URL` to the public frontend origin and make sure the same origin/path is allowed in Supabase Auth redirect settings. Do not leave this value pointed at `localhost` in production.

### Available Scripts

| Script                  | Description                                                  |
| ----------------------- | ------------------------------------------------------------ |
| `npm run dev`           | Start the backend with `tsx watch`                           |
| `npm run build`         | Compile TypeScript and rewrite path aliases with `tsc-alias` |
| `npm start`             | Run the compiled production server                           |
| `npm run test`          | Run the full Vitest suite                                    |
| `npm run test:watch`    | Run Vitest in watch mode                                     |
| `npm run test:coverage` | Generate coverage output                                     |
| `npm run typecheck`     | Run TypeScript without emitting                              |
| `npm run lint`          | Lint the codebase with ESLint                                |
| `npm run format`        | Format backend source and tests with Prettier                |
| `npm run db:generate`   | Generate Drizzle migrations                                  |
| `npm run db:migrate`    | Apply Drizzle migrations                                     |
| `npm run db:push`       | Push schema changes directly to the database                 |
| `npm run db:studio`     | Open Drizzle Studio                                          |

---

## Project Structure

```text
backend-ts/
|- src/
|  |- api/                    # Transport layer (middlewares/plugins/routes/common schemas)
|  |  |- middlewares/
|  |  |- plugins/
|  |  |- routes/v1/index.ts
|  |  |- schemas/common.schema.ts
|  |  `- utils/
|  |- modules/                # Feature modules (controller/service/repository/model/schema)
|  |  |- auth/
|  |  |- users/
|  |  |- classes/
|  |  |- assignments/
|  |  |- submissions/
|  |  |- test-cases/
|  |  |- gradebook/
|  |  |- dashboard/
|  |  |- notifications/
|  |  |- enrollments/
|  |  |- modules/
|  |  |- plagiarism/
|  |  `- admin/
|  |- services/               # Cross-cutting services (email, adapters, interfaces)
|  |- repositories/           # Shared repositories only (base/shared query repos)
|  |- models/                 # Shared model barrel exports
|  |- shared/                 # Config, DI container, database, errors, logger, shared utils
|  |- lib/                    # Library/engine code (plagiarism engine)
|  |- app.ts
|  `- server.ts
|- tests/
|- package.json
|- tsconfig.json
`- vitest.config.ts
```

---

## Architecture

### Controller-Service-Repository Pattern

```text
+--------------+    Handles HTTP requests, validation
|  Controller  |
+------+-------+
       |
+------+-------+    Business logic, domain rules
|   Service    |
+------+-------+
       |
+------+-------+    Data access, database queries
|  Repository  |
+--------------+
```

### Dependency Injection

Uses **tsyringe** for constructor injection:

```typescript
@injectable()
export class AuthService {
  constructor(
    @inject(DI_TOKENS.repositories.user) private userRepo: UserRepository,
  ) {}
}
```

Resolve from container in controllers:

```typescript
const authService = container.resolve<AuthService>(DI_TOKENS.services.auth)
```

### Feature Module Layer

The backend now uses a module-first layout under `src/modules/*`.

- `src/modules/auth`
- `src/modules/users`
- `src/modules/classes`
- `src/modules/assignments`
- `src/modules/submissions`
- `src/modules/gradebook`
- `src/modules/dashboard`
- `src/modules/notifications`
- `src/modules/enrollments`
- `src/modules/plagiarism`
- `src/modules/admin`
- `src/modules/test-cases`
- `src/modules/modules`

Current behavior:

- Feature implementations (controllers, services, repositories, schemas, models) are colocated in their module folders.
- Feature-specific helper services are colocated with their module (for example, plagiarism helper services under `src/modules/plagiarism` and late penalty logic under `src/modules/assignments`).
- Feature-specific mappers/guards/helpers are colocated with their module (for example, `src/modules/*/*.mapper.ts`, `src/modules/classes/class.guard.ts`).
- Route registration in `src/api/routes/v1/index.ts` imports routable module entry points for auth, classes, modules, assignments, submissions, dashboards, plagiarism, users, admin, test cases, gradebook, and notifications.
- Protected route registration is centralized in a dedicated `protectedRoutes` scope that applies the auth middleware once and then mounts the authenticated route groups.
- Internal/shared modules that are not mounted directly as route groups can still be consumed through services without requiring their own route entrypoint.
- Shared cross-cutting concerns remain in shared layer folders such as `src/shared`, `src/api/middlewares`, `src/services/interfaces`, and `src/services/email`.

---

## Configuration

### Environment Validation

Environment variables are validated at startup using Zod. Invalid config causes immediate failure with clear error messages.

```typescript
// src/shared/config.ts
const EnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  PORT: z.string().transform(Number).default('8001'),
  // ...
});

export const env = validateEnv(); // Fails fast if invalid
export const settings = { ... };  // Typed settings object
```

### Test Execution Timeout

The backend includes configurable timeout protection for test execution to prevent long-running or infinite loop code from blocking the server:

- **Environment Variable**: `TEST_EXECUTION_TIMEOUT_SECONDS` (default: 60 seconds)
- **Endpoint**: `POST /api/v1/submissions/:submissionId/run-tests`
- **Behavior**:
  - If tests complete within the timeout, returns 200 with results
  - If tests exceed the timeout, returns 504 Gateway Timeout with error message
  - Fastify request timeout is automatically set to `TEST_EXECUTION_TIMEOUT_SECONDS + 5` to allow graceful timeout responses

**Configuration Example**:

```env
# Set timeout to 90 seconds for complex test suites
TEST_EXECUTION_TIMEOUT_SECONDS=90
```

**Response on Timeout (504)**:

```json
{
  "success": false,
  "message": "Test execution timeout",
  "error": "Tests did not complete within <TEST_EXECUTION_TIMEOUT_SECONDS> seconds. This may indicate an infinite loop, excessive computation, or system overload."
}
```

_Note: The timeout value in the error message reflects the configured `TEST_EXECUTION_TIMEOUT_SECONDS` environment variable (default: 60 seconds)._

### Automatic Similarity Analysis

Similarity checks can run automatically after submission without requiring a manual button press.
This flow uses in-memory scheduling plus periodic reconciliation and does not require new database tables.

- **`AUTO_SIMILARITY_ENABLED`** (default: `true`) enables/disables automation.
- **`AUTO_SIMILARITY_DEBOUNCE_MS`** (default: `45000`) debounces repeated submissions per assignment.
- **`AUTO_SIMILARITY_RECONCILIATION_INTERVAL_MS`** (default: `180000`) controls the safety-net scan interval.
- **`AUTO_SIMILARITY_MIN_LATEST_SUBMISSIONS`** (default: `2`) minimum latest submissions required before analysis runs.
- **`SEMANTIC_SIMILARITY_MAX_CONCURRENT_REQUESTS`** (default: `2`) caps semantic sidecar requests in flight per assignment analysis to prevent timeout-heavy fan-out.
- **`SEMANTIC_SIMILARITY_TIMEOUT_MS`** (default: `10000`) sets per-request semantic sidecar timeout.
- **`SEMANTIC_SIMILARITY_MAX_RETRIES`** (default: `1`) retries transient semantic failures (timeouts/5xx/429) before using fallback `semanticScore=0`.
- **`PLAGIARISM_STRUCTURAL_WEIGHT`** (default: `0.7`) sets the structural contribution to hybrid plagiarism scoring.
- **`PLAGIARISM_SEMANTIC_WEIGHT`** (default: `0.3`) sets the semantic contribution to hybrid plagiarism scoring.

**Behavior**:

- Submission success is not blocked by similarity scheduling failures.
- Rapid submission bursts for the same assignment are coalesced into one run.
- Reconciliation re-triggers analysis if reports are stale or missing after restarts.
- Assignment report persistence acquires an assignment-scoped transaction lock to prevent duplicate latest reports during concurrent analysis runs.
- Assignment report `averageSimilarity`, `highestSimilarity`, and pair ordering follow the weighted hybrid score instead of structural score alone.
- When an assignment enables similarity deduction, persisted assignment reports also refresh latest-submission similarity penalties through `SimilarityPenaltyService`.

### Programming Language Support

ClassiFi supports three programming languages for assignments and code execution:

- **Python** (`.py` files)
- **Java** (`.java` files)
- **C** (`.c` files)

The programming language is specified at assignment creation and enforced during:

- File upload validation
- Code execution via Judge0
- Plagiarism detection with Tree-Sitter
- Syntax highlighting in the IDE

---

## API Reference

**Base URL**: `http://localhost:8001/api/v1`

**Swagger UI**: `http://localhost:8001/docs`

### Authentication

| Method | Endpoint                | Description               |
| ------ | ----------------------- | ------------------------- |
| POST   | `/auth/register`        | Register new user         |
| POST   | `/auth/login`           | Login with email/password |
| POST   | `/auth/verify`          | Verify access token       |
| POST   | `/auth/forgot-password` | Request password reset    |
| POST   | `/auth/logout`          | Logout (client-side)      |

Teacher self-registration approval behavior:

- Student self-registrations create active accounts immediately.
- Teacher self-registrations create inactive accounts by setting `users.is_active = false`.
- Teacher registration still returns success so the UI can complete the sign-up flow, but inactive teachers cannot access the system yet.
- Both `/auth/login` and `/auth/verify` reject inactive teacher accounts with `403` and this exact message:
  - `Your access is pending administrator approval. You will be able to sign in once your account has been reviewed and approved by the admin`
- In v1, `users.is_active` doubles as both the approval gate and the general access gate for teachers. This means all inactive teachers are treated as pending administrator approval until a separate approval state is introduced.
- Inactive student and admin accounts are treated as deactivated accounts. Authentication and token verification reject them with `403` and this exact message:
  - `Your account has been deactivated. Please contact an administrator.`
- Admin approval in v1 reuses the existing user status toggle (`PATCH /admin/users/:id/status`) to activate the teacher account.
- When an admin activates an inactive teacher account, the backend sends the teacher an approval email so they know they can sign in.
- The approval confirmation is email-only in v1 and does not create an in-app notification record.

### User Management

| Method | Endpoint                            | Description                                |
| ------ | ----------------------------------- | ------------------------------------------ |
| GET    | `/user/me`                          | Get current user's profile                 |
| PATCH  | `/user/me/avatar`                   | Update avatar URL                          |
| PATCH  | `/user/me/notification-preferences` | Update user notification delivery settings |
| DELETE | `/user/me`                          | Reject self-service account deactivation     |

Account deactivation and deletion safety rules:

- Self-service account deactivation is blocked for all roles. Account deactivation must be handled by an administrator.
- Teacher accounts can be deactivated by admins only after every assigned class has been reassigned.
- Admin deactivation of a teacher with assigned classes returns `409 Conflict` and instructs the admin to reassign classes first.

### Classes

| Method | Endpoint                      | Description           |
| ------ | ----------------------------- | --------------------- |
| POST   | `/classes`                    | Create a class        |
| GET    | `/classes/:id`                | Get class by ID       |
| GET    | `/classes/teacher/:teacherId` | Get teacher's classes |
| PUT    | `/classes/:id`                | Update class          |
| DELETE | `/classes/:id`                | Delete class          |
| GET    | `/classes/:id/students`       | Get enrolled students |
| GET    | `/classes/:id/assignments`    | Get class assignments |
| POST   | `/classes/:id/assignments`    | Create assignment     |

### Student Dashboard

| Method | Endpoint                         | Description                               |
| ------ | -------------------------------- | ----------------------------------------- |
| GET    | `/student/dashboard/:studentId`  | Get student dashboard overview            |
| GET    | `/student/dashboard/:studentId/classes` | Get enrolled classes for a student |
| GET    | `/student/dashboard/:studentId/assignments` | Get pending assignments for a student |
| POST   | `/student/dashboard/join`        | Join a class using a class code           |
| POST   | `/student/dashboard/leave`       | Leave a class                             |

Student enrolled-classes query behavior:

- `GET /student/dashboard/:studentId/classes` remains active-only by default.
- Pass `includeArchived=true` to include archived classes in the response alongside active enrollments.
- This allows the student `My Classes` page to render both `Current classes` and `Archived classes` without changing the dashboard overview payload.

**Class Detail Response** (`GET /classes/:id`):

- Includes `instructorName` (teacher's full name)
- Includes `schedule` object with `days`, `startTime`, `endTime`
- Includes `studentCount` (number of enrolled students)

**Class Assignments Response** (`GET /classes/:id/assignments`):

- For students: Includes `submittedAt`, `grade`, and `maxGrade` fields
- `grade` is null if not yet graded
- `maxGrade` defaults to 100 if not specified
- For teacher-facing assignment progress, aggregate `studentCount` values are scoped to active students only so pending/missing submission metrics do not include inactive enrollments

**Class Students Response** (`GET /classes/:id/students`):

- Accepts optional query `status=active|inactive|all`
- Each returned student includes `isActive`
- This supports the teacher roster rule of defaulting to active students while still allowing explicit review of inactive/deactivated students

**Gradebook CSV Export** (`GET /gradebook/classes/:classId/export`):

- Includes all gradebook students, including inactive students, so historical grade records remain exportable.
- Adds a `Status` column with `Active` or `Inactive` for downstream filtering and audit clarity.
- Uses the same rank-based student ordering as the teacher gradebook view: active students first, then points-weighted current-standing percentage descending, with alphabetical name order only as a tie-breaker.
- Uses the same current-standing average policy as the teacher gradebook view: no submission counts as `0`, submitted-but-ungraded work is excluded until a grade exists, and the percentage is weighted by each assignment's total score.

### Modules

| Method | Endpoint                     | Description                  |
| ------ | ---------------------------- | ---------------------------- |
| POST   | `/classes/:classId/modules`  | Create a module              |
| GET    | `/classes/:classId/modules`  | Get modules with assignments |
| PUT    | `/modules/:moduleId`         | Rename a module              |
| PATCH  | `/modules/:moduleId/publish` | Toggle module publish        |
| DELETE | `/modules/:moduleId`         | Delete module (cascades)     |

**Module Design**:

- Modules are assignment grouping containers within a class (e.g., "Module 1", "Midterm", "Finals")
- Every assignment optionally belongs to a module via the `moduleId` foreign key
- `GET /classes/:classId/modules` returns modules ordered by creation date (ascending), each including its nested assignments with submission counts
- Teacher-facing module assignment progress uses active-student totals only; inactive students' historical submissions remain accessible through submission review endpoints
- Deleting a module cascades to all assignments within it
- Modules support publish/unpublish toggling (`isPublished` boolean)
- A "General" module is auto-created per class during migration for ungrouped assignments

### Assignments & Submissions

| Method | Endpoint                                        | Description                   |
| ------ | ----------------------------------------------- | ----------------------------- |
| GET    | `/assignments/:id`                              | Get assignment details        |
| PUT    | `/assignments/:id`                              | Update assignment             |
| DELETE | `/assignments/:id`                              | Delete assignment             |
| POST   | `/submissions`                                  | Submit assignment (multipart) |
| GET    | `/submissions/history/:assignmentId/:studentId` | Get submission history        |
| GET    | `/submissions/assignment/:assignmentId`         | Get all submissions           |
| GET    | `/submissions/student/:studentId`               | Get student's submissions     |

Authorization notes:

- Assignment mutation endpoints (`PUT /assignments/:id`, `DELETE /assignments/:id`) are intended for teacher/admin workflows.
- Student-facing flows should not expose assignment management actions in the UI.

**Assignment Instructions Content**:

- Assignment create/update supports both text (`instructions`) and an optional image field (`instructionsImageUrl`)
- Assignment updates also support reassigning the record to a different class module through `moduleId`
- Business rule requires at least one instructions surface: text or image
- Assignment deadline is optional (`deadline` may be `null`) to support assignment with no due date
- Assignment create/update also supports late submission policy fields (`allowLateSubmissions`, `latePenaltyConfig`)
- Assignment create/update also supports the assignment-level similarity deduction toggle (`enableSimilarityPenalty`)
- Similarity deduction uses a backend-managed conservative default policy in v1:
  - `75%` to `<85%` hybrid similarity is warning-only
  - deductions start at `85%` based on the hybrid similarity band alone
  - only the highest qualifying pair is applied to the latest submission
  - automatic deduction is capped at `20%`
- If `allowLateSubmissions` is false, submissions after deadline are rejected when a deadline exists
- If `allowLateSubmissions` is true, late submissions are accepted and penalties are computed from the stored config (or default fallback) when a deadline exists
- If `enableSimilarityPenalty` is false, no automatic similarity deduction is applied
- Late penalty tiers apply immediately after the deadline (no grace-period window), with optional `rejectAfterHours` cutoff
- Instruction images are stored in the `assignment-descriptions` bucket and are cleaned up on image replacement, assignment deletion, and class deletion
- Storage setup is provisioned via SQL migration scripts under `backend-ts/drizzle/`

### Gradebook

| Method | Endpoint                                               | Description              |
| ------ | ------------------------------------------------------ | ------------------------ |
| GET    | `/gradebook/classes/:classId`                          | Get class gradebook      |
| GET    | `/gradebook/classes/:classId/export`                   | Export CSV               |
| GET    | `/gradebook/students/:studentId`                       | Get student grades       |
| GET    | `/gradebook/students/:studentId/classes/:classId`      | Get student class grades |
| GET    | `/gradebook/students/:studentId/classes/:classId/rank` | Get student rank         |
| POST   | `/gradebook/submissions/:submissionId/override`        | Override grade           |
| DELETE | `/gradebook/submissions/:submissionId/override`        | Remove override          |
| GET    | `/gradebook/assignments/:id/late-penalty`              | Get late penalty config  |
| PUT    | `/gradebook/assignments/:id/late-penalty`              | Set late penalty config  |

Gradebook scoring notes:

- `grade` is the displayed score returned to clients.
- Automatic similarity deductions are applied to the automatic grade after test scoring and late penalties.
- Manual teacher overrides still win as the final displayed score and are stored separately in `override_grade`.
- Class gradebook rows also include each student's `isActive` flag.
- Inactive/deactivated students remain in gradebook responses and exports so historical academic records are preserved.

### Test Cases & Code Testing

| Method | Endpoint                                        | Description                    |
| ------ | ----------------------------------------------- | ------------------------------ |
| GET    | `/assignments/:assignmentId/test-cases`         | Get test cases                 |
| POST   | `/assignments/:assignmentId/test-cases`         | Create test case               |
| PUT    | `/test-cases/:testCaseId`                       | Update test case               |
| DELETE | `/test-cases/:testCaseId`                       | Delete test case               |
| PUT    | `/assignments/:assignmentId/test-cases/reorder` | Reorder test cases             |
| POST   | `/code/run-tests`                               | Run tests preview              |
| GET    | `/submissions/:submissionId/test-results`       | Get submission results         |
| POST   | `/submissions/:submissionId/run-tests`          | Trigger manual test run        |
| GET    | `/code/health`                                  | Check execution service status |

Notes:

- `GET /submissions/:submissionId/test-results` accepts optional query `includeHiddenDetails=true` for teacher/admin review flows that need hidden test-case input/output details.
- Hidden detail exposure is enforced server-side: the query flag is honored only when `request.user.role` is `teacher` or `admin`; non-privileged callers are forced to masked hidden-case fields.

### Plagiarism Detection

The plagiarism detection system uses a custom implementation based on Winnowing algorithm with Tree-Sitter for code parsing. It supports Python, Java, and C languages.

| Method | Endpoint                                                          | Description                                         |
| ------ | ----------------------------------------------------------------- | --------------------------------------------------- |
| POST   | `/plagiarism/analyze`                                             | Analyze files                                       |
| POST   | `/plagiarism/analyze/assignment/:assignmentId`                    | Analyze full assignment                             |
| GET    | `/plagiarism/reports/:reportId`                                   | Get report details                                  |
| DELETE | `/plagiarism/reports/:reportId`                                   | Delete report                                       |
| GET    | `/plagiarism/reports/:reportId/pairs/:pairId`                     | Get match pair details                              |
| GET    | `/plagiarism/results/:resultId/details`                           | Get result details                                  |
| POST   | `/plagiarism/cross-class/analyze/assignment/:assignmentId`        | Analyze matching assignments across classes         |
| GET    | `/plagiarism/cross-class/reports/:reportId`                       | Get a saved cross-class report                      |
| GET    | `/plagiarism/cross-class/reports/assignment/:assignmentId/latest` | Get the latest cross-class report for an assignment |
| GET    | `/plagiarism/cross-class/results/:resultId/details`               | Get cross-class result details                      |
| DELETE | `/plagiarism/cross-class/reports/:reportId`                       | Delete a cross-class report manually                |

**Supported Languages**: Python, Java, C

**Detection Features**:

- AST-based tokenization using Tree-Sitter
- Winnowing fingerprinting algorithm
- Configurable k-gram size and window size
- Fragment-level match detection with line/column positions
- Similarity scoring and overlap metrics

**Pairwise-First Analysis**:

The plagiarism API now focuses on assignment-level review workflows:

- Report responses include `submissions` plus pair rows so the frontend can render true singleton nodes alongside suspicious links.
- Assignment-level analyze/report responses also include `generatedAt`, allowing the frontend to stamp exported evidence PDFs with both report-generation time and download time.
- Pair rows include both students plus structural, semantic, and hybrid similarity scores alongside overlap and longest match.
- Clients can sort/filter pair results to prioritize high-risk comparisons and generate threshold-aware class or pairwise PDF evidence on the frontend without needing a server-side PDF endpoint.
- Detailed fragment/code inspection remains available through result-detail endpoints.
- Cross-class result-detail responses include both student names and submission timestamps so clients can render the same temporal review cues used by intra-assignment comparisons.
- `POST /plagiarism/analyze/assignment/:assignmentId` reuses the latest existing report when no new/latest submissions have been added since that report was generated.
- The system keeps only one report per assignment; when a new report is generated (or a reusable one is reviewed), older reports for that assignment are deleted.
- Cross-class reports are retained as historical records so previously opened cross-class result IDs and report deep links remain valid even after newer cross-class comparisons are generated.
- `GET /plagiarism/cross-class/reports/assignment/:assignmentId/latest` should be used by clients that want the newest saved cross-class comparison without triggering a fresh write.
- Automatic similarity scheduling runs after successful submissions (when at least two latest submissions exist) and keeps manual analyze endpoint support for explicit teacher-initiated checks.
- When an admin reassigns a class to another teacher, historical similarity report ownership for that class is also reassigned so report access follows the new class owner.

### Notifications

The notification system provides real-time updates to users about important events in the platform. It supports in-app notifications with optional email delivery.

| Method | Endpoint                      | Description                    |
| ------ | ----------------------------- | ------------------------------ |
| GET    | `/notifications`              | Get user notifications         |
| GET    | `/notifications/unread-count` | Get unread notification count  |
| PATCH  | `/notifications/:id/read`     | Mark notification as read      |
| PATCH  | `/notifications/read-all`     | Mark all notifications as read |
| DELETE | `/notifications/:id`          | Delete notification            |

**Notification Types**:

| Type                 | Trigger Event              | Recipients        |
| -------------------- | -------------------------- | ----------------- |
| `ASSIGNMENT_CREATED` | Teacher creates assignment | Enrolled students |
| `SUBMISSION_GRADED`  | Submission grade changes with explicit grading reason metadata | Student |
| `NEW_USER_REGISTERED` | Teacher self-registers and awaits approval | Admins |

**Features**:

- In-app notifications with real-time unread count
- Post-commit email delivery for grade and feedback write flows
- Configurable notification channels (IN_APP, EMAIL)
- Pagination support for notification history
- User-specific notification filtering
- Authorization checks (users can only access their own notifications)

Teacher approval notification behavior:

- Admin registration notifications are sent only for teacher self-signups in v1.
- The reused `NEW_USER_REGISTERED` template is approval-oriented and tells admins that a teacher account request is awaiting review and activation.

**Email Configuration**:

The notification system supports multiple email providers:

**Environment Variables**:

```env
# Email Provider (sendgrid, smtp, or supabase)
EMAIL_PROVIDER=sendgrid

# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Sender Information
EMAIL_FROM=noreply@classifi.com
EMAIL_FROM_NAME=ClassiFi

# Frontend URL (for links in emails)
FRONTEND_URL=http://localhost:5173
```

**Supported Email Providers**:

1. **SendGrid** - Recommended for production
   - Set `EMAIL_PROVIDER=sendgrid`
   - Requires `SENDGRID_API_KEY`
2. **SMTP** - For custom email servers
   - Set `EMAIL_PROVIDER=smtp`
   - Requires `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
3. **Supabase** - Uses Supabase's built-in email service
   - Set `EMAIL_PROVIDER=supabase`
   - Uses existing Supabase configuration

**Email Templates**:

The system includes pre-built HTML email templates for:

- Assignment creation notifications
- Submission grading notifications
- Password reset emails
- Supabase-hosted password changed notifications

Templates include:

- Responsive HTML design
- Action buttons linking to relevant pages
- Assignment/submission details
- Branding and styling

**Email Delivery Behavior**:

Notifications separate write commits from email delivery:

- In-app notification rows are persisted during the main write flow when that channel is enabled
- Email sends for grade and feedback updates happen only after the surrounding write transaction commits
- Failed email attempts are logged for operational visibility and do not partially commit the caller's primary write
- In-app notifications are stored only when the user has in-app notifications enabled

**Example Response** (`GET /notifications`):

```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "userId": 123,
      "type": "ASSIGNMENT_CREATED",
      "title": "New Assignment: Homework 1",
      "message": "A new assignment has been posted in CS101",
      "metadata": {
        "assignmentId": 456,
        "assignmentTitle": "Homework 1",
        "className": "CS101",
        "classId": 10,
        "dueDate": "12/31/2024",
        "assignmentUrl": "http://localhost:5173/dashboard/assignments/456"
      },
      "isRead": false,
      "readAt": null,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "hasMore": true
  }
}
```

**Example Response** (`GET /notifications/unread-count`):

```json
{
  "success": true,
  "unreadCount": 5
}
```

**Query Parameters** (`GET /notifications`):

- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 20, max: 100) - Items per page
- `unreadOnly` (boolean, default: false) - Filter to show only unread notifications

### Dashboard

| Method | Endpoint                        | Description       |
| ------ | ------------------------------- | ----------------- |
| GET    | `/student/dashboard/:studentId` | Student dashboard |
| POST   | `/student/dashboard/join`       | Join class        |
| POST   | `/student/dashboard/leave`      | Leave class       |
| GET    | `/teacher/dashboard/:teacherId` | Teacher dashboard |

### Admin

#### User Management

| Method | Endpoint                | Description      |
| ------ | ----------------------- | ---------------- |
| GET    | `/admin/users`          | List users       |
| POST   | `/admin/users`          | Create user      |
| GET    | `/admin/users/:id`      | Get user details |
| PUT    | `/admin/users/:id`      | Update user      |
| PATCH  | `/admin/users/:id/role` | Update user role |
| DELETE | `/admin/users/:id`      | Deactivate user  |

Admin user deactivation policy:

- Admin user deactivation sets `users.is_active` to `false` and preserves the user row, Supabase Auth user, enrollments, submissions, grades, avatars, and files.
- Deactivated student and admin accounts are blocked by the authentication guard on login and token verification.
- Teacher accounts with assigned classes remain blocked from this action until their classes are reassigned.

#### Class Management

| Method | Endpoint                         | Description           |
| ------ | -------------------------------- | --------------------- |
| GET    | `/admin/classes`                 | List classes          |
| POST   | `/admin/classes`                 | Create class          |
| GET    | `/admin/classes/:id`             | Get class details     |
| PUT    | `/admin/classes/:id`             | Update class          |
| DELETE | `/admin/classes/:id`             | Delete class          |
| PATCH  | `/admin/classes/:id/reassign`    | Reassign teacher      |
| PATCH  | `/admin/classes/:id/archive`     | Archive class         |
| GET    | `/admin/classes/:id/assignments` | Get class assignments |

#### Enrollment Management

| Method | Endpoint                                 | Description        |
| ------ | ---------------------------------------- | ------------------ |
| GET    | `/admin/classes/:id/students`            | Get class students |
| POST   | `/admin/classes/:id/students`            | Enroll student     |
| DELETE | `/admin/classes/:id/students/:studentId` | Remove student     |
| GET    | `/admin/enrollments`                     | List enrollments   |
| POST   | `/admin/enrollments/transfer`            | Transfer student   |

#### Analytics

| Method | Endpoint          | Description       |
| ------ | ----------------- | ----------------- |
| GET    | `/admin/stats`    | System statistics |
| GET    | `/admin/activity` | Recent activity   |

---

## Database Models

### Entity Relationship Diagram

```text
[User] <- [Class] <- [Assignment] <- [TestCase]
  |          |             |              |
  +-------> [Enrollment]   +----------> [Submission] <---------- [TestResult]
                             |
                             v
                     [SimilarityReport]
                             |
                             v
                     [SimilarityResult] <---------- [MatchFragment]
  |
  +----------> [Notification]
```

````

### User Model

```typescript
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  supabaseUserId: varchar("supabase_user_id", { length: 255 }).unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  role: userRoleEnum("role").notNull().default("student"),
  avatarUrl: varchar("avatar_url", { length: 255 }),
  isActive: boolean("is_active").notNull().default(true),
  emailNotificationsEnabled: boolean("email_notifications_enabled").notNull().default(true),
  inAppNotificationsEnabled: boolean("in_app_notifications_enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});
````

### Notification Models

```typescript
export const notificationTypeEnum = pgEnum("notification_type", [
  "ASSIGNMENT_CREATED",
  "SUBMISSION_GRADED",
  "SUBMISSION_FEEDBACK_GIVEN",
  "CLASS_ANNOUNCEMENT",
  "DEADLINE_REMINDER",
  "ENROLLMENT_CONFIRMED",
])

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
```

**Indexes**:

- `notifications`: `user_id`, `created_at`, `is_read`, composite `(user_id, is_read)`

**Delivery behavior**:

- In-app notifications are persisted in `notifications`
- Email notifications are sent separately after successful write completion when the relevant flow opts into post-commit delivery
- If in-app notifications are disabled but email is enabled, the user receives the email without an inbox row being created

### Roles

- `student` - Can enroll in classes, submit assignments
- `teacher` - Can create classes, assignments
- `admin` - System administration

---

## Services

### Admin Services

The admin module is organized into specialized services for different administrative functions:

#### AdminUserService

```typescript
class AdminUserService {
  getAllUsers(filters) // List users with pagination and filters
  getUserById(userId) // Get user details
  createUser(userData) // Create new user
  updateUser(userId, userData) // Update user information
  updateUserRole(userId, role) // Change user role
  deactivateUser(userId) // Deactivate user account without deleting records
}
```

#### AdminClassService

```typescript
class AdminClassService {
  getAllClasses(filters) // List classes with pagination
  getClassById(classId) // Get class details
  createClass(classData) // Create new class
  updateClass(classId, classData) // Update class
  deleteClass(classId) // Delete class
  reassignClassTeacher(classId, newTeacherId) // Change teacher
  archiveClass(classId) // Soft delete class
  getClassAssignments(classId) // Get class assignments
}
```

#### AdminEnrollmentService

```typescript
class AdminEnrollmentService {
  getClassStudents(classId) // Get enrolled students
  enrollStudent(classId, studentId) // Add student to class
  removeStudent(classId, studentId) // Remove student from class
  getAllEnrollments(filters) // List all enrollments
  transferStudent(data) // Move student between classes
}
```

#### AdminAnalyticsService

```typescript
class AdminAnalyticsService {
  getSystemStatistics() // Overall system metrics
  getRecentActivity() // Recent user activity
}
```

### AuthService

Handles authentication with Supabase coordination:

```typescript
class AuthService {
  registerUser(email, password, firstName, lastName, role) // Create user
  loginUser(email, password) // Authenticate
  verifyToken(token) // Validate JWT
  requestPasswordReset(email) // Send reset email
}
```

**Auth Email Redirects**:

- Registration passes an explicit Supabase `emailRedirectTo` value so confirmation emails land on the frontend `/login` route.
- Password reset requests redirect to the frontend `/reset-password` route using the same configured frontend origin.
- Password changed notifications are still sent by Supabase security notifications, but the branded HTML source of truth lives in `src/services/email/templates.ts` via `supabasePasswordChangedNotificationEmailTemplate()`.
- Supabase project URL configuration must still allow the deployed frontend origin/path for these redirects to succeed.

### ClassService

Manages classes and assignments:

```typescript
class ClassService {
  createClass(teacherId, className, description)
  getClassById(classId, teacherId?)
  updateClass(classId, teacherId, data)
  deleteClass(classId, teacherId)
  getEnrolledStudents(classId)
  getClassStudents(classId) // Get enrolled students with full info
  removeStudent(classId, studentId, teacherId) // Remove student from class
  createAssignment(classId, teacherId, data)
  getAssignmentDetails(assignmentId, userId)
  updateAssignment(assignmentId, teacherId, data)
  deleteAssignment(assignmentId, teacherId)
  getClassAssignmentsForStudent(classId, studentId) // Get assignments with student-specific data
}
```

**Supported Programming Languages**: Python, Java, C

**Enhanced Class Detail Response**:

- `getClassById()` now includes `instructorName` (teacher's full name)
- Class data includes `schedule` object with days, start time, and end time
- Includes `studentCount` for enrollment tracking

**Student-Specific Assignment Data**:

- `getClassAssignmentsForStudent()` fetches assignments with student-specific fields:
  - `submittedAt`: Timestamp of submission (null if not submitted)
  - `grade`: Student's grade (null if not yet graded)
  - `maxGrade`: Maximum possible grade (defaults to 100)

**Assignment Instructions Media Support**:

- Assignment creation and updates support an optional instruction image (`instructionsImageUrl`)
- Assignment responses include instruction image fields for rendering in teacher/student assignment views
- Class-level cleanup includes best-effort deletion of assignment instruction images when classes are deleted

### SubmissionService

Handles file submissions with validation:

```typescript
class SubmissionService {
  submitAssignment(assignmentId, studentId, file)
  getSubmissionHistory(assignmentId, studentId)
  getAssignmentSubmissions(assignmentId, latestOnly)
  getFileDownloadUrl(filePath, expiresIn)
}
```

**File Validation**:

- Validates file extensions against programming language
- Python: `.py`
- Java: `.java`
- C: `.c`
- Maximum file size enforcement
- Content type validation

### GradebookService

Manages student grades and exports:

```typescript
class GradebookService {
  getClassGradebook(classId) // Get full gradebook
  getStudentGradebook(studentId) // Get all grades for a student
  overrideGrade(submissionId, grade, teacherId) // Manual override
  removeGradeOverride(submissionId, teacherId) // Remove override
  getLatePenaltyConfig(assignmentId) // Get late penalty settings
  setLatePenaltyConfig(assignmentId, config) // Update late penalty
  exportGradebookCSV(classId) // Export to CSV
}
```

**Features**:

- Automatic grade calculation based on test results
- Late penalty application with configurable rates
- Manual grade overrides with audit trail
- CSV export for external processing

### PlagiarismService

Handles file analysis and similarity detection using a custom Winnowing-based algorithm:

```typescript
class PlagiarismService {
  analyzeFiles(files) // Analyze raw files
  analyzeAssignmentSubmissions(assignmentId, teacherId) // Batch analysis
  getReport(reportId) // Get report details
  getReportPair(reportId, pairId) // Get specific pair comparison
  deleteReport(reportId) // Delete report
}
```

**Implementation Details**:

- Uses Tree-Sitter for language-specific AST parsing
- Implements Winnowing algorithm for fingerprint generation
- Stores match fragments with precise line/column positions
- Calculates structural, semantic, and weighted hybrid similarity metrics
- Returns reusable report metadata (`reportId`, `generatedAt`, submissions, pairs) needed by the frontend evidence-export workflow
- Supports Python, Java, and C programming languages
- Passes the assignment's programming language to the semantic similarity microservice, enabling language-aware logging and future per-language optimisations in the GraphCodeBERT inference pipeline

### CrossClassSimilarityService

Compares latest submissions across assignments with the same name in multiple classes owned by the same teacher:

```typescript
class CrossClassSimilarityService {
  analyzeAssignment(assignmentId, teacherId) // Find and analyze matching assignments across teacher classes
  getLatestReport(assignmentId) // Fetch the latest saved cross-class report
  getReport(reportId) // Retrieve a saved cross-class report by ID
  getResultDetails(resultId) // Get detailed fragment/code info for a cross-class pair
  deleteReport(reportId) // Delete a saved report
}
```

**Behavior**:

- Identifies matching assignments by name in other classes taught by the same teacher.
- Cross-class reports are persisted as historical records and are never automatically overwritten by newer runs.
- Use `getLatestReport` when the frontend needs the newest result without triggering a new write.
- Passes the assignment's programming language through to the semantic embedding pipeline so cross-class semantic scores are language-aware.

### PlagiarismAutoAnalysisService

Schedules and reconciles automatic post-submission similarity analysis:

```typescript
class PlagiarismAutoAnalysisService {
  scheduleAnalysis(assignmentId) // Debounce and schedule a deferred analysis run
  reconcile() // Safety-net scan to trigger analysis for stale or missing reports
}
```

**Behavior**:

- Driven by `AUTO_SIMILARITY_ENABLED`, `AUTO_SIMILARITY_DEBOUNCE_MS`, and `AUTO_SIMILARITY_RECONCILIATION_INTERVAL_MS` env vars.
- Submission success is never blocked by scheduling failures.
- Rapid burst submissions for the same assignment are coalesced into a single run.

### PlagiarismPersistenceService

Handles atomic report writes with assignment-scoped transaction locking:

```typescript
class PlagiarismPersistenceService {
  saveReport(assignmentId, reportData) // Persist a new report under a lock
  refreshSimilarityPenalties(assignmentId) // Re-sync similarity deductions after a new report is saved
}
```

**Behavior**:

- Acquires an assignment-scoped lock before writing so concurrent analysis runs never produce duplicate latest reports.
- After saving a new report, notifies `SimilarityPenaltyService` to refresh deduction records when penalty is enabled.

### SimilarityPenaltyService

Applies and syncs automatic similarity-based grade deductions:

```typescript
class SimilarityPenaltyService {
  applyPenaltiesForAssignment(assignmentId) // Compute and persist deductions for all latest submissions
  getPenaltyForSubmission(submissionId) // Retrieve the stored penalty amount for a submission
}
```

**Behavior**:

- Deductions use the backend-managed conservative band policy (warning-only below 85 %, capped at 20 %).
- Only the highest qualifying pair hybrid score is applied to each latest submission.
- When the displayed score changes after a penalty sync, a `SUBMISSION_GRADED` notification is dispatched to the affected student.

### CodeTestService

Executes code against test cases using Judge0:

```typescript
class CodeTestService {
  runTestsPreview(sourceCode, language, assignmentId) // Dry run
  runSubmissionTests(submissionId) // Run tests for submission
  checkExecutionServiceHealth() // Check Judge0 availability
}
```

**Features**:

- Timeout protection (configurable via `TEST_EXECUTION_TIMEOUT_SECONDS`)
- Support for Python, Java, and C
- Test case execution with input/output validation
- Detailed error reporting and execution statistics
- Role-aware hidden test-case detail retrieval for submission review endpoints (teacher/admin only)

### NotificationService

Manages user notifications and email delivery:

```typescript
class NotificationService {
  createNotification(userId, type, data) // Create an in-app notification when that channel is enabled
  sendEmailNotificationIfEnabled(userId, type, data) // Send email after commit when that channel is enabled
  getUserNotifications(userId, page, limit, unreadOnly) // Get paginated notifications
  getUnreadCount(userId) // Get unread notification count
  markAsRead(notificationId, userId) // Mark single notification as read
  markAllAsRead(userId) // Mark all user notifications as read
  deleteNotification(notificationId, userId) // Delete notification
}
```

**Features**:

- Automatic notification creation on key events (assignment creation, grading)
- Post-commit email delivery for transaction-sensitive write flows
- Template-based email generation
- User authorization checks
- Pagination support

**Notification Types**:

- `ASSIGNMENT_CREATED` - Sent to all enrolled students when teacher creates assignment
- `SUBMISSION_GRADED` - Sent to students for grade lifecycle events with explicit `reason` metadata:
  - `automatic_grade` when tests produce the first score
  - `manual_grade` when a teacher sets a score directly
  - `grade_override` when a teacher replaces the displayed score
  - `late_penalty_applied` when the visible score is reduced after lateness is applied
  - `similarity_deduction` when the visible score is reduced after similarity review
- `STUDENT_UNENROLLED` - Sent to the teacher when a student leaves voluntarily or is removed by an admin
- `REMOVED_FROM_CLASS` - Sent to the student when a teacher or admin removes them from a class
- `NEW_USER_REGISTERED` - Sent to admins only when a self-registered teacher account is awaiting approval
- `TEACHER_APPROVED` - Email-only notification sent to a teacher when an admin activates their pending account

Teacher-initiated class-roster removals:

- When a teacher removes a student from their own class roster, the backend does not send that same teacher a redundant `STUDENT_UNENROLLED` notification.
- The removed student still receives the `REMOVED_FROM_CLASS` notification.

Similarity-deduction notification behavior:

- When automatic similarity deduction changes a student's visible score, the student also receives a `SUBMISSION_GRADED` notification explaining that the score was updated after similarity review.
- Similarity-deduction metadata includes the previous score, updated score, similarity percentage, and the matched student name or names used in the message copy.
- The notification is sent only when the displayed score actually changes; repeated penalty syncs with the same grade do not create duplicate notices.

Late-penalty notification behavior:

- Automatic grading still emits the initial `automatic_grade` notification with the raw computed score.
- If a late penalty reduces that visible score afterward, the student receives a second `SUBMISSION_GRADED` notification with `reason: "late_penalty_applied"`.
- Late-penalty metadata includes the previous score, adjusted score, and human-readable lateness text such as `You submitted 5 hours late`.

Manual grading notification behavior:

- Teacher-set scores emit `reason: "manual_grade"` with the teacher-entered score.
- If the stored late penalty reduces that teacher-entered score, the student also receives a follow-up `late_penalty_applied` notification describing the deduction.

Grade-override notification behavior:

- Teacher overrides emit `reason: "grade_override"` and include both the previous displayed score and the new overridden score when available.

**Email Providers**:

- SendGrid (recommended for production)
- SMTP (for custom email servers)
- Supabase (uses built-in email service)

**Email Delivery Behavior**:

- Email delivery is attempted only after grade/feedback write transactions commit
- Failed email attempts are logged and do not partially commit the caller's primary write

Teacher approval notification behavior:

- Admin registration notifications are sent only for teacher self-signups in v1.
- The reused `NEW_USER_REGISTERED` template is approval-oriented and tells admins that a teacher account request is awaiting review and activation.

**Preference Resolution**:

- Notification delivery reads the current user record before deciding which channels to use.
- `emailNotificationsEnabled` gates email delivery globally for the user.
- `inAppNotificationsEnabled` gates in-app delivery globally for the user.
- Type-level channel restrictions still apply through each notification type configuration.

### ModuleService

Manages assignment-grouping modules within a class:

```typescript
class ModuleService {
  createModule(data) // Create a module for a class
  getModulesWithAssignments(classId, isStudent) // Return ordered modules with nested assignments
  renameModule(data) // Rename an existing module
  toggleModulePublish(data) // Publish or unpublish a module
  deleteModule(data) // Delete a module and cascade its assignments
}
```

**Features**:

- Supports the frontend's Module View / List View toggle workflows
- Enforces teacher ownership on write operations
- Returns assignment-grouped read models for class detail pages

---

## Repositories

### Repository Categories

ClassiFi uses two repository categories:

1. **Entity Repositories**  
   Table-oriented repositories for CRUD and direct entity persistence (e.g., `UserRepository`, `AssignmentRepository`, `SubmissionRepository`).

2. **Query Repositories**  
   Read-model repositories for aggregate/query-heavy views used by specific use-cases (e.g., `DashboardQueryRepository` for student/teacher dashboard summaries).

Guideline:

- Put transactional table writes in Entity Repositories.
- Put multi-table dashboard/reporting read queries in Query Repositories.
- Keep controllers calling services only; services orchestrate repositories.

### Module-First Imports

Canonical imports now point to module paths:

- `@/modules/test-cases/test-case.repository.js`
- `@/modules/test-cases/code-test.service.js`
- `@/modules/notifications/notification.service.js`

### BaseRepository

Generic CRUD operations:

```typescript
class BaseRepository<TTable, TSelect, TInsert> {
  findAll(): Promise<TSelect[]>
  findById(id: number): Promise<TSelect | undefined>
  create(data: TInsert): Promise<TSelect>
  update(id: number, data: Partial<TInsert>): Promise<TSelect>
  delete(id: number): Promise<boolean>
  count(): Promise<number>
  withContext(tx: TransactionContext): this // For transactions
}
```

### Transaction Support

```typescript
import { withTransaction } from './shared/transaction.js';

const result = await withTransaction(async (tx) => {
  const userRepo = new UserRepository().withContext(tx);
  const enrollmentRepo = new EnrollmentRepository().withContext(tx);

  await userRepo.create({ ... });
  await enrollmentRepo.enrollStudent(studentId, classId);

  return { success: true };
});
```

---

## Middleware & Plugins

### Zod Validation

Declarative request validation:

```typescript
import type { ValidatedRequest } from "@/api/plugins/zod-validation"

app.post("/register", {
  preHandler: validateBody(RegisterRequestSchema),
  handler: async (request, reply) => {
    const body = (request as ValidatedRequest<RegisterRequest>).validatedBody
    // body is fully typed and validated
  },
})
```

Validation plugin notes:

- `ValidatedRequest<TBody, TQuery, TParams>` provides typed access for validated fields.
- `validatedBody`, `validatedQuery`, and `validatedParams` are attached by pre-handlers in `src/api/plugins/zod-validation.ts`.

### Swagger/OpenAPI

Auto-generated documentation at `/docs`:

```typescript
app.post('/login', {
  schema: {
    tags: ['Auth'],
    summary: 'Login with email and password',
    body: { ... },
    response: { 200: { ... } }
  },
  handler: ...
});
```

### Logging (Pino)

Runtime logging is centralized through `src/shared/logger.ts`, which wraps `pino` behind a small `Logger` interface:

```typescript
import { createLogger } from "@/shared/logger.js"

const logger = createLogger("AuthService")
logger.error("Failed to rollback Supabase user", { error })
```

Guidelines:

- Use `createLogger("<ServiceOrModuleName>")` in services/controllers/plugins.
- Prefer structured context objects over string interpolation for diagnostics.
- Keep API responses generic and safe; log internal details only in server logs.

---

## Error Handling

### Domain Errors

```typescript
// Throwing errors
if (!user) throw new UserNotFoundError(userId)
if (exists) throw new UserAlreadyExistsError("email", email)
if (deadline < now) throw new DeadlinePassedError()
```

### Error Classes

| Error               | Status | Description             |
| ------------------- | ------ | ----------------------- |
| `BadRequestError`   | 400    | Invalid request data    |
| `UnauthorizedError` | 401    | Authentication required |
| `ForbiddenError`    | 403    | Permission denied       |
| `NotFoundError`     | 404    | Resource not found      |
| `ApiError`          | 500    | Generic server error    |

### Domain-Specific Errors

- `UserNotFoundError`, `UserAlreadyExistsError`
- `ClassNotFoundError`, `ClassInactiveError`
- `AssignmentNotFoundError`, `DeadlinePassedError`
- `NotEnrolledError`, `AlreadyEnrolledError`
- `InvalidFileTypeError`, `FileTooLargeError`

---

## Testing

### Running Tests

```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

Test location policy:

- Unit and integration tests are centralized under `backend-ts/tests/**`.
- `vitest.config.ts` discovery is scoped to `tests/**/*.test.ts` to avoid scattered test files inside `src/**`.

### Test Organization Rules (Required)

- Keep all backend tests under `backend-ts/tests/**`.
- Group tests by purpose using existing folders: `api/`, `services/`, `repositories/`, `modules/`, `integration/`, and shared setup/utils.
- Name tests as `*.test.ts` to match Vitest discovery.
- Do not add new test files under `backend-ts/src/**`.

High-signal coverage gate:

- `vitest` coverage enforces `100%` statements/branches/functions/lines with per-file thresholds for critical contracts (`auth.service`, `auth.schema`, `class.schema`, `class-code.util`, `assignment.schema`, `submission.schema`, `notification.schema`, `user.service`).
- This gate ensures login/register payload rules and auth service business paths fail fast on regressions.

### Test Factories

```typescript
import { createMockUser, createMockClass } from "../utils/factories"

const user = createMockUser({ role: "teacher" })
const classData = createMockClass({ teacherId: user.id })
```

### Example Test

```typescript
describe('AuthService', () => {
  it('should throw InvalidRoleError for invalid role', async () => {
    await expect(
      authService.registerUser(..., 'invalid-role')
    ).rejects.toThrow(InvalidRoleError);
  });
});
```

---

## Development Guidelines

### Adding a New Endpoint

1. **Schema** - Define or extend the module-local Zod schema for the endpoint contract.
2. **Repository** - Add or update the entity/query repository method if data access changes are needed.
3. **Service** - Implement business logic in the owning module service.
4. **Controller** - Add the Fastify route handler with validation and OpenAPI schema.
5. **Route registration** - Ensure the module entry point is exported and mounted from `src/api/routes/v1/index.ts` if it is a new routable surface.
6. **Test** - Add focused tests under `backend-ts/tests/**`.
7. **Documentation** - Update this file when the API surface, runtime contract, or architectural expectations change.

### Endpoint Documentation Standards

Every API endpoint must include comprehensive Fastify schema documentation:

**Required Elements:**

- **Endpoint comment**: Multi-line comment block with HTTP method, path, and summary for better readability
- **tags**: Array with category (e.g., `["Admin - Users"]`, `["Classes"]`)
- **summary**: Brief description of what the endpoint does
- **description**: (Optional) Additional context or usage notes
- **security**: Authentication requirements (e.g., `[{ bearerAuth: [] }]`)
- **params/querystring/body**: Zod schema converted via `toJsonSchema()`
- **response**: Expected response schemas by status code

**Example:**

```typescript
/**
 * GET /classes/:id/students
 * Get enrolled students in a class
 */
app.get<{ Params: ClassParams }>("/classes/:id/students", {
  preHandler: [authMiddleware],
  schema: {
    tags: ["Classes"],
    summary: "Get enrolled students in a class",
    description: "Returns list of students with enrollment details",
    security: [{ bearerAuth: [] }],
    params: toJsonSchema(ClassParamsSchema),
    response: {
      200: toJsonSchema(EnrolledStudentsResponseSchema),
    },
  },
  handler: async (request, reply) => {
    const students = await classService.getEnrolledStudents(request.params.id)
    return reply.send({ success: true, students })
  },
})

/**
 * POST /submissions
 * Submit an assignment
 */
app.post<{ Body: CreateSubmission }>("/submissions", {
  preHandler: [authMiddleware, uploadMiddleware],
  schema: {
    tags: ["Submissions"],
    summary: "Submit an assignment",
    description: "Upload code file for assignment submission",
    security: [{ bearerAuth: [] }],
    body: toJsonSchema(CreateSubmissionSchema),
    response: {
      201: toJsonSchema(SubmissionResponseSchema),
    },
  },
  handler: async (request, reply) => {
    const submission = await submissionService.submitAssignment(request.body)
    return reply.status(201).send({ success: true, submission })
  },
})
```

**Endpoint Comment Format:**

```typescript
/**
 * {METHOD} {PATH}
 * {Summary description}
 */

// Examples:
/**
 * GET /users/:id
 * Get user details by ID
 */

/**
 * POST /classes
 * Create a new class
 */

/**
 * PATCH /users/:id/role
 * Update user role
 */

/**
 * DELETE /assignments/:id
 * Delete an assignment
 */
```

**Endpoint Documentation Checklist:**

- [ ] Endpoint comment includes method, path, and summary
- [ ] Tags match the feature domain
- [ ] Summary is action-oriented and clear
- [ ] Security requirements are specified
- [ ] All input schemas (params, query, body) are documented
- [ ] Response schemas include success and common error codes
- [ ] Description added for complex or non-obvious endpoints

### Function Documentation Standards

Every exported function must include a full JSDoc block:

**Required Elements:**

- **Summary**: Clear, concise sentence describing the function's action
- **@param**: Must be present for every parameter with descriptive text
- **@returns**: Must be present for non-void functions

**Example:**

```typescript
/**
 * Retrieves the submission history for a specific student and assignment.
 *
 * @param assignmentId - The unique identifier of the assignment.
 * @param studentId - The unique identifier of the student.
 * @returns An object containing the list of past submissions.
 */
export async function getSubmissionHistory(
  assignmentId: number,
  studentId: number,
): Promise<SubmissionHistoryResponse> {
  // Implementation
}
```

### Code Style

- Use `@injectable()` decorator on all services/repositories
- Throw domain errors instead of returning error objects
- Use DTOs for API responses via mappers
- Add OpenAPI schema to all routes
- Document all endpoints with comprehensive Fastify schemas
- Document all exported functions with JSDoc

### TypeScript

```bash
# Check types
npm run typecheck

# Required tsconfig options:
# - experimentalDecorators: true
# - emitDecoratorMetadata: true
```

---

## Semantic Similarity Microservice

The backend delegates semantic code similarity scoring to a Python FastAPI sidecar located at `../semantic-service/`.

### Overview

- **Model**: Fine-tuned [GraphCodeBERT](https://github.com/microsoft/CodeBERT) (`microsoft/graphcodebert-base`) for code clone detection
- **Languages**: Python, Java, and C
- **Inference**: CLS-token embeddings (768-dim) with pairwise cosine similarity
- **Training**: DFG-augmented attention masks, CosineEmbeddingLoss, code_length=256, dfg_length=64

### Endpoints

| Method | Path          | Description                                            |
| ------ | ------------- | ------------------------------------------------------ |
| GET    | `/health`     | Model readiness check                                  |
| POST   | `/similarity` | Compute cosine similarity between two code snippets    |
| POST   | `/embed`      | Extract CLS embedding for a single snippet (cacheable) |

Both `/similarity` and `/embed` accept an optional `language` field (`"python"`, `"java"`, or `"c"`) for logging and future per-language optimisations.

### Backend Integration

The backend communicates with the semantic service through:

- `semantic-similarity.client.ts` — HTTP client with configurable timeout/retries
- `semantic-scoring.ts` — Embedding cache strategy (O(n) embeddings for O(n²) pairs) and pairwise cosine computation

- `semantic-masking.ts` â€” blanks ignored structural/template regions before embeddings are requested so semantic and hybrid scores stay aligned with teacher-template suppression

Semantic embeddings are generated from masked submission text instead of raw source whenever structural analysis has already marked template or common-code regions as ignored.

Both modules forward the assignment's programming language to the microservice.

### Training & Evaluation Scripts

| Script                                         | Description                                                                                                                                                                  |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `semantic-service/train_multilingual.py`       | Standalone training script — reproduces the fine-tuning pipeline from `notebook.ipynb`. Trains GraphCodeBERT on Python, Java, and C clone pairs with DFG-augmented features. |
| `semantic-service/evaluate_multilingual.py`    | Per-language evaluation — reports Accuracy, Precision, Recall, F1, ROC-AUC, and Average Precision for each language individually and in aggregate.                           |
| `semantic-service/evaluate_semantic_hybrid.py` | Overall ablation study — compares structural-only, semantic-only, and hybrid (70/30) approaches on the full test set.                                                        |

---

## Technology Stack

| Component            | Technology       | Version |
| -------------------- | ---------------- | ------- |
| Runtime              | Node.js          | 20+     |
| Language             | TypeScript       | 5.x     |
| Framework            | Fastify          | 5.x     |
| ORM                  | Drizzle ORM      | 0.36.x  |
| Database             | PostgreSQL       | Latest  |
| Validation           | Zod              | 4.x     |
| Auth                 | Supabase Auth    | 2.x     |
| Storage              | Supabase Storage | 2.x     |
| Code Execution       | Judge0           | Latest  |
| Code Analysis        | Tree-Sitter      | 0.25.x  |
| Semantic Analysis    | GraphCodeBERT    | Base    |
| Dependency Injection | tsyringe         | 4.x     |
| Testing              | Vitest           | 4.x     |
| API Documentation    | Swagger/OpenAPI  | 3.x     |
| Formatting           | Prettier         | 3.8.x   |

---

## License

MIT
