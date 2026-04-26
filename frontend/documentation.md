# ClassiFi Frontend Documentation

## Project Overview

The ClassiFi Frontend is a role-aware single-page application built with **React 19**, **Vite**, and **TypeScript**. It follows a strict **Clean Architecture** split between Presentation, Business, and Data layers so UI code stays thin and feature logic remains testable. The app uses **Tailwind CSS v4** for styling, **Zustand** for minimal shared state, **react-hook-form + Zod** for form workflows, and Supabase-backed services for authentication and storage.

## Technology Stack

| Category | Technology | Version | Description |
| -------- | ---------- | ------- | ----------- |
| **Core** | React | 19.2.x | UI library for the application shell and feature pages |
| **Build Tool** | Vite | 7.2.x | Dev server and production bundler |
| **Language** | TypeScript | 5.9.x | Static typing across UI, services, and tests |
| **Styling** | Tailwind CSS | 4.1.x | Utility-first styling and design tokens |
| **Routing** | React Router DOM | 7.13.x | Browser routing with shared, teacher, student, and admin route groups |
| **Forms** | React Hook Form + Zod | 7.71.x / 4.3.x | Typed form state, validation, and submission flows |
| **State** | Zustand | 5.0.x | Minimal shared auth and toast state |
| **Auth & Storage** | Supabase JS | 2.93.x | Authentication session handling and storage access |
| **Editor** | Monaco Editor | 0.55.x | Code editor for assignment authoring and review |
| **Calendar & Dates** | react-big-calendar + date-fns | 1.19.x / 4.1.x | Shared calendar views and date formatting |
| **PDF Export** | @react-pdf/renderer | 4.3.x | Teacher-facing plagiarism evidence export |
| **Icons** | Lucide React | 0.563.x | Consistent iconography across the UI |
| **Testing** | Vitest + Playwright | 4.x / 1.58.x | Centralized unit tests and end-to-end workflows |
| **Formatting** | Prettier | 3.8.x | Markdown, TypeScript, and CSS formatting |

---

## Styling Architecture

Global styling is centralized through the CSS entrypoint at `src/index.css`.

- `src/index.css`: The single stylesheet imported by the app. It should stay small and only compose the styling system.
- `src/styles/tokens.css`: App-wide design tokens defined with Tailwind v4 `@theme` (`--color-*`, `--radius-*`, `--shadow-*`, `--font-*`, etc.).
- `src/styles/base.css`: Global element-level rules such as document scroll behavior, typography defaults, and selection styling.
- `src/styles/utilities.css`: Project-wide utility helpers that are intentionally global, such as `.custom-scrollbar` and `.sr-only`.

Guidelines:

- Put app-wide UI decisions and reusable design tokens in `src/styles/tokens.css`.
- Put only true global element resets/defaults in `src/styles/base.css`.
- Put only intentionally shared CSS helpers in `src/styles/utilities.css`.
- Do not add one-off component styling to these files. Keep component-specific styling inside the component or the relevant shared theme constant/module.
- Prefer shared React UI components and colocated constants for reusable component styling over global CSS helper classes.

This keeps the frontend scalable while preserving a single entrypoint for global design decisions.

---

## Project Structure

The codebase keeps application source under `src/`:

