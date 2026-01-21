import type {
  ClassStatistics,
  GradeEntry,
  GradebookAssignment,
  GradebookStudent,
  LatePenaltyConfig,
  PenaltyResult,
  PenaltyTier,
  StudentClassGrades,
  StudentGradeEntry,
} from "@/shared/types/gradebook";
import type {
  Submission,
  SubmissionWithAssignment,
  SubmissionWithStudent,
  SubmissionContent,
} from "@/shared/types/submission";

// ============================================================================
// Core Shared Types
// ============================================================================

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface Schedule {
  days: DayOfWeek[];
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
}

/**
 * Array of valid programming languages.
 */
export const VALID_PROGRAMMING_LANGUAGES = ["python", "java", "c"] as const;

/** Supported programming languages for assignments */
export type ProgrammingLanguage = (typeof VALID_PROGRAMMING_LANGUAGES)[number];

/** Test case structure for assignments */
export interface AssignmentTestCase {
  id: number;
  name: string;
  isHidden: boolean;
  input?: string;
  expectedOutput?: string;
}

// ============================================================================
// Data Layer DTO Types (replacing business layer imports)
// ============================================================================

/** Base class fields shared across all class representations */
interface ClassBase {
  id: number;
  teacherId: number;
  className: string;
  classCode: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  teacherName?: string;
  yearLevel: number;
  semester: number;
  academicYear: string;
  schedule: Schedule;
}

/** Class DTO for API responses - includes optional aggregate counts */
export interface ClassDTO extends ClassBase {
  studentCount?: number;
  assignmentCount?: number;
}

/** Task/Assignment DTO for API responses */
export interface TaskDTO {
  id: number;
  classId: number;
  assignmentName: string;
  className?: string;
  deadline: string | null;
  programmingLanguage: string;
  hasSubmitted?: boolean;
  submissionCount?: number;
  studentCount?: number;
}

// ============================================================================
// Assignment & Submission Types
// ============================================================================

// Re-exporting from shared for convenience if needed,
// though direct imports from @/shared/types/submission are preferred.
export type {
  Submission,
  SubmissionWithAssignment,
  SubmissionWithStudent,
  SubmissionContent,
};

export interface AssignmentDetail {
  id: number;
  classId: number;
  className: string;
  assignmentName: string;
  description: string;
  programmingLanguage: ProgrammingLanguage;
  deadline: string;
  allowResubmission: boolean;
  maxAttempts?: number | null;
  createdAt?: string;
  isActive: boolean;
  hasSubmitted?: boolean;
  latestSubmission?: Submission;
  submissionCount?: number;
  templateCode?: string | null;
  hasTemplateCode?: boolean;
  totalScore?: number;
  scheduledDate?: string | null;
  latePenaltyEnabled?: boolean;
  latePenaltyConfig?: LatePenaltyConfig | null;
  testCases?: AssignmentTestCase[];
}

// ============================================================================
// Class Request DTOs
// ============================================================================

export interface CreateClassRequest {
  teacherId: number;
  className: string;
  description?: string;
  classCode: string;
  yearLevel: 1 | 2 | 3 | 4;
  semester: 1 | 2;
  academicYear: string; // Format: YYYY-YYYY (e.g., "2024-2025")
  schedule: Schedule;
}

export interface UpdateClassRequest {
  teacherId: number;
  className?: string;
  description?: string;
  isActive?: boolean;
  yearLevel?: 1 | 2 | 3 | 4;
  semester?: 1 | 2;
  academicYear?: string;
  schedule?: Schedule;
}

// ============================================================================
// Assignment Request DTOs
// ============================================================================

export interface SubmitAssignmentRequest {
  assignmentId: number;
  studentId: number;
  file: File;
  programmingLanguage: ProgrammingLanguage;
}

export interface CreateAssignmentRequest {
  classId: number;
  teacherId: number;
  assignmentName: string;
  description: string;
  programmingLanguage: ProgrammingLanguage;
  deadline: Date | string;
  allowResubmission?: boolean;
  maxAttempts?: number | null;
  templateCode?: string | null;
  totalScore?: number;
  scheduledDate?: Date | string | null;
  latePenaltyEnabled?: boolean;
  latePenaltyConfig?: LatePenaltyConfig | null;
}

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

