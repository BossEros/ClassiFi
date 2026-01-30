# ClassiFi Frontend Documentation

## Project Overview

The ClassiFi Frontend is a modern, responsive web application built with **React 19**, **Vite**, and **TypeScript**. It follows a strict **Clean Architecture** pattern to separate concerns between the UI (Presentation), Business Logic (Business), and Data Access (Data) layers. The application is styled using **Tailwind CSS v4** and manages global state via Context and Services.

## Technology Stack

| Category        | Technology       | Version | Description                    |
| --------------- | ---------------- | ------- | ------------------------------ |
| **Core**        | React            | 19.x    | UI Library                     |
| **Build Tool**  | Vite             | 7.x     | Fast bundler and dev server    |
| **Language**    | TypeScript       | 5.9.x   | Static typing                  |
| **Styling**     | Tailwind CSS     | 4.x     | Utility-first CSS framework    |
| **Routing**     | React Router DOM | 7.x     | Client-side routing            |
| **Auth & Data** | Supabase JS      | 2.93.x  | Authentication and Storage SDK |
| **Editor**      | Monaco Editor    | 0.55.x  | Code editor for IDE features   |
| **Icons**       | Lucide React     | 0.563.x | Icon set                       |
| **Testing**     | Vitest           | 4.x     | Unit and Integration testing   |
| **E2E Testing** | Playwright       | 1.58.x  | End-to-End testing             |
| **Formatting**  | Prettier         | 3.8.x   | Code formatting                |

---

## Project Structure

The codebase is organized into three main layers defined in the root directory:

```
frontend/
├── business/               # Domain Logic Layer
│   ├── models/             # Domain entities and interfaces (e.g., User, Class)
│   ├── services/           # Business logic and use cases (e.g., AuthService)
│   └── validation/         # Zod schemas for data validation
│
├── data/                   # Data Access Layer
│   ├── api/                # API clients, types, and adapters (Supabase)
│   ├── repositories/       # Implementation of data access patterns
│   └── mappers.ts          # Transformers between API DTOs and Domain Models
│
├── presentation/           # UI Layer
│   ├── components/         # Reusable React components
│   │   ├── admin/          # Admin-specific components
│   │   ├── dashboard/      # Dashboard widgets and distinct views
│   │   ├── forms/          # Complex form components
│   │   ├── gradebook/      # Gradebook and assessment UI
│   │   ├── modals/         # Dialogs and overlays
│   │   ├── plagiarism/     # Plagiarism detection UI components
│   │   ├── settings/       # User settings components
│   │   └── ui/             # Generic/Shared UI atoms (Button, Input, etc.)
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Full page views corresponding to routes
│   └── styles/             # Global styles and tailwind config
│
├── shared/                 # Cross-cutting concerns
│   ├── constants/          # Application constants
│   ├── context/            # React Contexts (e.g., ToastContext)
│   ├── types/              # Shared utility types
│   └── utils/              # Helper functions (Date formatting, etc.)
│
└── main.tsx                # Application Entry Point
```

---

## Architecture

### Clean Architecture Layers

1.  **Presentation Layer (`/presentation`)**:
    - **Responsibility**: Renders UI and handles user interactions.
    - **Dependency**: Depends only on the Business Layer.
    - **Key Concept**: Components should generally call _Services_, not Repositories or APIs directly.

2.  **Business Layer (`/business`)**:
    - **Responsibility**: Enforces business rules, validates data, and orchestrates workflows.
    - **Dependency**: Depends on the Data Layer (via Interfaces/Repositories) and Models.
    - **Key Concept**: Services are "pure" logic containers. `AuthService`, `ClassService`, etc.

3.  **Data Layer (`/data`)**:
    - **Responsibility**: Communicates with the Backend API and Supabase.
    - **Dependency**: None (conceptually, though it implements Business interfaces).
    - **Key Concept**: `Repositories` abstract the source of data. `Mappers` ensure the app uses clean Domain Models, not raw API DTOs.

### State Management

