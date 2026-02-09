import { useEffect } from "react"
import { createPortal } from "react-dom"
import {
  X,
  Calendar,
  CheckCircle,
  Users,
  ExternalLink,
  Clock,
  AlertCircle,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { CalendarEvent } from "@/business/models/calendar/types"
import { getCurrentUser } from "@/business/services/authService"
import { formatCalendarDate } from "@/business/services/calendarService"

export interface EventDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  event: CalendarEvent | null
}

/**
 * EventDetailsModal Component
 *
 * Displays detailed information about a calendar event (assignment).
 * Shows role-specific information for students and teachers.
 * Features a clean, professional design with colored header accent.
 *
 * @param isOpen - Whether the modal is visible
 * @param onClose - Callback to close the modal
 * @param event - The calendar event to display details for
 */
export function EventDetailsModal({
  isOpen,
  onClose,
  event,
}: EventDetailsModalProps) {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen || !event) return null

  const isStudent = currentUser?.role === "student"
  const isTeacher = currentUser?.role === "teacher"
  const classColor = event.classInfo.color || "#3b82f6"

  /**
   * Formats the deadline date and time for display.
   */
  const formattedDeadline = formatCalendarDate(event.timing.start)

  /**
   * Gets the status configuration for student view.
   */
  const getStatusConfig = () => {
    if (!event.assignment.status) return null

    const statusConfig = {
      "not-started": {
        label: "Not Started",
        bgColor: "bg-slate-500/15",
        textColor: "text-slate-300",
        icon: Clock,
      },
      pending: {
        label: "Pending Review",
        bgColor: "bg-amber-500/15",
        textColor: "text-amber-300",
        icon: Clock,
      },
      submitted: {
        label: "Submitted",
        bgColor: "bg-emerald-500/15",
        textColor: "text-emerald-300",
        icon: CheckCircle,
      },
      late: {
        label: "Late Submission",
        bgColor: "bg-rose-500/15",
        textColor: "text-rose-300",
        icon: AlertCircle,
      },
    }

    return statusConfig[event.assignment.status]
  }

  /**
   * Handles navigation to the assignment page.
   */
  const handleNavigateToAssignment = () => {
    if (isStudent) {
      navigate(`/dashboard/assignments/${event.assignment.assignmentId}`)
    } else if (isTeacher) {
      navigate(
        `/dashboard/assignments/${event.assignment.assignmentId}/submissions`,
      )
    }

    onClose()
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig?.icon || Clock

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md min-w-[400px] overflow-hidden rounded-2xl bg-slate-900 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200">
        {/* Colored Header Bar */}
        <div className="h-1.5" style={{ backgroundColor: classColor }} />

        {/* Header */}
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Class Badge */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: classColor }}
                />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider truncate">
                  {event.classInfo.name}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-white leading-tight">
                {event.title}
              </h3>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/5 mx-6" />

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {/* Deadline Card */}
          <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-800/50 border border-white/5">
            <div
              className="p-2.5 rounded-lg"
              style={{ backgroundColor: `${classColor}20` }}
            >
              <Calendar className="w-5 h-5" style={{ color: classColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">
                Deadline
              </p>
              <p className="text-sm font-medium text-white">
                {formattedDeadline}
              </p>
            </div>
          </div>

          {/* Student-specific: Status */}
          {isStudent && statusConfig && (
            <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-800/50 border border-white/5">
              <div className={`p-2.5 rounded-lg ${statusConfig.bgColor}`}>
                <StatusIcon className={`w-5 h-5 ${statusConfig.textColor}`} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">
                  Status
                </p>
                <p className={`text-sm font-medium ${statusConfig.textColor}`}>
                  {statusConfig.label}
                </p>
              </div>
            </div>
          )}

          {/* Student-specific: Grade */}
          {isStudent &&
            event.assignment.grade !== undefined &&
            event.assignment.grade !== null && (
              <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-800/50 border border-white/5">
                <div className="p-2.5 rounded-lg bg-emerald-500/15">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">
                    Grade
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-white">
                      {event.assignment.grade}
                    </span>
                    <span className="text-sm text-slate-500">/ 100</span>
                  </div>
                </div>
              </div>
            )}

          {/* Teacher-specific: Submissions */}
          {isTeacher && (
            <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-800/50 border border-white/5">
              <div className="p-2.5 rounded-lg bg-blue-500/15">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">
                  Submissions
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-white">
                    {event.assignment.submittedCount ?? 0}
                  </span>
                  <span className="text-sm text-slate-500">/</span>
                  <span className="text-base font-semibold text-slate-400">
                    {event.assignment.totalStudents ?? 0}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">students</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2">
          <button
            onClick={handleNavigateToAssignment}
            className="w-full px-4 py-3 rounded-xl font-medium text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:brightness-110"
            style={{
              backgroundColor: classColor,
              boxShadow: `0 4px 14px ${classColor}40`,
            }}
          >
            <span>{isStudent ? "View Assignment" : "View Submissions"}</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
