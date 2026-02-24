import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { BookOpen, Calendar, Clock, RefreshCw, Check, X } from "lucide-react"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/Card"
import { useAuthStore } from "@/shared/store/useAuthStore"
import {
  createClass,
  generateClassCode,
  getClassById,
  updateClass,
} from "@/business/services/classService"
import { Input } from "@/presentation/components/ui/Input"
import { Textarea } from "@/presentation/components/ui/Textarea"
import { Button } from "@/presentation/components/ui/Button"
import { Select, type SelectOption } from "@/presentation/components/ui/Select"
import { useToastStore } from "@/shared/store/useToastStore"
import { DAYS, TIME_OPTIONS } from "@/presentation/constants/schedule.constants"
import { formatTimeDisplay } from "@/presentation/utils/timeUtils"
import { getCurrentAcademicYear } from "@/presentation/utils/dateUtils"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import { BackButton } from "@/presentation/components/ui/BackButton"
import { useZodForm } from "@/presentation/hooks/shared/useZodForm"
import {
  teacherClassFormSchema,
  type TeacherClassFormValues,
} from "@/presentation/schemas/class/classSchemas"
import { getFieldErrorMessage } from "@/presentation/utils/formErrorMap"
import type { DayOfWeek } from "@/business/models/dashboard/types"

function getDefaultClassFormValues(): TeacherClassFormValues {
  return {
    className: "",
    description: "",
    classCode: "",
    yearLevel: 1,
    semester: 1,
    academicYear: getCurrentAcademicYear(),
    schedule: {
      days: [],
      startTime: "08:00",
      endTime: "09:30",
    },
  }
}

const classScheduleTimeOptions: SelectOption[] = TIME_OPTIONS.map((timeValue) => ({
  value: timeValue,
  label: formatTimeDisplay(timeValue),
}))

