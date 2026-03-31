# ClassiFi Testing Selection Report

Date: 2026-03-28

## Purpose

This report identifies the most defensible unit and integration tests to feature in the research paper without attempting to document the entire test suite.

The goal is to follow the same pattern used in `Thesis Reference - SWIFTSHIELD.pdf`: show representative, high-value test cases for the system's most important modules instead of trying to prove every file was tested.

## Basis For Selection

I reviewed:

- `AGENTS.md`
- `frontend/documentation.md`
- `backend-ts/documentation.md`
- the current frontend and backend test inventory
- the SWIFTSHIELD testing section

Reference observation from SWIFTSHIELD:

- The testing chapter is selective, not exhaustive.
- It groups tests by major module and workflow.
- It is strongest when it shows business-critical and user-facing behavior.

## Current Test Landscape

- Frontend unit test files: `72`
- Backend test files: `42`
- The codebase already has broad coverage across services, validation, repositories, schemas, utilities, controllers, and integration flows.
- Because the project is already large, the paper should not try to include all of these tests.

## Selection Criteria

The recommended paper set is based on five filters:

1. Core workflow importance
2. Frequency of real user impact
3. Research significance for ClassiFi's plagiarism and grading features
4. Architectural representativeness across frontend and backend layers
5. Screenshot readability and paper presentation value

## Recommended Unit Tests For The Paper

These are the best files to feature in the unit testing section.

| Paper ID | Layer | Test File | Status | Why It Belongs In The Paper |
| --- | --- | --- | --- | --- |
| UT-01 | Frontend validation | `frontend/src/tests/unit/business/validation/assignmentValidation.test.ts` | Existing | Covers assignment title, instructions, language, deadline, create/update validation. This is a high-frequency teacher workflow and is easy to explain academically. |
| UT-02 | Frontend validation | `frontend/src/tests/unit/business/validation/submissionFileValidation.test.ts` | Existing | Covers upload gatekeeping for file presence, size, extension, and language matching. This is one of the most common student-facing failure points. |
| UT-03 | Frontend presentation hook | `frontend/src/tests/unit/presentation/hooks/teacher/useAssignmentForm.test.tsx` | Existing | Covers teacher assignment creation/edit flow, test-case management, late-submission behavior, and navigation on success. Strong representation of frontend business orchestration. |
| UT-04 | Frontend plagiarism reporting | `frontend/src/tests/unit/presentation/components/teacher/plagiarism/pdf/similarityReportPdf.test.ts` | Existing | Covers one of the platform's signature features: threshold-aware plagiarism evidence export for class and pair reports. Very strong paper value. |
| UT-05 | Backend authentication | `backend-ts/tests/services/auth.service.test.ts` | Existing | Covers registration, login, token verification, rollback behavior, invalid roles, duplicate emails, and password reset behavior. This is the most fundamental backend service. |
| UT-06 | Backend submission workflow | `backend-ts/tests/services/submission.service.test.ts` | Existing | Covers submission creation, deadlines, resubmission policy, late submission handling, file validation, numbering, signed download URLs, and teacher feedback flow. This is the most important operational service in the platform. |
| UT-07 | Backend grading rules | `backend-ts/tests/services/latePenalty.service.test.ts` | Existing | Covers penalty tiers, rejection windows, adjusted grades, and default config behavior. This is academically useful because it demonstrates rule-based grading correctness. |
| UT-08 | Backend plagiarism scoring | `backend-ts/tests/services/plagiarism-scoring.test.ts` | Existing | Covers hybrid scoring, stable pair key normalization, and suspicious-pair summarization. This directly supports the research contribution of the system. |

## Recommended Integration Tests For The Paper

These are the best files to feature in the integration testing section.

| Paper ID | Layer | Test File | Status | Why It Belongs In The Paper |
| --- | --- | --- | --- | --- |
| IT-01 | Backend service integration | `backend-ts/tests/integration/notification-flow.test.ts` | Existing | Verifies that assignment creation, grade override, notification persistence, and email dispatch work together. This is a true cross-module integration scenario. |
| IT-02 | Backend plagiarism integration | `backend-ts/tests/integration/plagiarism-fixtures.test.ts` | Existing | Verifies the plagiarism engine against curated fixture scenarios. This is the strongest integration evidence for the platform's research-specific detection pipeline. |
| IT-03 | Backend API integration | `backend-ts/tests/api/submission.controller.test.ts` | Existing | Verifies role-aware access to submission details and feedback endpoints, including hidden test-case protection. This is a good controller-to-service contract example. |

## Best Paper Set If You Want The Smallest Useful Scope

If you want a realistic paper-friendly subset, use these first:

- `frontend/src/tests/unit/business/validation/assignmentValidation.test.ts`
- `frontend/src/tests/unit/business/validation/submissionFileValidation.test.ts`
- `frontend/src/tests/unit/presentation/hooks/teacher/useAssignmentForm.test.tsx`
- `frontend/src/tests/unit/presentation/components/teacher/plagiarism/pdf/similarityReportPdf.test.ts`
- `backend-ts/tests/services/auth.service.test.ts`
- `backend-ts/tests/services/submission.service.test.ts`
- `backend-ts/tests/services/latePenalty.service.test.ts`
- `backend-ts/tests/services/plagiarism-scoring.test.ts`
- `backend-ts/tests/integration/notification-flow.test.ts`
- `backend-ts/tests/integration/plagiarism-fixtures.test.ts`

