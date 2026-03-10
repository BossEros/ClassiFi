# Milestone v1.1 Admin Enrollment Management Initialization

- [x] Reconstruct `.planning/PROJECT.md`, `.planning/STATE.md`, and `.planning/MILESTONES.md` from brownfield repo evidence
- [ ] Run milestone research for admin enrollment management
- [ ] Define `.planning/REQUIREMENTS.md`
- [ ] Create `.planning/ROADMAP.md`

# Admin Enrollment Management Workspace

- [x] Review `AGENTS.md`, `frontend/documentation.md`, and `backend-ts/documentation.md` for architecture and workflow constraints
- [x] Reuse the existing root `implementation_plan.md` and `task.md` for this milestone slice
- [x] Add backend enrollment registry query support with admin filters and pagination
- [x] Add backend transfer-student workflow with validation and safe error handling
- [x] Add frontend admin enrollment page toolbar, filters, and registry table
- [x] Add frontend enroll, remove, and transfer flows with clear confirmations and request states
- [x] Add targeted backend tests for admin enrollment listing and transfer behavior
- [x] Add targeted frontend tests for admin enrollment page states and actions
- [x] Update frontend and backend documentation for the admin enrollment workspace
- [x] Run `npm run build` in `frontend`
- [x] Run `npm run typecheck` in `backend-ts`
- [x] Run `npm test` in `backend-ts`
# Similarity Graph Singleton Support + UI Simplification

- [x] Extend plagiarism analysis responses with analyzed submissions so true singleton nodes can be rendered
- [x] Update graph utilities to derive nodes from full submission lists instead of pairs only
- [x] Fix the graph empty-state width so empty-threshold messaging stays horizontal and readable
- [x] Remove the separate Similarity Clusters panel and dead exports/components tied only to it
- [x] Rename the graph toggle to `Allow Singleton` and keep the right-rail controls aligned
- [x] Update targeted frontend/backend tests and run verification
# Similarity Graph View

- [x] Add graph data utility that derives nodes, edges, and visible singletons from the current threshold
- [x] Lift similarity threshold state so the graph and pairwise table use the same control value
- [x] Add native React graph view with hover tooltip, selected-node details, and cluster-aware layout
- [x] Add `Display singletons` toggle and resettable draggable threshold slider
- [x] Integrate graph actions with the existing code-comparison workflow
- [x] Add/update targeted frontend unit tests for graph behavior
- [x] Update frontend documentation for the graph workflow
- [x] Run frontend build verification
# Similarity Clustering Feature

- [x] Add frontend clustering utility that derives connected submission groups from pairwise similarity results
- [x] Add teacher similarity clusters panel and wire it into the similarity results page
- [x] Keep pairwise filtering and clustering threshold state synchronized
- [x] Add/update targeted frontend unit tests for clustering behavior
- [x] Update frontend documentation for the new clustering workflow
- [x] Run frontend build verification
# Frontend Unit Test Fixes

- [x] Update toast variant assertions to match the current light-theme tokens
- [x] Replace ambiguous class-detail text queries with stable heading assertions
- [x] Run targeted frontend tests for the touched suites
- [x] Run frontend build verification

# Review Findings Fixes

- [x] Preserve `submissionId` in the assignment detail breadcrumb for teacher review flows
- [x] Restore year-level identification in admin class list rows

- [x] Run frontend build verification
# ClassiFi One-Page App Summary PDF

- [x] Gather repo evidence for app description, personas, features, architecture, and run steps
- [x] Generate a single-page PDF summary with a clean, scannable layout
- [x] Capture a screenshot and verify the PDF stays on one page with no visible overflow
# Settings Page Light Mode Alignment

- [x] Add breadcrumb-driven settings page header that matches the current light-mode top bar pattern
- [x] Convert the settings page cards, profile fields, and notification rows to the light visual system
- [x] Convert the inlined settings modals to light mode without changing behavior
- [x] Run frontend build verification

# Similarity Analysis Column Sorting

- [x] Add ascending/descending sorting support for structural similarity in the pairwise triage table
- [x] Add ascending/descending sorting support for semantic similarity in the pairwise triage table
- [x] Run frontend build verification

# Similarity Analysis Results Light Mode Alignment

- [x] Add breadcrumb navigation to the similarity results top bar and remove the in-page back button
- [x] Convert the similarity results page and pairwise triage table to the existing light-mode system
- [x] Strengthen comparison panel hierarchy and align code-comparison chrome with the light visual language
- [x] Run frontend build verification

