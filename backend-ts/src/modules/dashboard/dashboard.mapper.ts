import type { Class, ClassSchedule } from "@/modules/classes/class.model.js"

export interface DashboardClassDTO {
  id: number
  teacherId: number
  className: string
  classCode: string
  description: string | null
  studentCount?: number
  assignmentCount?: number
  teacherName?: string
  createdAt: string
  isActive: boolean
  semester: number
  academicYear: string
  schedule: ClassSchedule
}

export function toDashboardClassDTO(
  classData: Class,
  extras?: {
    studentCount?: number
    assignmentCount?: number
    teacherName?: string
  },
): DashboardClassDTO {
  return {
    id: classData.id,
    teacherId: classData.teacherId,
    className: classData.className,
    classCode: classData.classCode,
    description: classData.description,
    semester: classData.semester,
    academicYear: classData.academicYear,
    schedule: classData.schedule,
    createdAt: classData.createdAt?.toISOString() ?? new Date().toISOString(),
    isActive: classData.isActive ?? true,
    ...extras,
  }
}

export interface PendingAssignmentDTO {
  id: number
  assignmentName: string
  className: string
  classId: number
  deadline: string | null
  hasSubmitted: boolean
  programmingLanguage: string
}

export interface PendingTaskDTO {
  id: number
  assignmentName: string
  className: string
  classId: number
  deadline: string | null
  submissionCount: number
  totalStudents: number
}

export interface AllTeacherAssignmentDTO {
  id: number
  assignmentName: string
  className: string
  classId: number
  deadline: string | null
  submissionCount: number
  totalStudents: number
  programmingLanguage: string
}


