/** Class model - matches backend ClassDTO */
export interface Class {
  id: number
  className: string
  classCode: string
  description?: string | null
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
  description: string
  classId: number
  className: string
  programmingLanguage: string
  deadline: Date | string
  allowResubmission: boolean
  createdAt?: Date | string
  hasSubmitted?: boolean
  submissionCount?: number
  totalStudents?: number
}

/** Assignment model for class detail - matches backend */
export interface Assignment {
  id: number
  assignmentName: string
  description: string
  programmingLanguage: string
  deadline: Date | string
  allowResubmission: boolean
  isActive?: boolean
  createdAt?: Date | string
  submissionCount?: number
  hasSubmitted?: boolean
  className?: string
}

/** Enrolled student model - matches backend */
export interface EnrolledStudent {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  enrolledAt?: Date | string
}

export interface ClassDetailData {
  classInfo: Class
  assignments: Assignment[]
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
