import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ToolbarProps } from "react-big-calendar";

/**
 * Custom toolbar component for React Big Calendar.
 * Provides month navigation controls styled to match ClassiFi's design system.
 *
 * @param onNavigate - Navigation callback from React Big Calendar
 * @param label - Formatted month/year label
 * @returns JSX element representing the calendar toolbar
 */
export function CustomToolbar({ onNavigate, label }: ToolbarProps) {
    const handlePrevious = () => {
        onNavigate("PREV");
    };

    const handleNext = () => {
        onNavigate("NEXT");
    };

    const handleToday = () => {
        onNavigate("TODAY");
    };

    return (
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/95 backdrop-blur-xl border-b border-white/10">
            <div className="flex items-center gap-2">
                <button
                    onClick={handlePrevious}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
                    aria-label="Previous month"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                    onClick={handleNext}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
                    aria-label="Next month"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            <h2 className="text-xl font-semibold text-white">{label}</h2>

            <button
                onClick={handleToday}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-medium"
            >
                Today
            </button>
        </div>
    );
}