- **Local State**: Managed with `useState` and `useReducer` for component-specific logic.
- **Global State**: Minimal global state. Authentication state is synchronized via `supabaseAuthAdapter`. UI state (like Toasts) is managed via `ToastContext`.
- **Server State**: Fetched via Services. The app typically fetches fresh data on mount (useEffect) rather than using a heavy global cache, ensuring simplicity.

---

## Routing & Navigation

Routing is handled in `presentation/App.tsx`.

### Route Types

1.  **Public Routes**: `/login`, `/register`, `/forgot-password`, `/reset-password`.
2.  **Protected Routes**: Wrapped in `<ProtectedRoute>`. Requires authenticated user.
    - Redirects to `/login` if unauthorized.
3.  **Role-Based Routes**:
    - **Functions**: `RoleBasedDashboard`, `RoleBasedClassesPage`.
    - **Logic**: Conditionally renders `StudentDashboardPage`, `TeacherDashboardPage`, or `AdminDashboardPage` based on `user.role` ('student', 'teacher', 'admin').
    - **Teacher-Only**: Wrapped in `<TeacherOnlyRoute>` (e.g., creating classes).

### Key Routes

| Path                         | Component                  | Description                        |
| ---------------------------- | -------------------------- | ---------------------------------- |
| `/dashboard`                 | `RoleBasedDashboard`       | Main landing page after login.     |
| `/dashboard/classes`         | `RoleBasedClassesPage`     | List of enrolled/teaching classes. |
| `/dashboard/classes/:id`     | `RoleBasedClassDetailPage` | detailed view of a class.          |
| `/dashboard/assignments/:id` | `AssignmentDetailPage`     | IDE and submission interface.      |
| `/dashboard/users`           | `AdminUsersPage`           | User management (Admin only).      |

---

## Key Components

### Dashboard Components

- **`Sidebar`**: Main navigation, responsive.
- **`Header`**: User profile, notifications, breadcrumbs.

### Feature Components

- **`CodeEditor`**: (Monaco) Used in `AssignmentDetailPage` for coding tasks with syntax highlighting for Python, Java, and C.
- **`PlagiarismReport`**: Visualizes similarity analysis results with side-by-side code comparison.
  - **`PairsTable`**: Lists file pairs with similarity scores
  - **`PairComparison`**: Side-by-side code editor with match highlighting
  - **`PairCodeEditor`**: Monaco-based editor with synchronized scrolling
  - **`FragmentsTable`**: Detailed view of matching code fragments
  - **`SimilarityBadge`**: Visual indicator for similarity percentage
- **`GradebookTable`**: Manages student grades and overrides.
- **`TestResultsPanel`**: Displays test execution results with pass/fail status.

### Forms

- **`ClassForm`**: Create/Edit classes with schedule configuration.
- **`CourseworkForm`**: Create/Edit assignments with:
  - Programming language selection (Python, Java, C)
  - File attachments
  - Test cases with input/output validation
  - Late penalty configuration
  - Deadline and resubmission settings

---

## Business Services

The Business Layer contains services that encapsulate business logic and orchestrate data operations. All services validate inputs and handle errors before delegating to repositories.

### Available Services

| Service                     | Location                                       | Purpose                                                   |
| --------------------------- | ---------------------------------------------- | --------------------------------------------------------- |
| **authService**             | `business/services/authService.ts`             | User authentication, registration, password management    |
| **assignmentService**       | `business/services/assignmentService.ts`       | Assignment submission, file validation                    |
| **classService**            | `business/services/classService.ts`            | Class management, enrollment operations                   |
| **gradebookService**        | `business/services/gradebookService.ts`        | Grade management, statistics, late penalties, CSV export  |
| **plagiarismService**       | `business/services/plagiarismService.ts`       | Plagiarism detection and similarity analysis              |
| **studentDashboardService** | `business/services/studentDashboardService.ts` | Student dashboard data aggregation                        |
| **teacherDashboardService** | `business/services/teacherDashboardService.ts` | Teacher dashboard data aggregation                        |
| **testCaseService**         | `business/services/testCaseService.ts`         | Test case management for assignments                      |
| **testService**             | `business/services/testService.ts`             | Code execution and testing                                |
| **adminService**            | `business/services/adminService.ts`            | Admin operations (user management, analytics)             |
| **userService**             | `business/services/userService.ts`             | User profile operations (avatar upload, account deletion) |

