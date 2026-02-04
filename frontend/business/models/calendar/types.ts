/**
 * Calendar Feature Type Definitions
 * 
 * This module defines the domain models and types for the calendar feature.
 * These types represent calendar events, date ranges, filters, and related data structures.
 */

/**
 * Represents the status of a student's assignment submission.
 */
export type AssignmentStatus = 'not-started' | 'pending' | 'submitted' | 'late';

/**
 * Represents a displayable event on the calendar.
 * This is the primary data structure for calendar events, typically representing assignment deadlines.
 */
export interface CalendarEvent {
    /** Unique identifier for the event (typically assignment ID) */
    id: number;

    /** Display title for the event (typically assignment name) */
    title: string;

    /** Detailed description of the event/assignment */
    description: string;

    /** Deadline date and time for the event */
    deadline: Date;

    /** ID of the associated class */
    classId: number;

    /** Name of the associated class for display */
    className: string;

    /** Hex color code for visual identification of the class */
    classColor: string;

    /** Type of event (extensible for future event types) */
    type: 'assignment';

    // Student-specific fields
    /** Submission status for students */
    status?: AssignmentStatus;

    /** Grade received if available */
    grade?: number;

    /** ID of the latest submission */
    submissionId?: number;

    // Teacher-specific fields
    /** Number of students who have submitted */
    submittedCount?: number;

    /** Total number of enrolled students */
    totalStudents?: number;
}

/**
 * Represents a month's worth of calendar data.
 * Contains metadata about the month and organized week/day structure.
 */
export interface CalendarMonth {
    /** Year (e.g., 2024) */
    year: number;

    /** Month (0-11, JavaScript Date convention) */
    month: number;

    /** Day of week for the 1st of the month (0=Sunday) */
    firstDayOfWeek: number;

    /** Number of days in the month */
    daysInMonth: number;

    /** Array of weeks in the calendar grid */
    weeks: CalendarWeek[];
}

/**
 * Represents a week in the calendar grid.
 */
export interface CalendarWeek {
    /** Array of 7 days (Sunday through Saturday) */
    days: CalendarDay[];
}

/**
 * Represents a single day in the calendar grid.
 */
export interface CalendarDay {
    /** Full date object */
    date: Date;

    /** Day number (1-31) */
    dayOfMonth: number;

    /** Whether this day is in the currently displayed month */
    isCurrentMonth: boolean;

    /** Whether this day is today's date */
    isToday: boolean;

    /** Events occurring on this day */
    events: CalendarEvent[];
}

/**
 * Simplified class information for filtering and display.
 */
export interface ClassInfo {
    /** Unique class identifier */
    id: number;

    /** Class name for display */
    name: string;

    /** Generated color for visual identification */
    color: string;

    /** Whether the student is enrolled in this class */
    isEnrolled?: boolean;

    /** Whether the teacher is teaching this class */
    isTeaching?: boolean;
}

/**
 * Represents a date range for querying events.
 */
export interface DateRange {
    /** Start date (inclusive) */
    start: Date;

    /** End date (inclusive) */
    end: Date;
}

/**
 * Represents active filters on the calendar.
 */
export interface CalendarFilters {
    /** Set of selected class IDs to display */
    classIds: Set<number>;

    /** Whether to show events before today */
    showPastEvents: boolean;
}
