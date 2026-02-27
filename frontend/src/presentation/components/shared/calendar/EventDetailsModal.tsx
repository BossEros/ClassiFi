import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import {
  X,
  Calendar,
  CheckCircle,
  Users,
  ExternalLink,
  Clock,
  AlertCircle,
  Bell,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { CalendarEvent } from "@/business/models/calendar/types"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { formatCalendarDate } from "@/business/services/calendarService"
import { sendReminderToNonSubmitters } from "@/business/services/assignmentService"
import { useToastStore } from "@/shared/store/useToastStore"

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
 * Features a clean, professional design.
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
  const currentUser = useAuthStore((state) => state.user)
  const showToast = useToastStore((state) => state.showToast)
  const [isSendingReminder, setIsSendingReminder] = useState(false)

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

  /**
   * Handles sending reminder to students who haven't submitted.
   */
  const handleSendReminder = async () => {
    if (!currentUser || !isTeacher) return

    const teacherId = Number(currentUser.id)

    if (!Number.isFinite(teacherId) || teacherId <= 0) {
      showToast("Invalid teacher ID", "error")
      return
    }

    setIsSendingReminder(true)

    try {
      const result = await sendReminderToNonSubmitters(
        event.assignment.assignmentId,
        teacherId,
      )

      showToast(result.message || "Reminders sent successfully", "success")
    } catch (error) {
      console.error("Error sending reminders:", error)
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send reminders"
      showToast(errorMessage, "error")
    } finally {
      setIsSendingReminder(false)
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig?.icon || Clock

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-lg sm:min-w-96 overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/95 shadow-[0_24px_80px_rgba(2,6,23,0.72)] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Class Badge */}
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-800/80 px-2.5 py-1">
                <div
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full ring-1 ring-white/30"
                  style={{ backgroundColor: classColor }}
                />
                <span className="truncate text-xs font-medium uppercase tracking-wider text-slate-300">
                  {event.classInfo.name}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-white leading-tight">
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
        <div className="mx-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {/* Deadline Card */}
          <div className="flex items-center gap-4 rounded-xl border border-slate-700/70 bg-slate-800/50 p-3.5">
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
            <div className="flex items-center gap-4 rounded-xl border border-slate-700/70 bg-slate-800/50 p-3.5">
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
              <div className="flex items-center gap-4 rounded-xl border border-slate-700/70 bg-slate-800/50 p-3.5">
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
            <div className="flex items-center gap-4 rounded-xl border border-slate-700/70 bg-slate-800/50 p-3.5">
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
        <div className="space-y-3 border-t border-white/5 px-6 pb-6 pt-4">
          {/* Teacher: Send Reminder Button */}
          {isTeacher && (
            <button
              onClick={handleSendReminder}
              disabled={isSendingReminder}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600/70 bg-slate-800 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Bell className="w-4 h-4" />
              <span>
                {isSendingReminder
                  ? "Sending Reminders..."
                  : "Send Reminder to Non-Submitters"}
              </span>
            </button>
          )}

          {/* View Assignment/Submissions Button */}
          <button
            onClick={handleNavigateToAssignment}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/40 bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
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
