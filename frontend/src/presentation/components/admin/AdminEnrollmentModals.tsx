import { useEffect, useState, type ReactNode } from "react"
import {
  ArrowRightLeft,
  Loader2,
  Search,
  UserPlus,
  UserRoundMinus,
  X,
} from "lucide-react"
import * as adminService from "@/business/services/adminService"
import type {
  AdminClass,
  AdminEnrollmentRecord,
  AdminUser,
} from "@/business/services/adminService"
import { useDebouncedValue } from "@/presentation/hooks/shared/useDebouncedValue"
import { cn } from "@/shared/utils/cn"

interface AdminEnrollStudentModalProps {
  isOpen: boolean
  isSubmitting: boolean
  onClose: () => void
  onConfirm: (selection: { studentId: number; classId: number }) => Promise<void>
}

interface AdminTransferEnrollmentModalProps {
  enrollment: AdminEnrollmentRecord | null
  isSubmitting: boolean
  onClose: () => void
  onConfirm: (selection: { toClassId: number }) => Promise<void>
}

interface AdminRemoveEnrollmentModalProps {
  enrollment: AdminEnrollmentRecord | null
  isSubmitting: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

interface EnrollmentModalFrameProps {
  title: string
  description: string
  isOpen: boolean
  isBusy: boolean
  icon: ReactNode
  onClose: () => void
  children: ReactNode
}

function useEnrollmentModalLifecycle(
  isOpen: boolean,
  isBusy: boolean,
  onClose: () => void,
) {
  useEffect(() => {
    if (!isOpen) return

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isBusy) {
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", handleEscapeKey)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", handleEscapeKey)
    }
  }, [isOpen, isBusy, onClose])
}

function EnrollmentModalFrame({
  title,
  description,
  isOpen,
  isBusy,
  icon,
  onClose,
  children,
}: EnrollmentModalFrameProps) {
  useEnrollmentModalLifecycle(isOpen, isBusy, onClose)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isBusy ? onClose : undefined}
      />

      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          disabled={isBusy}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-200 bg-teal-50 text-teal-700">
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}

interface SearchableListProps<TItem> {
  title: string
  searchPlaceholder: string
  searchValue: string
  isLoading: boolean
  selectedId: number | null
  items: TItem[]
  emptyMessage: string
  onSearchChange: (query: string) => void
  onSelect: (item: TItem) => void
  getId: (item: TItem) => number
  getPrimaryText: (item: TItem) => string
  getSecondaryText: (item: TItem) => string
  getMetadataText?: (item: TItem) => string
}

