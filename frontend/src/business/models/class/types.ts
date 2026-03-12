import type { Schedule } from "@/shared/types/class"

export interface CreateClassRequest {
  teacherId: number
  className: string
  description?: string
  classCode: string
  semester: 1 | 2
  academicYear: string
  schedule: Schedule
}

export interface UpdateClassRequest {
  teacherId: number
  className?: string
  description?: string
  isActive?: boolean
  semester?: 1 | 2
  academicYear?: string
  schedule?: Schedule
}