# Teacher Submission Overview Light Mode Alignment

- [x] Add breadcrumb navigation to the top bar and remove the in-page `Back to Class` button
- [x] Convert the teacher submission overview page and its local elements to the existing light-mode system
- [x] Update submission metric cards to use clean colored icons without colored icon backgrounds
- [x] Widen the assignment actions dropdown so `Delete Assignment` stays on one line
- [x] Run frontend build verification

# Task Checklist: Auth Session Hardening

- [x] Update API `401` flow to refresh session and retry once before redirecting
- [x] Add startup sync between Supabase session and local auth store
- [x] Run `npm run build` in `frontend`
- [x] Fix issues (if any) and re-run verification
# Calendar Event Contrast Update

- [x] Add reusable dark event color style helper for calendar cards
- [x] Apply helper to month/week/day event card rendering in shared and class calendar views
- [x] Run frontend build verification

# Teacher Assignment Timeline Filters

- [x] Add teacher timeline filter options (`All`, `Current & Upcoming`, `Past`) using shared assignment filter utilities
- [x] Reuse and extend `AssignmentFilterBar` to support teacher and student modes
- [x] Wire teacher filter state in class detail page and pass counts/grouped assignments into tab content
- [x] Render teacher assignment sections according to selected timeline filter while keeping student behavior unchanged
- [x] Update affected unit tests (assignment filters, filter bar, teacher class detail)
- [x] Run `frontend` build and targeted tests
- [x] Update frontend documentation for teacher assignment filters

# Gradebook Statistics Removal Task

- [x] Remove backend gradebook statistics endpoint and service/repository/schema support
- [x] Remove frontend gradebook statistics types/repository/service/hook usage
- [x] Remove gradebook statistics UI panel and expand student gradebook layout
- [x] Remove redundant class name subtitle under Gradebook title
- [x] Update gradebook call sites and affected tests
- [x] Update backend documentation to remove statistics endpoint/service mention
- [x] Run frontend build verification
- [x] Run backend typecheck verification
- [x] Run backend tests verification

# Teacher Assignment Card Callback Cleanup

- [x] Remove assignment-card edit/delete callback props and dead plumbing
- [x] Remove class-detail assignment delete modal wiring that became unreachable
- [x] Update assignment card and assignment section tests to match current UX
- [x] Update frontend documentation for assignment management location
- [x] Run frontend build verification

# Auth Cross-Tab Sync + Assignment Role Gate

- [x] Sync auth store state with cross-tab `storage` updates
- [x] Add listener deduplication guard for auth store runtime setup
- [x] Restrict assignment management dropdown to teacher/admin users
- [x] Guard assignment edit/delete handlers by role
- [x] Run frontend build verification

# Dependency-Level Dead Code Pass

- [x] Audit frontend dependencies/devDependencies for actual usage
- [x] Audit backend dependencies/devDependencies for actual usage
- [x] Remove dead backend barrel entry files with zero importers
- [x] Run frontend build verification
- [x] Run backend typecheck verification
- [x] Run backend tests verification

# Frontend/Backend Dead Code Cleanup

- [x] Verify dead-code candidates in frontend/backend with reference searches
- [x] Remove dead frontend files with zero runtime references
- [x] Remove dead backend module/helper exports with zero runtime references
- [x] Run frontend build verification
- [x] Run backend typecheck verification
- [x] Run backend tests verification

# Teacher Submissions Collapsible Instructions + Metrics Cards

- [x] Create reusable summary stat-card component for icon + label + value pattern
- [x] Migrate similarity results summary cards to reusable stat-card component
- [x] Make instructions card collapsible with right-side chevron affordance
- [x] Replace submissions instructions block with shared collapsible instructions component
- [x] Add `Missing` metric based on class roster count and render 4 individual stat cards
- [x] Run frontend build verification

# Teacher Submissions Header/Icon Layout Polish

- [x] Add an instructions icon to the left of the `Instructions` title
- [x] Place submissions search bar on the left and `Check Similarities` button on the right
- [x] Ensure the search input shows a visible search icon affordance
- [x] Run frontend build verification

# Teacher Submissions Table View

- [x] Create a submissions table component with columns: student name, status, submission time, grade, action
- [x] Replace submission cards with the new table in teacher submissions page
- [x] Add pagination with 10 rows per page and range summary display
- [x] Keep `View Details` action routing consistent with existing behavior
- [x] Update frontend documentation for table + pagination behavior
- [x] Run frontend build verification

