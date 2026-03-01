import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  BookOpen,
  Calendar,
  Check,
  Clock,
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
import { BackButton } from "@/presentation/components/ui/BackButton"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import { useZodForm } from "@/presentation/hooks/shared/useZodForm"
import {
  adminClassPageFormSchema,
  type AdminClassPageFormValues,
} from "@/presentation/schemas/class/classSchemas"
import { getFieldErrorMessage } from "@/presentation/utils/formErrorMap"
import { DAYS, TIME_OPTIONS } from "@/presentation/constants/schedule.constants"
import { formatTimeDisplay } from "@/presentation/utils/timeUtils"
import { getCurrentAcademicYear } from "@/presentation/utils/dateUtils"
import * as adminService from "@/business/services/adminService"
import type { AdminUser } from "@/business/services/adminService"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { useToastStore } from "@/shared/store/useToastStore"
import type { DayOfWeek } from "@/business/models/dashboard/types"

function getDefaultClassFormValues(): AdminClassPageFormValues {
  return {
    className: "",
    description: "",
    teacherId: "",
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
  const yearLevelField = register("yearLevel", { valueAsNumber: true })
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
            yearLevel: classData.yearLevel as 1 | 2 | 3 | 4,
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
      } catch (error) {
        console.error("Failed to load teachers:", error)
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

    setIsLoading(true)
    setGeneralError(null)

    try {
      const classPayload = {
        teacherId: Number(formValues.teacherId),
        className: formValues.className.trim(),
        description: formValues.description.trim() || undefined,
        yearLevel: formValues.yearLevel,
        semester: formValues.semester,
        academicYear: formValues.academicYear,
        schedule: formValues.schedule,
      }

      if (isEditMode && parsedClassId !== null) {
        await adminService.updateClass(parsedClassId, classPayload)
        showToast("Class updated successfully", "success")
        navigate(`/dashboard/classes/${parsedClassId}`)
      } else {
        await adminService.createClass(classPayload)
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

  const topBar = useTopBar({ user: currentUser, userInitials })

  if (isEditMode && (isFetchingClass || isFetchingTeachers)) {
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
      <div className="mb-8">
        <BackButton to="/dashboard/classes" />
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isEditMode ? "Edit Class" : "Create New Class"}
          </h1>
        </div>
        <p className="text-slate-300 text-sm">
          {isEditMode
            ? "Update class details and teacher assignment"
            : "Set up a new class and assign a teacher"}
        </p>
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mt-4"></div>
      </div>

      {generalError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{generalError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(handleValidSubmit)}>
        <input type="hidden" {...teacherIdField} value={teacherIdValue} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6 flex flex-col">
            <Card className="relative z-50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-500/20">
                    <BookOpen className="w-5 h-5 text-teal-300" />
                  </div>
                  <CardTitle>Basic Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
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
                  {errors.description && (
                    <p className="text-xs text-red-400">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="teacherSearch"
                    className="block text-sm font-medium text-gray-200"
                  >
                    Assigned Teacher <span className="text-red-400">*</span>
                  </label>

                  {selectedTeacherDetails ? (
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-teal-500/10 to-teal-500/5 border border-teal-500/20 rounded-xl transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-sm font-medium shadow-sm shadow-teal-500/10">
                          {selectedTeacherDetails.firstName[0].toUpperCase()}
                          {selectedTeacherDetails.lastName[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white flex items-center gap-2">
                            {getTeacherDisplayName(selectedTeacherDetails)}
                          </p>
                          <p className="text-xs text-teal-200/70">
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
                        className="h-8 px-3 text-xs bg-[#1A2130] hover:bg-white/10 text-gray-300 hover:text-white border-white/10"
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="relative z-50">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
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
                        className={`pl-10 h-11 bg-[#1A2130] border-white/10 text-white placeholder:text-gray-500 rounded-xl transition-all duration-200 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-teal-500/20 focus:border-teal-500/50 ${
                          errors.teacherId ? "border-red-500/50" : ""
                        }`}
                        autoComplete="off"
                      />

                      {!selectedTeacherDetails &&
                        isTeacherSearchOpen &&
                        hasTeacherSearchQuery && (
                          <div className="absolute z-50 top-full left-0 right-0 mt-2 rounded-xl border border-white/10 bg-[#1A2130] shadow-xl shadow-black/80 max-h-60 overflow-y-auto">
                            {isFetchingTeachers ? (
                              <div className="p-4 text-sm text-gray-400 flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin text-teal-500" />
                                Loading teachers...
                              </div>
                            ) : filteredTeachers.length === 0 ? (
                              <div className="p-6 text-center">
                                <p className="text-sm text-gray-300 font-medium mb-1">
                                  No teachers found
                                </p>
                                <p className="text-xs text-gray-500">
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
                                      className="w-full p-2.5 flex items-center gap-3 text-left rounded-lg transition-colors hover:bg-white/5 group"
                                    >
                                      <div className="w-8 h-8 rounded-full bg-slate-800 text-gray-300 flex items-center justify-center text-xs font-medium group-hover:bg-teal-500/20 group-hover:text-teal-300 transition-colors">
                                        {initials}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-white truncate group-hover:text-teal-100 transition-colors">
                                          {getTeacherDisplayName(teacher)}
                                        </p>
                                        <p className="text-xs text-gray-400/80 truncate">
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
                    <p className="text-xs text-red-400">
                      {errors.teacherId.message}
                    </p>
                  ) : (
                    !selectedTeacherDetails && (
                      <p className="text-xs text-gray-500 mt-1">
                        Search and select a teacher who will manage this class.
                      </p>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="relative z-0">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Clock className="w-5 h-5 text-green-300" />
                  </div>
                  <CardTitle>Schedule</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
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

          <div className="space-y-6">
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

            <Card>
              <CardContent className="p-6 space-y-3">
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isLoading || isFetchingTeachers || isFetchingClass}
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
                  onClick={() => navigate("/dashboard/classes")}
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

export default AdminClassFormPage
