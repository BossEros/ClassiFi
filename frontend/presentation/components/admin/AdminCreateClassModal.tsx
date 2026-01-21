import { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Calendar,
  Clock,
  Loader2,
  Plus,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import * as adminService from "@/business/services/adminService";
import type { AdminUser } from "@/business/services/adminService";
import type { DayOfWeek } from "@/data/api/types";
import {
  validateClassName,
  validateAcademicYear,
  validateSchedule,
} from "@/business/validation/classValidation";

/** Maps abbreviated day names to full DayOfWeek values */
const DAY_ABBREVIATION_MAP: Record<string, DayOfWeek> = {
  Mon: "monday",
  Tue: "tuesday",
  Wed: "wednesday",
  Thu: "thursday",
  Fri: "friday",
  Sat: "saturday",
  Sun: "sunday",
};

/** Convert abbreviated day strings to DayOfWeek[] */
function convertToDayOfWeek(abbreviatedDays: string[]): DayOfWeek[] {
  return abbreviatedDays
    .map((day) => DAY_ABBREVIATION_MAP[day])
    .filter((day): day is DayOfWeek => day !== undefined);
}

export interface ClassToEdit {
  id: number;
  className: string;
  description?: string;
  teacherId: number;
  yearLevel: number;
  semester: number;
  academicYear: string;
  schedule: {
    days: string[];
    startTime: string;
    endTime: string;
  };
}

interface AdminCreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teachers: AdminUser[];
  classToEdit?: ClassToEdit | null;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function AdminCreateClassModal({
  isOpen,
  onClose,
  onSuccess,
  teachers,
  classToEdit,
}: AdminCreateClassModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    className: "",
    description: "",
    teacherId: "",
    yearLevel: 1,
    semester: 1,
    academicYear:
      new Date().getFullYear().toString() +
      "-" +
      (new Date().getFullYear() + 1).toString(),
    scheduleDays: [] as string[],
    startTime: "08:00",
    endTime: "09:30",
  });

  // Reset or Populate form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (classToEdit) {
        setFormData({
          className: classToEdit.className,
          description: classToEdit.description || "",
          teacherId: classToEdit.teacherId.toString(),
          yearLevel: classToEdit.yearLevel,
          semester: classToEdit.semester,
          academicYear: classToEdit.academicYear,
          scheduleDays: classToEdit.schedule.days,
          startTime: classToEdit.schedule.startTime,
          endTime: classToEdit.schedule.endTime,
        });
      } else {
        setFormData({
          className: "",
          description: "",
          teacherId: "",
          yearLevel: 1,
          semester: 1,
          academicYear:
            new Date().getFullYear().toString() +
            "-" +
            (new Date().getFullYear() + 1).toString(),
          scheduleDays: [],
          startTime: "08:00",
          endTime: "09:30",
        });
      }
      setError(null);
    }
  }, [isOpen, classToEdit]);

  const toggleDay = (day: string) => {
    setFormData((prev) => {
      const days = prev.scheduleDays.includes(day)
        ? prev.scheduleDays.filter((d) => d !== day)
        : [...prev.scheduleDays, day];

      // Sort days based on standard week order
      return {
        ...prev,
        scheduleDays: days.sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b)),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate teacher selection
    if (!formData.teacherId) {
      setError("Please select a teacher");
      return;
    }

    // Use centralized validators
    const classNameError = validateClassName(formData.className);
    if (classNameError) {
      setError(classNameError);
      return;
    }

    // Validate schedule using centralized validator
    const scheduleError = validateSchedule({
      days: convertToDayOfWeek(formData.scheduleDays),
      startTime: formData.startTime,
      endTime: formData.endTime,
    });
    if (scheduleError) {
      setError(scheduleError);
      return;
    }

    // Validate time (end must be after start)
    if (formData.startTime >= formData.endTime) {
      setError("End time must be after start time");
      return;
    }

    // Use centralized academic year validation
    const academicYearError = validateAcademicYear(formData.academicYear);
    if (academicYearError) {
      setError(academicYearError);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const commonData = {
        className: formData.className,
        description: formData.description,
        teacherId: Number(formData.teacherId),
        yearLevel: Number(formData.yearLevel),
        semester: Number(formData.semester),
        academicYear: formData.academicYear,
        schedule: {
          days: convertToDayOfWeek(formData.scheduleDays),
          startTime: formData.startTime,
          endTime: formData.endTime,
        },
      };

      if (classToEdit) {
        await adminService.updateClass(classToEdit.id, commonData);
      } else {
        await adminService.createClass(commonData);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${classToEdit ? "update" : "create"} class`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-slate-900/95 p-6 text-left shadow-2xl transition-all border border-white/10 backdrop-blur-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {classToEdit ? "Edit Class" : "Create Class"}
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {classToEdit
                ? "Update existing class details"
                : "Add a new class to the academic roster"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              Class Details
              {!classToEdit && (
                <span className="text-[10px] normal-case font-normal text-gray-500 ml-auto bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                  Class Code auto-generated
                </span>
              )}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 ml-1">
                  Class Name
                </label>
                <input
                  type="text"
                  value={formData.className}
                  onChange={(e) =>
                    setFormData({ ...formData, className: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  placeholder="e.g. Introduction to Computer Science"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 ml-1">
                  Teacher
                </label>
                <div className="relative">
                  <select
                    value={formData.teacherId}
                    onChange={(e) =>
                      setFormData({ ...formData, teacherId: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all appearance-none cursor-pointer pr-10"
                    required
                  >
                    <option value="" className="bg-slate-900">
                      Select a teacher...
                    </option>
                    {teachers.map((teacher) => (
                      <option
                        key={teacher.id}
                        value={teacher.id}
                        className="bg-slate-900"
                      >
                        {teacher.firstName} {teacher.lastName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div className="col-span-full space-y-1.5">
                <label className="text-xs font-medium text-gray-400 ml-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all min-h-[80px] resize-none"
                  placeholder="Brief description of the class..."
                />
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-white/5" />

          {/* Academic Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              Academic Info
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 ml-1">
                  Year Level
                </label>
                <div className="relative">
                  <select
                    value={formData.yearLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        yearLevel: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all appearance-none cursor-pointer pr-10"
                  >
                    {[1, 2, 3, 4].map((y) => (
                      <option key={y} value={y} className="bg-slate-900">
                        Year {y}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 ml-1">
                  Semester
                </label>
                <div className="relative">
                  <select
                    value={formData.semester}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        semester: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all appearance-none cursor-pointer pr-10"
                  >
                    <option value={1} className="bg-slate-900">
                      1st Semester
                    </option>
                    <option value={2} className="bg-slate-900">
                      2nd Semester
                    </option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 ml-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={formData.academicYear}
                  onChange={(e) =>
                    setFormData({ ...formData, academicYear: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                  placeholder="e.g. 2023-2024"
                  required
                />
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-white/5" />

          {/* Schedule */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-400" />
              Schedule
            </h4>

            <div className="space-y-3">
              <label className="text-xs font-medium text-gray-400 ml-1">
                Class Days
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      formData.scheduleDays.includes(day)
                        ? "bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                        : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 ml-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all [color-scheme:dark]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 ml-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all [color-scheme:dark]"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>{classToEdit ? "Update Class" : "Create Class"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
