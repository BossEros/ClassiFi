export interface Class {
  id: number
  name: string
  code: string
  description?: string
  studentCount: number
  createdAt?: Date
}

export interface Task {
  id: number
  title: string
  description: string
  classId: number
  className: string
  programmingLanguage: string
  deadline: Date
  allowResubmission: boolean
  createdAt?: Date
}

export interface Assignment {
  id: number
  title: string
  description: string
  programmingLanguage: string
  deadline: Date
  allowResubmission: boolean
  isChecked: boolean
  createdAt?: Date
}

export interface EnrolledStudent {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  enrolledAt?: Date
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

export interface DashboardResponse {
  success: boolean
  message?: string
  recentClasses: Class[]
  pendingTasks: Task[]
}

export interface CreateClassRequest {
  teacherId: number
  className: string
  description?: string
  classCode?: string
}

export interface CreateClassResponse {
  success: boolean
  message?: string
  class: Class
}

