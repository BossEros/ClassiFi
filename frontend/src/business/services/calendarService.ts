import * as assignmentService from "./assignmentService"
import * as classService from "./classService"
import * as studentDashboardService from "./studentDashboardService"
import { validateId } from "@/business/validation/commonValidation"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  format,
} from "date-fns"
import type {
  CalendarEvent,
  AssignmentStatus,
  ClassInfo,
  DateRange,
} from "@/business/models/calendar/types"
import type { Assignment, Class } from "@/business/models/dashboard/types"
import type { Submission } from "@/business/models/assignment/types"
import type { CalendarView } from "@/business/models/calendar/types"

// ============================================================================
// Color Scheme Constants
// ============================================================================

/**
 * All available colors for class color assignment.
 * Uses a diverse palette to ensure different classes get different colors.
 */
const ALL_COLORS = [
  "#3B82F6", // Blue
  "#EC4899", // Pink
  "#10B981", // Green
  "#F97316", // Orange
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#EAB308", // Yellow
  "#EF4444", // Red
  "#14B8A6", // Teal
  "#A855F7", // Violet
  "#84CC16", // Lime
  "#F59E0B", // Amber
  "#6366F1", // Indigo
  "#0EA5E9", // Sky
  "#F472B6", // Light Pink
  "#FB923C", // Light Orange
]

/**
 * Fetches calendar events for a date range based on user role.
 * Aggregates data from existing services and transforms to calendar events.
 *
 * @param startDate - Start of date range (typically first day of month)
 * @param endDate - End of date range (typically last day of month)
 * @param userId - Current user ID
 * @param userRole - Current user role ('student' | 'teacher')
 * @returns Array of calendar events
 */
export async function getCalendarEvents(
  startDate: Date,
  endDate: Date,
  userId: number,
  userRole: "student" | "teacher",
): Promise<CalendarEvent[]> {
  validateId(userId, "user")

  if (startDate > endDate) {
    throw new Error("Start date must be before or equal to end date")
  }

  try {
    if (userRole === "student") {
      return await getStudentCalendarEvents(startDate, endDate, userId)
    } else {
      return await getTeacherCalendarEvents(startDate, endDate, userId)
    }
  } catch (error) {
    console.error("Error fetching calendar events:", error)

    // Provide user-friendly error message
    if (error instanceof Error) {
      // Normalize error message to lowercase for case-insensitive matching
      const msg = error.message.toLowerCase()

      // Don't expose internal error details to users
      if (
        msg.includes("network") ||
        msg.includes("failed to fetch") ||
        msg.includes("fetch")
      ) {
        throw new Error(
          "Network error. Please check your connection and try again.",
        )
      }
      if (msg.includes("unauthorized") || msg.includes("permission")) {
        throw new Error("You don't have permission to view these events.")
      }
    }

    throw new Error("Unable to load calendar events. Please try again later.")
  }
}

// ============================================================================
// Main Event Fetching Functions
// ============================================================================

/**
 * Fetches calendar events for a student.
 * Orchestrates data fetching and transformation for student view.
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @param studentId - Student user ID
 * @returns Array of calendar events with student-specific data
 */
async function getStudentCalendarEvents(
  startDate: Date,
  endDate: Date,
  studentId: number,
): Promise<CalendarEvent[]> {
  const classes = await fetchEnrolledClasses(studentId)

  if (classes.length === 0) {
    return []
  }

  const allAssignments = await fetchAssignmentsForClasses(classes)
  const filteredAssignments = filterAssignmentsByDateRange(
    allAssignments,
    startDate,
    endDate,
  )

  // Fetch submissions - use basic getStudentSubmissions which doesn't include assignment names
  // We'll match them with assignments ourselves
  let submissions: Submission[] = []
  try {
    submissions = await assignmentService.getStudentSubmissions(studentId, true)
  } catch (error) {
    console.warn("Error fetching student submissions:", error)
    // Continue without submissions - assignments will show as not-started
  }

  const submissionMap = createSubmissionMap(submissions)

  const events = filteredAssignments.map((assignment) =>
    transformToStudentEvent(assignment, classes, submissionMap),
  )

  // Filter out invalid events before returning
  const validEvents = filterValidEvents(events)
  return sortEventsByDeadline(validEvents)
}

/**
 * Fetches calendar events for a teacher.
 * Orchestrates data fetching and transformation for teacher view.
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @param teacherId - Teacher user ID
 * @returns Array of calendar events with teacher-specific data
 */
