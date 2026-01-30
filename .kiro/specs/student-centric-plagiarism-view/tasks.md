# Student-Centric Plagiarism Detection View - Implementation Tasks

## Task Status Legend
- `[ ]` Not started
- `[-]` In progress
- `[x]` Completed

## Phase 1: Backend Implementation

### 1. Backend Service Layer
- [x] 1.1 Add `getStudentSummary` method to PlagiarismService
  - [x] 1.1.1 Implement originality score calculation algorithm
  - [x] 1.1.2 Implement highest match identification logic
  - [x] 1.1.3 Implement suspicious pairs counting
  - [x] 1.1.4 Add comprehensive JSDoc documentation
  - [x] 1.1.5 Add error handling for edge cases
- [x] 1.2 Add `getStudentPairs` method to PlagiarismService
  - [x] 1.2.1 Implement pair filtering logic
  - [x] 1.2.2 Implement sorting by similarity
  - [x] 1.2.3 Add comprehensive JSDoc documentation
  - [x] 1.2.4 Add error handling for edge cases

### 2. Backend Schema Layer
- [x] 2.1 Add Zod schemas to plagiarism.schema.ts
  - [x] 2.1.1 Create StudentSummarySchema
  - [x] 2.1.2 Create StudentSummaryResponseSchema
  - [x] 2.1.3 Create StudentPairsParamsSchema
  - [x] 2.1.4 Create StudentPairsResponseSchema
  - [x] 2.1.5 Export TypeScript types

### 3. Backend Controller Layer
- [x] 3.1 Add GET /reports/:reportId/students endpoint
  - [x] 3.1.1 Implement route handler
  - [x] 3.1.2 Add authentication middleware
  - [x] 3.1.3 Add input validation
  - [x] 3.1.4 Add comprehensive endpoint documentation (JSDoc + Swagger)
  - [x] 3.1.5 Add error handling
- [x] 3.2 Add GET /reports/:reportId/students/:submissionId/pairs endpoint
  - [x] 3.2.1 Implement route handler
  - [x] 3.2.2 Add authentication middleware
  - [x] 3.2.3 Add input validation
  - [x] 3.2.4 Add comprehensive endpoint documentation (JSDoc + Swagger)
  - [x] 3.2.5 Add error handling

### 4. Backend Testing
- [x] 4.1 Write unit tests for PlagiarismService
  - [x] 4.1.1 Test getStudentSummary with various scenarios
  - [x] 4.1.2 Test getStudentPairs with various scenarios
  - [x] 4.1.3 Test edge cases (no pairs, single student, etc.)
  - [x] 4.1.4 Test error handling
- [ ] 4.2 Write integration tests for API endpoints
  - [ ] 4.2.1 Test GET /reports/:reportId/students
  - [ ] 4.2.2 Test GET /reports/:reportId/students/:submissionId/pairs
  - [ ] 4.2.3 Test authentication and authorization
  - [ ] 4.2.4 Test error responses

### 5. Backend Documentation
- [x] 5.1 Update backend-ts/documentation.md
  - [x] 5.1.1 Add new endpoints to API Reference section
  - [x] 5.1.2 Add student-centric analysis explanation
  - [x] 5.1.3 Add example requests and responses
  - [x] 5.1.4 Update PlagiarismService documentation

### 6. Backend Verification
- [x] 6.1 Run typecheck: `npm run typecheck`
- [x] 6.2 Run tests: `npm test`
- [x] 6.3 Verify no TypeScript errors
- [x] 6.4 Verify test coverage >80%

## Phase 2: Frontend Data Layer

### 7. Frontend Types
- [x] 7.1 Add StudentSummary interface to data/api/types.ts
  - [x] 7.1.1 Define interface with all required fields
  - [x] 7.1.2 Export type

### 8. Frontend Repository Layer
- [x] 8.1 Add repository functions to plagiarismRepository.ts
  - [x] 8.1.1 Implement getStudentSummaryForReport function
  - [x] 8.1.2 Implement getStudentPairs function
  - [x] 8.1.3 Add comprehensive JSDoc documentation
  - [x] 8.1.4 Add error handling with handleApiError

