# Student-Centric Plagiarism Detection View - Requirements

## Feature Overview

Refactor the plagiarism detection results page to provide a student-centric view as the primary interface, allowing teachers to quickly identify students with low originality scores and drill down into individual student details. The existing pairwise comparison view will remain available as an alternative view mode.

## User Stories

### US-1: View Student Originality Summary
**As a** teacher  
**I want to** see a list of all students with their originality scores  
**So that** I can quickly identify students who may have plagiarism concerns

**Acceptance Criteria:**
- 1.1: System displays a table of all students who submitted the assignment
- 1.2: Each student row shows: student name, submission ID, originality score (0-100%), highest similarity percentage, and the student they matched most with
- 1.3: Originality score is calculated as: `originality = 1 - max_similarity` where max_similarity is the highest similarity score across all pairs involving that student
- 1.4: Table is sortable by student name, originality score, and highest similarity
- 1.5: Table includes search/filter functionality by student name
- 1.6: Originality scores are color-coded:
  - Red (<30%): High plagiarism risk
  - Yellow (30-60%): Moderate concern
  - Green (>60%): Likely original
- 1.7: Table shows pagination with 25 items per page
- 1.8: Each row has a "View Details" button to drill down into that student's comparisons

### US-2: View Individual Student Pair Details
**As a** teacher  
**I want to** see all pairwise comparisons for a specific student  
**So that** I can understand who they matched with and the extent of similarity

**Acceptance Criteria:**
- 2.1: Clicking "View Details" on a student shows a detailed view with:
  - Student name and overall originality score in the header
  - Table of all pairs involving this student
  - For each pair: other student's name, similarity percentage, overlap, longest match
- 2.2: Each pair row has a "Compare Code" button to view side-by-side code comparison
- 2.3: A "Back" button returns to the student summary list
- 2.4: The existing code comparison functionality (PairComparison, PairCodeEditor) is preserved and accessible from this view

### US-3: Toggle Between View Modes
**As a** teacher  
**I want to** toggle between student-centric and pairwise views  
**So that** I can analyze plagiarism from different perspectives

**Acceptance Criteria:**
- 3.1: A view toggle control is displayed prominently near the top of the page with two options: "Students View" and "Pairs View"
- 3.2: "Students View" is the default view when the page loads
- 3.3: Clicking "Pairs View" shows the existing pairwise comparison table
- 3.4: Clicking "Students View" returns to the student-centric summary
- 3.5: View selection is preserved when navigating between student details and back to summary
- 3.6: Both views share the same summary cards (total pairs, suspicious pairs, avg similarity, max similarity)

### US-4: Maintain Existing Functionality
**As a** teacher  
**I want to** retain all existing plagiarism detection features  
**So that** I don't lose any functionality I currently use

**Acceptance Criteria:**
- 4.1: The existing PairsTable component and functionality remains available in "Pairs View"
- 4.2: The existing code comparison features (Match View, Diff View) remain unchanged
- 4.3: The existing search and sort functionality in Pairs View remains unchanged
- 4.4: All existing API endpoints continue to work as before
- 4.5: Report summary cards display the same metrics as before

## Technical Requirements

### Backend Requirements

#### TR-1: Student Summary Calculation
- System must calculate per-student originality scores from pairwise similarity results
- For each student with a submission:
  - Find all pairs where the student's submission appears (either as submission1 or submission2)
  - Calculate `max_similarity` as the highest similarity score across all their pairs
  - Calculate `originality = 1 - max_similarity`
  - Identify the student they matched most with (highest similarity pair)
  - Count total pairs and suspicious pairs (above threshold)

#### TR-2: New API Endpoints
- `GET /api/v1/plagiarism/reports/:reportId/students`
  - Returns student-centric summary for a report
  - Response includes array of student summaries with originality scores
  - Must include proper authentication and authorization
  - Must follow existing API documentation standards (JSDoc, Swagger schema)