# Teacher Submissions Table Polish

- [x] Remove `Submission Time` column from submissions table
- [x] Add avatar beside student name in table rows
- [x] Align action column content to center for visual consistency
- [x] Run frontend build verification

# Teacher Submissions Avatar Hydration Fix

- [x] Investigate why avatar image is not rendered in teacher submissions table
- [x] Reuse class-students data source to map `studentId` to `avatarUrl`
- [x] Pass avatar map into submissions table and wire `Avatar` src
- [x] Run frontend build verification

# Teacher Review Test Results Focus

- [x] Pass selected `submissionId` from teacher submissions table to assignment detail view
- [x] Fetch selected submission test results for teacher/admin in assignment detail data loading
- [x] Remove teacher submission-history card from assignment detail page
- [x] Keep teacher status panel preview/download/grade bound to selected submission
- [x] Run frontend build verification

# Hidden Test Cases Visibility by Role

- [x] Add role-aware hidden-case visibility control to assignment test results card
- [x] Show hidden test results/cases for teacher/admin viewers
- [x] Keep hidden masking behavior for students
- [x] Run frontend build verification

# Hidden Test Details Data Fix

- [x] Add backend query flag to include hidden test details for teacher review
- [x] Include hidden input/expected/actual in backend test-results mapping when requested
- [x] Update frontend test-results fetch path to request hidden details in teacher mode
- [x] Run frontend build verification
- [x] Run backend typecheck verification
- [x] Run backend tests verification

# Test Result Output Stacking

- [x] Change expected/actual output detail layout from side-by-side to vertical stack
- [x] Run frontend build verification

# Documentation Sync (Root + Frontend + Backend)

- [x] Update root `README.md` to include teacher submissions workspace and hidden-test access model
- [x] Update `frontend/documentation.md` for submissions table UX, collapsible instructions, and role-aware test results display
- [x] Update `backend-ts/documentation.md` to document server-enforced authorization for `includeHiddenDetails`

# Frontend Component Inlining + Deletion Pass

- [x] Inline JSX from components `5-10` into their parent components
- [x] Delete components `1-5` (`ClassCodeBadge`, `SubmissionCard`, `LanguageIcon`, `Tabs`, `InstructorInfo`)
- [x] Verify build after deleting components `1-5`
- [x] Delete remaining inlined components from `5-10` (`ScheduleInfo`, `DateBlock`, `GradeDisplay`, `StatusBadge`, `NavItem`)
- [x] Run frontend build verification

# Frontend Component Test Signal Pruning

- [x] Audit `frontend/src/presentation/components/**/*test.tsx` and classify by behavior coverage value
- [x] Remove only confirmed low-signal component tests
- [x] Run frontend build verification
- [x] Run frontend test verification
- [x] Align pre-existing `testService` assertion with current `includeHiddenDetails` default argument for passing verification

# High-Signal Unit Coverage Hardening

- [x] Audit existing unit tests for expectations that incorrectly follow current implementation bugs
- [x] Add/fix frontend high-signal unit tests for auth and validation behavior
- [x] Add/fix backend high-signal unit tests for auth schema/service contracts
- [x] Enforce 100% coverage thresholds for high-signal layers only
- [x] Keep low-signal component-only tests out of required coverage goals
- [x] Run frontend build verification
- [x] Run backend typecheck verification
- [x] Run backend tests verification

# Teacher Similarity View Simplification

- [x] Remove `Report ID` from similarity results header
- [x] Remove `Total Pairs` summary card and rebalance summary layout
- [x] Match student originality search bar width/style to submissions search input
- [x] Move student originality search bar into the overview header area (right aligned)
- [x] Run frontend build verification
- [x] Run frontend test verification

# Student Originality Pagination Alignment

- [x] Reuse the submissions-style pagination UI for student originality table
- [x] Match student originality page-size/paging behavior to submissions overview
- [x] Add additional spacing between originality header/search block and table
- [x] Run frontend build verification
- [x] Run frontend test verification

# Student Originality Column Cleanup

- [x] Remove `Total Pairs` column from the Student Originality Overview table
- [x] Align `Actions` header/cell content to center for visual consistency
- [x] Run frontend build verification
- [x] Run frontend test verification

# High-Signal Unit Coverage Expansion (Checkpoint 2)

