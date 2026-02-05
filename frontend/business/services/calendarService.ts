import * as assignmentService from "./assignmentService"
import * as classService from "./classService"
import * as studentDashboardService from "./studentDashboardService"
import { validateId } from "@/shared/utils/validators"
import type {
    CalendarEvent,
    AssignmentStatus,
    ClassInfo,
} from "@/business/models/calendar/types"
import type { Assignment, Class } from "@/business/models/dashboard/types"
import type { Submission } from "@/data/api/types"

/**
 * Color palette for class color coding.
 * These colors are chosen for good contrast against dark backgrounds.
 */
const COLOR_PALETTE = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#14B8A6", // Teal
    "#F97316", // Orange
    "#6366F1", // Indigo
    "#84CC16", // Lime
    "#06B6D4", // Cyan
    "#A855F7", // Violet
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
            // Don't expose internal error details to users
            if (error.message.includes('network') || error.message.includes('fetch')) {
                throw new Error("Network error. Please check your connection and try again.")
            }
            if (error.message.includes('unauthorized') || error.message.includes('permission')) {
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

    const submissions = await assignmentService.getStudentSubmissions(
        studentId,
        true,
    )
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
            console.error(`Error fetching counts for assignment ${assignment.id}:`, error)
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
 * Generates a deterministic color for a class based on its ID.
 * Uses a hash function to ensure consistent colors across sessions.
 *
 * @param classId - Class identifier
 * @returns Hex color string from the predefined palette
 */
export function getClassColor(classId: number): string {
    // Simple hash function for deterministic color selection
    const index = classId % COLOR_PALETTE.length
    return COLOR_PALETTE[index]
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
 * Formats a date for display in the calendar.
 * Uses locale-aware formatting for consistency.
 *
 * @param date - Date to format
 * @returns Formatted date string (e.g., "January 15, 2024 at 11:59 PM")
 */
export function formatCalendarDate(date: Date): string {
    return date.toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    })
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

    return classesResponse.classes as unknown as Class[]
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
            if (error instanceof Error &&
                (error.message.includes('unauthorized') ||
                    error.message.includes('permission') ||
                    error.message.includes('403'))) {
                console.warn(`No access to assignments for class ${cls.id}`)
                return []
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
            assignmentService.getAssignmentSubmissions(assignmentId, true).catch(err => {
                console.warn(`Error fetching submissions for assignment ${assignmentId}:`, err)
                return []
            }),
            classService.getClassStudents(classId).catch(err => {
                console.warn(`Error fetching students for class ${classId}:`, err)
                return []
            }),
        ])

        return {
            submittedCount: submissions.length,
            totalStudents: students.length,
        }
    } catch (error) {
        console.error(`Error fetching counts for assignment ${assignmentId}:`, error)
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
        if (!event.id || typeof event.id !== 'number') {
            console.warn('Invalid event: missing or invalid id', event);
            return false;
        }

        if (!event.title || typeof event.title !== 'string') {
            console.warn('Invalid event: missing or invalid title', event);
            return false;
        }

        if (!event.deadline || !(event.deadline instanceof Date) || isNaN(event.deadline.getTime())) {
            console.warn('Invalid event: missing or invalid deadline', event);
            return false;
        }

        if (!event.classId || typeof event.classId !== 'number') {
            console.warn('Invalid event: missing or invalid classId', event);
            return false;
        }

        if (!event.className || typeof event.className !== 'string') {
            console.warn('Invalid event: missing or invalid className', event);
            return false;
        }

        if (!event.classColor || typeof event.classColor !== 'string') {
            console.warn('Invalid event: missing or invalid classColor', event);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error validating calendar event:', error, event);
        return false;
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
    const validEvents = events.filter(isValidCalendarEvent);

    const invalidCount = events.length - validEvents.length;
    if (invalidCount > 0) {
        console.warn(`Filtered out ${invalidCount} invalid calendar event(s)`);
    }

    return validEvents;
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
 *
 * @param submissions - Array of submissions
 * @returns Map of assignment ID to submission
 */
function createSubmissionMap(
    submissions: Submission[],
): Map<number, Submission> {
    const submissionMap = new Map<number, Submission>()
    submissions.forEach((sub) => {
        submissionMap.set(sub.assignmentId, sub)
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

    return {
        id: assignment.id,
        title: assignment.assignmentName,
        description: assignment.description || "",
        deadline: new Date(assignment.deadline!),
        classId: assignment.classId,
        className: cls?.className || "Unknown Class",
        classColor: getClassColor(assignment.classId),
        type: "assignment" as const,
        status: calculateSubmissionStatus(assignment, submission),
        grade: submission?.grade ?? undefined,
        submissionId: submission?.id,
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

    return {
        id: assignment.id,
        title: assignment.assignmentName,
        description: assignment.description || "",
        deadline: new Date(assignment.deadline!),
        classId: assignment.classId,
        className: cls?.className || "Unknown Class",
        classColor: getClassColor(assignment.classId),
        type: "assignment" as const,
        submittedCount,
        totalStudents,
    }
}

/**
 * Sorts calendar events by deadline (earliest first).
 *
 * @param events - Array of calendar events
 * @returns Sorted array of events
 */
function sortEventsByDeadline(events: CalendarEvent[]): CalendarEvent[] {
    return events.sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
}
