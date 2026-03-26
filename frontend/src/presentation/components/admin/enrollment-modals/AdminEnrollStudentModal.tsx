import { useEffect, useMemo, useState } from "react"
import { BookOpen, Clock, Loader2, UserPlus } from "lucide-react"
import * as adminService from "@/business/services/adminService"
import type { AdminClass, AdminUser } from "@/business/services/adminService"
import { useDebouncedValue } from "@/presentation/hooks/shared/useDebouncedValue"
import { Avatar } from "@/presentation/components/ui/Avatar"
import { convertToSingleLetterAbbr, formatTimeRange } from "@/presentation/constants/schedule.constants"
import { EnrollmentModalFrame, getSemesterAndAcademicYearLabel, SearchableList, SelectionSummaryCard } from "./_shared"

interface AdminEnrollStudentModalProps {
  isOpen: boolean
  isSubmitting: boolean
  onClose: () => void
  onConfirm: (selection: { studentId: number; classId: number }) => Promise<void>
}

export function AdminEnrollStudentModal({
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
}: AdminEnrollStudentModalProps) {
  const [studentSearchQuery, setStudentSearchQuery] = useState("")
  const [classSearchQuery, setClassSearchQuery] = useState("")
  const [availableStudents, setAvailableStudents] = useState<AdminUser[]>([])
  const [availableClasses, setAvailableClasses] = useState<AdminClass[]>([])
  const [selectedStudent, setSelectedStudent] = useState<AdminUser | null>(null)
  const [selectedClass, setSelectedClass] = useState<AdminClass | null>(null)
  const [isStudentsLoading, setIsStudentsLoading] = useState(false)
  const [isClassesLoading, setIsClassesLoading] = useState(false)
  const [studentLoadError, setStudentLoadError] = useState<string | null>(null)
  const [classLoadError, setClassLoadError] = useState<string | null>(null)

  const debouncedStudentSearch = useDebouncedValue(studentSearchQuery, 300)
  const debouncedClassSearch = useDebouncedValue(classSearchQuery, 300)

  useEffect(() => {
    if (!isOpen) {
      setStudentSearchQuery("")
      setClassSearchQuery("")
      setAvailableStudents([])
      setAvailableClasses([])
      setSelectedStudent(null)
      setSelectedClass(null)
      setStudentLoadError(null)
      setClassLoadError(null)
      return
    }

    const loadStudentOptions = async () => {
      try {
        setIsStudentsLoading(true)
        setStudentLoadError(null)

        const response = await adminService.getAllUsers({
          page: 1,
          limit: 8,
          search: debouncedStudentSearch || undefined,
          role: "student",
          status: "active",
        })

        setAvailableStudents(response.data)
      } catch (error) {
        setStudentLoadError(
          error instanceof Error ? error.message : "Failed to load students",
        )
      } finally {
        setIsStudentsLoading(false)
      }
    }

    void loadStudentOptions()
  }, [debouncedStudentSearch, isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const loadClassOptions = async () => {
      try {
        setIsClassesLoading(true)
        setClassLoadError(null)

        const response = await adminService.getAllClasses({
          page: 1,
          limit: 8,
          search: debouncedClassSearch || undefined,
          status: "active",
        })

        setAvailableClasses(response.data)
      } catch (error) {
        setClassLoadError(
          error instanceof Error ? error.message : "Failed to load classes",
        )
      } finally {
        setIsClassesLoading(false)
      }
    }

    void loadClassOptions()
  }, [debouncedClassSearch, isOpen])

  const selectedStudentId = selectedStudent?.id ?? null
  const selectedClassId = selectedClass?.id ?? null

  const isReadyToSubmit = useMemo(
    () => selectedStudentId !== null && selectedClassId !== null,
    [selectedClassId, selectedStudentId],
  )

  const handleConfirm = async () => {
    if (!selectedStudentId || !selectedClassId) {
      return
    }

    await onConfirm({ studentId: selectedStudentId, classId: selectedClassId })
  }

  return (
    <EnrollmentModalFrame
      title="Manual Enrollment"
      description="Add an active student to an active class without jumping through class detail pages."
      isOpen={isOpen}
      isBusy={isSubmitting}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-2">
          <SearchableList
            title="Select Student"
            description="Search active student accounts only."
            searchPlaceholder="Search active students..."
            searchValue={studentSearchQuery}
            isLoading={isStudentsLoading}
            selectedId={selectedStudentId}
            items={availableStudents}
            emptyMessage="No active students matched your search."
            errorMessage={studentLoadError}
            onSearchChange={setStudentSearchQuery}
            onSelect={setSelectedStudent}
            getId={(student) => student.id}
            getPrimaryText={(student) => `${student.firstName} ${student.lastName}`}
            getSecondaryText={(student) => student.email}
            getAriaLabel={(student) => `Select student ${student.firstName} ${student.lastName}`}
            renderLeadingVisual={(student) => (
              <Avatar
                fallback={`${student.firstName[0] ?? "?"}${student.lastName[0] ?? ""}`}
                src={student.avatarUrl ?? undefined}
                size="sm"
              />
            )}
          />

          <SearchableList
            title="Select Class"
            description="Search active classes that can accept enrollments."
            searchPlaceholder="Search active classes..."
            searchValue={classSearchQuery}
            isLoading={isClassesLoading}
            selectedId={selectedClassId}
            items={availableClasses}
            emptyMessage="No active classes matched your search."
            errorMessage={classLoadError}
            onSearchChange={setClassSearchQuery}
            onSelect={setSelectedClass}
            getId={(availableClass) => availableClass.id}
            getPrimaryText={(availableClass) => availableClass.className}
            getSecondaryText={(availableClass) => availableClass.classCode}
            getAriaLabel={(availableClass) => `Select class ${availableClass.className}`}
            renderItemContent={(availableClass) => (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {availableClass.className}
                  </p>
                  <p className="shrink-0 whitespace-nowrap text-xs text-slate-500">
                    {getSemesterAndAcademicYearLabel(
                      availableClass.semester,
                      availableClass.academicYear,
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3 text-slate-400" />
                  <p className="text-xs text-slate-500">{availableClass.classCode}</p>
                </div>
                {availableClass.schedule.days.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <p className="text-xs text-slate-500">
                      {convertToSingleLetterAbbr(availableClass.schedule.days).join("")}{" "}
                      {formatTimeRange(availableClass.schedule.startTime, availableClass.schedule.endTime)}
                    </p>
                  </div>
                )}
              </div>
            )}
          />
        </div>

        <SelectionSummaryCard
          student={selectedStudent}
          selectedClass={selectedClass}
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isReadyToSubmit || isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Enroll Student
          </button>
        </div>
      </div>
    </EnrollmentModalFrame>
  )
}
