import type { ClassSchedule } from "@/models/index.js"

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
