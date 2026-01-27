// Re-export shared types for backward compatibility
export type {
  DayOfWeek,
  Schedule,
  Class,
  Assignment,
  Task,
  EnrolledStudent,
} from "@/shared/types/class";

// Re-export API response types
export type {
  ClassDetailResponse,
  ClassListResponse,
  AssignmentListResponse,
  StudentListResponse,
  DeleteResponse,
  GenerateCodeResponse,
} from "@/data/api/types";

// Import types locally for use in this file's interfaces
import type { Class, Task, EnrolledStudent } from "@/shared/types/class";

// ============================================================================
// Business Layer Specific Types
// ============================================================================

export interface ClassDetailData {
  classInfo: Class;
  assignments: Task[];
  students: EnrolledStudent[];
}

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface DashboardStats {
  totalClasses?: number;
  totalTasks?: number;
  pendingTasks?: number;
  totalStudents?: number;
}

export interface DashboardData {
  recentClasses: Class[];
  pendingTasks: Task[];
}

// Backend response type (does not include fullName - we compute it on the frontend)
export interface StudentBackendResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  enrolledAt?: string;
}