async function getTeacherCalendarEvents(
  startDate: Date,
  endDate: Date,
  teacherId: number,
): Promise<CalendarEvent[]> {
  const classes = await classService.getAllClasses(teacherId)

  if (!classes || classes.length === 0) {
    return []
  }

  const allAssignments = await fetchAssignmentsForClasses(classes)
  const filteredAssignments = filterAssignmentsByDateRange(
    allAssignments,
    startDate,
    endDate,
  )

  const eventPromises = filteredAssignments.map(async (assignment) => {
    try {
      const { submittedCount, totalStudents } = await fetchAssignmentCounts(
        assignment.id,
        assignment.classId,
      )

      return transformToTeacherEvent(
        assignment,
        classes,
        submittedCount,
        totalStudents,
      )
    } catch (error) {
      // Log error but continue processing other assignments
      console.error(
        `Error fetching counts for assignment ${assignment.id}:`,
        error,
      )
      return null
    }
  })

  const events = await Promise.all(eventPromises)

  // Filter out null events (failed fetches) and invalid events
  const validEvents = events
    .filter((event): event is CalendarEvent => event !== null)
    .filter(isValidCalendarEvent)

  return sortEventsByDeadline(validEvents)
}

// ============================================================================
// Exported Utility Functions
// ============================================================================

/**
 * Calculates date range for a given view and date.
 * Returns appropriate start and end dates based on the view mode.
 *
 * @param date - Reference date
 * @param view - View mode ('month' | 'week' | 'day')
 * @returns DateRange object with start and end dates
 *
 * Requirements: 3.1, 3.2, 3.5
 */
export function getDateRangeForView(date: Date, view: CalendarView): DateRange {
  switch (view) {
    case "month":
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      }

    case "week":
      return {
        start: startOfWeek(date, { weekStartsOn: 0 }),
        end: endOfWeek(date, { weekStartsOn: 0 }),
      }

    case "day":
      return {
        start: startOfDay(date),
        end: endOfDay(date),
      }

    case "agenda":
      // For agenda view, show current month by default
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      }

    default:
      // Default to month view
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      }
  }
}

/**
 * Generates a deterministic color for a class based on its ID.
 * Uses a hash-based approach to ensure better color distribution.
 *
 * @param classId - Class identifier
 * @returns Hex color string from the color palette
 *
 * Requirements: 4.3, 5.4, 7.5
 */
export function getClassColor(classId: number): string {
  // Use ALL_COLORS palette for better distribution
  // This ensures different classes get different colors
  const palette = ALL_COLORS

  // Use a simple hash function to distribute colors more evenly
  // This prevents adjacent class IDs from getting similar colors
  const hash = (classId * 2654435761) % palette.length
  const index = Math.abs(hash)

  return palette[index]
}

/**
 * Calculates submission status for a student assignment.
 * Determines if the assignment is not started, pending, submitted, or late.
 *
 * @param assignment - Assignment data
 * @param submission - Student's latest submission for this assignment (if any)
 * @returns Status string ('not-started' | 'pending' | 'submitted' | 'late')
 */
export function calculateSubmissionStatus(
  assignment: Assignment,
  submission?: Submission,
): AssignmentStatus {
  // No submission exists
  if (!submission) {
    return "not-started"
  }

  // Has a grade - considered submitted
  if (submission.grade !== null && submission.grade !== undefined) {
    return "submitted"
  }

  // Check if submitted late
  if (assignment.deadline && submission.submittedAt) {
    const deadline = new Date(assignment.deadline)
    const submittedAt = new Date(submission.submittedAt)

    if (submittedAt > deadline) {
      return "late"
    }
  }

  // Submitted but not graded yet
  return "pending"
}

/**
 * Formats a date for display in the calendar navigation.
 * Uses view-aware formatting for appropriate context.
 *
 * @param date - Date to format
 * @param view - View mode for context-appropriate formatting (optional)
 * @returns Formatted date string based on view mode
 *
 * View-specific formats:
 * - Month: "October 2023"
 * - Week: "Oct 16-22, 2023"
 * - Day: "October 16, 2023"
 * - Default (no view): "January 15, 2024 at 11:59 PM"
 *
 * Requirements: 3.4, 9.4
 */