- [x] Add tests for `submissionFileValidation` behavior-critical branches
- [x] Add tests for `classMappers` payload guard/mapping behavior
- [x] Add tests for `userRepository` avatar upload flow and failure handling
- [x] Harden avatar cleanup logic to skip empty avatar file paths
- [x] Extend frontend strict coverage gate include set for added modules
- [x] Run focused frontend coverage verification for strict-gated files
- [x] Run frontend build verification

# Backend High-Signal Coverage Expansion (Checkpoint 3)

- [x] Add tests for `class.schema` validation/coercion contracts
- [x] Add tests for `submission.schema` validation/coercion contracts
- [x] Add tests for `class-code.util` unique code retry behavior
- [x] Extend backend strict coverage gate include set for added modules
- [x] Run focused backend coverage verification for strict-gated files
- [x] Run backend typecheck verification
- [x] Run backend test verification

# Backend High-Signal Coverage Expansion (Checkpoint 4)

- [x] Add tests for `user.service` account-deletion and avatar-update behavior
- [x] Add tests for `notification-preference.service` defaults/updates/channel resolution
- [x] Add tests for `notification-preference.schema` request/response contracts
- [x] Extend backend strict coverage gate include set for added modules
- [x] Run focused backend coverage verification for strict-gated files
- [x] Run backend typecheck verification
- [x] Run backend test verification

# Backend Schema Contract Expansion (Checkpoint 5)

- [x] Add tests for `assignment.schema` request/response/param contracts
- [x] Add tests for `notification.schema` type/response/query/DTO behavior
- [x] Fix notification query boolean parsing to correctly handle string booleans
- [x] Extend backend strict coverage gate include set for added schema modules
- [x] Run focused backend coverage verification for strict-gated files
- [x] Run backend typecheck verification
- [x] Run backend test verification

# Frontend Validation Contract Expansion (Checkpoint 6)

- [x] Add branch-complete tests for `assignmentValidation`
- [x] Add branch-complete tests for `classValidation`
- [x] Extend frontend strict coverage gate include set for assignment/class/common validation modules
- [x] Run focused frontend coverage verification for strict-gated files
- [x] Run frontend build verification

# Frontend Unit Test Centralization (Checkpoint 7)

- [x] Move scattered frontend unit tests into `frontend/src/tests/unit/**` preserving domain grouping
- [x] Rewrite moved test file imports from broken relatives to stable `@/` aliases
- [x] Restrict Vitest discovery to `src/tests/unit/**/*.test.ts(x)`
- [x] Run frontend build verification
- [x] Run frontend test verification
- [x] Update frontend documentation to define centralized unit test location convention

# Cross-Repo Test Policy Sync (Checkpoint 8)

- [x] Restrict frontend test TypeScript project includes to `frontend/src/tests/**`
- [x] Restrict backend Vitest test discovery to `backend-ts/tests/**/*.test.ts`
- [x] Update `README.md`, `frontend/documentation.md`, and `backend-ts/documentation.md` with centralized test policy
- [x] Run frontend build verification
- [x] Run frontend test verification
- [x] Run backend typecheck verification
- [x] Run backend test verification

# Similarity Student View Personalization

- [x] Update similarity page back-button behavior to return to students overview when a student is selected
- [x] Change student-view heading to `Similarity Analysis Result - {Student Name}`
- [x] Show student-level summary cards (suspicious pairs, average similarity, max similarity) in student view
- [x] Remove student header summary card above pairwise comparisons and keep only pairwise comparison table card
- [x] Update frontend documentation for student-view behavior
- [x] Run frontend build verification

# Similarity Pairwise-Triage Primary Flow

- [x] Add pairwise triage table component with search, similarity threshold, sortable columns, and pagination
- [x] Refactor similarity results page to pairwise-first flow and remove student-drilldown state
- [x] Keep compare-code panel and pair-details fetch flow intact
- [x] Remove obsolete student-centric plagiarism components/exports
- [x] Update frontend documentation to describe the pairwise-first review workflow
- [x] Run frontend build verification

# Teacher Submissions Row Click Consistency

- [x] Make teacher submission table rows open submission details on click
- [x] Keep `View Details` button behavior and prevent double-trigger from row click
- [x] Update frontend documentation for row-click interaction
- [x] Run frontend build verification

# Similarity Pairwise Metric Clarity