```text
frontend/
|-- src/
|   |-- app/                # App composition and route wiring
|   |   |-- routes/
|   |   `-- App.tsx
|   |-- business/           # Domain Logic Layer
|   |   `-- services/       # Business services (auth, class, assignment, etc.)
|   |-- data/               # Data Access Layer
|   |   |-- api/            # API type definitions, clients, and adapters
|   |   |-- repositories/
|   |   `-- mappers.ts
|   |-- presentation/       # UI Layer
|   |   |-- components/
|   |   |   |-- admin/
|   |   |   |-- auth/
|   |   |   |-- shared/
|   |   |   |   |-- assignmentDetail/  # Shared assignment detail form and test card
|   |   |   |   |-- calendar/          # Calendar view components
|   |   |   |   |-- dashboard/         # Layout, sidebar, top bar, notification widgets
|   |   |   |   |-- modules/           # Module UI components (ViewToggle, ModuleCard, etc.)
|   |   |   |   `-- pdf/               # Shared PDF report type definitions
|   |   |   |-- student/
|   |   |   |   `-- grades/            # Student grade display components and PDF export
|   |   |   |-- teacher/
|   |   |   |   |-- classDetail/       # Teacher class detail tab contents
|   |   |   |   |-- forms/             # Assignment form sub-components
|   |   |   |   |-- gradebook/         # Gradebook content and grade override modal
|   |   |   |   `-- plagiarism/        # Similarity graph, pair comparison, cross-class section
|   |   |   `-- ui/                    # Shared UI primitives (Button, Card, Input, etc.)
|   |   |-- hooks/
|   |   |   |-- shared/                # Shared hooks (useZodForm, useCalendar, useMediaQuery, etc.)
|   |   |   |   `-- assignmentDetail/  # Assignment detail data and submission hooks
|   |   |   `-- teacher/               # Teacher-specific hooks (useAssignmentForm, useGradebook)
|   |   |-- pages/
|   |   |-- schemas/
|   |   `-- utils/
|   |-- shared/             # Cross-cutting concerns
|   |   |-- constants/
|   |   |-- store/
|   |   `-- utils/
|   |-- tests/              # Centralized tests, setup, and mocks
|   |   |-- unit/           # All frontend unit test files (*.test.ts|tsx)
|   |   |-- e2e/            # Playwright tests
|   |   |-- mocks/          # Test doubles / MSW handlers
|   |   `-- setup.ts        # Vitest setup
|   |-- index.css           # Global styling entrypoint
|   |-- styles/             # Global styling organization
|   |   |-- tokens.css      # Tailwind v4 theme tokens
|   |   |-- base.css        # Global element defaults
|   |   `-- utilities.css   # Shared global helpers
|   `-- main.tsx            # Application Entry Point
|-- public/
`-- index.html
```

---

## Architecture

### Clean Architecture Layers

1.  **Presentation Layer (`/src/presentation`)**:
    - **Responsibility**: Renders UI and handles user interactions.
    - **Dependency**: Depends only on the Business Layer.
    - **Key Concept**: Components should generally call _Services_, not Repositories or APIs directly.

2.  **Business Layer (`/src/business`)**:
    - **Responsibility**: Enforces business rules, validates data, and orchestrates workflows.
    - **Dependency**: Depends on the Data Layer (via Repositories).
    - **Key Concept**: Services are the sole inhabitants of this layer. Each service encapsulates domain logic for its feature area (e.g., `authService`, `classService`, `calendarService`).

3.  **Data Layer (`/src/data`)**:
    - **Responsibility**: Communicates with the Backend API and Supabase.
    - **Dependency**: None (conceptually, though it implements Business interfaces).
    - **Key Concept**: `Repositories` abstract the source of data. `Mappers` ensure the app uses clean Domain Models, not raw API DTOs.

### State Management

- **Local State**: Managed with `useState` and `useReducer` for component-specific logic.
- **Global State**: Minimal global state with Zustand stores.
  - Auth state is handled in `src/shared/store/useAuthStore.ts`, persisted in `localStorage`, and synchronized across browser tabs through a `storage` event listener.
  - Toast state is handled in `src/shared/store/useToastStore.ts` and rendered in `src/app/App.tsx` via `ToastContainer`.
- **Server State**: Fetched via Services. The app typically fetches fresh data on mount (useEffect) rather than using a heavy global cache, ensuring simplicity.

---

## Routing & Navigation

Routing is composed in `src/app/App.tsx`, which mounts route groups from `src/app/routes/*` in this order: `auth.routes.tsx`, `shared.routes.tsx`, `student.routes.tsx`, `teacher.routes.tsx`, and `admin.routes.tsx`.

### Route Types

1. **Public routes**: Authentication flows such as `/login`, `/register`, `/forgot-password`, `/reset-password`, and email confirmation live in `auth.routes.tsx`.
2. **Shared protected routes**: Core authenticated routes such as `/dashboard`, `/dashboard/classes`, `/dashboard/assignments`, `/dashboard/settings`, `/dashboard/notifications`, and `/dashboard/calendar` live in `shared.routes.tsx` and are wrapped in `ProtectedRoute`.
3. **Role-based guards**: `RoleBasedDashboard`, `RoleBasedClassesPage`, and `RoleBasedClassDetailPage` choose the correct student, teacher, or admin page at runtime from the authenticated user role.
4. **Teacher-specific routes**: Assignment authoring, gradebook, submissions, and similarity review are defined in `teacher.routes.tsx`. `TeacherOnlyRoute` is currently enforced for teacher class creation; the rest of the teacher surfaces are auth-protected and keep teacher/admin action checks in-page where appropriate.
5. **Admin-specific routes**: User management, enrollment management, and admin class create/edit routes live in `admin.routes.tsx`.

### Route Behavior Notes

- `RoleBasedClassDetailPage` renders `AdminClassDetailPage` for admins and the shared teacher/student class detail page for everyone else.
- `AuthRedirectHandler` normalizes Supabase email-confirmation and recovery links into the correct reset or confirmation pages.
- Shared pages such as assignment detail, settings, notifications, and calendar are intentionally routed once and adapt based on user role and available permissions.
- Teacher self-registration completes normally, but the frontend does not persist a local auth session for teacher accounts returned with `isActive = false`.
- If backend verification rejects a teacher with pending approval or rejects a student/admin because the account is deactivated, the frontend immediately clears the Supabase session, clears local auth state, and shows the exact backend message unchanged.

### Key Routes

| Path | Component | Description |
| ---- | --------- | ----------- |
| `/dashboard` | `RoleBasedDashboard` | Student, teacher, or admin landing page after authentication |
| `/dashboard/classes` | `RoleBasedClassesPage` | Student, teacher, or admin classes listing |
| `/dashboard/classes/:classId` | `RoleBasedClassDetailPage` | Role-specific class detail page |
| `/dashboard/assignments` | `AssignmentsPage` | Shared assignments listing |
| `/dashboard/assignments/:assignmentId` | `AssignmentDetailPage` | Shared assignment detail, IDE, and submission review surface |
| `/dashboard/assignments/:assignmentId/submissions` | `AssignmentSubmissionsPage` | Teacher/admin submissions workspace for an assignment |
| `/dashboard/assignments/:assignmentId/similarity` | `SimilarityResultsPage` | Graph-first plagiarism triage and evidence export |
| `/dashboard/assignments/:assignmentId/cross-class-similarity` | `CrossClassSimilarityPage` | Cross-class similarity review for a teacher-owned assignment |
| `/dashboard/classes/:classId/gradebook` | `GradebookPage` | Teacher/admin gradebook page |
| `/dashboard/settings` | `SettingsPage` | Shared account settings and notification preferences |
| `/dashboard/notifications` | `NotificationsPage` | Shared notifications inbox |
| `/dashboard/calendar` | `CalendarPage` | Shared calendar experience |
| `/dashboard/users` | `AdminUsersPage` | Admin-only user management workspace |
| `/dashboard/enrollments` | `AdminEnrollmentsPage` | Admin-only cross-class enrollment workspace |
| `/dashboard/admin/classes/new` | `AdminClassFormPage` | Admin class creation page |
| `/dashboard/admin/classes/:classId/edit` | `AdminClassFormPage` | Admin class edit page |

Admin class detail behavior:
- `AdminClassDetailPage` is a student-management focused view.
- Admins can review class metadata, search enrolled students, enroll new students, and remove students.
- Assignment-list tabs are intentionally not shown in this admin detail view.

Admin enrollment workspace behavior:
- `AdminEnrollmentsPage` provides a cross-class enrollment registry for admins.
- Admins can search by student, class, or teacher and filter by class status, semester, and academic year.
- The page supports manual enrollment, student transfer between active classes, and direct removal with confirmation modals.

---

## Key Components

### Dashboard Components

- **`Sidebar`**: Main navigation, responsive.
- **`TopBar`**: Breadcrumbs, page actions, profile controls, and notification access.
- **`ClassCard`**: Displays class information in list view with code pattern background, instructor avatar, student count, term info, and archived status. Used in classes list pages.
- **`ClassHeader`**: Displays class information including name, instructor, schedule, and optional description with action buttons (teachers: Gradebook button and Edit/Delete dropdown; students: Leave Class dropdown).
- **`ClassTabs`**: Tab navigation for Assignment, Students, and Calendar views with keyboard accessibility.
- **`CustomEventComponent`**: Month-view calendar event content renderer that shows assignment title (with status icon) in a compact single-line card.
- **`ClassCalendarTab`**: Inline calendar tab on the class detail page showing the assignment deadlines for a specific class.
- **`CustomDayView`** / **`CustomWeekView`**: Custom `react-big-calendar` views that render day/week grids with CSS-offset positioning for better time slot visibility.
- **`CustomToolbar`** / **`CustomViewToolbar`**: Toolbar components for the main calendar page and the class-level tab view respectively, providing navigation controls and view switchers.
- **`EventDetailsModal`**: Overlay panel showing full event details (assignment name, class, due date, status) when a calendar event is clicked.
- **`AssignmentFilterBar`**: Role-aware filter buttons with counts. Student view uses all/pending/submitted; teacher view uses all/current & upcoming/past timeline filters.
- **`AssignmentSection`**: Groups assignments by time period (current/upcoming vs past) with section headers.
- **`AssignmentCard`**: Shared assignment card with role-based content. Student cards show submission/status context and grades. Teacher cards emphasize assignment name + due date and intentionally hide student-only status badges and submission ratio details.
- **`ViewToggle`**, **`ModuleCard`**, and **`CreateModuleInput`**: Teacher-only module-management UI for switching between grouped module view and flat assignment-list view.

### Feature Components

- **`CodeEditor`**: (Monaco) Used in `AssignmentDetailPage` for coding tasks with syntax highlighting for Python, Java, and C.
- **`SimilarityGraphView`**: Controlled SVG graph overview with a compact right-rail workflow for threshold control and review context before pairwise drill-down.
- **`PairwiseTriageTable`**: Assignment-level table of student pairs with similarity threshold filtering, sorting, search, and pagination.
- **`PairComparison`** and **`PairCodeDiff`**: Side-by-side code comparison surfaces for evidence review.
- **Teacher PDF exports**: Threshold-aware class report download plus pairwise evidence download built with `@react-pdf/renderer`
- **`GradebookTable`**: Displays read-only student grades and averages for monitoring/export.
- **`StudentClassGradesContent`**: Student-only class grades tab that shows personal current grade, grading progress, pending review count, not-submitted count, assignment-level scores, late-penalty badges, similarity-deduction breakdowns, and teacher feedback without exposing any class ranking or peer data.
- **`CollapsibleInstructions`**: Reusable instruction panel with left icon + right chevron toggle; supports `defaultExpanded` for page-specific defaults.
- **`SummaryStatCard`**: Shared icon-label-value card used by teacher submissions metrics and similarity analysis summaries.
- **`AssignmentSubmissionsTable`**: Teacher submissions table (`Student Name`, `Status`, `Grade`, `Action`) with avatar cells, centered actions, and built-in pagination summary/controls.
- **`AssignmentTestResultsCard`**: Displays test details in stacked blocks (`Input`, `Expected`, `Actual`) to preserve output readability; hidden-case details are role-aware (teacher/admin can view, student view remains masked).
- **`AssignmentDetailPage`**: Shared assignment detail view now shows the similarity-policy notice before submission and a score breakdown (`raw score`, deduction, final score) when similarity penalties apply.

### Forms

- **`ClassForm`**: Create/Edit classes with schedule configuration.
- **`AssignmentForm`**: Create/Edit assignments with:
  - Module selection for choosing or reassigning which module owns the assignment
  - Programming language selection (Python, Java, C)
  - Instructions text plus optional image attachment (preview)
  - File attachments
  - Test cases with input/output validation
  - Late submission policy toggle (`Allow late submissions`) with conditional late penalty configuration (penalty tiers + optional reject-after cutoff, no grace period)
  - Similarity deduction toggle (`Deduct score based on similarity score`) with helper copy explaining the capped hybrid-band policy
  - Optional deadline settings (assignment can be created without a deadline)
  - Create flow requires any provided deadline to be in the future; edit flow allows keeping or saving an already-past deadline so teachers can revise expired assignments without reopening them
  - Resubmission settings
- **`AdminUserModal` / `AdminEditUserModal`**: Admin user create/edit flows use `react-hook-form` + Zod schemas.
- **`AdminDeactivateUserModal`**: Admin user deactivation confirmation flow uses `react-hook-form` + Zod confirmation schema and preserves academic records.
- **`ChangePasswordModal`**: Password change flow uses `react-hook-form` + Zod schema with strong-password and confirmation checks.
- **Account Status settings card**: Student and teacher settings show a read-only account status card with the current access state and administrator contact guidance. Admin settings intentionally omit this card.
- **`GradeOverrideModal`**: Shared grade-override input (used from teacher submission detail view) with `react-hook-form` + dynamic Zod schema and assignment-score bounds.

Frontend form validation schemas are colocated in `src/presentation/schemas/*` by feature:

- `auth/` for authentication forms
- `class/` for class management forms
- `assignment/` for assignment authoring forms
- `admin/` for admin user forms
- `gradebook/` for grade override forms

### RHF + Zod Form Pattern (Standard)

All new or refactored Presentation-layer forms should follow this pattern:

- Define a feature-local Zod schema in `src/presentation/schemas/<feature>/...`.
- Infer form types from schema using `z.infer<typeof schema>`.
- Use `useZodForm` to wire `react-hook-form` and `zodResolver` consistently.
- Map field errors through `getFieldErrorMessage` and modal-level summaries through `getFirstFormErrorMessage`.
- Keep submit handlers delegating to Business services, preserving Clean Architecture boundaries.

Reference implementations:

- `src/presentation/components/auth/forms/LoginForm.tsx`
- `src/presentation/pages/teacher/AssignmentFormPage.tsx`
- `src/presentation/components/admin/AdminUserModal.tsx`
- `src/presentation/components/shared/settings/ChangePasswordModal.tsx`

**Assignment Instructions Image Storage Configuration**:

- Uses Supabase Storage bucket configured via `VITE_SUPABASE_ASSIGNMENT_INSTRUCTIONS_BUCKET` (defaults to `assignment-descriptions`)
- If the configured bucket is unavailable, the client attempts fallback upload buckets for compatibility

### Shared Presentation Hooks (Admin Pages)

- **`useDebouncedValue`** (`src/presentation/hooks/shared/useDebouncedValue.ts`): Centralizes debounced search input behavior used by admin list pages.
- **`useDocumentClick`** (`src/presentation/hooks/shared/useDocumentClick.ts`): Standardized click-outside handling for dropdown dismissal and menu cleanup.
- **`useRequestState`** (`src/presentation/hooks/shared/useRequestState.ts`): Shared fetch lifecycle utility for loading/error state and request execution wrappers.
- **`useAssignmentDetailData`** (`src/presentation/hooks/shared/assignmentDetail/useAssignmentDetailData.ts`): Handles assignment detail authentication and role-based initial data loading.
- **`useAssignmentSubmissionFlow`** (`src/presentation/hooks/shared/assignmentDetail/useAssignmentSubmissionFlow.ts`): Encapsulates assignment submission workflow, file validation, test preview execution, and submission-result polling.
- **`useAssignmentCodePreview`** (`src/presentation/hooks/shared/assignmentDetail/useAssignmentCodePreview.ts`): Manages code preview modal state, submission preview loading, and submission download actions.
- **`useCalendar`** (`src/presentation/hooks/shared/useCalendar.ts`): Manages full calendar state including events, view modes (month/week/day/agenda), period navigation, class-based event filtering, and event detail modal. Delegates to `calendarService` for data fetching.
- **`useMediaQuery`** / **`useIsMobile`** / **`useIsTabletOrBelow`** (`src/presentation/hooks/shared/useMediaQuery.ts`): Subscribes to CSS media queries via `useSyncExternalStore`. `useIsMobile` returns true below 640 px; `useIsTabletOrBelow` returns true below 1024 px.

### Teacher-Specific Presentation Hooks

- **`useAssignmentForm`** (`src/presentation/hooks/teacher/useAssignmentForm.ts`): Manages the full assignment creation/edit form state including module selection, test cases, late penalty tiers, and file attachment handling.
- **`useGradebook`** (`src/presentation/hooks/teacher/useGradebook.ts`): Encapsulates gradebook data fetching and grade override/remove lifecycle for the teacher gradebook page.

---

## Business Services

The Business Layer contains services that encapsulate business logic and orchestrate data operations. All services validate inputs and handle errors before delegating to repositories.

### Available Services

| Service                          | Location                                                | Purpose                                                                              |
| -------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **authService**                  | `src/business/services/authService.ts`                  | User authentication, registration, password management                               |
| **assignmentService**            | `src/business/services/assignmentService.ts`            | Assignment submission, file validation                                               |
| **calendarService**              | `src/business/services/calendarService.ts`              | Calendar event aggregation for student and teacher views; date-range-aware fetching  |
| **classService**                 | `src/business/services/classService.ts`                 | Class management, enrollment operations                                              |
| **crossClassPlagiarismService**  | `src/business/services/crossClassPlagiarismService.ts`  | Cross-class similarity analysis and result retrieval for teacher-owned assignments   |
| **gradebookService**             | `src/business/services/gradebookService.ts`             | Grade management, statistics, late penalties, CSV export                             |
| **moduleService**                | `src/business/services/moduleService.ts`                | Module CRUD inside a class (create, rename, publish toggle, delete)                  |
| **notificationService**          | `src/business/services/notificationService.ts`          | Notification management, unread counts, mark as read                                 |
| **plagiarismService**            | `src/business/services/plagiarismService.ts`            | Assignment-level similarity analysis, pairwise code comparison, report management    |
| **studentDashboardService**      | `src/business/services/studentDashboardService.ts`      | Student dashboard data aggregation                                                   |
| **teacherDashboardService**      | `src/business/services/teacherDashboardService.ts`      | Teacher dashboard data aggregation                                                   |
| **testCaseService**              | `src/business/services/testCaseService.ts`              | Test case management for assignments                                                 |
| **testResultNormalizer**         | `src/business/services/testResultNormalizer.ts`         | Normalizes raw test-result API responses into consistent `TestResultDetail` objects  |
| **testService**                  | `src/business/services/testService.ts`                  | Code execution and testing                                                           |
| **adminService**                 | `src/business/services/adminService.ts`                 | Admin operations (user management, classes, enrollments, analytics)                  |
| **userService**                  | `src/business/services/userService.ts`                  | User profile operations (avatar upload, notification preferences, account deletion)  |

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
7.  **Inactive account cleanup**: If backend profile verification rejects the sign-in because the teacher is pending approval or the student/admin account is deactivated, the frontend signs out from Supabase and clears local auth state before showing the backend message.

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

### Cross-Class Plagiarism Detection

Cross-class analysis extends the per-assignment similarity workflow to compare submissions across multiple classes taught by the same teacher:

- Accessible from the submissions page via a dedicated `Cross-Class Similarity` action that navigates to `/dashboard/assignments/:assignmentId/cross-class-similarity`.
- `CrossClassSimilarityPage` fetches the assignment details and renders a `CrossClassResultsSection` showing matching assignments found across other classes.
- Results include per-pair structural, semantic, and hybrid scores so teachers can identify suspicious cross-class sharing quickly.
- Selected cross-class pair review reuses the shared `PairComparison` / `PairCodeDiff` experience, including temporal submission-order context when both submissions expose timestamps.
- Cross-class reports are retained as historical records; newer analyses do not overwrite prior cross-class results.
- `crossClassPlagiarismService` deduplicates in-flight requests per assignment using a module-scoped `Map` so concurrent navigation events do not double-trigger analysis.
- `Download Class Report` is also available on the cross-class page to export the current threshold view.

### Plagiarism Detection

The plagiarism detection workflow is pairwise-triage-first so teachers can review high-risk matches quickly while still seeing graph relationships:

- **Assignment-level summary cards**: Suspicious pairs, analyzed submissions, and maximum similarity.
- **Similarity graph overview**: A native React SVG graph that derives nodes from the analyzed-submission list and edges from the active pair results, while keeping graph selection in page state so the graph and triage table stay synchronized.
- **Shared draggable threshold**: The `Threshold >= X%` slider drives the graph and pairwise table together so review surfaces never drift out of sync.
- **Isolated submission toggle**: `Show isolated submissions` lets teachers reveal isolated submissions, including true zero-pair submissions returned by the backend.
- **Right-rail review context**: The graph card keeps a populated `Review Context` panel with full student names, member pills, reset access, and review shortcuts so teachers are never dropped into a blank side panel.
- **Hover and selection details**: Hovering a node shows quick similarity context; clicking a node or cluster narrows the pairwise table and refreshes the review-context panel.
- **Edge-driven review**: Clicking a graph edge jumps directly into pairwise code comparison for that specific submission pair.
- **Pairwise triage table**: Shows `Student A vs Student B` rows directly for assignment-level review and reuses the shared threshold from the graph view.
- **Default high-similarity filter**: Starts at `95%` to keep the first graph view focused on the strongest matches.
- **Fast triage controls**: Sortable `Overall Similarity`, `Structural Similarity`, and `Semantic Similarity` scores, along with qualitative `Total Shared Chunks` and `Longest Continuous Shared Block` signals (with plain-language tooltips), and paginated results.
- **Details on demand**: `Compare Code` (or row click) opens side-by-side match/diff inspection with fragment context and auto-scrolls to the comparison panel.
- **Class PDF export**: `Download Class Report` exports the active threshold view only, including summary metrics, a static graph, and the threshold-qualified pair table.
- **Pairwise evidence PDF**: `Download Pair Report` exports the selected comparison with overall, structural, and semantic metrics, fragment evidence rows, and full source-code appendices.
- **Evidence timestamps**: Export metadata shows both the original report generation time and the actual download time so the PDF can be used as a teacher-facing evidence artifact.

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
- **Notification preferences**: Two global delivery toggles for email and in-app notifications backed by `userService`
- **Account deletion**: Self-service account removal with confirmation for non-teacher roles

Teacher account deletion UX notes:

- Teachers no longer see the destructive self-delete danger zone in `SettingsPage`.
- `SettingsPage` shows a management notice instead, explaining that teacher accounts can be removed only by an administrator.
- Admin user deletion blocks teacher deletion when assigned classes remain and directs admins to reassign classes first.

### Notification System

Real-time notification system that keeps users informed about important events:

#### Components

- **`NotificationBadge`**: Displays unread notification count in the top bar
  - Shows count badge (red circle) when unread notifications exist
  - Displays "99+" for counts over 99
  - Polls for updates every 30 seconds
  - Toggles notification dropdown on click
- **`NotificationDropdown`**: Quick access to recent notifications
  - Shows last 5 notifications
  - "Mark all read" button for bulk actions
  - "View all" link to full notifications page
  - Click outside to close
  - Loading and empty states
- **`NotificationItem`**: Individual notification display
  - Type-specific icons (Bell, CheckCircle, etc.)
  - Title and message text
  - Relative time display ("5m ago", "2h ago")
  - Unread indicator (blue dot)
  - Different styling for read vs unread
  - Click to mark as read
- **`NotificationCard`**: Full notification card for notifications page
  - Complete notification details
  - Delete button
  - Mark as read button (if unread)
  - Metadata display (assignment links, grades, etc.)
- **`NotificationsPage`**: Full notification management page
  - Paginated list (20 per page)
  - "Load more" button for infinite scroll
  - "Mark all as read" action
  - Empty state when no notifications
  - Total count display
  - Individual delete actions

#### Notification Types

| Type                 | Trigger                    | Content                                |
| -------------------- | -------------------------- | -------------------------------------- |
| `ASSIGNMENT_CREATED` | Teacher creates assignment | Assignment title, class name, due date |
| `SUBMISSION_GRADED`  | Submission score changes for automatic grading, teacher grading, overrides, late penalties, or similarity review | Assignment title, updated score, reason-specific metadata |

`SUBMISSION_GRADED` metadata now includes a required `reason` field:

- `automatic_grade` for the first auto-graded score
- `manual_grade` when a teacher grades directly
- `grade_override` when a teacher replaces the visible score
- `late_penalty_applied` when lateness reduces the visible score and includes human-readable lateness text
- `similarity_deduction` when similarity review reduces the visible score and includes the matched student name or names
| `NEW_USER_REGISTERED` | Teacher self-registers and awaits approval | Teacher name/email and approval-needed context for admins |

#### Features

- **Real-time Updates**: Unread count polls every 30 seconds
- **Pagination**: Efficient loading of notification history
- **Bulk Actions**: Mark all as read with single click
- **Individual Actions**: Mark as read or delete specific notifications
- **Responsive Design**: Works on mobile and desktop
- **Accessibility**: Keyboard navigation and screen reader support
- **Time Formatting**: Human-readable relative timestamps
- **Icon Mapping**: Type-specific icons for visual clarity

Teacher approval UX notes:

- The registration completion step uses a teacher-specific success message when the new account is inactive:
  - `Your access is pending administrator approval. You will be able to sign in once your account has been reviewed and approved by the admin`
- Admin user management reuses the existing status toggle as the v1 approval action, showing `Activate Account` for inactive users and `Deactivate User` for active users.
- In the admin users table and edit modal, inactive teachers are labeled `Pending Approval` instead of generic suspended wording.

#### Usage Example

```typescript
// In a component
import { notificationService } from "@/business/services/notificationService"

// Get notifications
const { notifications, total, hasMore } =
  await notificationService.getNotifications(1, 20)

// Get unread count
const count = await notificationService.getUnreadCount()

// Mark as read
await notificationService.markAsRead(notificationId)

// Mark all as read
await notificationService.markAllAsRead()

// Delete notification
await notificationService.deleteNotification(notificationId)

// Format time
const timeAgo = notificationService.formatNotificationTime(
  notification.createdAt,
)

// Get icon
const Icon = notificationService.getNotificationIcon(notification.type)
```

#### Integration

The notification system is integrated into the main dashboard layout:

- **TopBar**: NotificationBadge component displays unread count and toggles dropdown
- **Sidebar**: "Notifications" navigation item for all roles (student, teacher, admin)
- **Routing**: `/dashboard/notifications` route for full notifications page

#### Styling

Notifications follow the current light-surface design system:

- White and off-white surfaces with subtle borders and shadows
- Slate text for primary and secondary copy
- Blue accents for unread indicators and interactive states
- Soft hover states that stay consistent with the rest of the dashboard chrome

---

## Type System

### Core Types

Frontend types live in `src/data/api/` and are colocated with their feature area. There is no centralized `types/` directory; types follow the colocation principle described in the code quality guidelines.

Key type files:

- `src/data/api/class.types.ts`: `Class`, `Assignment`, `EnrolledStudent`, `Schedule`, `DayOfWeek`, `Module`
- `src/data/api/assignment.types.ts`: `AssignmentDetail`, `Submission`, `TestResult`, `SubmissionStatus`
- `src/data/api/auth.types.ts`: `User`, `UserRole`, `AuthSession`
- `src/data/api/gradebook.types.ts`: `GradebookEntry`, `StudentGrade`, `LatePenaltyConfig`
- `src/data/api/notification.types.ts`: `Notification`, `NotificationChannel`
- `src/data/api/plagiarism.types.ts`: `SimilarityReport`, `SimilarityPair`, `MatchFragment`
- `src/data/api/crossClassPlagiarism.types.ts`: `CrossClassAnalysisResponse`, `CrossClassResultDTO`
- `src/data/api/calendar.types.ts`: `CalendarEvent`, `CalendarView`, `ClassInfo`, `DateRange`
- `src/data/api/test-case.types.ts`: `TestCase`, `RawTestResult`, `TestResultDetail`
- `src/data/api/shared.types.ts`: `ISODateString`, `PaginatedResponse`, `ApiResponse`

### Class Detail View Types

Specialized types for the class detail page redesign:

- **`AssignmentStatus`**: `'pending' | 'not-started' | 'submitted' | 'late'` - Card status for student assignment cards (`late` means missed deadline without submission; submitted items stay `pending`/`submitted`)
- **`AssignmentFilter`**: `'all' | 'pending' | 'submitted'` - Student filter options for assignment list
- **`ClassTab`**: `'assignment' | 'students' | 'calendar'` - Tab navigation options

### Type Utilities

- **`parseISODate()`**: Safely parse ISO date strings to Date objects
- **`toISODateString()`**: Convert Date objects to ISO date strings for API calls

## Common Workflows

### Student: Viewing Class Assignments

1. **Navigate to Class**: From the dashboard, click on a class card to view class details
2. **View Assignment Organization**:
   - Assignments are automatically grouped into "Current & Upcoming" and "Past Assignments"
   - Each assignment card shows the deadline date, title, programming language, and status
   - Status badges indicate: pending (yellow, submitted but awaiting grade), not-started (gray), submitted (teal), or late (red, missed deadline with no submission)
3. **Filter Assignments**:
   - Click "All Assignments" to view all assignments
   - Click "Pending" to view tasks that still need submission, including assignments inside an allowed late-submission window
   - Click "Submitted" to view assignments already submitted (graded and pending review)
   - Filter counts update dynamically based on assignment status
4. **View Assignment Details**:
   - Click on any assignment card to navigate to the assignment detail page
   - View grades directly on assignment cards for graded work (displayed as "95/100" format)
5. **Switch Tabs**:
   - Use the tab navigation to switch between Assignment, Students, Calendar, and Grades views
   - Filter selections persist when switching between tabs
   - Keyboard navigation supported (arrow keys + Enter)
6. **Review Grades in Class Context**:
   - Open the `Grades` tab to see a personal performance view for the current class
   - Summary cards show current grade, graded assignments, pending review, and not-submitted counts
   - Assignment rows show score, percentage, submission timing, late penalties, adjusted grades, similarity deductions, and teacher feedback when available

### Teacher: Managing Class Assignments

1. **Navigate to Class**: From the dashboard, click on a class card
2. **View Class Information**:
   - Class header displays instructor name, schedule (days and time), and class code
   - Access quick actions: View Gradebook, Edit Class, Delete Class
   - Gradebook provides a read-only grade overview and CSV export (no inline grade override actions)
   - Class code badge is styled with teal colors for easy visibility
3. **Manage Assignments**:
   - Assignments are organized into **modules** (collapsible sections like "Module 1", "Midterm", "Finals")
   - Toggle between **Module View** (default, grouped by module) and **List View** (flat filter-based) using the view toggle
   - **Module View**: Each module is a collapsible accordion card showing assignment count badge, draft/published status, and a three-dot menu (Rename, Publish/Unpublish, Delete)
   - The first module is expanded by default, others are collapsed
   - Create new modules via the dashed "Create Module" input at the bottom of the module list
   - Add assignments to a specific module via the "Add Assignment" button inside each module card
   - Rename modules via modal, delete modules with cascade confirmation (shows assignment count)
   - **List View**: Preserves the existing flat assignment list with teacher filters (All, Current & Upcoming, Past)
   - Click assignment cards to view submissions and grade student work
   - In the submissions view, the Instructions card is collapsible from the header chevron to save vertical space
   - Submission metrics are shown as individual cards (`Total Submissions`, `On Time`, `Late`, `Missing`) with status icons
   - Submissions are listed in a paginated table (`Student Name`, `Status`, `Grade`, `Action`) with 10 rows per page
   - Search includes a leading icon and shares the action bar row with the similarity action button (left search, right action button)
   - Clicking a submissions table row or the `View Details` action opens assignment review for the selected submission (`submissionId` in URL query)
   - Teacher assignment review prioritizes selected submission status and test-case results; the teacher submission-history list is removed
   - Teacher assignment review includes an `Override Score` action in the submission status card (uses the shared grade override modal and supports removing an existing override)
   - Teacher/admin review shows hidden test-case details when present; students still see hidden-case placeholders only
   - Test result details render vertically (`Input` above `Expected`, `Actual` below) to avoid misleading line-break interpretation
   - The similarity action button shows `Check Similarities` when a fresh run is needed and `Review Similarities` when a reusable report already exists
   - The analysis-complete toast is shown only when a new analysis is performed (not when reviewing a reused report)
   - Edit/delete assignment actions are available from the assignment submissions page dropdown menu (teacher/admin only)
4. **View Students**:
   - Switch to Students tab to view enrolled students
   - Manage student enrollments
5. **Create New Assignment**:
   - Click "Add Assignment" button (from module card or tab header)
   - Select which module to assign the assignment to via the module selector dropdown
   - Configure assignment details, test cases, deadlines, late submission policy, and whether strong similarity evidence can trigger a capped automatic deduction
   - Module is pre-selected when creating from within a module card

### Teacher: Reviewing Plagiarism Results

1. **Navigate to Results**: From the assignment submissions page, click `Check Similarities` for a fresh run or `Review Similarities` when a reusable report already exists.
2. **Triage Pairwise Results** (Default View):
   - Review direct `Student A vs Student B` pair rows sorted by highest similarity.
   - Start with the default `95% and above` threshold, then relax or tighten as needed.
   - Use student-name search and sorting to prioritize suspicious pairs quickly.
   - Use the graph and table together; they share one threshold and selection flow.
3. **Compare Code**:
   - View matched code fragments highlighted in both files
   - Use synchronized scrolling to navigate through matches
   - Click on fragments in the table to jump to specific matches
   - Toggle between "Match" and "Diff" views for different perspectives
4. **Export Evidence**:
   - Use `Download Class Report` to export the active threshold view for the whole class; only pairs at or above the current threshold are included.
   - Use `Download Pair Report` inside the comparison panel when a specific `Student A vs Student B` review needs standalone evidence.
5. **Take Action**:
   - Document findings for academic integrity review
   - Contact students as needed
   - Attach the exported PDF evidence to the case record when needed

---

## Development Guidelines

### Adding a New Page

1. Create the page component in the correct role/shared folder under `src/presentation/pages/`.
2. Register the route in the appropriate route group file: `auth.routes.tsx`, `shared.routes.tsx`, `student.routes.tsx`, `teacher.routes.tsx`, or `admin.routes.tsx`.
3. Reuse or add supporting Presentation components under `src/presentation/components/` only when the page cannot stay readable without extraction.
4. Keep route-level permission logic in guards or page orchestration, not inside low-level UI components.

### Adding Data Logic

1. Define or extend the domain model in `src/business/models/`.
2. Create or update the repository in `src/data/repositories/` and keep DTO-to-domain mapping there.
3. Create or update the Business-layer service in `src/business/services/`.
4. Consume the service from Presentation code; do not call repositories or API clients directly from pages/components.

### Styling

- Use **Tailwind CSS** utility classes.
- Avoid arbitrary values (e.g., `w-[123px]`); use theme spacing.
- Common UI components (`Button`, `Card`) are in `src/presentation/components/ui`.
- UI icon policy:
  - Use `lucide-react` only for frontend UI icons.
  - Do not use inline `<svg>` for UI icons in Presentation components.
  - Keep icon stroke style consistent by avoiding ad-hoc per-instance `strokeWidth` overrides unless intentionally required.

### Form Validation Standard (RHF + Zod)

Frontend form migration follows a standardized pattern:

1. **Schema Colocation**
   - Keep Zod schemas in `src/presentation/schemas/*` by feature:
     - `auth/` for authentication forms
     - `class/` for class flows
     - `assignment/` for assignment flows
     - `shared/` for reusable primitives (email, password, etc.)
2. **Form State**
   - Use `react-hook-form` with `zodResolver`.
   - Use shared hook `src/presentation/hooks/shared/useZodForm.ts` for consistent setup and typing.
3. **Error Mapping**
   - Use shared mapper `src/presentation/utils/formErrorMap.ts` for field-path error handling.
4. **Behavior Preservation**
   - Preserve current submit payloads, loading states, and navigation behavior when migrating existing forms.
   - Backend validation remains the final source of truth.

---

## Testing

- **Unit Tests**: `npm run test` (Vitest). All unit tests must live in `src/tests/unit/**` (not colocated in feature folders).
- **Unit Test Discovery Policy**: `vitest.config.ts` and `tsconfig.test.json` are intentionally scoped to `src/tests/unit/**/*.test.ts(x)` and `src/tests/**` to keep tests centralized.
- **E2E Tests**: Playwright (setup in `src/tests/e2e`).
  - Authentication flows
  - Class and assignment creation
  - Submission workflows
  - Smoke tests for critical paths

### Test Organization Rules (Required)

- Keep all unit tests in `src/tests/unit/**` grouped by architecture layer (`business`, `data`, `presentation`, `shared`).
- Keep Playwright tests in `src/tests/e2e/**`.
- Keep shared setup and mocks in `src/tests/setup.ts` and `src/tests/mocks/**`.
- Do not create new `*.test.ts(x)` files inside feature folders (for example `src/presentation/**`, `src/business/**`, `src/data/**`).

### Test Coverage

The project maintains comprehensive test coverage for:

- Business services (auth, class, assignment, gradebook)
- Data repositories (API integration)
- Utility functions (date formatting, validation)
- UI components (Button, Card, Input, Toast)
- E2E workflows (login, class creation, assignment submission)

High-signal coverage gate:

- `vitest` coverage includes a strict critical-path set (`authService`, `userService`, `classMappers`, `assignmentValidation`, `authValidation`, `classValidation`, `commonValidation`, `submissionFileValidation`, `userRepository`, and `authSchemas`).
- Critical-path files enforce `100%` statements/branches/functions/lines with per-file thresholds.
- Low-signal component rendering tests are not part of this strict gate.