### 9. Frontend Service Layer
- [x] 9.1 Add service methods to plagiarismService.ts
  - [x] 9.1.1 Implement getStudentSummary function
  - [x] 9.1.2 Implement getStudentPairs function
  - [x] 9.1.3 Add input validation
  - [x] 9.1.4 Add comprehensive JSDoc documentation
  - [x] 9.1.5 Export StudentSummary type

### 10. Frontend Data Layer Testing
- [x] 10.1 Write unit tests for plagiarismService
  - [x] 10.1.1 Test getStudentSummary success case
  - [x] 10.1.2 Test getStudentSummary validation
  - [x] 10.1.3 Test getStudentSummary error handling
  - [x] 10.1.4 Test getStudentPairs success case
  - [x] 10.1.5 Test getStudentPairs validation
  - [x] 10.1.6 Test getStudentPairs error handling

## Phase 3: Frontend Components

### 11. OriginalityBadge Component
- [x] 11.1 Create OriginalityBadge.tsx
  - [x] 11.1.1 Define component props interface
  - [x] 11.1.2 Implement color-coding logic (red/yellow/green)
  - [x] 11.1.3 Implement tooltip with explanation
  - [x] 11.1.4 Add size variants (sm/md/lg)
  - [x] 11.1.5 Style with Tailwind CSS (dark theme, teal accents)
  - [x] 11.1.6 Add JSDoc documentation
- [ ] 11.2 Write tests for OriginalityBadge
  - [ ] 11.2.1 Test color rendering for different scores
  - [ ] 11.2.2 Test tooltip display
  - [ ] 11.2.3 Test size variants
  - [ ] 11.2.4 Test percentage formatting

### 12. StudentSummaryTable Component
- [x] 12.1 Create StudentSummaryTable.tsx
  - [x] 12.1.1 Define component props interface
  - [x] 12.1.2 Implement table structure with all columns
  - [x] 12.1.3 Implement sorting functionality (name, originality, similarity)
  - [x] 12.1.4 Implement search/filter by student name
  - [x] 12.1.5 Implement pagination (25 items per page)
  - [x] 12.1.6 Add loading skeleton state
  - [x] 12.1.7 Add empty state message
  - [x] 12.1.8 Style with Tailwind CSS (consistent with existing tables)
  - [x] 12.1.9 Add hover effects and selected row highlight
  - [x] 12.1.10 Make responsive (mobile-friendly)
  - [x] 12.1.11 Add JSDoc documentation
- [ ] 12.2 Write tests for StudentSummaryTable
  - [ ] 12.2.1 Test rendering with data
  - [ ] 12.2.2 Test sorting functionality
  - [ ] 12.2.3 Test search/filter functionality
  - [ ] 12.2.4 Test pagination
  - [ ] 12.2.5 Test onStudentSelect callback
  - [ ] 12.2.6 Test loading state
  - [ ] 12.2.7 Test empty state

### 13. StudentPairsDetail Component
- [x] 13.1 Create StudentPairsDetail.tsx
  - [x] 13.1.1 Define component props interface
  - [x] 13.1.2 Implement header with student info and back button
  - [x] 13.1.3 Implement pairs table with all columns
  - [x] 13.1.4 Implement sorting functionality
  - [x] 13.1.5 Add loading state
  - [x] 13.1.6 Add empty state message
  - [x] 13.1.7 Style with Tailwind CSS (card-based layout)
  - [x] 13.1.8 Add hover effects
  - [x] 13.1.9 Make responsive
  - [x] 13.1.10 Add JSDoc documentation
- [ ] 13.2 Write tests for StudentPairsDetail
  - [ ] 13.2.1 Test rendering with data
  - [ ] 13.2.2 Test back button callback
  - [ ] 13.2.3 Test pair selection callback
  - [ ] 13.2.4 Test sorting functionality
  - [ ] 13.2.5 Test loading state
  - [ ] 13.2.6 Test empty state