- [x] Rename pairwise columns to `Total Shared Chunks` and `Longest Continuous Shared Block`
- [x] Add plain-language hover tooltips for both pairwise columns
- [x] Replace numeric overlap/longest cells with normalized qualitative badges (`Low`, `Medium`, `High`)
- [x] Keep overlap/longest sorting based on normalized values for fair length-aware comparison
- [x] Update frontend documentation for revised pairwise column behavior
- [x] Run frontend build verification

# Calendar Month Event Card Simplification

- [x] Remove class-name prefix from month-view event card text
- [x] Remove submitted/total ratio line from month-view event card content
- [x] Keep assignment title as the only text line in month-view event cards
- [x] Update frontend documentation for simplified month-view event cards
- [x] Run frontend build verification

# Classes Search Bar Hover Simplification

- [x] Remove classes-view search bar hover glow/gradient layer
- [x] Align classes search input styling with standard search input behavior
- [x] Run frontend build verification

# Plagiarism Assignment Report Reuse

- [x] Add latest-report lookup for assignment in similarity repository
- [x] Reuse existing assignment report when submissions have not changed since report generation
- [x] Keep new report creation when latest submissions changed
- [x] Update plagiarism service tests for report reuse path
- [x] Update backend documentation for deduplicated report behavior
- [x] Run backend typecheck verification
- [x] Run backend test verification

# Similarity Review Label + Reusable Report Status

- [x] Add backend endpoint to expose reusable assignment similarity report status
- [x] Add frontend plagiarism repository/service method for assignment similarity status
- [x] Update teacher submissions button label to `Review Similarities` when reusable report exists
- [x] Keep fallback label `Check Similarities` when no reusable report exists
- [x] Run frontend build verification
- [x] Run backend typecheck verification
- [x] Run backend test verification

# Similarity Toast + Latest-Only Report Retention

- [x] Add backend `isReusedReport` response flag for assignment similarity analyze flow
- [x] Show analysis toast only when a new analysis runs (suppress when report is reused)
- [x] Add backend cleanup to keep only latest similarity report per assignment
- [x] Prune old reports on both new report creation and reusable-report review path
- [x] Update backend/frontend documentation for revised behavior
- [x] Run frontend build verification
- [x] Run backend typecheck verification
- [x] Run backend test verification

# Settings Avatar Immediate Refresh Fix

- [x] Investigate why profile picture updates only appear after logout/login
- [x] Implement immediate avatar refresh after upload confirmation
- [x] Update affected frontend unit tests
- [x] Run frontend build verification

# Frontend Icon Policy Standardization

- [x] Replace inline SVG icon usage with `lucide-react` equivalents
- [x] Standardize icon usage by removing inconsistent stroke overrides
- [x] Add lint guardrails for icon-library and inline-SVG policy
- [x] Run frontend build verification
- [x] Run frontend lint verification

# Similarity Results Transition UX Fix

- [x] Remove first-render empty-state flash by hydrating similarity results from navigation state synchronously
- [x] Preserve state sync for route-state updates after initial mount
- [x] Run frontend build verification

# Teacher Submission Detail Override Action

- [x] Add override-score action button in teacher submission detail view
- [x] Reuse existing grade override modal and hook for submit/remove logic
- [x] Update assignment detail local submission state after override changes
- [x] Replace `any` callback typing with concrete `Submission` type
- [x] Map submission feedback/override fields in frontend mapper
- [x] Run frontend build verification

# Remove Gradebook Override Capability

- [x] Remove grade override interaction from gradebook content
- [x] Convert gradebook cells to read-only display
- [x] Update frontend docs for gradebook behavior
- [x] Run frontend build verification

# Student Assignment Status Consistency Fix

- [x] Pass `studentId` when fetching class assignments for student class detail
- [x] Update assignment status precedence so submitted work is not labeled `late`
- [x] Update targeted unit tests for repository/service/status/filter behavior
- [x] Run frontend build verification
- [x] Run targeted frontend test verification

# Similarity Comparison Auto-Scroll

- [x] Add auto-scroll behavior when a teacher selects a pair in the pairwise table
- [x] Ensure auto-scroll triggers for repeated pair selections and first-time open
- [x] Add/Update targeted unit test coverage for auto-scroll interaction
- [x] Run frontend build verification

# Automatic Similarity Analysis Queue - Design

- [x] Inspect current submission -> plagiarism workflow and existing queue patterns
- [x] Research queue implementation references via MCP (pg-boss, BullMQ, PostgreSQL locking)
- [x] Define exact trigger rules for automatic similarity analysis
- [x] Define job lifecycle, deduplication, retries, failure policy, and observability model
- [x] Define implementation blueprint (modules, DB schema, API/status changes, rollout)

