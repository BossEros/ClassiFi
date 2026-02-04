import { Filter, Check } from "lucide-react";
import type { ClassInfo } from "@/business/models/calendar/types";
import { useState } from "react";

export interface CalendarFiltersProps {
    /** Available classes to filter by */
    classes: ClassInfo[];
    /** Currently selected class IDs */
    selectedClasses: Set<number>;
    /** Callback when filter changes */
    onFilterChange: (classId: number, checked: boolean) => void;
    /** Callback to select all classes */
    onSelectAll: () => void;
    /** Callback to deselect all classes */
    onDeselectAll: () => void;
}

/**
 * CalendarFilters Component
 * 
 * Renders class filter controls for the calendar.
 * Displays checkboxes for each class with color indicators.
 * Provides "Select All" and "Deselect All" buttons.
 * Responsive layout: dropdown on mobile, list on desktop.
 * 
 * @param classes - Available classes to filter by
 * @param selectedClasses - Currently selected class IDs
 * @param onFilterChange - Callback when filter changes
 * @param onSelectAll - Callback to select all classes
 * @param onDeselectAll - Callback to deselect all classes
 * @returns JSX element representing the calendar filters
 */
export function CalendarFilters({
    classes,
    selectedClasses,
    onFilterChange,
    onSelectAll,
    onDeselectAll,
}: CalendarFiltersProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleCheckboxChange = (classId: number, checked: boolean) => {
        onFilterChange(classId, checked);
    };

    const handleSelectAll = () => {
        onSelectAll();
    };

    const handleDeselectAll = () => {
        onDeselectAll();
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const selectedCount = selectedClasses.size;
    const totalCount = classes.length;

    // Render filter content (used in both mobile dropdown and desktop list)
    const renderFilterContent = () => (
        <>
            {/* Action Buttons */}
            <div className="flex gap-2 mb-3 pb-3 border-b border-white/10">
                <button
                    onClick={handleSelectAll}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    aria-label="Select all classes"
                >
                    Select All
                </button>
                <button
                    onClick={handleDeselectAll}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    aria-label="Deselect all classes"
                >
                    Deselect All
                </button>
            </div>

            {/* Class Checkboxes */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {classes.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                        No classes available
                    </p>
                ) : (
                    classes.map((classInfo) => {
                        const isChecked = selectedClasses.has(classInfo.id);

                        return (
                            <label
                                key={classInfo.id}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group"
                            >
                                {/* Custom Checkbox */}
                                <div className="relative flex-shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) =>
                                            handleCheckboxChange(
                                                classInfo.id,
                                                e.target.checked
                                            )
                                        }
                                        className="sr-only"
                                        aria-label={`Filter by ${classInfo.name}`}
                                    />
                                    <div
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isChecked
                                                ? "bg-blue-600 border-blue-600"
                                                : "bg-transparent border-gray-500 group-hover:border-gray-400"
                                            }`}
                                    >
                                        {isChecked && (
                                            <Check className="w-3.5 h-3.5 text-white" />
                                        )}
                                    </div>
                                </div>

                                {/* Color Indicator */}
                                <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: classInfo.color }}
                                    aria-hidden="true"
                                />

                                {/* Class Name */}
                                <span className="text-sm text-white flex-1 truncate">
                                    {classInfo.name}
                                </span>
                            </label>
                        );
                    })
                )}
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Dropdown (visible on small screens) */}
            <div className="md:hidden">
                <button
                    onClick={toggleDropdown}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                    aria-expanded={isDropdownOpen}
                    aria-label="Toggle class filters"
                >
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-white font-medium">
                            Filter by Class
                        </span>
                    </div>
                    <span className="text-xs text-gray-400">
                        {selectedCount === 0
                            ? "All"
                            : `${selectedCount}/${totalCount}`}
                    </span>
                </button>

                {isDropdownOpen && (
                    <div className="mt-2 p-4 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl">
                        {renderFilterContent()}
                    </div>
                )}
            </div>

            {/* Desktop List (visible on medium+ screens) */}
            <div className="hidden md:block p-4 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <h3 className="text-sm font-semibold text-white">
                        Filter by Class
                    </h3>
                    <span className="ml-auto text-xs text-gray-400">
                        {selectedCount === 0
                            ? "All"
                            : `${selectedCount}/${totalCount}`}
                    </span>
                </div>
                {renderFilterContent()}
            </div>
        </>
    );
}
