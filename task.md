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