This gives you:

- `8` unit test files
- `2` integration test files

That is already enough for a strong thesis section without making the paper bloated.

## High-Value Gaps Worth Adding Before Finalizing The Paper

These are important parts of the product that are not yet directly represented by their own focused unit test files and would strengthen the paper if added.

### 1. Shared Assignment Detail Page

- Target file: `frontend/src/presentation/pages/shared/AssignmentDetailPage.tsx`
- Current size: about `776` lines
- Reason to add:
  - This is one of the most central shared pages in the system.
  - It coordinates student, teacher, and admin review behaviors.
  - It is large enough that a dedicated unit test file would be justified academically and architecturally.
- Suggested new test file:
  - `frontend/src/tests/unit/presentation/pages/shared/AssignmentDetailPage.test.tsx`
- Suggested scenarios:
  - renders role-specific actions correctly
  - shows submission/test result sections based on role and data state
  - opens code preview and handles empty/loading states
  - blocks invalid teacher feedback actions when required data is missing

### 2. Similarity Graph View

- Target file: `frontend/src/presentation/components/teacher/plagiarism/SimilarityGraphView.tsx`
- Current size: about `561` lines
- Reason to add:
  - This is one of ClassiFi's most distinctive UI features.
  - Existing utility tests cover graph math, but not the actual interactive component behavior.
  - A direct component test would be valuable both technically and for the paper.
- Suggested new test file:
  - `frontend/src/tests/unit/presentation/components/teacher/plagiarism/SimilarityGraphView.test.tsx`
- Suggested scenarios:
  - threshold slider updates callback
  - singleton toggle changes visible graph behavior
  - clicking an edge calls the review callback
  - empty-state message appears when no nodes meet the threshold

## Why These Choices Are Stronger Than Testing Everything

This selection is better than broad random coverage because it includes:

- authentication and account security
- assignment authoring rules
- submission and upload constraints
- grading and late-penalty correctness
- plagiarism scoring and evidence export
- cross-module notification integration

Together, these represent the system's:

- core academic workflows
- highest-risk business rules
- signature research functionality
- both frontend and backend architecture layers

## Suggested Paper Structure

To match the SWIFTSHIELD style, I recommend:

1. Unit Testing table
2. Integration Testing table
3. Appendix screenshots of actual test execution per selected file

For the tables, use columns similar to:

- Test Case ID
- Module / Feature
- Test Objective
- Expected Result
- Actual Result
- Remarks

Suggested grouping:

- Authentication
- Assignment Management
- Submission Validation
- Grading / Late Penalty
- Plagiarism Scoring
- Plagiarism Report Export
- Notification Integration

## Suggested Terminal Commands For Screenshots

Run one file at a time so each screenshot is clean and easy to paste into the paper.

Frontend examples:

```powershell
.\node_modules\.bin\vitest.cmd run src/tests/unit/business/validation/assignmentValidation.test.ts --reporter=verbose
.\node_modules\.bin\vitest.cmd run src/tests/unit/business/validation/submissionFileValidation.test.ts --reporter=verbose
.\node_modules\.bin\vitest.cmd run src/tests/unit/presentation/hooks/teacher/useAssignmentForm.test.tsx --reporter=verbose
.\node_modules\.bin\vitest.cmd run src/tests/unit/presentation/components/teacher/plagiarism/pdf/similarityReportPdf.test.ts --reporter=verbose
```

Backend examples:

```powershell
.\node_modules\.bin\vitest.cmd run tests/services/auth.service.test.ts --reporter=verbose
.\node_modules\.bin\vitest.cmd run tests/services/submission.service.test.ts --reporter=verbose
.\node_modules\.bin\vitest.cmd run tests/services/latePenalty.service.test.ts --reporter=verbose
.\node_modules\.bin\vitest.cmd run tests/services/plagiarism-scoring.test.ts --reporter=verbose
.\node_modules\.bin\vitest.cmd run tests/integration/notification-flow.test.ts --reporter=verbose
.\node_modules\.bin\vitest.cmd run tests/integration/plagiarism-fixtures.test.ts --reporter=verbose
```

If Vitest config loading has issues in a restricted environment, Vite documents `--configLoader runner` as an alternative config-loading mode.

## Verification Note

I was able to inventory and analyze the test suite, but I could not complete live Vitest execution inside the current sandbox because Vite/Vitest config loading hit Windows `spawn EPERM` restrictions in this environment.

That means:

- the file recommendations are based on architecture review and current test inventory
- the screenshot commands above should be run in your normal local terminal, not this restricted sandbox

## Final Recommendation

For the paper, do not attempt to document all tests in the repository.

Use the `8` selected unit test files and `2` selected integration test files as the main body evidence, then add the two missing high-value UI tests for:

- `AssignmentDetailPage`
- `SimilarityGraphView`

That gives you a focused, defensible, and research-relevant testing section that matches the style of SWIFTSHIELD while still reflecting ClassiFi's actual architecture and most important features.
