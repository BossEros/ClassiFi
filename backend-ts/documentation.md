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
│   │   ├── logger.ts         # Centralized pino logger wrapper
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

### Feature Module Layer (Phase 4)

The backend now uses a module-first layout under `src/modules/*`.

- `src/modules/auth`
- `src/modules/users`
- `src/modules/classes`
- `src/modules/assignments`
- `src/modules/submissions`
- `src/modules/gradebook`
- `src/modules/dashboard`
- `src/modules/notifications`
- `src/modules/plagiarism`
- `src/modules/admin`
- `src/modules/test-cases`

Current behavior:
- Feature implementations (controllers, services, repositories, schemas, models) are colocated in their module folders.
- Route registration imports module entry points from `src/modules/*/index.ts`.
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

*Note: The timeout value in the error message reflects the configured `TEST_EXECUTION_TIMEOUT_SECONDS` environment variable (default: 60 seconds).*

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

**Class Detail Response** (`GET /classes/:id`):
- Includes `instructorName` (teacher's full name)
- Includes `schedule` object with `days`, `startTime`, `endTime`
- Includes `studentCount` (number of enrolled students)

**Class Assignments Response** (`GET /classes/:id/assignments`):
- For students: Includes `submittedAt`, `grade`, and `maxGrade` fields
- `grade` is null if not yet graded
- `maxGrade` defaults to 100 if not specified

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

**Assignment Instructions Content**:
- Assignment create/update supports both text (`instructions`) and an optional image field (`instructionsImageUrl`)
- Business rule requires at least one instructions surface: text or image
- Assignment deadline is optional (`deadline` may be `null`) to support assignment with no due date
- Assignment create/update also supports late submission policy fields (`allowLateSubmissions`, `latePenaltyConfig`)
- If `allowLateSubmissions` is false, submissions after deadline are rejected when a deadline exists
- If `allowLateSubmissions` is true, late submissions are accepted and penalties are computed from the stored config (or default fallback) when a deadline exists
- Late penalty tiers apply immediately after the deadline (no grace-period window), with optional `rejectAfterHours` cutoff
- Instruction images are stored in the `assignment-descriptions` bucket and are cleaned up on image replacement, assignment deletion, and class deletion
- Storage setup is provisioned via SQL migration scripts under `backend-ts/drizzle/`

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

| Method | Endpoint                                                      | Description                    |
| ------ | ------------------------------------------------------------- | ------------------------------ |
| POST   | `/plagiarism/analyze`                                         | Analyze files                  |
| POST   | `/plagiarism/analyze/assignment/:assignmentId`                | Analyze full assignment        |
| GET    | `/plagiarism/reports/:reportId`                               | Get report details             |
| GET    | `/plagiarism/reports/:reportId/students`                      | Get student originality summary|
| GET    | `/plagiarism/reports/:reportId/students/:submissionId/pairs`  | Get student's pairs            |
| DELETE | `/plagiarism/reports/:reportId`                               | Delete report                  |
| GET    | `/plagiarism/reports/:reportId/pairs/:pairId`                 | Get match pair details         |
| GET    | `/plagiarism/results/:resultId/details`                       | Get result details             |

**Supported Languages**: Python, Java, C

**Detection Features**:
- AST-based tokenization using Tree-Sitter
- Winnowing fingerprinting algorithm
- Configurable k-gram size and window size
- Fragment-level match detection with line/column positions
- Similarity scoring and overlap metrics

**Student-Centric Analysis**:

The plagiarism system provides a student-centric view that calculates originality scores:

- **Originality Score**: Calculated as `1 - max_similarity` where max_similarity is the highest similarity score across all pairs involving the student
- **Color Coding**: Red (<30%), Yellow (30-60%), Green (>60%)
- **Use Case**: Quickly identify students with potential plagiarism concerns

**Example Response** (`GET /plagiarism/reports/:reportId/students`):
```json
{
  "success": true,
  "message": "Student summary retrieved successfully",
  "students": [
    {
      "studentId": 123,
      "studentName": "John Doe",
      "submissionId": 456,
      "originalityScore": 0.25,
      "highestSimilarity": 0.75,
      "highestMatchWith": {
        "studentId": 789,
        "studentName": "Jane Smith",
        "submissionId": 101
      },
      "totalPairs": 5,
      "suspiciousPairs": 2
    }
  ]
}
```

**Example Response** (`GET /plagiarism/reports/:reportId/students/:submissionId/pairs`):
```json
{
  "success": true,
  "message": "Student pairs retrieved successfully",
  "pairs": [
    {
      "id": 1,
      "leftFile": {
        "id": 456,
        "path": "submission.py",
        "filename": "submission.py",
        "lineCount": 50,
        "studentId": "123",
        "studentName": "John Doe"
      },
      "rightFile": {
        "id": 101,
        "path": "submission.py",
        "filename": "submission.py",
        "lineCount": 48,
        "studentId": "789",
        "studentName": "Jane Smith"
      },
      "structuralScore": 0.75,
      "semanticScore": 0,
      "hybridScore": 0,
      "overlap": 35,
      "longest": 12
    }
  ]
}
```

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

| Type                  | Trigger Event                | Recipients        |
| --------------------- | ---------------------------- | ----------------- |
| `ASSIGNMENT_CREATED`  | Teacher creates assignment   | Enrolled students |
| `SUBMISSION_GRADED`   | Submission receives grade    | Student           |

**Features**:
- In-app notifications with real-time unread count
- Email delivery queue with retry logic
- Configurable notification channels (IN_APP, EMAIL)
- Pagination support for notification history
- User-specific notification filtering
- Authorization checks (users can only access their own notifications)

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

Templates include:
- Responsive HTML design
- Action buttons linking to relevant pages
- Assignment/submission details
- Branding and styling

**Delivery Queue**:

Notifications are queued for email delivery with:
- Automatic retry on failure (max 3 attempts)
- Exponential backoff between retries
- Status tracking (PENDING, SENT, FAILED, RETRYING)
- Error logging for debugging

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
     ├───────────►│Enrollment│         │Submission│◄───────┤ TestResult │
     │            └──────────┘         └────┬────┘         └────────────┘
     │                                      │
     │                             ┌────────▼────────┐
     │                             │SimilarityReport │
     │                             └────────┬────────┘
     │                                      │
     │                             ┌────────▼────────┐
     │                             │SimilarityResult │◄───────┐
     │                             └────────┬────────┘        │
     │                                      │           ┌─────┴────────┐
     │                                      └──────────►│MatchFragment │
     │                                                  └──────────────┘
     │
     │            ┌──────────────┐
     └───────────►│ Notification │
                  └──────┬───────┘
                         │
                  ┌──────▼──────────────────┐
                  │ NotificationDelivery    │
                  └─────────────────────────┘
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

### Notification Models

```typescript
export const notificationTypeEnum = pgEnum("notification_type", [
  "ASSIGNMENT_CREATED",
  "SUBMISSION_GRADED",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "EMAIL",
  "IN_APP",
]);

export const deliveryStatusEnum = pgEnum("delivery_status", [
  "PENDING",
  "SENT",
  "FAILED",
  "RETRYING",
]);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationDeliveries = pgTable("notification_deliveries", {
  id: serial("id").primaryKey(),
  notificationId: integer("notification_id").notNull().references(() => notifications.id, { onDelete: "cascade" }),
  channel: notificationChannelEnum("channel").notNull(),
  status: deliveryStatusEnum("status").notNull().default("PENDING"),
  retryCount: integer("retry_count").notNull().default(0),
  sentAt: timestamp("sent_at"),
  failedAt: timestamp("failed_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Indexes**:
- `notifications`: `user_id`, `created_at`, `is_read`, composite `(user_id, is_read)`
- `notification_deliveries`: `notification_id`, `status`, composite `(status, created_at)`

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
  getClassStudents(classId); // Get enrolled students with full info
  removeStudent(classId, studentId, teacherId); // Remove student from class
  createAssignment(classId, teacherId, data);
  getAssignmentDetails(assignmentId, userId);
  updateAssignment(assignmentId, teacherId, data);
  deleteAssignment(assignmentId, teacherId);
  getClassAssignmentsForStudent(classId, studentId); // Get assignments with student-specific data
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

### NotificationService

Manages user notifications and email delivery:

```typescript
class NotificationService {
  createNotification(userId, type, data); // Create notification with email queue
  getUserNotifications(userId, page, limit, unreadOnly); // Get paginated notifications
  getUnreadCount(userId); // Get unread notification count
  markAsRead(notificationId, userId); // Mark single notification as read
  markAllAsRead(userId); // Mark all user notifications as read
  deleteNotification(notificationId, userId); // Delete notification
}
```

**Features**:
- Automatic notification creation on key events (assignment creation, grading)
- Email delivery queue with retry logic
- Template-based email generation
- User authorization checks
- Pagination support

**Notification Types**:
- `ASSIGNMENT_CREATED` - Sent to all enrolled students when teacher creates assignment
- `SUBMISSION_GRADED` - Sent to student when their submission is graded

**Email Providers**:
- SendGrid (recommended for production)
- SMTP (for custom email servers)
- Supabase (uses built-in email service)

**Delivery Queue**:
- Automatic retry on failure (max 3 attempts)
- Exponential backoff between retries
- Status tracking (PENDING, SENT, FAILED, RETRYING)

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
import type { ValidatedRequest } from "@/api/plugins/zod-validation"

app.post("/register", {
  preHandler: validateBody(RegisterRequestSchema),
  handler: async (request, reply) => {
    const body = (request as ValidatedRequest<RegisterRequest>).validatedBody;
    // body is fully typed and validated
  },
});
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
    const students = await classService.getEnrolledStudents(request.params.id);
    return reply.send({ success: true, students });
  },
});

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
    const submission = await submissionService.submitAssignment(request.body);
    return reply.status(201).send({ success: true, submission });
  },
});
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
