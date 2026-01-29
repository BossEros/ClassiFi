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
│   │   │   ├── admin/        # Admin-specific controllers
│   │   │   │   ├── admin-analytics.controller.ts
│   │   │   │   ├── admin-class.controller.ts
│   │   │   │   ├── admin-enrollment.controller.ts
│   │   │   │   └── admin-user.controller.ts
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
  "error": "Tests did not complete within 60 seconds. This may indicate an infinite loop, excessive computation, or system overload."
}
```

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

The plagiarism detection system uses a custom implementation based on Winnowing algorithm with Tree-Sitter for code parsing. It supports Python, Java, and C languages.

| Method | Endpoint                                       | Description             |
| ------ | ---------------------------------------------- | ----------------------- |
| POST   | `/plagiarism/analyze`                          | Analyze files           |
| POST   | `/plagiarism/analyze/assignment/:assignmentId` | Analyze full assignment |
| GET    | `/plagiarism/reports/:reportId`                | Get report details      |
| DELETE | `/plagiarism/reports/:reportId`                | Delete report           |
| GET    | `/plagiarism/reports/:reportId/pairs/:pairId`  | Get match pair details  |
| GET    | `/plagiarism/results/:resultId/details`        | Get result details      |

**Supported Languages**: Python, Java, C

**Detection Features**:
- AST-based tokenization using Tree-Sitter
- Winnowing fingerprinting algorithm
- Configurable k-gram size and window size
- Fragment-level match detection with line/column positions
- Similarity scoring and overlap metrics

### Dashboard

| Method | Endpoint                        | Description       |
| ------ | ------------------------------- | ----------------- |
| GET    | `/student/dashboard/:studentId` | Student dashboard |
| POST   | `/student/dashboard/join`       | Join class        |
| POST   | `/student/dashboard/leave`      | Leave class       |
| GET    | `/teacher/dashboard/:teacherId` | Teacher dashboard |

### Admin

#### User Management

| Method | Endpoint                  | Description       |
| ------ | ------------------------- | ----------------- |
| GET    | `/admin/users`            | List users        |
| POST   | `/admin/users`            | Create user       |
| GET    | `/admin/users/:id`        | Get user details  |
| PUT    | `/admin/users/:id`        | Update user       |
| PATCH  | `/admin/users/:id/role`   | Update user role  |
| DELETE | `/admin/users/:id`        | Delete user       |

#### Class Management

| Method | Endpoint                      | Description          |
| ------ | ----------------------------- | -------------------- |
| GET    | `/admin/classes`              | List classes         |
| POST   | `/admin/classes`              | Create class         |
| GET    | `/admin/classes/:id`          | Get class details    |
| PUT    | `/admin/classes/:id`          | Update class         |
| DELETE | `/admin/classes/:id`          | Delete class         |
| PATCH  | `/admin/classes/:id/reassign` | Reassign teacher     |
| PATCH  | `/admin/classes/:id/archive`  | Archive class        |
| GET    | `/admin/classes/:id/assignments`    | Get class assignments    |

#### Enrollment Management

| Method | Endpoint                                 | Description        |
| ------ | ---------------------------------------- | ------------------ |
| GET    | `/admin/classes/:id/students`            | Get class students |
| POST   | `/admin/classes/:id/students`            | Enroll student     |
| DELETE | `/admin/classes/:id/students/:studentId` | Remove student     |
| GET    | `/admin/enrollments`                     | List enrollments   |

#### Analytics

| Method | Endpoint           | Description       |
| ------ | ------------------ | ----------------- |
| GET    | `/admin/stats`     | System statistics |
| GET    | `/admin/activity`  | Recent activity   |

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

### Admin Services

The admin module is organized into specialized services for different administrative functions:

#### AdminUserService
```typescript
class AdminUserService {
  getAllUsers(filters); // List users with pagination and filters
  getUserById(userId); // Get user details
  createUser(userData); // Create new user
  updateUser(userId, userData); // Update user information
  updateUserRole(userId, role); // Change user role
  deleteUser(userId); // Delete user account
}
```

#### AdminClassService
```typescript
class AdminClassService {
  getAllClasses(filters); // List classes with pagination
  getClassById(classId); // Get class details
  createClass(classData); // Create new class
  updateClass(classId, classData); // Update class
  deleteClass(classId); // Delete class
  reassignClassTeacher(classId, newTeacherId); // Change teacher
  archiveClass(classId); // Soft delete class
  getClassAssignments(classId); // Get class assignments
}
```

#### AdminEnrollmentService
```typescript
class AdminEnrollmentService {
  getClassStudents(classId); // Get enrolled students
  enrollStudent(classId, studentId); // Add student to class
  removeStudent(classId, studentId); // Remove student from class
  getAllEnrollments(filters); // List all enrollments
}
```

#### AdminAnalyticsService
```typescript
class AdminAnalyticsService {
  getSystemStatistics(); // Overall system metrics
  getRecentActivity(); // Recent user activity
}
```

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
  getEnrolledStudents(classId);
  createAssignment(classId, teacherId, data);
  getAssignmentDetails(assignmentId, userId);
  updateAssignment(assignmentId, teacherId, data);
  deleteAssignment(assignmentId, teacherId);
}
```

