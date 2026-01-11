/** Days of the week for class schedule */
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

/** Schedule for class meetings */
export interface Schedule {
  days: DayOfWeek[]
  startTime: string
  endTime: string
}

/** Class model - matches backend ClassDTO */
export interface Class {
  id: number
  className: string
  classCode: string
  description?: string | null
  yearLevel: number
  semester: number
  academicYear: string
  schedule: Schedule
  studentCount?: number
  createdAt?: Date | string
  isActive?: boolean
  teacherId?: number
  teacherName?: string
  assignmentCount?: number
}

/** Task/Assignment model for dashboard - matches backend */
export interface Task {
  id: number
  assignmentName: string
  description: string | null
  programmingLanguage: string
  deadline: Date | string
  allowResubmission: boolean
  maxAttempts?: number | null
  isActive?: boolean
  createdAt?: Date | string
  submissionCount?: number
  hasSubmitted?: boolean
  className?: string
  templateCode?: string | null
  hasTemplateCode?: boolean
}

/** Assignment alias for Task - both represent the same domain concept */
export type Assignment = Task

/** Enrolled student model - matches backend */
export interface EnrolledStudent {
  id: number
  email: string
  firstName: string
  lastName: string
  fullName: string
  avatarUrl?: string | null
  enrolledAt?: Date | string
}

export interface ClassDetailData {
  classInfo: Class
  assignments: Task[]
  students: EnrolledStudent[]
}

export interface NavigationItem {
  id: string
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

export interface DashboardStats {
  totalClasses?: number
  totalTasks?: number
  pendingTasks?: number
  totalStudents?: number
}

export interface DashboardData {
  recentClasses: Class[]
  pendingTasks: Task[]
}
