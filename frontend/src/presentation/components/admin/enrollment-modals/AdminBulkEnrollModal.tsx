import { useEffect, useMemo, useState } from "react"
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  Users,
  XCircle,
} from "lucide-react"
import * as adminService from "@/business/services/adminService"
import type {
  AdminClass,
  AdminUser,
  BulkEnrollmentResult,
} from "@/business/services/adminService"
import { Avatar } from "@/presentation/components/ui/Avatar"
import {
  convertToSingleLetterAbbr,
  formatTimeRange,
} from "@/presentation/constants/schedule.constants"
import {
  EnrollmentModalFrame,
  getSemesterAndAcademicYearLabel,
  SearchableList,
} from "./_shared"
import { cn } from "@/shared/utils/cn"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminBulkEnrollModalProps {
  isOpen: boolean
  isSubmitting: boolean
  onClose: () => void
  onConfirm: (selection: {
    classId: number
    studentIds: number[]
  }) => Promise<BulkEnrollmentResult>
}

// ---------------------------------------------------------------------------
// Result summary panel shown after the operation completes
// ---------------------------------------------------------------------------

function BulkEnrollmentResultSummary({
  result,
  selectedStudents,
  onClose,
}: {
  result: BulkEnrollmentResult
  selectedStudents: AdminUser[]
  onClose: () => void
}) {
  const studentById = useMemo(() => {
    const map = new Map<number, AdminUser>()
    for (const s of selectedStudents) {
      map.set(s.id, s)
    }
    return map
  }, [selectedStudents])

  const { summary, results } = result

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <p className="text-xl font-bold text-emerald-700">{summary.enrolled}</p>
          <p className="text-xs font-medium text-emerald-600">Enrolled</p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-4">
          <Clock className="h-5 w-5 text-amber-600" />
          <p className="text-xl font-bold text-amber-700">{summary.skipped}</p>
          <p className="text-xs font-medium text-amber-600">Skipped</p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-4">
          <XCircle className="h-5 w-5 text-rose-600" />
          <p className="text-xl font-bold text-rose-700">{summary.failed}</p>
          <p className="text-xs font-medium text-rose-600">Failed</p>
        </div>
      </div>

      {/* Per-student breakdown */}
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {results.map((item) => {
          const student = studentById.get(item.studentId)
          const name = student
            ? `${student.firstName} ${student.lastName}`
            : `Student #${item.studentId}`
          const email = student?.email ?? ""

          return (
            <div
              key={item.studentId}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3",
                item.status === "enrolled" && "border-emerald-200 bg-emerald-50",
                item.status === "skipped" && "border-amber-200 bg-amber-50",
                item.status === "failed" && "border-rose-200 bg-rose-50",
              )}
            >
              {student && (
                <Avatar
                  fallback={`${student.firstName[0] ?? "?"}${student.lastName[0] ?? ""}`}
                  src={student.avatarUrl ?? undefined}
                  size="sm"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {name}
                </p>
                {email && (
                  <p className="truncate text-xs text-slate-500">{email}</p>
                )}
                {item.reason && (
                  <p
                    className={cn(
                      "text-xs",
                      item.status === "skipped" && "text-amber-700",
                      item.status === "failed" && "text-rose-700",
                    )}
                  >
                    {item.reason}
                  </p>
                )}
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                  item.status === "enrolled" && "bg-emerald-100 text-emerald-700",
                  item.status === "skipped" && "bg-amber-100 text-amber-700",
                  item.status === "failed" && "bg-rose-100 text-rose-700",
                )}
              >
                {item.status}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Multi-select student list (toggle-based)
// ---------------------------------------------------------------------------

interface MultiSelectStudentListProps {
  title: string
  description: string
  searchPlaceholder: string
  searchValue: string
  isLoading: boolean
  selectedIds: number[]
  items: AdminUser[]
  emptyMessage: string
  errorMessage?: string | null
  onSearchChange: (query: string) => void
  onToggle: (student: AdminUser) => void
}

function MultiSelectStudentList({
  title,
  description,
  searchPlaceholder,
  searchValue,
  isLoading,
  selectedIds,
  items,
  emptyMessage,
  errorMessage,
  onSearchChange,
  onToggle,
}: MultiSelectStudentListProps) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-300 bg-white p-5 shadow-md shadow-slate-200/70">
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-base font-semibold text-slate-900">{title}</p>
          {selectedIds.length > 0 && (
            <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
              {selectedIds.length} selected
            </span>
          )}
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>

      <div className="group relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-hover:text-slate-500 group-focus-within:text-teal-600" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 shadow-sm shadow-slate-200/80 transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md hover:shadow-slate-200/80 focus:border-transparent focus:outline-none focus:ring-4 focus:ring-teal-500/15"
        />
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {errorMessage}
        </div>
      )}

      <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading options...
          </div>
        ) : items.length > 0 ? (
          items.map((student) => {
            const isSelected = selectedIds.includes(student.id)

            return (
              <button
                key={student.id}
                type="button"
                onClick={() => onToggle(student)}
                aria-label={`${isSelected ? "Deselect" : "Select"} student ${student.firstName} ${student.lastName}`}
                aria-pressed={isSelected}
                className={cn(
                  "w-full cursor-pointer rounded-2xl border px-5 py-4 text-left shadow-sm shadow-slate-200/60 transition-all duration-150",
                  isSelected
                    ? "border-teal-300 bg-teal-50 shadow-md shadow-teal-100/70"
                    : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md hover:shadow-slate-200/70",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <Avatar
                      fallback={`${student.firstName[0] ?? "?"}${student.lastName[0] ?? ""}`}
                      src={student.avatarUrl ?? undefined}
                      size="sm"
                    />
                    {isSelected && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 ring-2 ring-white">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {student.email}
                    </p>
                  </div>
                </div>
              </button>
            )
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bulk selection summary card
// ---------------------------------------------------------------------------

function BulkSelectionSummaryCard({
  selectedStudents,
  selectedClass,
}: {
  selectedStudents: AdminUser[]
  selectedClass: AdminClass | null
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Selected Students
          </p>
          {selectedStudents.length > 0 ? (
            <div className="space-y-1">
              <div className="flex -space-x-2">
                {selectedStudents.slice(0, 5).map((s) => (
                  <Avatar
                    key={s.id}
                    fallback={`${s.firstName[0] ?? "?"}${s.lastName[0] ?? ""}`}
                    src={s.avatarUrl ?? undefined}
                    size="sm"
                    className="ring-2 ring-white"
                  />
                ))}
                {selectedStudents.length > 5 && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 ring-2 ring-white">
                    <span className="text-xs font-semibold text-slate-600">
                      +{selectedStudents.length - 5}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {selectedStudents.length} student
                {selectedStudents.length !== 1 ? "s" : ""} selected
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-900">
                Choose students
              </p>
              <p className="text-xs text-slate-500">
                Click students in the list to toggle their selection.
              </p>
            </>
          )}
        </div>

        <div className="hidden h-12 w-px bg-slate-200 md:block" />

        <div className="space-y-2 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Target Class
          </p>
          {selectedClass ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                {selectedClass.className}
              </p>
              <div className="flex items-center justify-end gap-1.5">
                <BookOpen className="h-3 w-3 shrink-0 text-slate-400" />
                <p className="text-xs text-slate-500">
                  {selectedClass.classCode}
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-900">
                Choose a class
              </p>
              <p className="text-xs text-slate-500">
                Only active classes are eligible for enrollment.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main modal component
// ---------------------------------------------------------------------------

export function AdminBulkEnrollModal({
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
}: AdminBulkEnrollModalProps) {
  const [studentSearchQuery, setStudentSearchQuery] = useState("")
  const [classSearchQuery, setClassSearchQuery] = useState("")
  const [allStudents, setAllStudents] = useState<AdminUser[]>([])
  const [allClasses, setAllClasses] = useState<AdminClass[]>([])
  const [selectedStudents, setSelectedStudents] = useState<AdminUser[]>([])
  const [selectedClass, setSelectedClass] = useState<AdminClass | null>(null)
  const [isStudentsLoading, setIsStudentsLoading] = useState(false)
  const [isClassesLoading, setIsClassesLoading] = useState(false)
  const [studentLoadError, setStudentLoadError] = useState<string | null>(null)
  const [classLoadError, setClassLoadError] = useState<string | null>(null)
  const [enrollmentResult, setEnrollmentResult] =
    useState<BulkEnrollmentResult | null>(null)

  // Reset on open/close
  useEffect(() => {
    if (!isOpen) {
      setStudentSearchQuery("")
      setClassSearchQuery("")
      setAllStudents([])
      setAllClasses([])
      setSelectedStudents([])
      setSelectedClass(null)
      setStudentLoadError(null)
      setClassLoadError(null)
      setEnrollmentResult(null)
    }
  }, [isOpen])

  // Load ALL active students once when the modal opens (paginate through all pages)
  useEffect(() => {
    if (!isOpen) return

    const loadAllStudents = async () => {
      try {
        setIsStudentsLoading(true)
        setStudentLoadError(null)

        const PAGE_SIZE = 100
        const firstPage = await adminService.getAllUsers({
          page: 1,
          limit: PAGE_SIZE,
          role: "student",
          status: "active",
        })

        const collected: AdminUser[] = [...firstPage.data]

        for (let page = 2; page <= firstPage.totalPages; page++) {
          const nextPage = await adminService.getAllUsers({
            page,
            limit: PAGE_SIZE,
            role: "student",
            status: "active",
          })
          collected.push(...nextPage.data)
        }

        setAllStudents(collected)
      } catch (err) {
        setStudentLoadError(
          err instanceof Error ? err.message : "Failed to load students",
        )
      } finally {
        setIsStudentsLoading(false)
      }
    }

    void loadAllStudents()
  }, [isOpen])

  // Filter students client-side based on search query
  const availableStudents = useMemo(() => {
    const trimmed = studentSearchQuery.trim().toLowerCase()
    if (!trimmed) return allStudents

    return allStudents.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase()
      return (
        fullName.includes(trimmed) ||
        student.email.toLowerCase().includes(trimmed)
      )
    })
  }, [allStudents, studentSearchQuery])

  // Load ALL active classes once when the modal opens (paginate through all pages)
  useEffect(() => {
    if (!isOpen) return

    const loadAllClasses = async () => {
      try {
        setIsClassesLoading(true)
        setClassLoadError(null)

        const PAGE_SIZE = 100
        const firstPage = await adminService.getAllClasses({
          page: 1,
          limit: PAGE_SIZE,
          status: "active",
        })

        const collected: AdminClass[] = [...firstPage.data]

        for (let page = 2; page <= firstPage.totalPages; page++) {
          const nextPage = await adminService.getAllClasses({
            page,
            limit: PAGE_SIZE,
            status: "active",
          })
          collected.push(...nextPage.data)
        }

        setAllClasses(collected)
      } catch (err) {
        setClassLoadError(
          err instanceof Error ? err.message : "Failed to load classes",
        )
      } finally {
        setIsClassesLoading(false)
      }
    }

    void loadAllClasses()
  }, [isOpen])

  // Filter classes client-side based on search query
  const availableClasses = useMemo(() => {
    const trimmed = classSearchQuery.trim().toLowerCase()
    if (!trimmed) return allClasses

    return allClasses.filter((cls) => {
      return (
        cls.className.toLowerCase().includes(trimmed) ||
        cls.classCode.toLowerCase().includes(trimmed)
      )
    })
  }, [allClasses, classSearchQuery])

  const selectedStudentIds = useMemo(
    () => selectedStudents.map((s) => s.id),
    [selectedStudents],
  )

  const isReadyToSubmit =
    selectedStudents.length > 0 && selectedClass !== null && !isSubmitting

  const handleToggleStudent = (student: AdminUser) => {
    setSelectedStudents((prev) => {
      const alreadySelected = prev.some((s) => s.id === student.id)
      return alreadySelected
        ? prev.filter((s) => s.id !== student.id)
        : [...prev, student]
    })
  }

  const handleConfirm = async () => {
    if (!selectedClass || selectedStudents.length === 0) return

    const result = await onConfirm({
      classId: selectedClass.id,
      studentIds: selectedStudentIds,
    })

    setEnrollmentResult(result)
  }

  return (
    <EnrollmentModalFrame
      title="Bulk Enrollment"
      description="Select multiple active students and an active class to enroll them all at once. Already-enrolled students are automatically skipped."
      isOpen={isOpen}
      isBusy={isSubmitting}
      onClose={onClose}
      icon={<Users className="h-6 w-6" />}
    >
      {enrollmentResult ? (
        // ── Result view ──────────────────────────────────────────────────────
        <BulkEnrollmentResultSummary
          result={enrollmentResult}
          selectedStudents={selectedStudents}
          onClose={onClose}
        />
      ) : (
        // ── Selection view ────────────────────────────────────────────────────
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            {/* Student multi-select list */}
            <MultiSelectStudentList
              title="Select Students"
              description="Search active student accounts. Click a student to toggle their selection."
              searchPlaceholder="Search active students..."
              searchValue={studentSearchQuery}
              isLoading={isStudentsLoading}
              selectedIds={selectedStudentIds}
              items={availableStudents}
              emptyMessage="No active students matched your search."
              errorMessage={studentLoadError}
              onSearchChange={setStudentSearchQuery}
              onToggle={handleToggleStudent}
            />

            {/* Class single-select */}
            <SearchableList
              title="Select Target Class"
              description="Search active classes that can accept enrollments."
              searchPlaceholder="Search active classes..."
              searchValue={classSearchQuery}
              isLoading={isClassesLoading}
              selectedId={selectedClass?.id ?? null}
              items={availableClasses}
              emptyMessage="No active classes matched your search."
              errorMessage={classLoadError}
              onSearchChange={setClassSearchQuery}
              onSelect={setSelectedClass}
              getId={(c) => c.id}
              getPrimaryText={(c) => c.className}
              getSecondaryText={(c) => c.classCode}
              getAriaLabel={(c) => `Select class ${c.className}`}
              renderItemContent={(c) => (
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {c.className}
                    </p>
                    <p className="shrink-0 whitespace-nowrap text-xs text-slate-500">
                      {getSemesterAndAcademicYearLabel(
                        c.semester,
                        c.academicYear,
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-3 w-3 text-slate-400" />
                    <p className="text-xs text-slate-500">{c.classCode}</p>
                  </div>
                  {c.schedule.days.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <p className="text-xs text-slate-500">
                        {convertToSingleLetterAbbr(c.schedule.days).join("")}{" "}
                        {formatTimeRange(
                          c.schedule.startTime,
                          c.schedule.endTime,
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            />
          </div>

          {/* Selection summary */}
          <BulkSelectionSummaryCard
            selectedStudents={selectedStudents}
            selectedClass={selectedClass}
          />

          {/* Actions */}
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
              onClick={() => void handleConfirm()}
              disabled={!isReadyToSubmit}
              className="inline-flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              {isSubmitting
                ? "Enrolling..."
                : `Enroll ${selectedStudents.length > 0 ? selectedStudents.length : ""} Student${selectedStudents.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}
    </EnrollmentModalFrame>
  )
}