# Admin Create Class Full-Page Flow

- [x] Add dedicated admin class create page with teacher-style layout
- [x] Add searchable teacher selection (name, email, user ID)
- [x] Add admin-only route for create class page
- [x] Route admin classes create button to the new full-page flow
- [x] Keep admin class edit modal flow intact
- [x] Run frontend build verification
- [x] Update frontend documentation for the new admin create route

# Admin Top Bar Consistency

- [x] Add shared dashboard top bar to Admin Dashboard page
- [x] Add shared dashboard top bar to Admin User Management page
- [x] Add shared dashboard top bar to Admin Class Management page
- [x] Add shared dashboard top bar to Admin Class Detail page (all states)
- [x] Refactor Admin Enrollments page to use DashboardLayout + top bar
- [x] Run frontend build verification

# Admin Class Form Modal Removal (Create/Edit Page Unification)

- [x] Convert AdminClassFormPage into create/edit route-based flow
- [x] Add admin edit class route and wire table edit action to navigate
- [x] Remove AdminCreateClassModal usage from AdminClassesPage
- [x] Delete AdminCreateClassModal component file
- [x] Delete AdminCreateClassModal unit test file
- [x] Run frontend build verification

# Admin Class Archive/Restore Action Consistency

- [x] Add restore action support in admin class service for archived classes
- [x] Show `Restore Class` in admin class table actions when a class is archived
- [x] Keep `Archive Class` action for active classes
- [x] Wire restore handler in admin class management page and refresh list after action
- [x] Run frontend build verification

# Admin Class Detail UX Simplification

- [x] Remove students/assignments tab switch and assignment content from admin class detail
- [x] Keep a single students-focused content area with class info + student list
- [x] Improve class header spacing and metadata readability
- [x] Widen and restyle student search bar to match admin UX
- [x] Fix remove action visibility in student table actions column
- [x] Run frontend build verification

# Sidebar Branding Consolidation

- [x] Move ClassiFi logo/title into `Sidebar` component above navigation items
- [x] Remove `topBar.sidebar` from shared top bar hook/layout contract
- [x] Keep `topBar.main` behavior unchanged
- [x] Run frontend build verification

# Automatic Similarity Report Teacher Attribution

- [x] Add repository helper to resolve class teacher by assignment ID
- [x] Add persistence fallback so missing report `teacherId` uses class teacher
- [x] Update auto-analysis unit tests to validate teacher resolution behavior
- [x] Run backend typecheck verification
- [x] Run backend test verification

# Semantic Similarity Throttling

- [x] Replace unbounded semantic `Promise.all` fan-out with bounded concurrency workers
- [x] Add configurable semantic max-concurrency setting in backend config
- [x] Add plagiarism service test that validates bounded max in-flight semantic requests
- [x] Update backend `.env.example` and backend documentation
- [x] Run backend typecheck verification
- [x] Run backend test verification

# Frontend Single-Use Component Inlining (Next Pass)

- [x] Inline `CollapsibleInstructions` into `AssignmentSubmissionsPage`
- [x] Inline `AssignmentSubmissionsTable` into `AssignmentSubmissionsPage`
- [x] Inline `TeacherFeedbackCard` into `AssignmentDetailPage`
- [x] Inline `SubmissionFeedbackCard` into `AssignmentDetailPage`
- [x] Delete now-inlined component files and obsolete component test
- [x] Run frontend build verification

# Teacher Similarity Table Score Columns

- [x] Rename `Similarity` column to `Overall Similarity`
- [x] Add `Structural Similarity` and `Semantic Similarity` columns after overall similarity
- [x] Render appropriate pair scores for each similarity column
- [x] Run frontend build verification
- [x] Update frontend documentation for revised similarity columns

# Teacher Dashboard + Topbar Format Refresh

- [x] Add dashboard-specific visual variant for class cards while keeping current card shape
- [x] Reformat teacher main dashboard sections (`Recent Classes`, `To-Check`) to reference layout
- [x] Keep assignment-name column free of avatars/icons that look like profile avatars
- [x] Restyle topbar to match the light reference style
- [x] Run frontend build verification
# Classes Page Light Theme + Shared UI Tokens