export interface UpdateAssignmentValidationData {
  teacherId?: number;
  assignmentName?: string;
  description?: string;
  deadline?: Date | string;
}

// ============================================================================
// Response DTOs
// ============================================================================

export interface CreateClassResponse {
  success: boolean;
  message?: string;
  class?: ClassDTO;
}

export interface CreateAssignmentResponse {
  success: boolean;
  message?: string;
  assignment?: TaskDTO;
}

export interface SubmitAssignmentResponse {
  success: boolean;
  message?: string;
  submission?: Submission;
}

export interface SubmissionListResponse {
  success: boolean;
  message?: string;
  submissions: Submission[];
}

export interface SubmissionHistoryResponse {
  success: boolean;
  message?: string;
  submissions: Submission[];
  totalSubmissions: number;
}

export interface AssignmentDetailResponse {
  success: boolean;
  message?: string;
  assignment?: AssignmentDetail;
}

export interface ClassListResponse {
  success: boolean;
  message?: string;
  classes: ClassResponse[];
}

export interface AssignmentListResponse {
  success: boolean;
  message?: string;
  assignments: AssignmentResponse[];
}

export interface JoinClassResponse {
  success: boolean;
  message: string;
  classInfo?: ClassResponse;
}

export interface LeaveClassResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// Dashboard Response DTOs
// ============================================================================

export interface DashboardResponse {
  success: boolean;
  message?: string;
  recentClasses: ClassDTO[];
  pendingTasks: TaskDTO[];
}

export interface StudentDashboardData {
  enrolledClasses: ClassDTO[];
  pendingAssignments: TaskDTO[];
}

// ============================================================================
// Student Dashboard Response DTOs
// ============================================================================

/** Class response - alias for ClassBase since student responses don't include counts */
export type ClassResponse = ClassBase;

export interface AssignmentResponse {
  id: number;
  classId: number;
  assignmentName: string;
  description: string | null;
  programmingLanguage: string;
  deadline: string;
  allowResubmission: boolean;
  isActive: boolean;
  createdAt: string;
  className?: string;
  hasSubmitted?: boolean;
}

export interface StudentDashboardBackendResponse {
  success: boolean;
  message?: string;
  enrolledClasses: ClassResponse[];
  pendingAssignments: AssignmentResponse[];
}

// ============================================================================
// Plagiarism Response DTOs
// ============================================================================

export interface FileResponse {
  id: number;
  path: string;
  filename: string;
  lineCount: number;
  studentId?: string;
  studentName?: string;
}

export interface PairResponse {
  id: number;
  leftFile: FileResponse;
  rightFile: FileResponse;
  structuralScore: number;
  semanticScore: number;
  hybridScore: number;
  overlap: number;
  longest: number;
}

export interface AnalyzeResponse {
  reportId: string;
  summary: {
    totalFiles: number;
    totalPairs: number;
    suspiciousPairs: number;
    averageSimilarity: number;
    maxSimilarity: number;
  };
  pairs: PairResponse[];
  warnings: string[];
}

// ============================================================================
// Test Preview Response DTOs
// ============================================================================

/** Individual test result detail */
export interface TestResultDetail {
  testCaseId: number;
  name: string;
  status: string;
  isHidden: boolean;
  executionTimeMs: number;
  memoryUsedKb: number;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  errorMessage?: string;
}

/** Test result from preview */
export interface TestPreviewResult {
  passed: number;
  total: number;
  percentage: number;
  results: TestResultDetail[];
}

/** API response wrapper */
export interface TestPreviewResponse {
  success: boolean;
  message: string;
  data: TestPreviewResult;
}

/** Result details response with fragments and file content */
export interface ResultDetailsResponse {
  result: {
    id: number;
    submission1Id: number;
    submission2Id: number;
    structuralScore: string;
    overlap: number;
    longestFragment: number;
  };
  fragments: Array<{
    id: number;
    leftSelection: {
      startRow: number;
      startCol: number;
      endRow: number;
      endCol: number;
    };
    rightSelection: {
      startRow: number;
      startCol: number;
      endRow: number;
      endCol: number;
    };
    length: number;
  }>;
  leftFile: {
    filename: string;
    content: string;
    lineCount: number;
    studentName: string;
  };
  rightFile: {
    filename: string;
    content: string;
    lineCount: number;
    studentName: string;
  };
}