function SearchableList<TItem>({
  title,
  searchPlaceholder,
  searchValue,
  isLoading,
  selectedId,
  items,
  emptyMessage,
  onSearchChange,
  onSelect,
  getId,
  getPrimaryText,
  getSecondaryText,
  getMetadataText,
}: SearchableListProps<TItem>) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-all hover:border-slate-400 focus:border-transparent focus:outline-none focus:ring-4 focus:ring-teal-500/15"
        />
      </div>

      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading options...
          </div>
        ) : items.length > 0 ? (
          items.map((item) => {
            const itemId = getId(item)
            const isSelected = selectedId === itemId

            return (
              <button
                key={itemId}
                type="button"
                onClick={() => onSelect(item)}
                className={cn(
                  "w-full cursor-pointer rounded-xl border px-4 py-3 text-left transition-all duration-150",
                  isSelected
                    ? "border-teal-300 bg-teal-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                <p className="text-sm font-semibold text-slate-900">{getPrimaryText(item)}</p>
                <p className="mt-1 text-xs text-slate-500">{getSecondaryText(item)}</p>
                {getMetadataText && <p className="mt-1 text-xs text-slate-400">{getMetadataText(item)}</p>}
              </button>
            )
          })
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  )
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
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [isStudentsLoading, setIsStudentsLoading] = useState(false)
  const [isClassesLoading, setIsClassesLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const debouncedStudentSearch = useDebouncedValue(studentSearchQuery, 300)
  const debouncedClassSearch = useDebouncedValue(classSearchQuery, 300)

  useEffect(() => {
    if (!isOpen) {
      setStudentSearchQuery("")
      setClassSearchQuery("")
      setAvailableStudents([])
      setAvailableClasses([])
      setSelectedStudentId(null)
      setSelectedClassId(null)
      setLoadError(null)
      return
    }

    const loadStudentOptions = async () => {
      try {
        setIsStudentsLoading(true)
        const response = await adminService.getAllUsers({
          page: 1,
          limit: 8,
          search: debouncedStudentSearch || undefined,
          role: "student",
          status: "active",
        })
        setAvailableStudents(response.data)
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Failed to load students")
      } finally {
        setIsStudentsLoading(false)
      }
    }

    void loadStudentOptions()
  }, [debouncedStudentSearch, isOpen])

  useEffect(() => {
    if (!isOpen) return

    const loadClassOptions = async () => {
      try {
        setIsClassesLoading(true)
        const response = await adminService.getAllClasses({
          page: 1,
          limit: 8,
          search: debouncedClassSearch || undefined,
          status: "active",
        })
        setAvailableClasses(response.data)
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Failed to load classes")
      } finally {
        setIsClassesLoading(false)
      }
    }

    void loadClassOptions()
  }, [debouncedClassSearch, isOpen])

  const handleConfirm = async () => {
    if (!selectedStudentId || !selectedClassId) return

    await onConfirm({ studentId: selectedStudentId, classId: selectedClassId })
  }

  return (
    <EnrollmentModalFrame
      title="Manual Enrollment"
      description="Add an active student to an active class without jumping through class detail pages."
      isOpen={isOpen}
      isBusy={isSubmitting}
      icon={<UserPlus className="h-6 w-6" />}
      onClose={onClose}
    >
      <div className="space-y-4">
        {loadError && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</div>}

        <div className="grid gap-4 lg:grid-cols-2">
          <SearchableList
            title="Select student"
            searchPlaceholder="Search active students..."
            searchValue={studentSearchQuery}
            isLoading={isStudentsLoading}
            selectedId={selectedStudentId}
            items={availableStudents}
            emptyMessage="No active students matched your search."
            onSearchChange={setStudentSearchQuery}
            onSelect={(student) => setSelectedStudentId(student.id)}
            getId={(student) => student.id}
            getPrimaryText={(student) => `${student.firstName} ${student.lastName}`}
            getSecondaryText={(student) => student.email}
            getMetadataText={(student) => `Student ID: ${student.id}`}
          />

          <SearchableList
            title="Select class"
            searchPlaceholder="Search active classes..."
            searchValue={classSearchQuery}
            isLoading={isClassesLoading}
            selectedId={selectedClassId}
            items={availableClasses}
            emptyMessage="No active classes matched your search."
            onSearchChange={setClassSearchQuery}
            onSelect={(selectedClass) => setSelectedClassId(selectedClass.id)}
            getId={(selectedClass) => selectedClass.id}
            getPrimaryText={(selectedClass) => selectedClass.className}
            getSecondaryText={(selectedClass) => `${selectedClass.classCode} � ${selectedClass.teacherName}`}
            getMetadataText={(selectedClass) => `${selectedClass.academicYear} � ${selectedClass.semester} semester`}
          />
        </div>

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
            disabled={!selectedStudentId || !selectedClassId || isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Enroll Student
          </button>
        </div>
      </div>
    </EnrollmentModalFrame>
  )
}

export function AdminTransferEnrollmentModal({
  enrollment,
  isSubmitting,
  onClose,
  onConfirm,
}: AdminTransferEnrollmentModalProps) {
  const [classSearchQuery, setClassSearchQuery] = useState("")
  const [availableClasses, setAvailableClasses] = useState<AdminClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [isClassesLoading, setIsClassesLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const debouncedClassSearch = useDebouncedValue(classSearchQuery, 300)
  const isOpen = !!enrollment

  useEffect(() => {
    if (!enrollment) {
      setClassSearchQuery("")
      setAvailableClasses([])
      setSelectedClassId(null)
      setLoadError(null)
      return
    }

    const loadClassOptions = async () => {
      try {
        setIsClassesLoading(true)
        const response = await adminService.getAllClasses({
          page: 1,
          limit: 8,
          search: debouncedClassSearch || undefined,
          status: "active",
        })
        setAvailableClasses(response.data.filter((availableClass) => availableClass.id !== enrollment.classId))
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Failed to load classes")
      } finally {
        setIsClassesLoading(false)
      }
    }

    void loadClassOptions()
  }, [debouncedClassSearch, enrollment])

  const handleConfirm = async () => {
    if (!selectedClassId) return

    await onConfirm({ toClassId: selectedClassId })
  }

  return (
    <EnrollmentModalFrame
      title="Transfer Enrollment"
      description={
        enrollment
          ? `Move ${enrollment.studentFirstName} ${enrollment.studentLastName} out of ${enrollment.className} and into another active class.`
          : "Move a student between classes."
      }
      isOpen={isOpen}
      isBusy={isSubmitting}
      icon={<ArrowRightLeft className="h-6 w-6" />}
      onClose={onClose}
    >
      <div className="space-y-4">
        {enrollment && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Current class: <span className="font-semibold text-slate-900">{enrollment.className}</span>
            <span className="text-slate-400"> ({enrollment.classCode})</span>
          </div>
        )}

        {loadError && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</div>}

        <SearchableList
          title="Select destination class"
          searchPlaceholder="Search active destination classes..."
          searchValue={classSearchQuery}
          isLoading={isClassesLoading}
          selectedId={selectedClassId}
          items={availableClasses}
          emptyMessage="No eligible destination classes matched your search."
          onSearchChange={setClassSearchQuery}
          onSelect={(selectedClass) => setSelectedClassId(selectedClass.id)}
          getId={(selectedClass) => selectedClass.id}
          getPrimaryText={(selectedClass) => selectedClass.className}
          getSecondaryText={(selectedClass) => `${selectedClass.classCode} � ${selectedClass.teacherName}`}
          getMetadataText={(selectedClass) => `${selectedClass.academicYear} � ${selectedClass.semester} semester`}
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
            disabled={!selectedClassId || isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
            Transfer Student
          </button>
        </div>
      </div>
    </EnrollmentModalFrame>
  )
}

export function AdminRemoveEnrollmentModal({
  enrollment,
  isSubmitting,
  onClose,
  onConfirm,
}: AdminRemoveEnrollmentModalProps) {
  return (
    <EnrollmentModalFrame
      title="Remove Enrollment"
      description={
        enrollment
          ? `Remove ${enrollment.studentFirstName} ${enrollment.studentLastName} from ${enrollment.className}. This action removes class access immediately.`
          : "Remove a student from a class."
      }
      isOpen={!!enrollment}
      isBusy={isSubmitting}
      icon={<UserRoundMinus className="h-6 w-6" />}
      onClose={onClose}
    >
      <div className="space-y-5">
        {enrollment && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-700">
            <p>Student: <span className="font-semibold">{enrollment.studentFirstName} {enrollment.studentLastName}</span></p>
            <p>Class: <span className="font-semibold">{enrollment.className}</span><span className="text-rose-500"> ({enrollment.classCode})</span></p>
            <p className="mt-2 text-rose-600">Use transfer instead if the student should stay enrolled elsewhere this term.</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
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
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRoundMinus className="h-4 w-4" />}
            Remove Student
          </button>
        </div>
      </div>
    </EnrollmentModalFrame>
  )
}
