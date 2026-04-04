import type { Event as RBCEvent } from "react-big-calendar"

export type AssignmentStatus = "not-started" | "pending" | "submitted" | "late"
export type CalendarEventType = "assignment"
export type CalendarView = "month" | "week" | "day" | "agenda"

export interface CalendarEventClassInfo {
  id: number
  name: string
  color: string
}

export interface CalendarEventTiming {
  start: Date
  end: Date
  allDay?: boolean
}

export interface CalendarEventAssignmentInfo {
  assignmentId: number
  status?: AssignmentStatus
  grade?: number
  submissionId?: number
  submittedCount?: number
  totalStudents?: number
}

export interface CalendarEvent extends RBCEvent {
  id: number
  type: CalendarEventType
  title: string
  description?: string
  timing: CalendarEventTiming
  classInfo: CalendarEventClassInfo
  assignment: CalendarEventAssignmentInfo
  resourceId?: number
}

export interface ClassInfo {
  id: number
  name: string
  color: string
  isEnrolled?: boolean
  isTeaching?: boolean
}

export interface DateRange {
  start: Date
  end: Date
}

export interface CalendarFilters {
  classIds: Set<number>
  showPastEvents: boolean
}
