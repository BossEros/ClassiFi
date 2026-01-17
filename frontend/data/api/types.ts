import type { Class, Task } from "@/business/models/dashboard/types";

// ============================================================================
// Shared Types
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
// Class Response DTOs
// ============================================================================

export interface CreateClassResponse {
  success: boolean;
  message?: string;
  class?: Class;
}

export interface CreateAssignmentResponse {
  success: boolean;
  message?: string;
  assignment?: Task;
}

// ============================================================================
// Dashboard Response DTOs
// ============================================================================

export interface DashboardResponse {
  success: boolean;
  message?: string;
  recentClasses: Class[];
  pendingTasks: Task[];
}

export interface StudentDashboardData {
  enrolledClasses: Class[];
  pendingAssignments: Task[];
}

// ============================================================================
// Student Dashboard Response DTOs
// ============================================================================

export interface ClassResponse {
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
  schedule: {
    days: (
      | "monday"
      | "tuesday"
      | "wednesday"
      | "thursday"
      | "friday"
      | "saturday"
      | "sunday"
    )[];
    startTime: string;
    endTime: string;
  };
}

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
  days: string[];
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
// Assignment Types
// ============================================================================

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

export interface SubmissionWithAssignment extends Submission {
  assignmentName: string;
}

export interface SubmissionWithStudent extends Submission {
  studentName: string;
}

export interface AssignmentDetail {
  id: number;
  classId: number;
  className: string;
  assignmentName: string;
  description: string;
  programmingLanguage: string;
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
  testCases?: {
    id: number;
    name: string;
    isHidden: boolean;
    input?: string;
    expectedOutput?: string;
  }[];
}

// ============ Request Schemas ============

export interface SubmitAssignmentRequest {
  assignmentId: number;
  studentId: number;
  file: File;
  programmingLanguage: string;
}

export interface CreateAssignmentRequest {
  classId: number;
  teacherId: number;
  assignmentName: string;
  description: string;
  programmingLanguage: "python" | "java" | "c";
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
  programmingLanguage?: "python" | "java" | "c";
  deadline?: Date | string;
  allowResubmission?: boolean;
  maxAttempts?: number | null;
  templateCode?: string | null;
  totalScore?: number;
  scheduledDate?: Date | string | null;
  latePenaltyEnabled?: boolean;
  latePenaltyConfig?: LatePenaltyConfig | null;
}

// ============ Response Schemas ============

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

// ============================================================================
// Gradebook Types
// ============================================================================

/** Penalty tier for late submissions */
export interface PenaltyTier {
  hoursAfterGrace: number;
  penaltyPercent: number;
}

/** Late penalty configuration */
export interface LatePenaltyConfig {
  gracePeriodHours: number;
  tiers: PenaltyTier[];
  rejectAfterHours: number | null;
}

/** Penalty calculation result */
export interface PenaltyResult {
  isLate: boolean;
  hoursLate: number;
  penaltyPercent: number;
  gradeMultiplier: number;
  tierLabel: string;
}

/** Single grade entry in gradebook */
export interface GradeEntry {
  assignmentId: number;
  submissionId: number | null;
  grade: number | null;
  isOverridden: boolean;
  submittedAt: string | null;
}

/** Assignment info in gradebook */
export interface GradebookAssignment {
  id: number;
  name: string;
  totalScore: number;
  deadline: string;
}

/** Student row in gradebook */
export interface GradebookStudent {
  id: number;
  name: string;
  email: string;
  grades: GradeEntry[];
}

/** Class gradebook data */
export interface ClassGradebook {
  assignments: GradebookAssignment[];
  students: GradebookStudent[];
}

/** Student grade for an assignment */
export interface StudentGradeEntry {
  id: number;
  name: string;
  totalScore: number;
  deadline: string;
  grade: number | null;
  isOverridden: boolean;
  feedback: string | null;
  submittedAt: string | null;
  isLate?: boolean;
  penaltyApplied?: number;
}

/** Student grades for a class */
export interface StudentClassGrades {
  classId: number;
  className: string;
  teacherName: string;
  assignments: StudentGradeEntry[];
}

/** Class statistics */
export interface ClassStatistics {
  classAverage: number | null;
  submissionRate: number;
  totalStudents: number;
  totalAssignments: number;
}

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
