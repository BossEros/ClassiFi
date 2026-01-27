import { useState, useEffect } from "react"
import { X, Search, UserPlus, Loader2 } from "lucide-react"
import {
  getAllUsers,
  addStudentToClass,
} from "@/business/services/adminService"
import { useToast } from "@/shared/context/ToastContext"
import { Avatar } from "@/presentation/components/ui/Avatar"
import type {
  AdminUser,
  EnrolledStudent,
} from "@/business/services/adminService"

interface AdminAddStudentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  classId: number
  existingStudents: EnrolledStudent[]
}

export function AdminAddStudentModal({
  isOpen,
  onClose,
  onSuccess,
  classId,
  existingStudents,
}: AdminAddStudentModalProps) {
  const { showToast } = useToast()
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
      showToast("Failed to enroll student", "error")
    } finally {
      setIsSubmitting(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
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
