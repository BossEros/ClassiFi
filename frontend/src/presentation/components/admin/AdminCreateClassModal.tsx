import { useState, useEffect } from "react"
import {
  X,
  BookOpen,
  Calendar,
  Clock,
  Loader2,
  Plus,
  ChevronDown,
  AlertCircle,
} from "lucide-react"
import type { FieldErrors } from "react-hook-form"
import * as adminService from "@/business/services/adminService"
import type { AdminUser, AdminClass } from "@/business/services/adminService"
import {
  DAY_ABBREVIATIONS,
  convertToDayOfWeek,
  convertToAbbreviations,
} from "@/presentation/constants/schedule.constants"
import { useZodForm } from "@/presentation/hooks/shared/useZodForm"
import {
  adminClassFormSchema,
  type AdminClassFormValues,
} from "@/presentation/schemas/class/classSchemas"

interface AdminCreateClassModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  teachers: AdminUser[]
  classToEdit?: AdminClass | null
}

interface AdminClassModalFormData {
  className: string
  description: string
  teacherId: string
  yearLevel: 1 | 2 | 3 | 4
  semester: 1 | 2
  academicYear: string
  scheduleDays: string[]
  startTime: string
  endTime: string
}

function getDefaultFormData(): AdminClassModalFormData {
  return {
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
  }
}

function getFirstErrorMessage(errorNode: unknown): string | null {
  if (!errorNode || typeof errorNode !== "object") {
    return null
  }

  const maybeMessage = (errorNode as { message?: unknown }).message

  if (typeof maybeMessage === "string") {
    return maybeMessage
  }

  for (const nestedValue of Object.values(errorNode)) {
    const nestedMessage = getFirstErrorMessage(nestedValue)

    if (nestedMessage) {
      return nestedMessage
    }
  }

  return null
}

export function AdminCreateClassModal({
  isOpen,
  onClose,
  onSuccess,
  teachers,
  classToEdit,
}: AdminCreateClassModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
  } = useZodForm({
    schema: adminClassFormSchema,
    defaultValues: getDefaultFormData(),
    mode: "onSubmit",
  })

  const classNameField = register("className")
  const descriptionField = register("description")
  const teacherIdField = register("teacherId")
  const yearLevelField = register("yearLevel", { valueAsNumber: true })
  const semesterField = register("semester", { valueAsNumber: true })
  const academicYearField = register("academicYear")
  const startTimeField = register("startTime")
  const endTimeField = register("endTime")

  const scheduleDaysValue = watch("scheduleDays")
  const classNameValue = watch("className")
  const descriptionValue = watch("description")
  const teacherIdValue = watch("teacherId")
  const yearLevelValue = watch("yearLevel")
  const semesterValue = watch("semester")
  const academicYearValue = watch("academicYear")
  const startTimeValue = watch("startTime")
  const endTimeValue = watch("endTime")

  // Reset or populate form when modal opens
  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (classToEdit) {
      reset({
        className: classToEdit.className,
        description: classToEdit.description || "",
        teacherId: classToEdit.teacherId.toString(),
        yearLevel: classToEdit.yearLevel as 1 | 2 | 3 | 4,
        semester: classToEdit.semester as 1 | 2,
        academicYear: classToEdit.academicYear,
        scheduleDays: convertToAbbreviations(classToEdit.schedule.days),
        startTime: classToEdit.schedule.startTime,
        endTime: classToEdit.schedule.endTime,
      })
    } else {
      reset(getDefaultFormData())
    }

    setError(null)
  }, [isOpen, classToEdit, reset])

  const toggleDay = (day: string) => {
    const updatedScheduleDays = scheduleDaysValue.includes(day)
      ? scheduleDaysValue.filter((scheduleDay) => scheduleDay !== day)
      : [...scheduleDaysValue, day]

    const sortedScheduleDays = updatedScheduleDays.sort(
      (firstDay, secondDay) =>
        DAY_ABBREVIATIONS.indexOf(firstDay) -
        DAY_ABBREVIATIONS.indexOf(secondDay),
    )

    setValue("scheduleDays", sortedScheduleDays, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  const handleValidSubmit = async (formValues: AdminClassFormValues) => {
    try {
      setIsLoading(true)
      setError(null)

      const commonClassData = {
        className: formValues.className,
        description: formValues.description,
        teacherId: Number(formValues.teacherId),
        yearLevel: Number(formValues.yearLevel),
        semester: Number(formValues.semester),
        academicYear: formValues.academicYear,
        schedule: {
          days: convertToDayOfWeek(formValues.scheduleDays),
          startTime: formValues.startTime,
          endTime: formValues.endTime,
        },
      }

      if (classToEdit) {
        await adminService.updateClass(classToEdit.id, commonClassData)
      } else {
        await adminService.createClass(commonClassData)
      }

      onSuccess()
      onClose()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : `Failed to ${classToEdit ? "update" : "create"} class`,
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleInvalidSubmit = (
    validationErrors: FieldErrors<AdminClassFormValues>,
  ) => {
    const firstErrorMessage = getFirstErrorMessage(validationErrors)

    if (firstErrorMessage) {
      setError(firstErrorMessage)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl min-w-[600px] transform overflow-hidden rounded-2xl bg-slate-900/95 p-6 text-left shadow-2xl transition-all border border-white/10 backdrop-blur-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
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

        <form
          onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
          className="space-y-6"
          noValidate
        >
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
                  {...classNameField}
                  value={classNameValue}
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
                    {...teacherIdField}
                    value={teacherIdValue}
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
                  {...descriptionField}
                  value={descriptionValue}
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
              <Calendar className="w-4 h-4 text-teal-400" />
              Academic Info
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 ml-1">
                  Year Level
                </label>
                <div className="relative">
                  <select
                    {...yearLevelField}
                    value={yearLevelValue}
                    className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/50 focus:border-transparent transition-all appearance-none cursor-pointer pr-10"
                  >
                    {[1, 2, 3, 4].map((yearLevelOption) => (
                      <option
                        key={yearLevelOption}
                        value={yearLevelOption}
                        className="bg-slate-900"
                      >
                        Year {yearLevelOption}
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
                    {...semesterField}
                    value={semesterValue}
                    className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent transition-all appearance-none cursor-pointer pr-10"
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
                  {...academicYearField}
                  value={academicYearValue}
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent transition-all"
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
                {DAY_ABBREVIATIONS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      scheduleDaysValue.includes(day)
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
                  {...startTimeField}
                  value={startTimeValue}
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
                  {...endTimeField}
                  value={endTimeValue}
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
              className="flex-1 px-4 py-3 rounded-xl bg-teal-600 text-white hover:bg-teal-700 border border-teal-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{classToEdit ? "Update Class" : "Create Class"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
