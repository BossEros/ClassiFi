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

- Node.js 18+
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

### Available Scripts

| Script                  | Description                      |
| ----------------------- | -------------------------------- |
| `npm run dev`           | Start dev server with hot reload |
| `npm run build`         | Compile TypeScript to JavaScript |
| `npm start`             | Run compiled production server   |
| `npm run test`          | Run test suite                   |
| `npm run test:watch`    | Watch mode testing               |
| `npm run test:coverage` | Generate coverage report         |
| `npm run typecheck`     | Type check without emitting      |

---

## Project Structure

```
backend-ts/
├── src/
│   ├── api/
│   │   ├── controllers/      # Route handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── class.controller.ts
│   │   │   ├── assignment.controller.ts
│   │   │   ├── submission.controller.ts
│   │   │   ├── student-dashboard.controller.ts
│   │   │   ├── teacher-dashboard.controller.ts
│   │   │   ├── gradebook.controller.ts
│   │   │   ├── plagiarism.controller.ts
│   │   │   ├── testCase.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   └── admin.controller.ts
│   │   ├── middlewares/      # Error handling
│   │   │   └── error-handler.ts
│   │   ├── plugins/          # Fastify plugins
│   │   │   ├── swagger.ts
│   │   │   └── zod-validation.ts
│   │   ├── routes/           # Route aggregators
│   │   │   └── v1/index.ts
│   │   └── schemas/          # Zod validation schemas
│   │       ├── auth.schema.ts
│   │       ├── class.schema.ts
│   │       ├── assignment.schema.ts
│   │       ├── submission.schema.ts
│   │       ├── dashboard.schema.ts
│   │       ├── gradebook.schema.ts
│   │       ├── plagiarism.schema.ts
│   │       ├── testCase.schema.ts
│   │       ├── user.schema.ts
│   │       └── admin.schema.ts
│   ├── lib/                  # External library integrations
│   │   └── plagiarism/       # Plagiarism detection engine
│   ├── models/               # Drizzle ORM schemas
│   │   ├── user.model.ts
│   │   ├── class.model.ts
│   │   ├── assignment.model.ts
│   │   ├── enrollment.model.ts
│   │   ├── submission.model.ts
│   │   ├── similarity-report.model.ts
│   │   ├── similarity-result.model.ts
│   │   ├── match-fragment.model.ts
│   │   ├── test-case.model.ts
│   │   ├── test-result.model.ts
│   │   └── index.ts
│   ├── repositories/         # Data access layer
│   │   ├── base.repository.ts
│   │   ├── user.repository.ts
│   │   ├── class.repository.ts
│   │   ├── assignment.repository.ts
│   │   ├── enrollment.repository.ts
│   │   ├── submission.repository.ts
│   │   └── index.ts
│   ├── services/             # Business logic layer
│   │   ├── auth.service.ts
│   │   ├── class.service.ts
│   │   ├── submission.service.ts
│   │   ├── student-dashboard.service.ts
│   │   ├── teacher-dashboard.service.ts
│   │   ├── gradebook.service.ts
│   │   ├── plagiarism.service.ts
│   │   ├── codeTest.service.ts
│   │   ├── admin/            # Admin services
│   │   └── index.ts
│   ├── shared/               # Shared utilities
│   │   ├── config.ts         # Environment configuration
│   │   ├── container.ts      # DI container
│   │   ├── database.ts       # Database connection
│   │   ├── errors.ts         # Domain error classes
│   │   ├── mappers.ts        # DTO mappers
│   │   ├── supabase.ts       # Supabase clients
│   │   └── transaction.ts    # Transaction support
│   ├── app.ts                # Fastify app configuration
│   └── server.ts             # Entry point
├── tests/
│   ├── services/             # Service tests
│   ├── shared/               # Utility tests
│   ├── utils/factories.ts    # Test factories
│   └── setup.ts              # Test setup
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## Architecture

### Controller-Service-Repository Pattern

```
┌──────────────┐
│  Controller  │  ← Handles HTTP requests, validation
└──────┬───────┘
       │
┌──────▼───────┐
│   Service    │  ← Business logic, domain rules
└──────┬───────┘
       │
