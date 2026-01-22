import type {
  AssignmentDetail,
  AssignmentTestCase,
  ProgrammingLanguage,
  Submission,
  SubmissionWithAssignment,
  SubmissionWithStudent,
  SubmitAssignmentRequest,
  UpdateAssignmentRequest,
  SubmitAssignmentResponse,
  SubmissionListResponse,
  SubmissionHistoryResponse,
  AssignmentDetailResponse,
} from "@/data/api/types";

// ============================================================================
// Shared Type Aliases (Re-exported from API types)
// ============================================================================

export type { ProgrammingLanguage, AssignmentTestCase };

// ============================================================================
// Domain Types - Business Layer (Re-exported from API types)
// ============================================================================

export type {
  Submission,
  SubmissionWithAssignment,
  SubmissionWithStudent,
  AssignmentDetail,
};

// ============================================================================
// Request DTOs (Re-exported from API types)
// ============================================================================

export type { SubmitAssignmentRequest, UpdateAssignmentRequest };

// ============================================================================
// Response DTOs (Re-exported from API types)
// ============================================================================

export type {
  SubmitAssignmentResponse,
  SubmissionListResponse,
  SubmissionHistoryResponse,
  AssignmentDetailResponse,
};