### 14. Component Exports
- [x] 14.1 Update plagiarism/index.ts
  - [x] 14.1.1 Export OriginalityBadge
  - [x] 14.1.2 Export StudentSummaryTable
  - [x] 14.1.3 Export StudentPairsDetail

## Phase 4: Page Integration

### 15. SimilarityResultsPage Refactoring
- [x] 15.1 Add new state variables
  - [x] 15.1.1 Add viewMode state (students | pairs)
  - [x] 15.1.2 Add students state
  - [x] 15.1.3 Add selectedStudent state
  - [x] 15.1.4 Add studentPairs state
  - [x] 15.1.5 Add loading states
  - [x] 15.1.6 Add error states
- [x] 15.2 Implement data fetching logic
  - [x] 15.2.1 Add fetchStudentSummary function
  - [x] 15.2.2 Add useEffect to fetch on view change
  - [x] 15.2.3 Add handleStudentSelect function
  - [x] 15.2.4 Add handleBackToStudents function
  - [x] 15.2.5 Add error handling with toast notifications
- [x] 15.3 Create view toggle component
  - [x] 15.3.1 Implement toggle UI (Students | Pairs)
  - [x] 15.3.2 Add icons (Users, GitCompare)
  - [x] 15.3.3 Style with Tailwind CSS
  - [x] 15.3.4 Add smooth transitions
- [x] 15.4 Implement conditional rendering
  - [x] 15.4.1 Render StudentSummaryTable in students view
  - [x] 15.4.2 Render StudentPairsDetail when student selected
  - [x] 15.4.3 Render existing PairsTable in pairs view (placeholder added)
  - [x] 15.4.4 Share code comparison panel between views
  - [x] 15.4.5 Add loading states for each view
  - [x] 15.4.6 Add error states for each view
- [x] 15.5 Preserve existing functionality
  - [x] 15.5.1 Verify pairs view works as before
  - [x] 15.5.2 Verify code comparison works from both views
  - [x] 15.5.3 Verify search and sort in pairs view
  - [x] 15.5.4 Verify summary cards display correctly

## Phase 5: Testing and Quality

### 16. Integration Testing
- [ ] 16.1 Test complete user flows
  - [ ] 16.1.1 Test viewing student summary
  - [ ] 16.1.2 Test drilling down into student details
  - [ ] 16.1.3 Test comparing code from student view
  - [ ] 16.1.4 Test toggling between views
  - [ ] 16.1.5 Test search and sort in students view
  - [ ] 16.1.6 Test pagination in students view

### 17. E2E Testing
- [ ] 17.1 Write Playwright tests
  - [ ] 17.1.1 Test: Teacher views student originality summary
  - [ ] 17.1.2 Test: Teacher drills down into student details
  - [ ] 17.1.3 Test: Teacher toggles between views
  - [ ] 17.1.4 Test: Teacher searches and sorts students
  - [ ] 17.1.5 Test: Teacher compares code from student view
  - [ ] 17.1.6 Test: Existing pairs view still works

### 18. Acessibility Auditc
- [ ] 18.1 Verify keyboard navigation
  - [ ] 18.1.1 Test tab order in students table
  - [ ] 18.1.2 Test tab order in pairs detail
  - [ ] 18.1.3 Test view toggle keyboard access
  - [ ] 18.1.4 Test back button keyboard access
- [ ] 18.2 Verify ARIA labels
  - [ ] 18.2.1 Add ARIA labels to tables
  - [ ] 18.2.2 Add ARIA labels to buttons
  - [ ] 18.2.3 Add ARIA labels to tooltips
  - [ ] 18.2.4 Add ARIA live regions for loading states
- [ ] 18.3 Verify color contrast
  - [ ] 18.3.1 Test originality badge colors
  - [ ] 18.3.2 Test text on dark backgrounds
  - [ ] 18.3.3 Test focus indicators

