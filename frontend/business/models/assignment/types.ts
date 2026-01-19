import type { LatePenaltyConfig } from "@/shared/types/gradebook";

// ============================================================================
// Shared Type Aliases
// ============================================================================

/** Supported programming languages for assignments */
export type ProgrammingLanguage = "python" | "java" | "c";

/** Test case structure for assignments */
export interface AssignmentTestCase {
  id: number;
  name: string;
  isHidden: boolean;
  input?: string;
  expectedOutput?: string;
}

// ============================================================================
// Domain Types - Business Layer
// ============================================================================

/** Submission entity */
export interface Submission {
  id: number;
  assignmentId: number;
  studentId: number;
  fileName: string;
  fileSize: number;
  submissionNumber: number;
  submittedAt: Date;
  isLatest: boolean;
  assignmentName?: string;
  studentName?: string;
  grade?: number;
}

/** Submission with assignment details */
export interface SubmissionWithAssignment extends Submission {
  assignmentName: string;
}

/** Submission with student details */
export interface SubmissionWithStudent extends Submission {
  studentName: string;
}

/** Assignment details entity */
export interface AssignmentDetail {
  id: number;
  classId: number;
  className: string;
  assignmentName: string;
  description: string;
  programmingLanguage: ProgrammingLanguage;
  deadline: Date | string;
  allowResubmission: boolean;
  maxAttempts?: number | null;
  createdAt?: Date | string;
  isActive: boolean;
  hasSubmitted?: boolean;
  latestSubmission?: Submission;
  submissionCount?: number;
  templateCode?: string | null;
  hasTemplateCode?: boolean;
  totalScore?: number;
  scheduledDate?: Date | string | null;
  latePenaltyEnabled?: boolean;
  latePenaltyConfig?: LatePenaltyConfig | null;
  testCases?: AssignmentTestCase[];
}

// ============================================================================
// Request DTOs
// ============================================================================

/** Request to submit an assignment */
export interface SubmitAssignmentRequest {
  assignmentId: number;
  studentId: number;
  file: File;
  programmingLanguage: ProgrammingLanguage;
}

/** Request to update an assignment */
export interface UpdateAssignmentRequest {
  teacherId: number;
  assignmentName?: string;
  description?: string;
  programmingLanguage?: ProgrammingLanguage;
  deadline?: Date | string;
  allowResubmission?: boolean;
  maxAttempts?: number | null;
  templateCode?: string | null;
  totalScore?: number;
  scheduledDate?: Date | string | null;
  latePenaltyEnabled?: boolean;
  latePenaltyConfig?: LatePenaltyConfig | null;
}

// ============================================================================
// Response DTOs
// ============================================================================

/** Response after submitting an assignment */
export interface SubmitAssignmentResponse {
  success: boolean;
  message?: string;
  submission?: Submission;
}

/** Response containing a list of submissions */
export interface SubmissionListResponse {
  success: boolean;
  message?: string;
  submissions: Submission[];
}

/** Response containing submission history */
export interface SubmissionHistoryResponse {
  success: boolean;
  message?: string;
  submissions: Submission[];
  totalSubmissions: number;
}

/** Response containing assignment details */
export interface AssignmentDetailResponse {
  success: boolean;
  message?: string;
  assignment?: AssignmentDetail;
}