- `GET /api/v1/plagiarism/reports/:reportId/students/:submissionId/pairs`
  - Returns all pairwise comparisons involving a specific student's submission
  - Filters existing pairs where either submission1Id or submission2Id matches the given submissionId
  - Must include proper authentication and authorization
  - Must follow existing API documentation standards

#### TR-3: Service Layer Implementation
- Add method to PlagiarismService: `getStudentSummary(reportId: number): Promise<StudentSummary[]>`
- Add method to PlagiarismService: `getStudentPairs(reportId: number, submissionId: number): Promise<PairResponse[]>`
- Methods must validate inputs and handle errors appropriately
- Methods must include comprehensive JSDoc documentation

### Frontend Requirements

#### TR-4: Service Layer
- Add methods to `plagiarismService.ts`:
  - `getStudentSummary(reportId: string): Promise<StudentSummary[]>`
  - `getStudentPairs(reportId: string, submissionId: number): Promise<PairResponse[]>`
- Methods must validate inputs using existing validators
- Methods must handle errors and throw descriptive error messages

#### TR-5: Type Definitions
- Create `StudentSummary` interface with fields:
  - `studentId: number`
  - `studentName: string`
  - `submissionId: number`
  - `originalityScore: number` (0-1)
  - `highestSimilarity: number` (0-1)
  - `highestMatchWith: { studentId: number, studentName: string, submissionId: number }`
  - `totalPairs: number`
  - `suspiciousPairs: number`

#### TR-6: Component Architecture
- Create `StudentSummaryTable` component for displaying student list
- Create `StudentPairsDetail` component for individual student drill-down
- Create `OriginalityBadge` component for color-coded originality display
- All components must follow existing ClassiFi design patterns
- All components must be responsive and accessible

#### TR-7: Page Refactoring
- Update `SimilarityResultsPage` to support view toggle
- Add state management for current view mode and selected student
- Preserve existing functionality in "Pairs View"
- Implement proper loading states and error handling
- Maintain existing code comparison features

## Non-Functional Requirements

### NFR-1: Performance
- Student summary calculation must complete within 2 seconds for up to 100 students
- Page transitions between views must be smooth (<100ms)
- Code comparison loading must show progress indicator

### NFR-2: Usability
- UI must be consistent with existing ClassiFi design system (teal accent colors, dark theme)
- All interactive elements must have hover states and visual feedback
- Tooltips must explain originality score calculation
- Error messages must be clear and actionable

### NFR-3: Accessibility
- All components must be keyboard navigable
- Color-coding must not be the only indicator (include text labels)
- ARIA labels must be present for screen readers
- Focus states must be clearly visible

### NFR-4: Code Quality
- All code must follow AGENTS.md guidelines (SOLID, DRY principles)
- All functions must have JSDoc documentation
- All API endpoints must have comprehensive Swagger schemas
- TypeScript strict mode must be enabled
- No `any` types allowed

### NFR-5: Testing
- Unit tests for new service methods
- Component tests for new UI components
- Integration tests for API endpoints
- E2E tests for critical user flows

## Out of Scope

- Exporting student-centric reports to CSV (future enhancement)
- Filtering by originality score ranges (future enhancement)
- Historical tracking of originality scores across multiple reports (future enhancement)
- Automated flagging or notifications for low originality scores (future enhancement)
- Bulk actions on students (future enhancement)

## Dependencies

- Existing plagiarism detection system must be functional
- Existing PairsTable and code comparison components must be working
- Backend must have access to similarity reports and results in the database
- Frontend must have authentication and authorization working

## Success Metrics

- Teachers can identify students with low originality in <5 seconds
- Teachers can drill down into individual student details in <2 clicks
- Teachers can toggle between views without losing context
- All existing functionality remains intact and working
- Code passes all quality checks (typecheck, lint, tests)

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance degradation with large datasets | High | Implement pagination, optimize queries, add loading states |
| Breaking existing functionality | High | Comprehensive testing, feature flags, gradual rollout |
| Confusion with two view modes | Medium | Clear UI labels, default to student view, user education |
| Incorrect originality calculations | High | Unit tests, validation against known datasets, peer review |