┌──────▼───────┐
│  Repository  │  ← Data access, database queries
└──────────────┘
```

### Dependency Injection

Uses **tsyringe** for constructor injection:

```typescript
@injectable()
export class AuthService {
  constructor(@inject("UserRepository") private userRepo: UserRepository) {}
}
```

Resolve from container in controllers:

```typescript
const authService = container.resolve<AuthService>("AuthService");
```

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

### User Management

| Method | Endpoint          | Description                |
| ------ | ----------------- | -------------------------- |
| GET    | `/user/me`        | Get current user's profile |
| PATCH  | `/user/me/avatar` | Update avatar URL          |
| DELETE | `/user/me`        | Delete account             |

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

### Gradebook

| Method | Endpoint                                               | Description              |
| ------ | ------------------------------------------------------ | ------------------------ |
| GET    | `/gradebook/classes/:classId`                          | Get class gradebook      |
| GET    | `/gradebook/classes/:classId/export`                   | Export CSV               |
| GET    | `/gradebook/classes/:classId/statistics`               | Get class stats          |
| GET    | `/gradebook/students/:studentId`                       | Get student grades       |
| GET    | `/gradebook/students/:studentId/classes/:classId`      | Get student class grades |
| GET    | `/gradebook/students/:studentId/classes/:classId/rank` | Get student rank         |
| POST   | `/gradebook/submissions/:submissionId/override`        | Override grade           |
| DELETE | `/gradebook/submissions/:submissionId/override`        | Remove override          |
| GET    | `/gradebook/assignments/:id/late-penalty`              | Get late penalty config  |
| PUT    | `/gradebook/assignments/:id/late-penalty`              | Set late penalty config  |

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

### Plagiarism Detection

| Method | Endpoint                                       | Description             |
| ------ | ---------------------------------------------- | ----------------------- |
| POST   | `/plagiarism/analyze`                          | Analyze files           |
| POST   | `/plagiarism/analyze/assignment/:assignmentId` | Analyze full assignment |
| GET    | `/plagiarism/reports/:reportId`                | Get report details      |
| DELETE | `/plagiarism/reports/:reportId`                | Delete report           |
| GET    | `/plagiarism/reports/:reportId/pairs/:pairId`  | Get match pair details  |
| GET    | `/plagiarism/results/:resultId/details`        | Get result details      |

### Dashboard

| Method | Endpoint                        | Description       |
| ------ | ------------------------------- | ----------------- |
| GET    | `/student/dashboard/:studentId` | Student dashboard |
| POST   | `/student/dashboard/join`       | Join class        |
| POST   | `/student/dashboard/leave`      | Leave class       |
| GET    | `/teacher/dashboard/:teacherId` | Teacher dashboard |

### Admin

| Method | Endpoint                                 | Description        |
| ------ | ---------------------------------------- | ------------------ |
| GET    | `/admin/users`                           | List users         |
| POST   | `/admin/users`                           | Create user        |
| GET    | `/admin/users/:id`                       | Get user details   |
| PATCH  | `/admin/users/:id/role`                  | Update user role   |
| DELETE | `/admin/users/:id`                       | Delete user        |
| GET    | `/admin/classes`                         | List classes       |
| POST   | `/admin/classes`                         | Create class       |
| PATCH  | `/admin/classes/:id/reassign`            | Reassign teacher   |
| PATCH  | `/admin/classes/:id/archive`             | Archive class      |
| GET    | `/admin/classes/:id/students`            | Get class students |
| POST   | `/admin/classes/:id/students`            | Enroll student     |
| DELETE | `/admin/classes/:id/students/:studentId` | Remove student     |
| GET    | `/admin/stats`                           | System statistics  |
| GET    | `/admin/activity`                        | Recent activity    |

---

## Database Models

### Entity Relationship Diagram

```
┌─────────┐       ┌─────────┐       ┌──────────────┐      ┌────────────┐
│  User   │◄──────┤  Class  │◄──────┤  Assignment  │◄─────┤  TestCase  │
└────┬────┘       └────┬────┘       └──────┬───────┘      └──────┬─────┘
     │                 │                   │                     │
     │            ┌────▼────┐         ┌────▼────┐         ┌──────▼─────┐
     └───────────►│Enrollment│         │Submission│◄───────┤ TestResult │
                  └──────────┘         └────┬────┘         └────────────┘
                                            │
                                   ┌────────▼────────┐
                                   │SimilarityReport │
                                   └────────┬────────┘
                                            │
                                   ┌────────▼────────┐
                                   │SimilarityResult │◄───────┐
                                   └────────┬────────┘        │
                                            │           ┌─────┴────────┐
                                            └──────────►│MatchFragment │
                                                        └──────────────┘