- [ ] Create a central shared theme token file for dashboard/class page colors and font-color roles
- [ ] Apply light-mode styling to teacher classes page using shared tokens
- [ ] Apply light-mode styling to student classes page using shared tokens
- [ ] Update class filter control styling to use shared token classes
- [x] Run frontend build verification
# Academic Calendar Light Mode Conversion

- [x] Create centralized calendar color/text theme tokens
- [x] Convert shared calendar page to light mode (header, filters, grid shell, states)
- [x] Convert class detail calendar tab to light mode
- [x] Convert calendar toolbars and event cards to light visual system
- [x] Convert event details modal to light mode
- [x] Update calendar CSS files to light backgrounds/borders/text
- [x] Run frontend build verification

# Auth Palette Rebalance

- [x] Add a shared auth theme token file for balanced page/card/input colors
- [x] Apply the softer auth palette to the login page
- [x] Apply the same palette to the registration flow
- [x] Run frontend build verification

# Auth Visual Polish Follow-Up

- [x] Fix auth field icon visibility where the icon is being visually buried
- [x] Make the selected registration role card more prominent
- [x] Apply the shared auth palette to forgot password
- [x] Apply the shared auth palette to reset password and its success/error states
- [x] Run frontend build verification

# Student Class Overview Light Mode

- [x] Add student light-mode variants to the shared class-detail UI pieces
- [x] Convert the student class overview shell and states to light mode
- [x] Convert the student leave-class modal to the same light palette
- [x] Run frontend build verification

# Teacher Class Overview Light Mode

- [x] Convert remaining teacher-only class-detail modals and surfaces to the shared light system
- [x] Add light-mode support to the gradebook tab content
- [x] Verify the teacher class overview build path still passes

# Class Overview Layout Refresh

- [x] Replace the in-page back button with breadcrumb navigation in the top bar
- [x] Reformat the class overview header to the cleaner plain layout
- [x] Restyle the tabs and remove the central wrapper around tab content
- [x] Run frontend build verification

# Class Overview Tab Clarity Polish

- [x] Make the class overview tabs read more clearly as interactive controls
- [x] Add an explicit assignments header row above the filters
- [x] Increase assignment card visibility against the page background
- [x] Run frontend build verification

# Class Overview Content Polish

- [x] Make assignments, enrolled students, and gradebook section headings use a consistent scale
- [x] Make the selected assignment filter state more obvious
- [x] Improve visibility of the student search field and role badge
- [x] Make the remove-student icon read as destructive
- [x] Run frontend build verification

# Gradebook Contrast Polish

- [x] Improve score badge contrast in the light-mode gradebook
- [x] Improve average badge contrast in the light-mode gradebook
- [x] Run frontend build verification

# Class Header Information Hierarchy Polish

- [x] Make the class title the primary anchor and keep actions on the same row
- [x] Move schedule closer to the title and de-emphasize secondary metadata
- [x] Make the accent bar span the full header height
- [x] Run frontend build verification

# Assignment Overview Light Mode

- [x] Replace the in-page back button with top-bar breadcrumb navigation
- [x] Convert the assignment overview page shell and content to light mode
- [x] Add light-mode support to the assignment overview components and modals it uses
- [x] Run frontend build verification

# Assignment Overview UI Polish

- [x] Remove the redundant class-name line from the assignment overview body
- [x] Strengthen metadata pill contrast and add a total-score pill
- [x] Add icons to the instructions, submission status, and submit assignment headings
- [x] Refine the no-submission and hidden-case icon treatments
- [x] Run frontend build verification

# Create Assignment Light Mode

- [x] Replace the create/edit assignment back button with clickable breadcrumbs in the top bar
- [x] Convert the create/edit assignment page shell and action area to light mode
- [x] Convert assignment form sections, toggles, template code, test cases, and local modals to light mode
- [x] Replace required-field asterisks with explicit optional labels where appropriate
- [x] Run frontend build verification

# Student Class Grades Tab

- [x] Add a student-focused grades tab component scoped to the current class
- [x] Reuse current-class student grades data via `useStudentGrades(studentId, classId)`
- [x] Show summary metrics without any class ranking
- [x] Show assignment rows with score, feedback, late penalty, and adjusted markers
- [x] Replace the student grades placeholder in class detail
- [x] Update frontend documentation
- [x] Run frontend build verification

# Assignment Form Card Emphasis

- [x] Add shared section-card styling for the teacher assignment form
- [x] Apply the stronger card treatment to `Basic Information`, `Submission Settings`, and `Late Submissions`
- [x] Apply the same elevated treatment to the action card with `Create Assignment` and `Cancel`
- [x] Run frontend build verification

