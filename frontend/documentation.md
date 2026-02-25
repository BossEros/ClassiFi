# ClassiFi Frontend Documentation

## Project Overview

The ClassiFi Frontend is a modern, responsive web application built with **React 19**, **Vite**, and **TypeScript**. It follows a strict **Clean Architecture** pattern to separate concerns between the UI (Presentation), Business Logic (Business), and Data Access (Data) layers. The application is styled using **Tailwind CSS v4** and manages global state through lightweight Zustand stores plus feature services.

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

The codebase keeps application source under `src/`:

```text
frontend/
|-- src/
|   |-- app/                # App composition and route wiring
|   |   |-- routes/
|   |   `-- App.tsx
|   |-- business/           # Domain Logic Layer
|   |   |-- models/
|   |   |-- services/
|   |   `-- validation/
|   |-- data/               # Data Access Layer
|   |   |-- api/
|   |   |-- repositories/
|   |   `-- mappers.ts
|   |-- presentation/       # UI Layer
|   |   |-- components/
|   |   |   |-- admin/
|   |   |   |-- auth/
|   |   |   |-- shared/
|   |   |   |-- student/
|   |   |   |-- teacher/
|   |   |   `-- ui/
|   |   |-- hooks/
|   |   |   |-- shared/
|   |   |   `-- teacher/
|   |   |-- pages/
|   |   |-- schemas/
|   |   `-- utils/
|   |-- shared/             # Cross-cutting concerns
|   |   |-- constants/
|   |   |-- store/
|   |   |-- types/
|   |   `-- utils/
|   |-- tests/              # Centralized tests, setup, and mocks
|   |   |-- unit/           # All frontend unit test files (*.test.ts|tsx)
|   |   |-- e2e/            # Playwright tests
|   |   |-- mocks/          # Test doubles / MSW handlers
|   |   `-- setup.ts        # Vitest setup
|   |-- index.css
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
    - **Dependency**: Depends on the Data Layer (via Interfaces/Repositories) and Models.
    - **Key Concept**: Services are "pure" logic containers. `AuthService`, `ClassService`, etc.

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

Routing is handled in `src/app/App.tsx`, with route groups split in `src/app/routes/*`.

### Route Types

1.  **Public Routes**: `/login`, `/register`, `/forgot-password`, `/reset-password`.
2.  **Protected Routes**: Wrapped in `<ProtectedRoute>`. Requires authenticated user.
    - Redirects to `/login` if unauthorized.
3.  **Role-Based Routes**:
    - **Functions**: `RoleBasedDashboard`, `RoleBasedClassesPage`.
    - **Logic**: Conditionally renders `StudentDashboardPage`, `TeacherDashboardPage`, or `AdminDashboardPage` based on `user.role` ('student', 'teacher', 'admin').
    - **Teacher-Only**: `TeacherOnlyRoute` is applied for class creation (`/dashboard/classes/new`). Other teacher pages are protected by auth, with teacher/admin-only controls gated in-page where needed.

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
- **`ClassCard`**: Displays class information in list view with code pattern background, instructor avatar, student count, term info, and archived status. Used in classes list pages.
- **`ClassHeader`**: Displays class information including name, instructor, schedule, and optional description with action buttons (teachers: Gradebook button and Edit/Delete dropdown; students: Leave Class dropdown).
- **`ClassTabs`**: Tab navigation for Assignment, Students, and Calendar views with keyboard accessibility.
- **`InstructorInfo`**: Displays instructor name with user icon for class detail views.
- **`ScheduleInfo`**: Displays class schedule with days and time range.
- **`ClassCodeBadge`**: Styled badge displaying the class join code.
- **`AssignmentFilterBar`**: Role-aware filter buttons with counts. Student view uses all/pending/submitted; teacher view uses all/current & upcoming/past timeline filters.
- **`AssignmentSection`**: Groups assignments by time period (current/upcoming vs past) with section headers.
- **`AssignmentCard`**: Shared assignment card with role-based content. Student cards show submission/status context and grades. Teacher cards emphasize assignment name + due date and intentionally hide student-only status badges and submission ratio details.

### Feature Components

- **`CodeEditor`**: (Monaco) Used in `AssignmentDetailPage` for coding tasks with syntax highlighting for Python, Java, and C.
- **`PlagiarismReport`**: Visualizes similarity analysis results with two complementary views:
  - **Student-Centric View Components**:
    - **`OriginalityBadge`**: Color-coded badge (red/yellow/green) displaying originality percentage with tooltip
    - **`StudentSummaryTable`**: Sortable, searchable table of all students with originality scores, highest matches, and suspicious pair counts
    - **`StudentPairsDetail`**: Detailed view of all similarity pairs for a selected student with summary statistics
  - **Pairwise View Components**:
    - **`PairsTable`**: Lists file pairs with similarity scores
    - **`PairComparison`**: Side-by-side code editor with match highlighting
    - **`PairCodeEditor`**: Monaco-based editor with synchronized scrolling
    - **`FragmentsTable`**: Detailed view of matching code fragments
    - **`SimilarityBadge`**: Visual indicator for similarity percentage
- **`GradebookTable`**: Manages student grades and overrides.
- **`CollapsibleInstructions`**: Reusable instruction panel with left icon + right chevron toggle; supports `defaultExpanded` for page-specific defaults.
- **`SummaryStatCard`**: Shared icon-label-value card used by teacher submissions metrics and similarity analysis summaries.
- **`AssignmentSubmissionsTable`**: Teacher submissions table (`Student Name`, `Status`, `Grade`, `Action`) with avatar cells, centered actions, and built-in pagination summary/controls.
- **`AssignmentTestResultsCard`**: Displays test details in stacked blocks (`Input`, `Expected`, `Actual`) to preserve output readability; hidden-case details are role-aware (teacher/admin can view, student view remains masked).

### Forms

- **`ClassForm`**: Create/Edit classes with schedule configuration.
- **`AssignmentForm`**: Create/Edit assignments with:
  - Programming language selection (Python, Java, C)
  - Instructions text plus optional image attachment (preview)
  - File attachments
  - Test cases with input/output validation
  - Late submission policy toggle (`Allow late submissions`) with conditional late penalty configuration (penalty tiers + optional reject-after cutoff, no grace period)
  - Optional deadline settings (assignment can be created without a deadline)
  - Resubmission settings
- **`AdminUserModal` / `AdminEditUserModal`**: Admin user create/edit flows use `react-hook-form` + Zod schemas.
- **`AdminDeleteUserModal`**: Admin delete-user confirmation flow uses `react-hook-form` + Zod confirmation schema.
- **`ChangePasswordModal`**: Password change flow uses `react-hook-form` + Zod schema with strong-password and confirmation checks.
- **`DeleteAccountModal`**: Account deletion confirmation flow uses `react-hook-form` + Zod schema for password + destructive confirmation.
- **`GradeOverrideModal`**: Grade override input uses `react-hook-form` + dynamic Zod schema with assignment-score bounds.

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

---

## Business Services

The Business Layer contains services that encapsulate business logic and orchestrate data operations. All services validate inputs and handle errors before delegating to repositories.

### Available Services

| Service                     | Location                                           | Purpose                                                                |
| --------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| **authService**             | `src/business/services/authService.ts`             | User authentication, registration, password management                 |
| **assignmentService**       | `src/business/services/assignmentService.ts`       | Assignment submission, file validation                                 |
| **classService**            | `src/business/services/classService.ts`            | Class management, enrollment operations                                |
| **gradebookService**        | `src/business/services/gradebookService.ts`        | Grade management, statistics, late penalties, CSV export               |
| **notificationService**     | `src/business/services/notificationService.ts`     | Notification management, unread counts, mark as read                   |
| **plagiarismService**       | `src/business/services/plagiarismService.ts`       | Plagiarism detection, similarity analysis, student originality scoring |
| **studentDashboardService** | `src/business/services/studentDashboardService.ts` | Student dashboard data aggregation                                     |
| **teacherDashboardService** | `src/business/services/teacherDashboardService.ts` | Teacher dashboard data aggregation                                     |
| **testCaseService**         | `src/business/services/testCaseService.ts`         | Test case management for assignments                                   |
| **testService**             | `src/business/services/testService.ts`             | Code execution and testing                                             |
| **adminService**            | `src/business/services/adminService.ts`            | Admin operations (user management, analytics)                          |
| **userService**             | `src/business/services/userService.ts`             | User profile operations (avatar upload, account deletion)              |

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

The plagiarism detection system provides two complementary views for analyzing code similarity:

#### Student-Centric View (Default)

The student-centric view focuses on individual student originality scores, making it easy to identify students who may need attention:

- **Originality Scores**: Each student receives an originality score calculated as `1 - max_similarity`, where max_similarity is the highest similarity score across all pairs involving that student
- **Color-Coded Badges**: Visual indicators for quick assessment
  - Red (<30%): Low originality, requires immediate attention
  - Yellow (30-60%): Moderate originality, may warrant review
  - Green (>60%): High originality, likely original work
- **Student Summary Table**: Sortable table showing all students with their originality scores, highest matches, and suspicious pair counts
- **Drill-Down Details**: Click any student to view all their similarity pairs and detailed comparisons
- **Search and Filter**: Quickly find specific students by name
- **Pagination**: Handles large classes efficiently (25 students per page)

#### Pairwise Comparison View

The traditional pairwise view provides detailed code comparison capabilities:

- **Side-by-side comparison**: View matched code fragments in parallel editors
- **Synchronized scrolling**: Navigate through matches seamlessly
- **Fragment highlighting**: Visual indicators for matching code regions
- **Similarity metrics**: Percentage similarity, overlap, and longest match
- **Interactive navigation**: Click fragments to jump to specific matches
- **Export capabilities**: Download reports for record-keeping

#### View Toggle

Teachers can seamlessly switch between the student-centric view and pairwise view using the toggle at the top of the plagiarism results page. Both views share the same code comparison panel, ensuring a consistent experience when examining specific matches.

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
| `SUBMISSION_GRADED`  | Submission receives grade  | Assignment title, grade, feedback      |

#### Features

- **Real-time Updates**: Unread count polls every 30 seconds
- **Pagination**: Efficient loading of notification history
- **Bulk Actions**: Mark all as read with single click
- **Individual Actions**: Mark as read or delete specific notifications
- **Responsive Design**: Works on mobile and desktop
- **Accessibility**: Keyboard navigation and screen reader support
- **Time Formatting**: Human-readable relative timestamps
- **Icon Mapping**: Type-specific icons for visual clarity

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

Notifications follow ClassiFi's dark theme design system:

- Background: `slate-800` and `slate-900`
- Accent: `blue-500` for unread indicators
- Text: `white` for primary, `slate-300` for secondary
- Hover states: `slate-700` backgrounds
- Borders: `white/10` for subtle separation

---

## Type System

### Core Types

The application uses a strongly-typed system with branded types for enhanced type safety:

- **`ISODateString`**: Branded type for ISO 8601 date strings from APIs
- **`DayOfWeek`**: Union type for days of the week
- **`Schedule`**: Interface for class schedule with days and time range
- **`Class`**: Core class entity with instructor, schedule, and metadata
- **`Assignment`**: Assignment entity with deadline, grades, submission status, and programming language
- **`EnrolledStudent`**: Student enrollment information

### Class Detail View Types

Specialized types for the class detail page redesign:

- **`AssignmentStatus`**: `'pending' | 'not-started' | 'submitted' | 'late'` - Status for student assignment cards and filtering
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
   - Status badges indicate: pending (yellow), not-started (gray), submitted (teal), or late (red)
3. **Filter Assignments**:
   - Click "All Assignments" to view all assignments
   - Click "Pending" to view ungraded submissions and not-yet-started assignments
   - Click "Submitted" to view graded assignments and late submissions
   - Filter counts update dynamically based on assignment status
4. **View Assignment Details**:
   - Click on any assignment card to navigate to the assignment detail page
   - View grades directly on assignment cards for graded work (displayed as "95/100" format)
5. **Switch Tabs**:
   - Use the tab navigation to switch between Assignment, Students, and Calendar views
   - Filter selections persist when switching between tabs
   - Keyboard navigation supported (arrow keys + Enter)

### Teacher: Managing Class Assignments

1. **Navigate to Class**: From the dashboard, click on a class card
2. **View Class Information**:
   - Class header displays instructor name, schedule (days and time), and class code
   - Access quick actions: View Gradebook, Edit Class, Delete Class
   - Class code badge is styled with teal colors for easy visibility
3. **Manage Assignments**:
   - View all assignments organized by current/upcoming and past
   - Use teacher assignment filters: all, current & upcoming, and past
   - Assignment cards emphasize due date only for teachers
   - Click assignment cards to view submissions and grade student work
   - In the submissions view, the Instructions card is collapsible from the header chevron to save vertical space
   - Submission metrics are shown as individual cards (`Total Submissions`, `On Time`, `Late`, `Missing`) with status icons
   - Submissions are listed in a paginated table (`Student Name`, `Status`, `Grade`, `Action`) with 10 rows per page
   - Search includes a leading icon and shares the action bar row with `Check Similarities` (left search, right action button)
   - `View Details` opens assignment review for the selected submission (`submissionId` in URL query)
   - Teacher assignment review prioritizes selected submission status and test-case results; the teacher submission-history list is removed
   - Teacher/admin review shows hidden test-case details when present; students still see hidden-case placeholders only
   - Test result details render vertically (`Input` above `Expected`, `Actual` below) to avoid misleading line-break interpretation
   - `Check Similarities` is available on the submissions page action bar and is intentionally not shown on the submission detail page
   - Edit/delete assignment actions are available from the assignment submissions page dropdown menu (teacher/admin only)
4. **View Students**:
   - Switch to Students tab to view enrolled students
   - Manage student enrollments
5. **Create New Assignment**:
   - Click "Add Assignment" button in the Assignment tab
   - Configure assignment details, test cases, deadlines, and late submission policy

### Teacher: Reviewing Plagiarism Results

1. **Navigate to Results**: From the assignment submissions page, click "View Plagiarism Report"
2. **Review Student Originality** (Default View):
   - View the student summary table showing all students with originality scores
   - Identify students with low originality (red badges) for immediate attention
   - Use search to find specific students
   - Sort by originality score, similarity, or student name
3. **Investigate Specific Students**:
   - Click on a student row to view all their similarity pairs
   - Review summary statistics (total pairs, suspicious pairs, highest match)
   - Click on any pair to view side-by-side code comparison
4. **Compare Code**:
   - View matched code fragments highlighted in both files
   - Use synchronized scrolling to navigate through matches
   - Click on fragments in the table to jump to specific matches
   - Toggle between "Match" and "Diff" views for different perspectives
5. **Switch to Pairwise View** (Optional):
   - Click the "Pairs" toggle to view traditional pairwise comparison
   - Search and sort pairs by similarity score
   - All code comparison features remain available
6. **Take Action**:
   - Document findings for academic integrity review
   - Contact students as needed
   - Export report for record-keeping

---

## Development Guidelines

### Adding a New Page

1.  Create the page component in `src/presentation/pages/NewPage.tsx`.
2.  Define the route in `src/app/routes/*.routes.tsx` and mount it in `src/app/App.tsx`.
3.  (Optional) specific components in `src/presentation/components/feature/`.

### Adding Data Logic

1.  Define the Model in `src/business/models/`.
2.  Create/Update specific `Repository` in `src/data/repositories/`.
3.  Create/Update `Service` in `src/business/services/`.
4.  Consume in Component.

### Styling

- Use **Tailwind CSS** utility classes.
- Avoid arbitrary values (e.g., `w-[123px]`); use theme spacing.
- Common UI components (`Button`, `Card`) are in `src/presentation/components/ui`.

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

### Test Coverage

The project maintains comprehensive test coverage for:

- Business services (auth, class, assignment, gradebook)
- Data repositories (API integration)
- Utility functions (date formatting, validation)
- UI components (Button, Card, Input, Toast)
- E2E workflows (login, class creation, assignment submission)

High-signal coverage gate:
- `vitest` coverage includes a strict critical-path set (`authService`, `userService`, `notificationPreferenceService`, `classMappers`, `assignmentValidation`, `authValidation`, `classValidation`, `commonValidation`, `submissionFileValidation`, `notificationPreferenceRepository`, `userRepository`, and `authSchemas`).
- Critical-path files enforce `100%` statements/branches/functions/lines with per-file thresholds.
- Low-signal component rendering tests are not part of this strict gate.
