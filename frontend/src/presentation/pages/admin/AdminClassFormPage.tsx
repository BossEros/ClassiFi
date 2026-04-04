import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ClipboardList,
  GraduationCap,
  Check,
  AlarmClock,
  RefreshCw,
  Search,
  X,
} from "lucide-react"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/Card"
import { Input } from "@/presentation/components/ui/Input"
import { Textarea } from "@/presentation/components/ui/Textarea"
import { Button } from "@/presentation/components/ui/Button"
import { Select, type SelectOption } from "@/presentation/components/ui/Select"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import { useZodForm } from "@/presentation/hooks/shared/useZodForm"
import {
  adminClassPageFormSchema,
  type AdminClassPageFormValues,
} from "@/presentation/schemas/class/classSchemas"
import { getFieldErrorMessage } from "@/presentation/utils/formErrorMap"
import {
  normalizeClassDescriptionForCreate,
  normalizeClassDescriptionForUpdate,
} from "@/shared/utils/classDescriptionUtils"
import { DAYS, TIME_OPTIONS } from "@/presentation/constants/schedule.constants"
import { formatTimeDisplay } from "@/presentation/utils/timeUtils"
import { getCurrentAcademicYear } from "@/presentation/utils/dateUtils"
import * as adminService from "@/business/services/adminService"
import type { AdminUser } from "@/business/services/adminService"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { useToastStore } from "@/shared/store/useToastStore"
import type { DayOfWeek } from "@/business/models/class"
import { dashboardTheme } from "@/presentation/constants/dashboardTheme"

function getDefaultClassFormValues(): AdminClassPageFormValues {
  return {
    className: "",
    description: "",
    teacherId: "",
    semester: 1,
    academicYear: getCurrentAcademicYear(),
    schedule: {
      days: [],
      startTime: "08:00",
      endTime: "09:30",
    },
  }
}

function getTeacherDisplayName(teacher: AdminUser): string {
  return `${teacher.firstName} ${teacher.lastName}`.trim()
}

const classScheduleTimeOptions: SelectOption[] = TIME_OPTIONS.map(
  (timeValue) => ({
    value: timeValue,
    label: formatTimeDisplay(timeValue),
  }),
)