# Settings Topbar Action Removal

- [x] Make the topbar profile/settings shortcut optional
- [x] Hide the shortcut on the settings page
- [x] Run frontend build verification





# Admin Dashboard Light Mode

- [x] Convert the admin dashboard header, refresh action, and request states to the white-mode palette
- [x] Convert the admin summary cards, recent activity panel, and quick actions to the same light dashboard system
- [x] Run frontend build verification


# Admin Users Page Light Mode

- [x] Convert the admin users page header, filter bar, and action controls to the white-mode palette
- [x] Match the users table container and header row to the similarity results light-mode styling
- [x] Convert row states, dropdown, empty state, and pagination to the same light visual system
- [x] Run frontend build verification




# Admin Users Page Light Mode Follow-up

- [x] Extend the create, edit, and delete modals to the same light visual system
- [x] Remove the visible filter wrapper so search and role controls appear standalone


# Admin Users Page Interaction Polish

- [x] Increase search and role control elevation to match the stronger light-mode control treatment
- [x] Strengthen hover visibility for the role filter and row action dropdown items
- [x] Add pointer cursors to key clickable admin users page controls


# Admin Classes Page Light Mode Alignment

- [x] Apply the admin users light-mode header, actions, and error-state treatment to admin class management
- [x] Convert the class filters, table shell, header row, dropdowns, and delete modal to the same light visual system where applicable
- [x] Carry over the stronger hover states and pointer cursors for applicable class management controls


# Admin Refresh And Divider Consistency

- [x] Remove redundant helper text from the admin dashboard summary cards
- [x] Increase divider visibility in recent activity and the admin users table rows
- [x] Standardize the admin users and classes refresh buttons to match the admin dashboard refresh button


# Admin User Modal Polish

- [x] Remove the unnatural glow from the create, edit, and delete user modal containers
- [x] Strengthen field label hierarchy and soften placeholder emphasis in the create and edit user forms
- [x] Align modal button icons, cursor affordances, and destructive delete-flow styling with the admin button conventions


# Admin Delete Class Modal Polish

# Admin Table Separator And Class Academic Info Polish

# Admin Dashboard Stat Icon And Quick Actions Spacing Polish

# Admin Class Detail Top Bar And Light Mode

# Admin Enrollment Management Light Mode

# Frontend Dead Code Audit And Cleanup

- [x] Scan the frontend source tree for files and exports with no runtime consumers after the light-mode refactor.
- [x] Remove only the confirmed dead frontend files, orphaned barrel exports, and stale dark-mode leftovers.
- [ ] Verify the cleanup with a frontend production build.






# Admin Class Detail Students-Only Follow-Up

- [x] Remove students/assignments tab UI and assignment content from admin class detail
- [x] Keep a single students table view
- [x] Widen student search bar and update placeholder copy
- [x] Move Enroll Student button beside the search bar
- [x] Make remove-student action icon red by default
- [x] Run frontend build verification



# Admin Search Width + Hover Visibility Polish

- [x] Remove class-detail search width cap so the input expands in the toolbar row
- [x] Align user-management search placeholder color with class-management search placeholder color
- [x] Strengthen admin table row hover background visibility
- [x] Run frontend build verification



# Admin Class Detail Header Refresh

- [x] Replace the admin class detail helper copy with a cleaner header that uses the class description and keeps the current class metadata visible
- [x] Reuse the admin class-management three-dot action menu in the class detail header
- [x] Fix the student search toolbar layout so the input width is readable beside the enroll action
- [x] Run frontend build verification








# Similarity PDF Export

- [x] Add a reusable frontend PDF document layer for plagiarism evidence exports
- [x] Add threshold-aware class report download from the teacher similarity results page
- [x] Add pairwise evidence report download for the selected comparison
- [x] Extend plagiarism analyze/report responses with `generatedAt`
- [x] Add/update frontend and backend tests for the new export workflow
- [x] Update frontend/backend documentation and root progress tracking

# Similarity PDF Institutional Refresh

- [x] Refresh the PDF header and section/card styling to a more professional ClassiFi-branded look
- [x] Replace visible generated/download metadata with a single Report Generated timestamp entry
- [x] Rework class-report table cells to use badge-style color treatments with aligned headers/body widths
- [x] Update targeted PDF/page tests for metadata and badge mapping behavior
- [x] Run frontend test verification
- [x] Run frontend build verification