### 19. Performance Testing
- [ ] 19.1 Test with various dataset sizes
  - [ ] 19.1.1 Test with 5 students
  - [ ] 19.1.2 Test with 50 students
  - [ ] 19.1.3 Test with 100 students
  - [ ] 19.1.4 Verify <2s load time for 100 students
- [ ] 19.2 Optimize if needed
  - [ ] 19.2.1 Add memoization where appropriate
  - [ ] 19.2.2 Optimize sorting algorithms
  - [ ] 19.2.3 Add debouncing to search input

### 20. Code Quality Verification
- [x] 20.1 Frontend verification
  - [x] 20.1.1 Run `npm run build` (must pass)
  - [x] 20.1.2 Run `npm run lint` (fix any issues)
  - [x] 20.1.3 Run `npm test` (all tests pass)
  - [x] 20.1.4 Verify no TypeScript errors
  - [x] 20.1.5 Verify no `any` types used
- [x] 20.2 Backend verification
  - [x] 20.2.1 Run `npm run typecheck` (must pass)
  - [x] 20.2.2 Run `npm test` (all tests pass)
  - [x] 20.2.3 Verify test coverage >80%
  - [x] 20.2.4 Verify no TypeScript errors

## Phase 6: Documentation and Polish

### 21. Documentation Updates
- [x] 21.1 Update backend documentation
  - [x] 21.1.1 Add new endpoints to API Reference
  - [x] 21.1.2 Add student-centric analysis section
  - [x] 21.1.3 Add example requests/responses
- [x] 21.2 Update frontend documentation
  - [x] 21.2.1 Add student-centric view section
  - [x] 21.2.2 Add workflow documentation
  - [x] 21.2.3 Update component documentation

### 22. UI/UX Polish
- [x] 22.1 Review visual consistency
  - [x] 22.1.1 Verify colors match design system
  - [x] 22.1.2 Verify spacing is consistent
  - [x] 22.1.3 Verify typography is consistent
- [x] 22.2 Add smooth transitions
  - [x] 22.2.1 Add fade transitions between views
  - [x] 22.2.2 Add loading animations
  - [x] 22.2.3 Add hover animations
- [x] 22.3 Improve error messages
  - [x] 22.3.1 Make error messages user-friendly
  - [x] 22.3.2 Add actionable suggestions
  - [x] 22.3.3 Add retry options where appropriate

### 23. Final Testing
- [ ] 23.1 Manual testing with test credentials
  - [ ] 23.1.1 Login as teacher (namisvilan@gmail.com)
  - [ ] 23.1.2 Navigate to assignment with plagiarism report
  - [ ] 23.1.3 Verify students view loads correctly
  - [ ] 23.1.4 Test all interactions
  - [ ] 23.1.5 Verify pairs view still works
  - [ ] 23.1.6 Test on different screen sizes
- [ ] 23.2 Cross-browser testing
  - [ ] 23.2.1 Test in Chrome
  - [ ] 23.2.2 Test in Firefox
  - [ ] 23.2.3 Test in Safari
  - [ ] 23.2.4 Test in Edge

## Phase 7: Deployment

### 24. Pre-Deployment Checklist
- [x] 24.1 All tests passing
- [x] 24.2 Documentation updated
- [x] 24.3 Code reviewed
- [x] 24.4 No console errors or warnings
- [x] 24.5 Performance targets met

### 25. Deployment
- [ ] 25.1 Deploy backend changes
- [ ] 25.2 Deploy frontend changes
- [ ] 25.3 Verify deployment successful
- [ ] 25.4 Monitor for errors
- [ ] 25.5 Gather initial user feedback

## Notes

- Follow AGENTS.md guidelines throughout implementation
- Use existing patterns and components where possible
- Write comprehensive JSDoc for all functions
- Add Swagger documentation for all API endpoints
- Ensure TypeScript strict mode compliance
- Test thoroughly before moving to next phase
- Keep commits atomic and well-documented
