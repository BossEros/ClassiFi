import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ClipboardList,
  GraduationCap,
  AlarmClock,
  RefreshCw,
  Check,
  X,
} from "lucide-react"
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
import { useZodForm } from "@/presentation/hooks/shared/useZodForm"
import {
  teacherClassFormSchema,
  type TeacherClassFormValues,
} from "@/presentation/schemas/class/classSchemas"
import {
  normalizeClassDescriptionForCreate,
  normalizeClassDescriptionForUpdate,
} from "@/shared/utils/classDescriptionUtils"
import { getFieldErrorMessage } from "@/presentation/utils/formErrorMap"
import type { DayOfWeek } from "@/data/api/class.types"
import { dashboardTheme } from "@/presentation/constants/dashboardTheme"

function getDefaultClassFormValues(): TeacherClassFormValues {
  return {
    className: "",
    description: "",
    classCode: "",
    semester: 1,
    academicYear: getCurrentAcademicYear(),
    schedule: {
      days: [],
      startTime: "08:00",
      endTime: "09:30",
    },
  }
}

const classScheduleTimeOptions: SelectOption[] = TIME_OPTIONS.map(
  (timeValue) => ({
    value: timeValue,
    label: formatTimeDisplay(timeValue),
  }),
)

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
          semester: classData.semester as 1 | 2,
          academicYear: classData.academicYear,
          schedule: classData.schedule,
        })
      } catch {
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

  const topBar = useTopBar({
    user: currentUser,
    userInitials,
    breadcrumbItems: [
      { label: "Classes", to: "/dashboard/classes" },
      { label: isEditMode ? "Edit Class" : "Create New Class" },
    ],
  })

  const handleValidSubmit = async (formValues: TeacherClassFormValues) => {
    if (!currentUser?.id) {
      setGeneralError("You must be logged in")
      return
    }

    const normalizedCreateDescription = normalizeClassDescriptionForCreate(
      formValues.description,
    )
    const normalizedUpdateDescription = normalizeClassDescriptionForUpdate(
      formValues.description,
    )

    setIsLoading(true)
    setGeneralError(null)

    try {
      if (isEditMode && classId) {
        // Update existing class
        await updateClass(parseInt(classId), {
          teacherId: parseInt(currentUser.id),
          className: formValues.className.trim(),
          description: normalizedUpdateDescription,
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
          description: normalizedCreateDescription,
          classCode: formValues.classCode,

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
  const saveActionLabel = isEditMode ? "Save Changes" : "Create Class"
  const savingActionLabel = isEditMode ? "Saving changes..." : "Creating class..."

  // Show loading state while fetching class data in edit mode
  if (isFetching) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">Loading class data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout topBar={topBar}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="mb-2">
          <h1 className={dashboardTheme.pageTitle}>
            {isEditMode ? "Edit Class" : "Create New Class"}
          </h1>
        </div>
        <p className={dashboardTheme.pageSubtitle}>
          {isEditMode
            ? "Update your class information"
            : "Set up a new class for your students"}
        </p>
        <div className={`${dashboardTheme.divider} mt-4`}></div>
      </div>

      {/* Error Banner */}
      {generalError && (
        <div className={dashboardTheme.errorSurface}>
          <p className="text-sm">{generalError}</p>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit(handleValidSubmit)} aria-busy={isLoading}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-6 h-6 text-teal-700" />
                  <CardTitle className="text-slate-900">Basic Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Class Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="className"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Class Name
                  </label>
                  <Input
                    id="className"
                    type="text"
                    placeholder="e.g., Introduction to Programming"
                    {...classNameField}
                    disabled={isLoading}
                    className={`h-11 border border-slate-400 bg-slate-50 text-slate-800 placeholder:text-slate-500 rounded-xl shadow-sm transition-all duration-200 hover:border-slate-500 focus:ring-teal-500/20 focus:border-teal-600 ${
                      errors.className ? "border-rose-400" : ""
                    }`}
                  />
                  {errors.className && (
                    <p className="text-xs text-rose-600">
                      {errors.className.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Description{" "}
                    <span className="text-xs font-normal text-slate-500">
                      (optional)
                    </span>
                  </label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the class..."
                    {...descriptionField}
                    disabled={isLoading}
                    className={`border border-slate-400 bg-slate-50 text-slate-800 placeholder:text-slate-500 rounded-xl shadow-sm transition-all duration-200 hover:border-slate-500 focus:ring-teal-500/20 focus:border-teal-600 ${
                      errors.description ? "border-rose-400" : ""
                    }`}
                    rows={3}
                  />
                </div>

                {/* Class Code */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Class Code
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      {...classCodeField}
                      value={classCodeValue}
                      placeholder={isEditMode ? "" : "Click Generate"}
                      readOnly
                      className={`h-11 border border-slate-400 bg-slate-100 text-slate-700 placeholder:text-slate-500 rounded-xl shadow-sm transition-all duration-200 hover:border-slate-500 focus:ring-teal-500/20 focus:border-teal-600 ${
                        errors.classCode ? "border-rose-400" : ""
                      } ${isEditMode ? "cursor-not-allowed" : ""}`}
                      disabled={isLoading || isEditMode}
                    />
                    {!isEditMode && (
                      <Button
                        type="button"
                        onClick={handleGenerateCode}
                        variant="secondary"
                        disabled={isGenerating || isLoading}
                        className="w-auto px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 shadow-none hover:shadow-none hover:translate-y-0"
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
                    <p className="text-xs text-rose-600">
                      {errors.classCode.message}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    {isEditMode
                      ? "Class code cannot be changed after creation"
                      : "Students will use this code to join the class"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Card */}
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <AlarmClock className="w-6 h-6 text-emerald-700" />
                  <CardTitle className="text-slate-900">Schedule</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Days */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Days
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
                            ? "bg-teal-600 text-white border-transparent"
                            : "bg-slate-50 text-slate-700 border border-slate-400 hover:bg-white hover:border-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                  {scheduleErrorMessage && (
                    <p className="text-xs text-rose-600">
                      {scheduleErrorMessage}
                    </p>
                  )}
                </div>

                {/* Time */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Time
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
                        className="h-11 py-0 border border-slate-400 rounded-xl shadow-sm transition-all duration-200 hover:border-slate-500 focus:ring-teal-500/20 focus:border-teal-600 bg-slate-50 text-slate-800 [&>option]:bg-white [&>option]:text-slate-700"
                      />
                    </div>
                    <span className="text-slate-500 text-sm">to</span>
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
                        className="h-11 py-0 border border-slate-400 rounded-xl shadow-sm transition-all duration-200 hover:border-slate-500 focus:ring-teal-500/20 focus:border-teal-600 bg-slate-50 text-slate-800 [&>option]:bg-white [&>option]:text-slate-700"
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
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-6 h-6 text-sky-700" />
                  <CardTitle className="text-slate-900">Academic Period</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">

                {/* Semester */}
                <div className="space-y-2">
                  <label
                    htmlFor="semester"
                    className="text-sm font-medium text-slate-700"
                  >
                    Semester
                  </label>
                  <select
                    id="semester"
                    {...semesterField}
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-400 shadow-sm text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  >
                    <option value={1} className="bg-white text-slate-700">
                      1st Semester
                    </option>
                    <option value={2} className="bg-white text-slate-700">
                      2nd Semester
                    </option>
                  </select>
                </div>

                {/* Academic Year */}
                <div className="space-y-2">
                  <label
                    htmlFor="academicYear"
                    className="text-sm font-medium text-slate-700"
                  >
                    Academic Year
                  </label>
                  <Input
                    id="academicYear"
                    type="text"
                    placeholder="e.g., 2024-2025"
                    {...academicYearField}
                    disabled={isLoading}
                    className={`h-11 border border-slate-400 bg-slate-50 text-slate-800 placeholder:text-slate-500 rounded-xl shadow-sm transition-all duration-200 hover:border-slate-500 focus:ring-teal-500/20 focus:border-teal-600 ${
                      errors.academicYear ? "border-rose-400" : ""
                    }`}
                  />
                  {errors.academicYear && (
                    <p className="text-xs text-rose-600">
                      {errors.academicYear.message}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    Format: YYYY-YYYY (e.g., 2024-2025)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons Card */}
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardContent className="p-6 space-y-3">
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isLoading}
                  className="w-full rounded-md bg-teal-600 hover:bg-teal-500 text-white border border-teal-600 shadow-none hover:shadow-none hover:translate-y-0"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? savingActionLabel : saveActionLabel}
                </Button>
                <Button
                  type="button"
                  onClick={() => navigate(-1)}
                  variant="secondary"
                  disabled={isLoading}
                  className="w-full rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 shadow-none hover:shadow-none hover:translate-y-0"
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