export function formatCalendarDate(date: Date, view?: CalendarView): string {
  if (!view) {
    // Full date with time for event details
    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  switch (view) {
    case "month":
      // Format: "October 2023"
      return format(date, "MMMM yyyy")

    case "week": {
      // Format: "Oct 16-22, 2023" or "Oct 30 - Nov 5, 2023" for cross-month
      const weekStart = startOfWeek(date, { weekStartsOn: 0 })
      const weekEnd = endOfWeek(date, { weekStartsOn: 0 })

      if (format(weekStart, "MMM") === format(weekEnd, "MMM")) {
        // Same month: compact form
        return `${format(weekStart, "MMM d")}-${format(weekEnd, "d")}, ${format(weekEnd, "yyyy")}`
      } else {
        // Different months: include both month names
        return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}, ${format(weekEnd, "yyyy")}`
      }
    }

    case "day":
      // Format: "October 16, 2023"
      return format(date, "MMMM d, yyyy")

    case "agenda":
      // Same as month for agenda view
      return format(date, "MMMM yyyy")

    default:
      return format(date, "MMMM yyyy")
  }
}

/**
 * Gets class information for filtering purposes.
 * Returns simplified class data with colors for the filter UI.
 *
 * @param userId - Current user ID
 * @param userRole - Current user role ('student' | 'teacher')
 * @returns Array of class info objects
 */
export async function getClassesForFilter(
  userId: number,
  userRole: "student" | "teacher",
): Promise<ClassInfo[]> {
  validateId(userId, "user")

  try {
    let classes: Class[]

    if (userRole === "student") {
      classes = await fetchEnrolledClasses(userId)
    } else {
      classes = await classService.getAllClasses(userId)
    }

    return classes.map((cls) => ({
      id: cls.id,
      name: cls.className,
      color: getClassColor(cls.id),
      isEnrolled: userRole === "student",
      isTeaching: userRole === "teacher",
    }))
  } catch (error) {
    console.error("Error fetching classes for filter:", error)
    // Return empty array instead of throwing - allows calendar to still function
    return []
  }
}

// ============================================================================
// Helper Functions - Data Fetching
// ============================================================================

/**
 * Type guard to validate if an object matches the Class interface structure.
 *
 * @param obj - Object to validate
 * @returns True if object has required Class properties
 */
function isValidClass(obj: unknown): obj is Class {
  if (typeof obj !== "object" || obj === null) {
    console.warn("Invalid class: not an object or null", obj)
    return false
  }

  const candidate = obj as Record<string, unknown>

  const checks = {
    id: typeof candidate.id === "number",
    teacherId: typeof candidate.teacherId === "number",
    className: typeof candidate.className === "string",
    classCode: typeof candidate.classCode === "string",
    description:
      candidate.description === null ||
      typeof candidate.description === "string",
    isActive: typeof candidate.isActive === "boolean",
    createdAt: typeof candidate.createdAt === "string",
    yearLevel: typeof candidate.yearLevel === "number",
    semester: typeof candidate.semester === "number",
    academicYear: typeof candidate.academicYear === "string",
    schedule:
      typeof candidate.schedule === "object" && candidate.schedule !== null,
  }

  const isValid = Object.values(checks).every((check) => check === true)

  if (!isValid) {
    console.log("❌ Invalid class object")
    console.log("Class data:", candidate)
    console.log("Validation checks:", checks)
    console.log(
      "Failed fields:",
      Object.entries(checks)
        .filter(([, passed]) => !passed)
        .map(([field]) => field),
    )
  }

  return isValid
}

/**
 * Safely maps and validates response data to Class array.
 *
 * @param classes - Array of class objects from API response
 * @returns Validated array of Class objects
 */
function mapToClassArray(classes: unknown[]): Class[] {
  return classes.filter(isValidClass)
}

/**
 * Fetches enrolled classes for a student.
 *
 * @param studentId - Student user ID
 * @returns Array of enrolled classes or empty array
 */
async function fetchEnrolledClasses(studentId: number): Promise<Class[]> {
  const classesResponse =
    await studentDashboardService.getEnrolledClasses(studentId)

  if (!classesResponse.success || !classesResponse.classes) {
    return []
  }

  // Safely validate and map the response to Class array
  if (!Array.isArray(classesResponse.classes)) {
    console.warn("Invalid classes response: expected array")
    return []
  }

  const validClasses = mapToClassArray(classesResponse.classes)

  if (validClasses.length !== classesResponse.classes.length) {
    console.warn(
      `Filtered out ${classesResponse.classes.length - validClasses.length} invalid class objects`,
    )
  }

  return validClasses
}

/**
 * Fetches all assignments for multiple classes.
 * Silently filters out classes the user doesn't have access to.
 *
 * @param classes - Array of classes
 * @returns Array of all assignments across classes
 */
async function fetchAssignmentsForClasses(
  classes: Class[],
): Promise<Assignment[]> {
  const assignmentPromises = classes.map(async (cls) => {
    try {
      return await classService.getClassAssignments(cls.id)
    } catch (error) {
      // Silently filter out unauthorized classes
      if (error instanceof Error) {
        // Normalize error message to lowercase for case-insensitive matching
        const msg = error.message.toLowerCase()

        if (
          msg.includes("unauthorized") ||
          msg.includes("permission") ||
          msg.includes("403")
        ) {
          console.warn(`No access to assignments for class ${cls.id}`)
          return []
        }
      }

      // Log other errors but continue
      console.error(`Error fetching assignments for class ${cls.id}:`, error)
      return []
    }
  })

  const assignmentArrays = await Promise.all(assignmentPromises)
  return assignmentArrays.flat()
}

/**
 * Fetches submission and student counts for an assignment.
 * Returns zero counts if data cannot be fetched.
 *
 * @param assignmentId - Assignment ID
 * @param classId - Class ID
 * @returns Object with submission and student counts
 */
async function fetchAssignmentCounts(
  assignmentId: number,
  classId: number,
): Promise<{ submittedCount: number; totalStudents: number }> {
  try {
    const [submissions, students] = await Promise.all([
      assignmentService
        .getAssignmentSubmissions(assignmentId, true)
        .catch((err) => {
          console.warn(
            `Error fetching submissions for assignment ${assignmentId}:`,
            err,
          )
          return []
        }),
      classService.getClassStudents(classId).catch((err) => {
        console.warn(`Error fetching students for class ${classId}:`, err)
        return []
      }),
    ])

    return {
      submittedCount: submissions.length,
      totalStudents: students.length,
    }
  } catch (error) {
    console.error(
      `Error fetching counts for assignment ${assignmentId}:`,
      error,
    )
    return {
      submittedCount: 0,
      totalStudents: 0,
    }
  }
}

/**
 * Validates that a calendar event has all required fields.
 *
 * @param event - Calendar event to validate
 * @returns True if event is valid, false otherwise
 */
function isValidCalendarEvent(event: CalendarEvent): boolean {
  try {
    // Check required fields
    if (!event.id || typeof event.id !== "number") {
      console.warn("Invalid event: missing or invalid id", event)
      return false
    }

    if (!event.title || typeof event.title !== "string") {
      console.warn("Invalid event: missing or invalid title", event)
      return false
    }

    if (
      !event.timing?.start ||
      !(event.timing.start instanceof Date) ||
      isNaN(event.timing.start.getTime())
    ) {
      console.warn("Invalid event: missing or invalid timing.start", event)
      return false
    }

    if (!event.classInfo?.id || typeof event.classInfo.id !== "number") {
      console.warn("Invalid event: missing or invalid classInfo.id", event)
      return false
    }

    if (!event.classInfo?.name || typeof event.classInfo.name !== "string") {
      console.warn("Invalid event: missing or invalid classInfo.name", event)
      return false
    }

    if (!event.classInfo?.color || typeof event.classInfo.color !== "string") {
      console.warn("Invalid event: missing or invalid classInfo.color", event)
      return false
    }

    if (
      !event.assignment?.assignmentId ||
      typeof event.assignment.assignmentId !== "number"
    ) {
      console.warn(
        "Invalid event: missing or invalid assignment.assignmentId",
        event,
      )
      return false
    }

    return true
  } catch (error) {
    console.error("Error validating calendar event:", error, event)
    return false
  }
}

/**
 * Filters out invalid calendar events.
 * Logs warnings for invalid events but continues processing valid ones.
 *
 * @param events - Array of calendar events to validate
 * @returns Array of valid calendar events
 */
function filterValidEvents(events: CalendarEvent[]): CalendarEvent[] {
  const validEvents = events.filter(isValidCalendarEvent)

  const invalidCount = events.length - validEvents.length
  if (invalidCount > 0) {
    console.warn(`Filtered out ${invalidCount} invalid calendar event(s)`)
  }

  return validEvents
}

// ============================================================================
// Helper Functions - Data Filtering
// ============================================================================

/**
 * Filters assignments by date range.
 *
 * @param assignments - Array of assignments
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Filtered assignments within date range
 */
function filterAssignmentsByDateRange(
  assignments: Assignment[],
  startDate: Date,
  endDate: Date,
): Assignment[] {
  return assignments.filter((assignment) => {
    if (!assignment.deadline) return false

    const deadline = new Date(assignment.deadline)
    return deadline >= startDate && deadline <= endDate
  })
}

// ============================================================================
// Helper Functions - Data Transformation
// ============================================================================

/**
 * Creates a map of assignment ID to submission for quick lookup.
 * Keeps only the most recent submission per assignment.
 *
 * @param submissions - Array of submissions
 * @returns Map of assignment ID to submission
 */
function createSubmissionMap(
  submissions: Submission[],
): Map<number, Submission> {
  const submissionMap = new Map<number, Submission>()
  submissions.forEach((sub) => {
    const existing = submissionMap.get(sub.assignmentId)

    if (!existing) {
      submissionMap.set(sub.assignmentId, sub)
    } else {
      if (sub.submittedAt > existing.submittedAt) {
        submissionMap.set(sub.assignmentId, sub)
      }
    }
  })
  return submissionMap
}

/**
 * Transforms an assignment to a student calendar event.
 *
 * @param assignment - Assignment data
 * @param classes - Array of classes for lookup
 * @param submissionMap - Map of assignment ID to submission
 * @returns Calendar event with student-specific data
 */
function transformToStudentEvent(
  assignment: Assignment,
  classes: Class[],
  submissionMap: Map<number, Submission>,
): CalendarEvent {
  const cls = classes.find((c) => c.id === assignment.classId)
  const submission = submissionMap.get(assignment.id)
  const deadlineDate = new Date(assignment.deadline!)
  const isAllDay = isDateOnlyDeadline(deadlineDate)

  return {
    id: assignment.id,
    type: "assignment",
    title: assignment.assignmentName,
    description: assignment.instructions || undefined,
    timing: {
      start: deadlineDate,
      end: deadlineDate,
      allDay: isAllDay,
    },
    classInfo: {
      id: assignment.classId,
      name: cls?.className || "Unknown Class",
      color: getClassColor(assignment.classId),
    },
    assignment: {
      assignmentId: assignment.id,
      status: calculateSubmissionStatus(assignment, submission),
      grade: submission?.grade ?? undefined,
      submissionId: submission?.id,
    },
    resourceId: assignment.classId,
  }
}

/**
 * Transforms an assignment to a teacher calendar event.
 *
 * @param assignment - Assignment data
 * @param classes - Array of classes for lookup
 * @param submittedCount - Number of submissions
 * @param totalStudents - Total enrolled students
 * @returns Calendar event with teacher-specific data
 */
function transformToTeacherEvent(
  assignment: Assignment,
  classes: Class[],
  submittedCount: number,
  totalStudents: number,
): CalendarEvent {
  const cls = classes.find((c) => c.id === assignment.classId)
  const deadlineDate = new Date(assignment.deadline!)
  const isAllDay = isDateOnlyDeadline(deadlineDate)

  return {
    id: assignment.id,
    type: "assignment",
    title: assignment.assignmentName,
    description: assignment.instructions || undefined,
    timing: {
      start: deadlineDate,
      end: deadlineDate,
      allDay: isAllDay,
    },
    classInfo: {
      id: assignment.classId,
      name: cls?.className || "Unknown Class",
      color: getClassColor(assignment.classId),
    },
    assignment: {
      assignmentId: assignment.id,
      submittedCount,
      totalStudents,
    },
    resourceId: assignment.classId,
  }
}

/**
 * Sorts calendar events by deadline (earliest first).
 *
 * @param events - Array of calendar events
 * @returns Sorted array of events
 */
function sortEventsByDeadline(events: CalendarEvent[]): CalendarEvent[] {
  return events.sort(
    (a, b) => a.timing.start.getTime() - b.timing.start.getTime(),
  )
}

/**
 * Determines whether a deadline is date-only (midnight) and should be all-day.
 *
 * @param deadline - Assignment deadline date
 * @returns True when the deadline has no explicit time component
 */
function isDateOnlyDeadline(deadline: Date): boolean {
  return (
    deadline.getUTCHours() === 0 &&
    deadline.getUTCMinutes() === 0 &&
    deadline.getUTCSeconds() === 0 &&
    deadline.getUTCMilliseconds() === 0
  )
}
