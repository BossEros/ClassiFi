/**
 * Calendar Feature Type Definitions
 *
 * This module defines the domain models and types for the calendar feature.
 * These types represent calendar events, date ranges, filters, and related data structures.
 */

import type { Event as RBCEvent } from "react-big-calendar"

/**
 * Represents the status of a student's assignment submission.
 */
export type AssignmentStatus = "not-started" | "pending" | "submitted" | "late"

/**
 * Supported calendar event types.
 */
export type CalendarEventType = "assignment"

/**
 * Class metadata attached to a calendar event.
 */
export interface CalendarEventClassInfo {
  /** Unique class identifier */
  id: number

  /** Class name for display */
  name: string

  /** Hex color code for visual identification */
  color: string
}

/**
 * Timing information for a calendar event.
 */
export interface CalendarEventTiming {
  /** Event start date/time */
  start: Date

  /** Event end date/time */
  end: Date

  /** Whether the event should render as an all-day event */
  allDay?: boolean
}

/**
 * Assignment-specific metadata for calendar events.
 */
export interface CalendarEventAssignmentInfo {
  /** Assignment identifier */
  assignmentId: number

  /** Submission status for students */
  status?: AssignmentStatus

  /** Grade received if available */
  grade?: number

  /** ID of the latest submission */
  submissionId?: number

  /** Number of students who have submitted (teacher view) */
  submittedCount?: number

  /** Total number of enrolled students (teacher view) */
  totalStudents?: number
}

/**
 * Represents a displayable event on the calendar.
 * Primary data structure for calendar UI rendering.
 * Extends react-big-calendar's Event interface for compatibility.
 */
export interface CalendarEvent extends RBCEvent {
  /** Unique identifier for the event (typically assignment ID) */
  id: number

  /** Type of event (extensible for future event types) */
  type: CalendarEventType

  /** Display title for the event (typically assignment name) */
  title: string

  /** Detailed description of the event/assignment */
  description?: string

  /** Timing information for rendering and sorting */
  timing: CalendarEventTiming

  /** Class metadata for filtering and styling */
  classInfo: CalendarEventClassInfo

  /** Assignment-specific metadata */
  assignment: CalendarEventAssignmentInfo

  /** Resource ID for better overlap handling (uses class ID) */
  resourceId?: number
}

/**
 * Simplified class information for filtering and display.
 */
export interface ClassInfo {
  /** Unique class identifier */
  id: number

  /** Class name for display */
  name: string

  /** Generated color for visual identification */
  color: string

  /** Whether the student is enrolled in this class */
  isEnrolled?: boolean

  /** Whether the teacher is teaching this class */
  isTeaching?: boolean
}

/**
 * Represents a date range for querying events.
 */
export interface DateRange {
  /** Start date (inclusive) */
  start: Date

  /** End date (inclusive) */
  end: Date
}

/**
 * Represents active filters on the calendar.
 */
export interface CalendarFilters {
  /** Set of selected class IDs to display */
  classIds: Set<number>

  /** Whether to show events before today */
  showPastEvents: boolean
}