```

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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});
```

### Roles

- `student` - Can enroll in classes, submit assignments
- `teacher` - Can create classes, assignments
- `admin` - System administration

---

## Services

### AuthService

Handles authentication with Supabase coordination:

```typescript
class AuthService {
  registerUser(email, password, firstName, lastName, role); // Create user
  loginUser(email, password); // Authenticate
  verifyToken(token); // Validate JWT
  requestPasswordReset(email); // Send reset email
}
```

### ClassService

Manages classes and assignments:

```typescript
class ClassService {
  createClass(teacherId, className, description);
  getClassById(classId, teacherId?);
  updateClass(classId, teacherId, data);
  deleteClass(classId, teacherId);
  createAssignment(classId, teacherId, data);
  getAssignmentDetails(assignmentId, userId);
}
```

### SubmissionService

Handles file submissions:

```typescript
class SubmissionService {
  submitAssignment(assignmentId, studentId, file);
  getSubmissionHistory(assignmentId, studentId);
  getAssignmentSubmissions(assignmentId, latestOnly);
  getFileDownloadUrl(filePath, expiresIn);
}
```

### GradebookService

Manages student grades and statistics:

```typescript
class GradebookService {
  getClassGradebook(classId); // Get full gradebook
  getStudentGradebook(studentId); // Get all grades for a student
  overrideGrade(submissionId, grade, teacherId); // Manual override
  getLatePenaltyConfig(assignmentId); // Get late penalty settings
}
```

### PlagiarismService

Handles file analysis and similarity detection:

```typescript
class PlagiarismService {
  analyzeFiles(files); // Analyze raw files
  analyzeAssignmentSubmissions(assignmentId, teacherId); // Batch analysis
  getReport(reportId); // Get report details
}
```

### CodeTestService

Executes code against test cases:

```typescript
class CodeTestService {
  runTestsPreview(sourceCode, language, assignmentId); // Dry run
  runSubmissionTests(submissionId); // Run tests for submission
}
```

---

## Repositories

### BaseRepository

Generic CRUD operations:

```typescript
class BaseRepository<TTable, TSelect, TInsert> {
  findAll(): Promise<TSelect[]>;
  findById(id: number): Promise<TSelect | undefined>;
  create(data: TInsert): Promise<TSelect>;
  update(id: number, data: Partial<TInsert>): Promise<TSelect>;
  delete(id: number): Promise<boolean>;
  count(): Promise<number>;
  withContext(tx: TransactionContext): this; // For transactions
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
app.post("/register", {
  preHandler: validateBody(RegisterRequestSchema),
  handler: async (request, reply) => {
    const body = request.validatedBody as RegisterRequest;
    // body is fully typed and validated
  },
});
```

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

---

## Error Handling

### Domain Errors

```typescript
// Throwing errors
if (!user) throw new UserNotFoundError(userId);
if (exists) throw new UserAlreadyExistsError("email", email);
if (deadline < now) throw new DeadlinePassedError();
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

### Test Factories

```typescript
import { createMockUser, createMockClass } from "../utils/factories";

const user = createMockUser({ role: "teacher" });
const classData = createMockClass({ teacherId: user.id });
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

1. **Schema** - Define Zod schema in `api/schemas/`
2. **Repository** - Add data methods if needed
3. **Service** - Implement business logic
4. **Controller** - Add route handler with validation
5. **Test** - Add unit tests

### Code Style

- Use `@injectable()` decorator on all services/repositories
- Throw domain errors instead of returning error objects
- Use DTOs for API responses via mappers
- Add OpenAPI schema to all routes

### TypeScript

```bash
# Check types
npm run typecheck

# Required tsconfig options:
# - experimentalDecorators: true
# - emitDecoratorMetadata: true
```

---

## Technology Stack

| Component  | Technology       |
| ---------- | ---------------- |
| Runtime    | Node.js 18+      |
| Language   | TypeScript 5.x   |
| Framework  | Fastify 5.x      |
| ORM        | Drizzle ORM      |
| Database   | PostgreSQL       |
| Validation | Zod              |
| Auth       | Supabase Auth    |
| Storage    | Supabase Storage |
| Code Exec  | Judge0           |
| Analysis   | Tree-Sitter      |
| DI         | tsyringe         |
| Testing    | Vitest           |
| Docs       | Swagger/OpenAPI  |

---

## License

MIT