export function AdminClassFormPage() {
  const navigate = useNavigate()
  const { classId } = useParams<{ classId: string }>()
  const currentUser = useAuthStore((state) => state.user)
  const showToast = useToastStore((state) => state.showToast)
  const parsedClassId = classId ? Number.parseInt(classId, 10) : null
  const isEditMode = parsedClassId !== null && !Number.isNaN(parsedClassId)
  const [teachers, setTeachers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingTeachers, setIsFetchingTeachers] = useState(true)
  const [isFetchingClass, setIsFetchingClass] = useState(isEditMode)
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("")
  const [isTeacherSearchOpen, setIsTeacherSearchOpen] = useState(false)
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
    schema: adminClassPageFormSchema,
    defaultValues: getDefaultClassFormValues(),
    mode: "onSubmit",
  })

  const classNameField = register("className")
  const descriptionField = register("description")
  const teacherIdField = register("teacherId")
  const semesterField = register("semester", { valueAsNumber: true })
  const academicYearField = register("academicYear")

  const scheduleDays = watch("schedule.days")
  const scheduleStartTime = watch("schedule.startTime")
  const scheduleEndTime = watch("schedule.endTime")
  const teacherIdValue = watch("teacherId")

  useEffect(() => {
    const fetchFormData = async () => {
      if (!currentUser) {
        navigate("/login")
        return
      }

      if (currentUser.role !== "admin") {
        navigate("/dashboard")
        return
      }

      setIsFetchingTeachers(true)
      setIsFetchingClass(isEditMode)
      try {
        const [teacherAccounts, classData] = await Promise.all([
          adminService.getAllTeachers(),
          isEditMode && parsedClassId !== null
            ? adminService.getClassById(parsedClassId)
            : Promise.resolve(null),
        ])
        setTeachers(teacherAccounts)

        if (classData) {
          reset({
            className: classData.className,
            description: classData.description ?? "",
            teacherId: classData.teacherId.toString(),
            semester: classData.semester as 1 | 2,
            academicYear: classData.academicYear,
            schedule: classData.schedule,
          })

          const assignedTeacher = teacherAccounts.find(
            (teacher) => teacher.id === classData.teacherId,
          )
          setTeacherSearchQuery(
            assignedTeacher ? getTeacherDisplayName(assignedTeacher) : "",
          )
          setIsTeacherSearchOpen(false)
        } else {
          setTeacherSearchQuery("")
          setIsTeacherSearchOpen(false)
        }
      } catch {
        setGeneralError(
          "Failed to load class form data. Please try refreshing.",
        )
      } finally {
        setIsFetchingTeachers(false)
        setIsFetchingClass(false)
      }
    }

    fetchFormData()
  }, [currentUser, navigate, isEditMode, parsedClassId, reset])

  const activeTeachers = useMemo(
    () => teachers.filter((teacher) => teacher.isActive),
    [teachers],
  )

  const filteredTeachers = useMemo(() => {
    const searchTerm = teacherSearchQuery.trim().toLowerCase()
    const sortedTeachers = [...activeTeachers].sort((teacherA, teacherB) =>
      getTeacherDisplayName(teacherA).localeCompare(
        getTeacherDisplayName(teacherB),
      ),
    )

    if (!searchTerm) {
      return []
    }

    return sortedTeachers
      .filter((teacher) => {
        const teacherName = getTeacherDisplayName(teacher).toLowerCase()
        const teacherEmail = teacher.email.toLowerCase()
        const teacherId = teacher.id.toString()

        return (
          teacherName.includes(searchTerm) ||
          teacherEmail.includes(searchTerm) ||
          teacherId.includes(searchTerm)
        )
      })
      .slice(0, 8)
  }, [activeTeachers, teacherSearchQuery])

  const hasTeacherSearchQuery = teacherSearchQuery.trim().length > 0

  const selectedTeacherDetails = useMemo(() => {
    return activeTeachers.find((t) => t.id.toString() === teacherIdValue)
  }, [activeTeachers, teacherIdValue])

  const handleTeacherSelect = (teacher: AdminUser) => {
    setValue("teacherId", teacher.id.toString(), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    clearErrors("teacherId")
    setTeacherSearchQuery(getTeacherDisplayName(teacher))
    setIsTeacherSearchOpen(false)
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

  const handleValidSubmit = async (formValues: AdminClassPageFormValues) => {
    if (!currentUser?.id || currentUser.role !== "admin") {
      setGeneralError("You must be logged in as an admin.")
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
      const sharedClassPayload = {
        teacherId: Number(formValues.teacherId),
        className: formValues.className.trim(),
        semester: formValues.semester,
        academicYear: formValues.academicYear,
        schedule: formValues.schedule,
      }

      if (isEditMode && parsedClassId !== null) {
        await adminService.updateClass(parsedClassId, {
          ...sharedClassPayload,
          description: normalizedUpdateDescription,
        })
        showToast("Class updated successfully", "success")
        navigate(`/dashboard/classes/${parsedClassId}`)
      } else {
        await adminService.createClass({
          ...sharedClassPayload,
          description: normalizedCreateDescription,
        })
        showToast("Class created successfully", "success")
        navigate("/dashboard/classes")
      }
    } catch (error) {
      setGeneralError(
        error instanceof Error
          ? error.message
          : `Failed to ${isEditMode ? "update" : "create"} class. Please try again.`,
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
  const saveActionLabel = isEditMode ? "Save Changes" : "Create Class"
  const savingActionLabel = isEditMode ? "Saving changes..." : "Creating class..."

  if (isEditMode && (isFetchingClass || isFetchingTeachers)) {
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
      <div className="mb-8">
        <div className="mb-2">
          <h1 className={dashboardTheme.pageTitle}>
            {isEditMode ? "Edit Class" : "Create New Class"}
          </h1>
        </div>
        <p className={dashboardTheme.pageSubtitle}>
          {isEditMode
            ? "Update class details and teacher assignment"
            : "Set up a new class and assign a teacher"}
        </p>
        <div className={`${dashboardTheme.divider} mt-4`}></div>
      </div>

      {generalError && (
        <div className={dashboardTheme.errorSurface}>
          <p className="text-sm">{generalError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(handleValidSubmit)} aria-busy={isLoading}>
        <input type="hidden" {...teacherIdField} value={teacherIdValue} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6 flex flex-col">
            <Card className="relative z-50 border-slate-300 bg-white shadow-md shadow-slate-200/80">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-6 h-6 text-teal-700" />
                  <CardTitle className="text-slate-900">Basic Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
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
                  {errors.description && (
                    <p className="text-xs text-rose-600">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="teacherSearch"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Assigned Teacher
                  </label>

                  {selectedTeacherDetails ? (
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-teal-50 to-teal-50/60 border border-teal-200 rounded-xl transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-medium shadow-sm shadow-teal-200">
                          {selectedTeacherDetails.firstName[0].toUpperCase()}
                          {selectedTeacherDetails.lastName[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                            {getTeacherDisplayName(selectedTeacherDetails)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {selectedTeacherDetails.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          setValue("teacherId", "", {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          })
                          setTeacherSearchQuery("")
                          setIsTeacherSearchOpen(true)
                          setTimeout(() => {
                            document.getElementById("teacherSearch")?.focus()
                          }, 0)
                        }}
                        className="h-8 px-3 text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400"
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="relative z-50">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                      <Input
                        id="teacherSearch"
                        type="text"
                        placeholder="Search by name, email, or user ID to assign..."
                        value={teacherSearchQuery}
                        onChange={(event) => {
                          const nextSearchValue = event.target.value
                          setTeacherSearchQuery(nextSearchValue)
                          setIsTeacherSearchOpen(true)

                          if (teacherIdValue) {
                            setValue("teacherId", "", {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            })
                          }
                        }}
                        onFocus={() => setIsTeacherSearchOpen(true)}
                        onBlur={() =>
                          setTimeout(() => setIsTeacherSearchOpen(false), 200)
                        }
                        disabled={isLoading || isFetchingTeachers}
                        className={`pl-10 h-11 border border-slate-400 bg-slate-50 text-slate-800 placeholder:text-slate-500 rounded-xl shadow-sm transition-all duration-200 hover:border-slate-500 focus:ring-teal-500/20 focus:border-teal-600 ${
                          errors.teacherId ? "border-rose-400" : ""
                        }`}
                        autoComplete="off"
                      />

                      {!selectedTeacherDetails &&
                        isTeacherSearchOpen &&
                        hasTeacherSearchQuery && (
                          <div className="absolute z-50 top-full left-0 right-0 mt-2 rounded-xl border border-slate-200 bg-white shadow-xl max-h-60 overflow-y-auto">
                            {isFetchingTeachers ? (
                              <div className="p-4 text-sm text-slate-500 flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                                Loading teachers...
                              </div>
                            ) : filteredTeachers.length === 0 ? (
                              <div className="p-6 text-center">
                                <p className="text-sm text-slate-700 font-medium mb-1">
                                  No teachers found
                                </p>
                                <p className="text-xs text-slate-500">
                                  We couldn't find anyone matching "
                                  {teacherSearchQuery}"
                                </p>
                              </div>
                            ) : (
                              <div className="p-1.5">
                                {filteredTeachers.map((teacher) => {
                                  const initials =
                                    `${teacher.firstName[0]}${teacher.lastName[0]}`.toUpperCase()
                                  return (
                                    <button
                                      key={teacher.id}
                                      type="button"
                                      onClick={() =>
                                        handleTeacherSelect(teacher)
                                      }
                                      className="w-full p-2.5 flex items-center gap-3 text-left rounded-lg transition-colors hover:bg-slate-50 group"
                                    >
                                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-medium group-hover:bg-teal-100 group-hover:text-teal-700 transition-colors">
                                        {initials}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-slate-800 truncate group-hover:text-teal-700 transition-colors">
                                          {getTeacherDisplayName(teacher)}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                          {teacher.email}
                                        </p>
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  )}

                  {errors.teacherId ? (
                    <p className="text-xs text-rose-600">
                      {errors.teacherId.message}
                    </p>
                  ) : (
                    !selectedTeacherDetails && (
                      <p className="text-xs text-slate-500 mt-1">
                        Search and select a teacher who will manage this class.
                      </p>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="relative z-0 border-slate-300 bg-white shadow-md shadow-slate-200/80">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <AlarmClock className="w-6 h-6 text-emerald-700" />
                  <CardTitle className="text-slate-900">Schedule</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
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

          <div className="space-y-6">
            <Card className="border-slate-300 bg-white shadow-md shadow-slate-200/80">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-6 h-6 text-sky-700" />
                  <CardTitle className="text-slate-900">Academic Period</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">

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

            <Card className="border-slate-300 bg-white shadow-md shadow-slate-200/80">
              <CardContent className="p-6 space-y-3">
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isLoading || isFetchingTeachers || isFetchingClass}
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
                  onClick={() => navigate("/dashboard/classes")}
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

export default AdminClassFormPage


