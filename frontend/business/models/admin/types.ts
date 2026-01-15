import type { AdminClassSchedule } from "@/data/api/types";

export type {
  AdminUser,
  CreateUserData,
  AdminClassSchedule,
  AdminClass,
  CreateClassData,
  UpdateClassData,
  EnrolledStudent,
  ClassAssignment,
  AdminStats,
  ActivityItem,
  AdminResponse,
  AdminUserResponse,
  AdminUsersResponse,
  AdminClassResponse,
  AdminStatsResponse,
  AdminActivityResponse,
  AdminTeachersResponse,
  AdminStudentsResponse,
  AdminAssignmentsResponse,
  PaginatedResponse,
} from "@/data/api/types";

// Maintain backward compatibility for ClassSchedule
export type ClassSchedule = AdminClassSchedule;
