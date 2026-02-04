import { CheckCircle, Clock } from "lucide-react";
import type { CalendarEvent } from "@/business/models/calendar/types";

interface CustomEventComponentProps {
    event: CalendarEvent;
    title: string;
}

/**
 * Custom event component for React Big Calendar.
 * Displays assignment information with class color coding and role-specific details.
 *
 * @param event - The calendar event to display
 * @param title - The event title (provided by React Big Calendar)
 * @returns JSX element representing the event
 */
export function CustomEventComponent({
    event,
    title,
}: CustomEventComponentProps) {
    const getStatusIcon = () => {
        if (!event.status) return null;

        switch (event.status) {
            case "submitted":
                return <CheckCircle className="w-3 h-3 text-green-400" />;
            case "pending":
                return <Clock className="w-3 h-3 text-yellow-400" />;
            case "late":
                return <Clock className="w-3 h-3 text-red-400" />;
            case "not-started":
                return <Clock className="w-3 h-3 text-slate-400" />;
            default:
                return null;
        }
    };

    const getSubmissionText = () => {
        if (
            event.submittedCount !== undefined &&
            event.totalStudents !== undefined
        ) {
            return `${event.submittedCount}/${event.totalStudents}`;
        }
        return null;
    };

    return (
        <div
            className="h-full px-1.5 py-0.5 rounded text-xs overflow-hidden"
            style={{
                backgroundColor: event.classColor,
                borderLeft: `3px solid ${event.classColor}`,
            }}
        >
            <div className="flex items-center gap-1">
                {getStatusIcon()}
                <span className="truncate font-medium text-white">{title}</span>
            </div>
            {getSubmissionText() && (
                <div className="text-[10px] text-white/80 mt-0.5">
                    {getSubmissionText()}
                </div>
            )}
        </div>
    );
}
