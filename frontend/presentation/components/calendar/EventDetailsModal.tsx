import { useEffect } from "react";
import { X, Calendar, Clock, BookOpen, CheckCircle, Users, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { CalendarEvent } from "@/business/models/calendar/types";
import { getCurrentUser } from "@/business/services/authService";
import { formatCalendarDate } from "@/business/services/calendarService";

interface EventDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: CalendarEvent | null;
}

/**
 * EventDetailsModal Component
 * 
 * Displays detailed information about a calendar event (assignment).
 * Shows role-specific information for students and teachers.
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
    const navigate = useNavigate();
    const currentUser = getCurrentUser();

    // Close modal on Escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen || !event) return null;

    const isStudent = currentUser?.role === "student";
    const isTeacher = currentUser?.role === "teacher";

    /**
     * Formats the deadline date and time for display.
     */
    const formattedDeadline = formatCalendarDate(event.deadline);

    /**
     * Gets the status badge for student view.
     */
    const getStatusBadge = () => {
        if (!event.status) return null;

        const statusConfig = {
            "not-started": {
                label: "Not Started",
                bgColor: "bg-slate-500/20",
                textColor: "text-slate-400",
                icon: Clock,
            },
            pending: {
                label: "Pending Review",
                bgColor: "bg-yellow-500/20",
                textColor: "text-yellow-400",
                icon: Clock,
            },
            submitted: {
                label: "Submitted",
                bgColor: "bg-green-500/20",
                textColor: "text-green-400",
                icon: CheckCircle,
            },
            late: {
                label: "Late Submission",
                bgColor: "bg-red-500/20",
                textColor: "text-red-400",
                icon: Clock,
            },
        };

        const config = statusConfig[event.status];
        const Icon = config.icon;

        return (
            <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgColor} border border-white/10`}
            >
                <Icon className={`w-4 h-4 ${config.textColor}`} />
                <span className={`text-sm font-medium ${config.textColor}`}>
                    {config.label}
                </span>
            </div>
        );
    };

    /**
     * Handles navigation to the assignment page.
     */
    const handleNavigateToAssignment = () => {
        if (isStudent) {
            navigate(`/assignments/${event.id}`);
        } else if (isTeacher) {
            navigate(`/assignments/${event.id}/submissions`);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-slate-900/95 backdrop-blur-xl shadow-2xl transition-all border border-white/10 ring-1 ring-white/5 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start justify-between px-6 py-5 border-b border-white/5">
                    <div className="flex-1 pr-4">
                        <h3 className="text-xl font-semibold text-white tracking-tight mb-2">
                            {event.title}
                        </h3>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: event.classColor }}
                            />
                            <span className="text-sm text-gray-400">
                                {event.className}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-5 space-y-5">
                    {/* Deadline */}
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-white/5">
                            <Calendar className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                Deadline
                            </p>
                            <p className="text-sm text-white font-medium">
                                {formattedDeadline}
                            </p>
                        </div>
                    </div>

                    {/* Description */}
                    {event.description && (
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-white/5">
                                <BookOpen className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Description
                                </p>
                                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {event.description}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Student-specific information */}
                    {isStudent && (
                        <>
                            {/* Submission Status */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-white/5">
                                    <CheckCircle className="w-5 h-5 text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                        Status
                                    </p>
                                    {getStatusBadge()}
                                </div>
                            </div>

                            {/* Grade */}
                            {event.grade !== undefined && event.grade !== null && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-white/5">
                                        <CheckCircle className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                            Grade
                                        </p>
                                        <p className="text-2xl font-bold text-white">
                                            {event.grade}
                                            <span className="text-sm text-gray-400 font-normal ml-1">
                                                / 100
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Teacher-specific information */}
                    {isTeacher && (
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-white/5">
                                <Users className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Submissions
                                </p>
                                <p className="text-2xl font-bold text-white">
                                    {event.submittedCount ?? 0}
                                    <span className="text-sm text-gray-400 font-normal mx-1">
                                        /
                                    </span>
                                    <span className="text-lg text-gray-400 font-semibold">
                                        {event.totalStudents ?? 0}
                                    </span>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {event.submittedCount === event.totalStudents
                                        ? "All students have submitted"
                                        : `${(event.totalStudents ?? 0) - (event.submittedCount ?? 0)} student${(event.totalStudents ?? 0) - (event.submittedCount ?? 0) === 1 ? "" : "s"} pending`}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02]">
                    <button
                        onClick={handleNavigateToAssignment}
                        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:from-teal-700 hover:to-teal-600 shadow-lg shadow-teal-500/25 transition-all font-semibold text-sm flex items-center justify-center gap-2 group active:scale-[0.98]"
                    >
                        <span>
                            {isStudent ? "View Assignment" : "View Submissions"}
                        </span>
                        <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}
