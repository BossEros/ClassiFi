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
