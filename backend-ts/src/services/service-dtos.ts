import type { UserRole } from "@/repositories/user.repository.js"
import type { ClassSchedule } from "@/models/index.js"
import type { LatePenaltyConfig } from "@/models/index.js"

/** DTO for AuthService.registerUser */
export interface RegisterUserServiceDTO {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
}

/** DTO for ClassService.createClass */
export interface CreateClassServiceDTO {
  teacherId: number
  className: string
  classCode: string
  yearLevel: number
  semester: number
  academicYear: string
  schedule: ClassSchedule
  description?: string
}

/** DTO for ClassService.removeStudent */
export interface RemoveStudentServiceDTO {
  classId: number
  studentId: number
  teacherId: number
}

/** DTO for enrolled student info returned by ClassService.getClassStudents */
export interface EnrolledStudentDTO {
  id: number
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
}

/** DTO for file upload in SubmissionService.submitAssignment */
export interface SubmissionFileDTO {
  filename: string
  data: Buffer
  mimetype: string
}

/** DTO for ClassService.updateClass */
export interface UpdateClassServiceDTO {
  classId: number
  teacherId: number
  className?: string
  description?: string | null
  isActive?: boolean
  yearLevel?: number
  semester?: number
  academicYear?: string
  schedule?: ClassSchedule
}

/** DTO for AssignmentService.createAssignment */
export interface CreateAssignmentServiceDTO {
  classId: number
  teacherId: number
  assignmentName: string
  description: string
  descriptionImageUrl?: string | null
  descriptionImageAlt?: string | null
  programmingLanguage: "python" | "java" | "c"
  deadline: Date | null
  allowResubmission?: boolean
  maxAttempts?: number | null
  templateCode?: string | null
  totalScore?: number
  scheduledDate?: Date | null
  latePenaltyEnabled?: boolean
  latePenaltyConfig?: LatePenaltyConfig | null
}

/** DTO for AssignmentService.updateAssignment */
export interface UpdateAssignmentServiceDTO {
  assignmentId: number
  teacherId: number
  assignmentName?: string
  description?: string
  descriptionImageUrl?: string | null
  descriptionImageAlt?: string | null
  programmingLanguage?: "python" | "java" | "c"
  deadline?: Date | null
  allowResubmission?: boolean
  maxAttempts?: number | null
  templateCode?: string | null
  totalScore?: number
  scheduledDate?: Date | null
  latePenaltyEnabled?: boolean
  latePenaltyConfig?: LatePenaltyConfig | null
}