**Supported Programming Languages**: Python, Java, C

### SubmissionService

Handles file submissions with validation:

```typescript
class SubmissionService {
  submitAssignment(assignmentId, studentId, file);
  getSubmissionHistory(assignmentId, studentId);
  getAssignmentSubmissions(assignmentId, latestOnly);
  getFileDownloadUrl(filePath, expiresIn);
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

Manages student grades and statistics:

```typescript
class GradebookService {
  getClassGradebook(classId); // Get full gradebook
  getStudentGradebook(studentId); // Get all grades for a student
  overrideGrade(submissionId, grade, teacherId); // Manual override
  removeGradeOverride(submissionId, teacherId); // Remove override
  getLatePenaltyConfig(assignmentId); // Get late penalty settings
  setLatePenaltyConfig(assignmentId, config); // Update late penalty
  exportGradebookCSV(classId); // Export to CSV
  getClassStatistics(classId); // Get class-wide statistics
}
```

**Features**:
- Automatic grade calculation based on test results
- Late penalty application with configurable rates
- Manual grade overrides with audit trail
- CSV export for external processing
- Class-wide statistics (average, median, distribution)

### PlagiarismService

Handles file analysis and similarity detection using a custom Winnowing-based algorithm:

```typescript
class PlagiarismService {
  analyzeFiles(files); // Analyze raw files
  analyzeAssignmentSubmissions(assignmentId, teacherId); // Batch analysis
  getReport(reportId); // Get report details
  getReportPair(reportId, pairId); // Get specific pair comparison
  deleteReport(reportId); // Delete report
}
```

**Implementation Details**:
- Uses Tree-Sitter for language-specific AST parsing
- Implements Winnowing algorithm for fingerprint generation
- Stores match fragments with precise line/column positions
- Calculates similarity, overlap, and longest match metrics
- Supports Python, Java, and C programming languages

### CodeTestService

Executes code against test cases using Judge0:

```typescript
class CodeTestService {
  runTestsPreview(sourceCode, language, assignmentId); // Dry run
  runSubmissionTests(submissionId); // Run tests for submission
  checkExecutionServiceHealth(); // Check Judge0 availability
}
```

**Features**:
- Timeout protection (configurable via `TEST_EXECUTION_TIMEOUT_SECONDS`)
- Support for Python, Java, and C
- Test case execution with input/output validation
- Detailed error reporting and execution statistics

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
6. **Documentation** - Add comprehensive endpoint documentation

### Endpoint Documentation Standards

Every API endpoint must include comprehensive Fastify schema documentation:

**Required Elements:**
- **Endpoint comment**: Single-line comment with HTTP method, path, and summary (e.g., `// GET /users - List all users`)
- **tags**: Array with category (e.g., `["Admin - Users"]`, `["Classes"]`)
- **summary**: Brief description of what the endpoint does
- **description**: (Optional) Additional context or usage notes
- **security**: Authentication requirements (e.g., `[{ bearerAuth: [] }]`)
- **params/querystring/body**: Zod schema converted via `toJsonSchema()`
- **response**: Expected response schemas by status code

**Example:**
```typescript
// GET /classes/:id/students - Get enrolled students in a class
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
    const students = await classService.getEnrolledStudents(request.params.id);
    return reply.send({ success: true, students });
  },
});

// POST /submissions - Submit an assignment
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
    const submission = await submissionService.submitAssignment(request.body);
    return reply.status(201).send({ success: true, submission });
  },
});
```

**Endpoint Comment Format:**
```typescript
// {METHOD} {PATH} - {Summary from schema}
// Examples:
// GET /users/:id - Get user details by ID
// POST /classes - Create a new class
// PATCH /users/:id/role - Update user role
// DELETE /assignments/:id - Delete an assignment
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
  studentId: number
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

## Technology Stack

| Component           | Technology       | Version |
| ------------------- | ---------------- | ------- |
| Runtime             | Node.js          | 18+     |
| Language            | TypeScript       | 5.x     |
| Framework           | Fastify          | 5.x     |
| ORM                 | Drizzle ORM      | 0.36.x  |
| Database            | PostgreSQL       | Latest  |
| Validation          | Zod              | 4.x     |
| Auth                | Supabase Auth    | 2.x     |
| Storage             | Supabase Storage | 2.x     |
| Code Execution      | Judge0           | Latest  |
| Code Analysis       | Tree-Sitter      | 0.25.x  |
| Dependency Injection| tsyringe         | 4.x     |
| Testing             | Vitest           | 4.x     |
| API Documentation   | Swagger/OpenAPI  | 3.x     |
| Formatting          | Prettier         | 3.8.x   |

---

## License

MIT
