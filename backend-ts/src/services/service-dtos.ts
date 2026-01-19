import type { UserRole } from "@/repositories/user.repository.js";
import type { ClassSchedule } from "@/models/index.js";

/** DTO for AuthService.registerUser */
export interface RegisterUserServiceDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

/** DTO for ClassService.createClass */
export interface CreateClassServiceDTO {
  teacherId: number;
  className: string;
  classCode: string;
  yearLevel: number;
  semester: number;
  academicYear: string;
  schedule: ClassSchedule;
  description?: string;
}

/** DTO for ClassService.removeStudent */
export interface RemoveStudentServiceDTO {
  classId: number;
  studentId: number;
  teacherId: number;
}
