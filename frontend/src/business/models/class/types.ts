import type { Schedule } from "@/shared/types/class"

export interface CreateClassRequest {
  teacherId: number
  className: string
  description?: string
  classCode: string
  yearLevel: 1 | 2 | 3 | 4
  semester: 1 | 2
  academicYear: string
  schedule: Schedule
}

export interface UpdateClassRequest {
  teacherId: number
  className?: string
  description?: string
  isActive?: boolean
  yearLevel?: 1 | 2 | 3 | 4
  semester?: 1 | 2
  academicYear?: string
  schedule?: Schedule
}