export function ClassFormPage() {
  const navigate = useNavigate()
  const { classId } = useParams<{ classId: string }>()
  const showToast = useToastStore((state) => state.showToast)
  const currentUser = useAuthStore((state) => state.user)

  // Determine if we're in edit mode
  const isEditMode = !!classId

  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(isEditMode)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    clearErrors,
    formState: { errors },
  } = useZodForm({
    schema: teacherClassFormSchema,
    defaultValues: getDefaultClassFormValues(),
    mode: "onSubmit",
  })

  const classNameField = register("className")
  const descriptionField = register("description")
  const classCodeField = register("classCode")
  const yearLevelField = register("yearLevel", { valueAsNumber: true })
  const semesterField = register("semester", { valueAsNumber: true })
  const academicYearField = register("academicYear")

  const scheduleDays = watch("schedule.days")
  const scheduleStartTime = watch("schedule.startTime")
  const scheduleEndTime = watch("schedule.endTime")
  const classCodeValue = watch("classCode")

  // Fetch existing class data when in edit mode
  useEffect(() => {
    if (!isEditMode || !classId) {
      return
    }

    if (!currentUser) return

    const fetchClassData = async () => {
      setIsFetching(true)
      try {
        const classData = await getClassById(
          parseInt(classId),
          parseInt(currentUser.id),
        )

        reset({
          className: classData.className,
          description: classData.description || "",
          classCode: classData.classCode,
          yearLevel: classData.yearLevel as 1 | 2 | 3 | 4,
          semester: classData.semester as 1 | 2,
          academicYear: classData.academicYear,
          schedule: classData.schedule,
        })
      } catch (error) {
        console.error("Error loading class data:", error)
        setGeneralError("Failed to load class data. Please try again.")
      } finally {
        setIsFetching(false)
      }
    }

    fetchClassData()
  }, [classId, currentUser, isEditMode, reset])

  const handleGenerateCode = async () => {
    setIsGenerating(true)
    try {
      const code = await generateClassCode()
      setValue("classCode", code, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
      clearErrors("classCode")
    } catch {
      setValue("classCode", "", {
        shouldValidate: true,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleDay = (day: DayOfWeek) => {
    const updatedDays = scheduleDays.includes(day)
      ? scheduleDays.filter((selectedDay) => selectedDay !== day)
      : [...scheduleDays, day]

    setValue("schedule.days", updatedDays, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  const handleScheduleTimeChange = (
    fieldName: "schedule.startTime" | "schedule.endTime",
    fieldValue: string,
  ) => {
    setValue(fieldName, fieldValue, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    clearErrors(fieldName)
  }

  const userInitials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user: currentUser, userInitials })

  const handleValidSubmit = async (formValues: TeacherClassFormValues) => {
    if (!currentUser?.id) {
      setGeneralError("You must be logged in")
      return
    }

    setIsLoading(true)
    setGeneralError(null)

    try {
      if (isEditMode && classId) {
        // Update existing class
        await updateClass(parseInt(classId), {
          teacherId: parseInt(currentUser.id),
          className: formValues.className.trim(),
          description: formValues.description.trim() || undefined,
          yearLevel: formValues.yearLevel,
          semester: formValues.semester,
          academicYear: formValues.academicYear,
          schedule: formValues.schedule,
        })
        showToast("Class updated successfully")
        navigate(`/dashboard/classes/${classId}`)
      } else {
        // Create new class
        await createClass({
          teacherId: parseInt(currentUser.id),
          className: formValues.className.trim(),
          description: formValues.description.trim() || undefined,
          classCode: formValues.classCode,
          yearLevel: formValues.yearLevel,
          semester: formValues.semester,
          academicYear: formValues.academicYear,
          schedule: formValues.schedule,
        })
        showToast("Class created successfully")
        navigate("/dashboard/classes")
      }
    } catch {
      setGeneralError(
        `Failed to ${isEditMode ? "update" : "create"} class. Please try again.`,
      )
    } finally {
      setIsLoading(false)
    }
  }

  const scheduleErrorMessage =
    getFieldErrorMessage(errors, "schedule.days") ||
    getFieldErrorMessage(errors, "schedule.startTime") ||
    getFieldErrorMessage(errors, "schedule.endTime") ||
    getFieldErrorMessage(errors, "schedule")

  // Show loading state while fetching class data in edit mode
  if (isFetching) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading class data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout topBar={topBar}>
      {/* Page Header */}
      <div className="mb-8">
        <BackButton />
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isEditMode ? "Edit Class" : "Create New Class"}
          </h1>
        </div>
        <p className="text-slate-300 text-sm">
          {isEditMode
            ? "Update your class information"
            : "Set up a new class for your students"}
        </p>
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mt-4"></div>
      </div>

      {/* Error Banner */}
      {generalError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{generalError}</p>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit(handleValidSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-500/20">
                    <BookOpen className="w-5 h-5 text-teal-300" />
                  </div>
                  <CardTitle>Basic Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Class Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="className"
                    className="block text-sm font-medium text-gray-200"
                  >
                    Class Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    id="className"
                    type="text"
                    placeholder="e.g., Introduction to Programming"
                    {...classNameField}
                    disabled={isLoading}
                    className={`h-11 bg-[#1A2130] border-white/10 text-white placeholder:text-gray-500 rounded-xl transition-all duration-200 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-blue-500/20 focus:border-blue-500/50 ${
                      errors.className ? "border-red-500/50" : ""
                    }`}
                  />
                  {errors.className && (
                    <p className="text-xs text-red-400">
                      {errors.className.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-200"
                  >
                    Description
                  </label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the class..."
                    {...descriptionField}
                    disabled={isLoading}
                    className={`h-11 bg-[#1A2130] border-white/10 text-white placeholder:text-gray-500 rounded-xl transition-all duration-200 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-blue-500/20 focus:border-blue-500/50 ${
                      errors.description ? "border-red-500/50" : ""
                    }`}
                    rows={3}
                  />
                </div>

                {/* Class Code */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-200">
                    Class Code <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      {...classCodeField}
                      value={classCodeValue}
                      placeholder={isEditMode ? "" : "Click Generate"}
                      readOnly
                      className={`h-11 bg-[#1A2130] border-white/10 text-white placeholder:text-gray-500 rounded-xl transition-all duration-200 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-blue-500/20 focus:border-blue-500/50 ${
                        errors.classCode ? "border-red-500/50" : ""
                      } ${isEditMode ? "cursor-not-allowed" : ""}`}
                      disabled={isLoading || isEditMode}
                    />
                    {!isEditMode && (
                      <Button
                        type="button"
                        onClick={handleGenerateCode}
                        variant="secondary"
                        disabled={isGenerating || isLoading}
                        className="w-auto px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 hover:border-slate-500 shadow-none hover:shadow-none hover:translate-y-0"
                      >
                        {isGenerating ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          "Generate"
                        )}
                      </Button>
                    )}
                  </div>
                  {errors.classCode && (
                    <p className="text-xs text-red-400">
                      {errors.classCode.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {isEditMode
                      ? "Class code cannot be changed after creation"
                      : "Students will use this code to join the class"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Clock className="w-5 h-5 text-green-300" />
                  </div>
                  <CardTitle>Schedule</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Days */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-200">
                    Days <span className="text-red-400">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        disabled={isLoading}
                        title={day.label}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          scheduleDays.includes(day.value)
                            ? "bg-teal-500 text-white border-transparent" 
                            : "bg-[#1A2130] text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                  {scheduleErrorMessage && (
                    <p className="text-xs text-red-400">
                      {scheduleErrorMessage}
                    </p>
                  )}
                </div>

                {/* Time */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-200">
                    Time <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Select
                        id="scheduleStartTime"
                        options={classScheduleTimeOptions}
                        value={scheduleStartTime}
                        onChange={(selectedValue) =>
                          handleScheduleTimeChange(
                            "schedule.startTime",
                            selectedValue,
                          )
                        }
                        disabled={isLoading}
                        className="h-11 py-0 bg-[#1A2130] border-white/10 rounded-xl transition-all duration-200 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-blue-500/20 focus:border-blue-500/50 text-white"
                      />
                    </div>
                    <span className="text-gray-400 text-sm">to</span>
                    <div className="flex-1">
                      <Select
                        id="scheduleEndTime"
                        options={classScheduleTimeOptions}
                        value={scheduleEndTime}
                        onChange={(selectedValue) =>
                          handleScheduleTimeChange(
                            "schedule.endTime",
                            selectedValue,
                          )
                        }
                        disabled={isLoading}
                        className="h-11 py-0 bg-[#1A2130] border-white/10 rounded-xl transition-all duration-200 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-blue-500/20 focus:border-blue-500/50 text-white"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Academic Period & Actions */}
          <div className="space-y-6">
            {/* Academic Period Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Calendar className="w-5 h-5 text-blue-300" />
                  </div>
                  <CardTitle>Academic Period</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Year Level */}
                <div className="space-y-2">
                  <label
                    htmlFor="yearLevel"
                    className="text-sm font-medium text-gray-200"
                  >
                    Year Level <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="yearLevel"
                    {...yearLevelField}
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#1A2130] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/50 focus:border-teal-600/50"
                  >
                    <option value={1} className="bg-slate-800 text-white">
                      1st Year
                    </option>
                    <option value={2} className="bg-slate-800 text-white">
                      2nd Year
                    </option>
                    <option value={3} className="bg-slate-800 text-white">
                      3rd Year
                    </option>
                    <option value={4} className="bg-slate-800 text-white">
                      4th Year
                    </option>
                  </select>
                </div>

                {/* Semester */}
                <div className="space-y-2">
                  <label
                    htmlFor="semester"
                    className="text-sm font-medium text-gray-200"
                  >
                    Semester <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="semester"
                    {...semesterField}
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#1A2130] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/50 focus:border-teal-600/50"
                  >
                    <option value={1} className="bg-slate-800 text-white">
                      1st Semester
                    </option>
                    <option value={2} className="bg-slate-800 text-white">
                      2nd Semester
                    </option>
                  </select>
                </div>

                {/* Academic Year */}
                <div className="space-y-2">
                  <label
                    htmlFor="academicYear"
                    className="text-sm font-medium text-gray-200"
                  >
                    Academic Year <span className="text-red-400">*</span>
                  </label>
                  <Input
                    id="academicYear"
                    type="text"
                    placeholder="e.g., 2024-2025"
                    {...academicYearField}
                    disabled={isLoading}
                    className={`h-11 bg-[#1A2130] border-white/10 text-white placeholder:text-gray-500 rounded-xl transition-all duration-200 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-blue-500/20 focus:border-blue-500/50 ${
                      errors.academicYear ? "border-red-500/50" : ""
                    }`}
                  />
                  {errors.academicYear && (
                    <p className="text-xs text-red-400">
                      {errors.academicYear.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Format: YYYY-YYYY (e.g., 2024-2025)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons Card */}
            <Card>
              <CardContent className="p-6 space-y-3">
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isLoading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white border border-teal-500/40 shadow-none hover:shadow-none hover:translate-y-0"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {isEditMode ? "Save Changes" : "Create Class"}
                </Button>
                <Button
                  type="button"
                  onClick={() => navigate(-1)}
                  variant="secondary"
                  disabled={isLoading}
                  className="w-full bg-transparent hover:bg-white/5 text-slate-300 hover:text-white border border-white/15 shadow-none hover:shadow-none hover:translate-y-0"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </DashboardLayout>
  )
}

// Export with both names for backwards compatibility
export { ClassFormPage as CreateClassPage }
export default ClassFormPage