// ============================================================================
// Admin Types
// ============================================================================

export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: "student" | "teacher" | "admin";
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "student" | "teacher" | "admin";
}

// ============ Admin Class Types ============

export interface AdminClassSchedule {
  days: DayOfWeek[];
  startTime: string;
  endTime: string;
}

export interface AdminClass {
  id: number;
  className: string;
  classCode: string;
  teacherId: number;
  yearLevel: number;
  semester: number;
  academicYear: string;
  schedule: AdminClassSchedule;
  description: string | null;
  isActive: boolean;
  studentCount: number;
  createdAt: string;
  teacherName: string;
}

export interface CreateClassData {
  teacherId: number;
  className: string;
  yearLevel: number;
  semester: number;
  academicYear: string;
  schedule: AdminClassSchedule;
  description?: string;
}

export interface UpdateClassData {
  className?: string;
  description?: string | null;
  isActive?: boolean;
  yearLevel?: number;
  semester?: number;
  academicYear?: string;
  schedule?: AdminClassSchedule;
  teacherId?: number;
}

// ============ Admin Enrollment Types ============

export interface EnrolledStudent {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  enrolledAt: string;
  fullName?: string;
  // studentId might be useful if it differs from id (user id), but usually id here refers to User ID
}

export interface ClassAssignment {
  id: number;
  title: string;
  description: string;
  deadline: string | null;
  createdAt: string;
  submissionCount: number;
}

// ============ Admin Analytics Types ============

export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalClasses: number;
  activeClasses: number;
  totalSubmissions: number;
  totalPlagiarismReports: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  user: string;
  target: string;
  timestamp: string;
}

// ============ Admin Response Types ============

export interface AdminResponse {
  success: boolean;
  message?: string;
}

export interface AdminUserResponse extends AdminResponse {
  user?: AdminUser;
}

export interface AdminUsersResponse extends AdminResponse {
  users?: AdminUser[];
}

export interface AdminClassResponse extends AdminResponse {
  class?: AdminClass;
}

export interface AdminStatsResponse extends AdminResponse {
  stats?: AdminStats;
}

export interface AdminActivityResponse extends AdminResponse {
  activity?: ActivityItem[];
}

export interface AdminTeachersResponse extends AdminResponse {
  teachers?: AdminUser[];
}

export interface AdminStudentsResponse extends AdminResponse {
  students?: EnrolledStudent[];
}

export interface AdminAssignmentsResponse extends AdminResponse {
  assignments?: ClassAssignment[];
}

export interface PaginatedResponse<T> extends AdminResponse {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Gradebook Types
// ============================================================================

/** Penalty tier for late submissions */
export type { PenaltyTier };

/** Late penalty configuration */
export type { LatePenaltyConfig };

/** Penalty calculation result */
export type { PenaltyResult };

/** Single grade entry in gradebook */
export type { GradeEntry };

/** Assignment info in gradebook */
export type { GradebookAssignment };

/** Student row in gradebook */
export type { GradebookStudent };

/** Class gradebook data */
export interface ClassGradebook {
  assignments: GradebookAssignment[];
  students: GradebookStudent[];
}

/** Student grade for an assignment */
export type { StudentGradeEntry };

/** Student grades for a class */
export type { StudentClassGrades };

/** Class statistics */
export type { ClassStatistics };

/** Student rank in class */
export interface StudentRank {
  rank: number | null;
  totalStudents: number | null;
  percentile: number | null;
}

// ============ Gradebook Response Types ============

export interface ClassGradebookResponse {
  success: boolean;
  assignments: GradebookAssignment[];
  students: GradebookStudent[];
}

export interface StudentGradesResponse {
  success: boolean;
  grades: StudentClassGrades[];
}

export interface ClassStatisticsResponse {
  success: boolean;
  statistics: ClassStatistics;
}

export interface StudentRankResponse {
  success: boolean;
  rank: number | null;
  totalStudents: number | null;
  percentile: number | null;
}

export interface LatePenaltyConfigResponse {
  success: boolean;
  enabled: boolean;
  config: LatePenaltyConfig | null;
}

// ============ Gradebook Request Types ============

export interface GradeOverrideRequest {
  grade: number;
  feedback?: string | null;
}

export interface LatePenaltyUpdateRequest {
  enabled: boolean;
  config?: LatePenaltyConfig;
}
