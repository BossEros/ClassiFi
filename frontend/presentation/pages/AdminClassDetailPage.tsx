import { useEffect, useState, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  BookOpen,
  Search,
  Trash2,
  UserPlus,
  Mail,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react"
import { DashboardLayout } from "@/presentation/components/dashboard/DashboardLayout"
import { Avatar } from "@/presentation/components/ui/Avatar"
import { useToast } from "@/shared/context/ToastContext"
import {
  getAdminClassDetailData,
  removeStudentFromClass,
  type AdminClass,
  type EnrolledStudent,
  type ClassAssignment,
} from "@/business/services/adminService"
import { AdminAddStudentModal } from "@/presentation/components/admin/AdminAddStudentModal"

export function AdminClassDetailPage() {
  const navigate = useNavigate()
  const { classId } = useParams<{ classId: string }>()
  const { showToast } = useToast()

  const [classInfo, setClassInfo] = useState<AdminClass | null>(null)
  const [students, setStudents] = useState<EnrolledStudent[]>([])
  const [assignments, setAssignments] = useState<ClassAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"students" | "coursework">(
    "students",
  )
  const [searchQuery, setSearchQuery] = useState("")

  // Action states
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [studentToRemove, setStudentToRemove] =
    useState<EnrolledStudent | null>(null)

  const fetchClassData = useCallback(async () => {
    if (!classId) return

    try {
      setIsLoading(true)
      setError(null)
      const data = await getAdminClassDetailData(parseInt(classId))
      setClassInfo(data.classInfo)
      setStudents(data.students)
      setAssignments(data.assignments)
    } catch (err) {
      console.error("Failed to fetch class details:", err)
      setError("Failed to load class details")
    } finally {
      setIsLoading(false)
    }
  }, [classId])

  useEffect(() => {
    fetchClassData()
  }, [fetchClassData])

  const handleRemoveStudent = async (studentId: number) => {
    if (!classId) return
    try {
      setActionLoading(studentId)
      await removeStudentFromClass(parseInt(classId), studentId)
      setStudents((prev) => prev.filter((s) => s.id !== studentId))
      showToast("Student removed from class", "success")
      setStudentToRemove(null)
    } catch (err) {
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-gray-400 font-medium">
              Loading class details...
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !classInfo) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="p-4 rounded-full bg-red-500/10 text-red-400">
            <XCircle className="w-8 h-8" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">
              Error Loading Class
            </h2>
            <p className="text-gray-400">{error || "Class not found"}</p>
          </div>
          <button
            onClick={() => navigate("/dashboard/classes")}
            className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
          >
            Go Back to Classes
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          <button
            onClick={() => navigate("/dashboard/classes")}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-fit group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Classes
          </button>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/50 border border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium uppercase tracking-wider">
                      {classInfo.classCode}
                    </span>
                    {classInfo.isActive ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-gray-500/10 border border-gray-500/20 text-gray-400 text-xs font-medium uppercase tracking-wider">
                        Archived
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">
                    {classInfo.className}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={undefined}
                      fallback={classInfo.teacherName[0]}
                      className="w-5 h-5 border border-white/10"
                    />
                    <span className="text-gray-300">
                      {classInfo.teacherName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>
                      A.Y. {classInfo.academicYear} •{" "}
                      {classInfo.semester === 1 ? "1st" : "2nd"} Sem
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span>{students.length} Students Enrolled</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowAddStudentModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all font-medium whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                Enroll Student
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/50 border border-white/5 w-fit">
          <button
            onClick={() => setActiveTab("students")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "students"
                ? "bg-white/10 text-white shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Users className="w-4 h-4" />
            Students
            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white/10 text-xs">
              {students.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("coursework")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "coursework"
                ? "bg-white/10 text-white shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Coursework
            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white/10 text-xs">
              {assignments.length}
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Search and Filters (Only for Students tab) */}
          {activeTab === "students" && (
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </div>
          )}

          {/* Students List */}
          {activeTab === "students" && (
            <div className="bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Enrolled On
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="group hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={student.avatarUrl ?? undefined}
                              fallback={`${student.firstName[0]}${student.lastName[0]}`}
                            />
                            <span className="text-sm font-medium text-white">
                              {student.firstName} {student.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Mail className="w-3.5 h-3.5" />
                            {student.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(student.enrolledAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {studentToRemove?.id === student.id ? (
                            <div className="flex items-center justify-end gap-2 animate-in fade-in duration-200">
                              <span className="text-xs text-red-400 mr-2">
                                Confirm removal?
                              </span>
                              <button
                                onClick={() => handleRemoveStudent(student.id)}
                                className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setStudentToRemove(null)}
                                className="px-2 py-1 bg-white/5 text-gray-400 rounded-lg text-xs font-medium hover:bg-white/10"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setStudentToRemove(student)}
                              disabled={actionLoading === student.id}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Remove student"
                            >
                              {actionLoading === student.id ? (
                                <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
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
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <p>No students found matching your search.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Coursework List */}
          {activeTab === "coursework" && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {assignments.length > 0 ? (
                assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="p-4 rounded-xl bg-slate-900/40 border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      {assignment.deadline && (
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                            new Date(assignment.deadline) < new Date()
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {new Date(assignment.deadline) < new Date()
                            ? "Past Due"
                            : "Active"}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-white mb-1 line-clamp-1">
                      {assignment.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">
                      {assignment.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>{assignment.submissionCount} submissions</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {assignment.deadline
                            ? new Date(assignment.deadline).toLocaleDateString()
                            : "No Deadline"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-gray-500 bg-slate-900/20 rounded-xl border border-white/5 border-dashed">
                  <BookOpen className="w-10 h-10 opacity-20 mx-auto mb-3" />
                  <p>No coursework created for this class yet.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <AdminAddStudentModal
          isOpen={showAddStudentModal}
          onClose={() => setShowAddStudentModal(false)}
          onSuccess={fetchClassData}
          classId={parseInt(classId!)}
          existingStudents={students}
        />
      </div>
    </DashboardLayout>
  )
}
