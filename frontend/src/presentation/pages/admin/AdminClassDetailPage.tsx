import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Users, Calendar, Clock, BookOpen, Search, Trash2, UserPlus, Mail, CheckCircle, XCircle, FileText, RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout";
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar";
import { Avatar } from "@/presentation/components/ui/Avatar";
import { useToastStore } from "@/shared/store/useToastStore";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { getAdminClassDetailData, removeStudentFromClass, type AdminClass, type EnrolledStudent, type ClassAssignment } from "@/business/services/adminService";
import { X, Loader2 } from "lucide-react";
import { getAllUsers, addStudentToClass } from "@/business/services/adminService";
import type { AdminUser } from "@/business/services/adminService";

// Inlined from src/presentation/components/admin/AdminAddStudentModal.tsx
interface AdminAddStudentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  classId: number
  existingStudents: EnrolledStudent[]
}



function AdminAddStudentModal({
  isOpen,
  onClose,
  onSuccess,
  classId,
  existingStudents,
}: AdminAddStudentModalProps) {
  const showToast = useToastStore((state) => state.showToast)
  const [searchQuery, setSearchQuery] = useState("")
  const [students, setStudents] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState<number | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("")
      setStudents([])
      return
    }

    const fetchStudents = async () => {
      try {
        setIsLoading(true)
        const response = await getAllUsers({
          role: "student",
          search: debouncedSearch || undefined,
          limit: 10,
          status: "active",
        })

        // Filter out already enrolled students
        const enrolledIds = new Set(existingStudents.map((s) => s.id))
        const availableStudents = response.data.filter(
          (s) => !enrolledIds.has(s.id),
        )

        setStudents(availableStudents)
      } catch (error) {
        console.error("Failed to fetch students:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudents()
  }, [isOpen, debouncedSearch, existingStudents])

  const handleAddStudent = async (student: AdminUser) => {
    try {
      setIsSubmitting(student.id)
      await addStudentToClass(classId, student.id)
      showToast(
        `Successfully enrolled ${student.firstName} ${student.lastName}`,
        "success",
      )
      onSuccess() // Refresh parent
      // Remove from local list
      setStudents((prev) => prev.filter((s) => s.id !== student.id))
    } catch (error) {
      console.error("Failed to enroll student:", error)
      showToast("Failed to enroll student", "error")
    } finally {
      setIsSubmitting(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] grid place-items-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg min-w-[320px] mx-auto bg-[#0B1120] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">Enroll Student</h2>
            <p className="text-sm text-gray-400">Add a student to this class</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10 bg-slate-900/50 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Loading available students...</p>
            </div>
          ) : students.length > 0 ? (
            <div className="space-y-1">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={student.avatarUrl ?? undefined}
                      fallback={`${student.firstName[0]}${student.lastName[0]}`}
                      className="w-10 h-10 border border-white/10"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {student.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddStudent(student)}
                    disabled={isSubmitting === student.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 text-xs font-medium hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group-hover:shadow-[0_0_10px_rgba(59,130,246,0.2)] shrink-0"
                  >
                    {isSubmitting === student.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    Enroll
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
                <Search className="w-6 h-6 opacity-40" />
              </div>
              <p className="text-sm font-medium">No students found</p>
              <p className="text-xs text-gray-600">Try adjusting your search</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-900/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminClassDetailPage() {
  const navigate = useNavigate()
  const { classId } = useParams<{ classId: string }>()
  const showToast = useToastStore((state) => state.showToast)
  const currentUser = useAuthStore((state) => state.user)
  const parsedClassId = classId ? Number.parseInt(classId, 10) : null

  const [classInfo, setClassInfo] = useState<AdminClass | null>(null)
  const [students, setStudents] = useState<EnrolledStudent[]>([])
  const [assignments, setAssignments] = useState<ClassAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"students" | "assignments">(
    "students",
  )
  const [searchQuery, setSearchQuery] = useState("")

  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [studentToRemove, setStudentToRemove] =
    useState<EnrolledStudent | null>(null)

  const fetchClassData = useCallback(async () => {
    if (parsedClassId === null || Number.isNaN(parsedClassId)) {
      setError("Class not found")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const data = await getAdminClassDetailData(parsedClassId)
      setClassInfo(data.classInfo)
      setStudents(data.students)
      setAssignments(data.assignments)
    } catch (requestError) {
      console.error("Failed to fetch class details:", requestError)
      setError("Failed to load class details")
    } finally {
      setIsLoading(false)
    }
  }, [parsedClassId])

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
      return
    }

    if (currentUser.role !== "admin") {
      navigate("/dashboard")
      return
    }

    void fetchClassData()
  }, [currentUser, navigate, fetchClassData])

  const handleRemoveStudent = async (studentId: number) => {
    if (parsedClassId === null || Number.isNaN(parsedClassId)) {
      return
    }

    try {
      setActionLoading(studentId)
      await removeStudentFromClass(parsedClassId, studentId)
      setStudents((previousStudents) =>
        previousStudents.filter((student) => student.id !== studentId),
      )
      showToast("Student removed from class", "success")
      setStudentToRemove(null)
    } catch (requestError) {
      console.error("Failed to remove student:", requestError)
      showToast("Failed to remove student", "error")
    } finally {
      setActionLoading(null)
    }
  }

  const filteredStudents = students.filter(
    (student) =>
      student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const userInitials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({
    user: currentUser,
    userInitials,
    breadcrumbItems: [
      { label: "Classes", to: "/dashboard/classes" },
      { label: classInfo?.className || "Class Overview" },
    ],
  })

  const classTeacherInitials = classInfo?.teacherName
    ? classInfo.teacherName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((namePart) => namePart[0])
        .join("")
        .toUpperCase()
    : "CL"

  const semesterLabel =
    classInfo?.semester === 1 ? "1st Semester" : "2nd Semester"

  if (isLoading) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-slate-500">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-teal-500" />
            <p className="text-sm font-medium">Loading class details...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !classInfo) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-md shadow-slate-200/80">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-500">
              <XCircle className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              Error Loading Class
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {error || "Class not found"}
            </p>
            <button
              onClick={fetchClassData}
              className="mt-6 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout topBar={topBar}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-300 bg-white p-6 shadow-md shadow-slate-200/80">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {classInfo.isActive ? (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-xl border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                    Archived
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                  {classInfo.className}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Review enrolled students and assignment activity for this class.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={undefined}
                    fallback={classTeacherInitials}
                    size="sm"
                    className="ring-2 ring-transparent"
                  />
                  <span className="font-medium text-slate-700">
                    {classInfo.teacherName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-sky-600" />
                  <span>
                    {semesterLabel} • A.Y. {classInfo.academicYear}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-teal-600" />
                  <span>{students.length} Students Enrolled</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAddStudentModal(true)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
            >
              <UserPlus className="h-4 w-4" />
              Enroll Student
            </button>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-300 bg-white p-1 shadow-sm shadow-slate-200/70">
          <button
            onClick={() => setActiveTab("students")}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === "students"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Users className="h-4 w-4" />
            Students
            <span
              className={`rounded-md px-1.5 py-0.5 text-xs ${
                activeTab === "students"
                  ? "bg-white/15 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {students.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === "assignments"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Assignments
            <span
              className={`rounded-md px-1.5 py-0.5 text-xs ${
                activeTab === "assignments"
                  ? "bg-white/15 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {assignments.length}
            </span>
          </button>
        </div>

        <div className="space-y-4">
          {activeTab === "students" ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="w-full rounded-xl border border-slate-400 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-md shadow-slate-200/70 transition-all hover:border-slate-500 hover:bg-white focus:border-transparent focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-md shadow-slate-200/80">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-300 bg-slate-200/85">
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                          Student
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                          Email
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                          Enrolled On
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300/70">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <tr
                            key={student.id}
                            className="group transition-colors duration-200 hover:bg-slate-50"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar
                                  src={student.avatarUrl ?? undefined}
                                  fallback={`${student.firstName[0]}${student.lastName[0]}`}
                                  size="sm"
                                  className="ring-2 ring-transparent transition-all group-hover:ring-teal-100"
                                />
                                <span className="text-sm font-medium text-slate-900 transition-colors group-hover:text-teal-700">
                                  {student.firstName} {student.lastName}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                <span>{student.email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                <span>{new Date(student.enrolledAt).toLocaleDateString()}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {studentToRemove?.id === student.id ? (
                                <div className="flex items-center justify-end gap-2">
                                  <span className="mr-2 text-xs font-medium text-rose-600">
                                    Confirm removal?
                                  </span>
                                  <button
                                    onClick={() => handleRemoveStudent(student.id)}
                                    className="inline-flex cursor-pointer items-center rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setStudentToRemove(null)}
                                    className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setStudentToRemove(student)}
                                  disabled={actionLoading === student.id}
                                  className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-transparent p-2 text-slate-400 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                                  title="Remove student"
                                >
                                  {actionLoading === student.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-14 text-center text-slate-500"
                          >
                            <div className="flex flex-col items-center gap-3">
                              <div className="rounded-full bg-slate-100 p-4">
                                <Search className="h-8 w-8 opacity-40" />
                              </div>
                              <p className="text-lg font-medium text-slate-700">
                                No students found
                              </p>
                              <p className="text-sm">
                                No students match the current search.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {assignments.length > 0 ? (
                assignments.map((assignment) => {
                  const isPastDue = assignment.deadline
                    ? new Date(assignment.deadline) < new Date()
                    : false

                  return (
                    <div
                      key={assignment.id}
                      className="rounded-3xl border border-slate-300 bg-white p-5 shadow-sm shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/80"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <FileText className="h-6 w-6 shrink-0 text-sky-600" />
                        {assignment.deadline ? (
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                              isPastDue
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {isPastDue ? "Past Due" : "Active"}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="line-clamp-1 text-base font-semibold text-slate-900">
                        {assignment.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 min-h-[2.75rem] text-sm leading-6 text-slate-500">
                        {assignment.instructions}
                      </p>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-teal-600" />
                          <span>{assignment.submissionCount} submissions</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-sky-600" />
                          <span>
                            {assignment.deadline
                              ? new Date(assignment.deadline).toLocaleDateString()
                              : "No Deadline"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-slate-500 shadow-sm shadow-slate-200/70">
                  <BookOpen className="mx-auto mb-4 h-10 w-10 text-slate-300" />
                  <p className="text-lg font-medium text-slate-700">
                    No assignments yet
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Assignments created for this class will appear here.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <AdminAddStudentModal
          isOpen={showAddStudentModal}
          onClose={() => setShowAddStudentModal(false)}
          onSuccess={fetchClassData}
          classId={parsedClassId ?? 0}
          existingStudents={students}
        />
      </div>
    </DashboardLayout>
  )
}
