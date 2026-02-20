import type { Class, ClassSchedule } from "@/models/index.js"

export interface ClassDTO {
  id: number
  teacherId: number
  className: string
  classCode: string
  description: string | null
  yearLevel: number
  semester: number
  academicYear: string
  schedule: ClassSchedule
  createdAt: string
  isActive: boolean
  studentCount?: number
  teacherName?: string
  assignmentCount?: number
}

export function toClassDTO(
  classData: Class,
  extras?: {
    studentCount?: number
    teacherName?: string
    assignmentCount?: number
  },
): ClassDTO {
  return {
    id: classData.id,
    teacherId: classData.teacherId,
    className: classData.className,
    classCode: classData.classCode,
    description: classData.description,
    yearLevel: classData.yearLevel,
    semester: classData.semester,
    academicYear: classData.academicYear,
    schedule: classData.schedule,
    createdAt: classData.createdAt?.toISOString() ?? new Date().toISOString(),
    isActive: classData.isActive ?? true,
    ...extras,
  }
}