### Service Guidelines

- **Input Validation**: All services validate inputs using utility functions (e.g., `validateId`) or Zod schemas before calling repositories.
- **Error Handling**: Services throw descriptive errors that can be caught and displayed in the UI.
- **Business Rules**: Services enforce business rules (e.g., grade must be 0-100, late penalty validation).
- **Repository Delegation**: Services delegate data operations to repositories, never accessing APIs directly.

---

## Data Flow & API Integration

1.  **Request**: Component calls `Service` method (e.g., `ClassService.getClasses()`).
2.  **Logic**: Service may validate inputs or check auth state. Service calls `Repository` (e.g., `ClassRepository.getAll()`).
3.  **Fetch**: Repository calls `apiClient` (axios/fetch wrapper) or Supabase SDK.
4.  **Response**: API returns JSON DTO.
5.  **Mapping**: Repository uses `mappers.ts` (e.g., `toClass`) to convert DTO -> Domain Model.
6.  **Render**: Component receives Domain Model and renders.

---

## Authentication Flow

1.  **Login**: User submits credentials to `LoginPage`.
2.  **Service**: `AuthService.login()` is called.
3.  **Supabase**: `supabase.auth.signInWithPassword()` is triggered.
4.  **Token**: Supabase manages the session (JWT). `supabaseAuthAdapter` listens for changes.
5.  **Redirect**: On success, user is navigated to `/dashboard`.
6.  **Persistence**: Session is persisted in LocalStorage/Cookies by Supabase client.

## Key Features

### Programming Language Support

ClassiFi supports three programming languages for assignments:

- **Python** (`.py` files)
- **Java** (`.java` files)
- **C** (`.c` files)

Language-specific features:

- Syntax highlighting in Monaco Editor
- File extension validation
- Language-specific test execution
- AST-based plagiarism detection

### Plagiarism Detection

The plagiarism detection system provides:

- **Side-by-side comparison**: View matched code fragments in parallel editors
- **Synchronized scrolling**: Navigate through matches seamlessly
- **Fragment highlighting**: Visual indicators for matching code regions
- **Similarity metrics**: Percentage similarity, overlap, and longest match
- **Interactive navigation**: Click fragments to jump to specific matches
- **Export capabilities**: Download reports for record-keeping

### Toast Notifications

Enhanced toast system with:

- **Pause on hover**: Prevents auto-dismiss when user is reading
- **Accessibility**: ARIA live regions and keyboard navigation
- **Auto-dismiss**: Configurable timeout (default: 5 seconds)
- **Multiple types**: Success, error, info, warning
- **Queue management**: Handles multiple toasts gracefully

### User Settings

Comprehensive settings page with:

- **Avatar upload**: Profile picture management via Supabase Storage
- **Password change**: Secure password update flow
- **Account deletion**: Self-service account removal with confirmation

---

## Development Guidelines

### Adding a New Page

1.  Create the page component in `presentation/pages/NewPage.tsx`.
2.  Define the route in `presentation/App.tsx`.
3.  (Optional) specific components in `presentation/components/feature/`.

### Adding Data Logic

1.  Define the Model in `business/models/`.
2.  Create/Update specific `Repository` in `data/repositories/`.
3.  Create/Update `Service` in `business/services/`.
4.  Consume in Component.

### Styling

- Use **Tailwind CSS** utility classes.
- Avoid arbitrary values (e.g., `w-[123px]`); use theme spacing.
- Common UI components (`Button`, `Card`) are in `presentation/components/ui`.

---

## Testing

- **Unit Tests**: `npm run test` (Vitest). Focus on `business/services` and utility logic.
- **E2E Tests**: Playwright (setup in `tests/e2e`).
  - Authentication flows
  - Class and assignment creation
  - Submission workflows
  - Smoke tests for critical paths

### Test Coverage

The project maintains comprehensive test coverage for:

- Business services (auth, class, assignment, gradebook)
- Data repositories (API integration)
- Utility functions (date formatting, validation)
- UI components (Button, Card, Input, Toast)
- E2E workflows (login, class creation, assignment submission)
