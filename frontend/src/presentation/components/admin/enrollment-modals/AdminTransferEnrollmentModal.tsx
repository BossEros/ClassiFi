import { useEffect, useState } from "react"
import { ArrowRightLeft, BookOpen, Clock, Loader2 } from "lucide-react"
import * as adminService from "@/business/services/adminService"
import type { AdminClass, AdminEnrollmentRecord } from "@/business/services/adminService"
import { useDebouncedValue } from "@/presentation/hooks/shared/useDebouncedValue"
import { convertToSingleLetterAbbr, formatTimeRange } from "@/presentation/constants/schedule.constants"
import { EnrollmentModalFrame, getSemesterAndAcademicYearLabel, SearchableList } from "./_shared"

interface AdminTransferEnrollmentModalProps {
  enrollment: AdminEnrollmentRecord | null
  isSubmitting: boolean
  onClose: () => void
  onConfirm: (selection: { toClassId: number }) => Promise<void>
}

export function AdminTransferEnrollmentModal({
  enrollment,
  isSubmitting,
  onClose,
  onConfirm,
}: AdminTransferEnrollmentModalProps) {
  const [classSearchQuery, setClassSearchQuery] = useState("")
  const [availableClasses, setAvailableClasses] = useState<AdminClass[]>([])
  const [selectedClass, setSelectedClass] = useState<AdminClass | null>(null)
  const [isClassesLoading, setIsClassesLoading] = useState(false)
  const [classLoadError, setClassLoadError] = useState<string | null>(null)

  const debouncedClassSearch = useDebouncedValue(classSearchQuery, 300)
  const isOpen = !!enrollment

  useEffect(() => {
    if (!enrollment) {
      setClassSearchQuery("")
      setAvailableClasses([])
      setSelectedClass(null)
      setClassLoadError(null)
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

        setAvailableClasses(
          response.data.filter(
            (availableClass) => availableClass.id !== enrollment.classId,
          ),
        )
      } catch (error) {
        setClassLoadError(
          error instanceof Error ? error.message : "Failed to load classes",
        )
      } finally {
        setIsClassesLoading(false)
      }
    }

    void loadClassOptions()
  }, [debouncedClassSearch, enrollment])

  const selectedClassId = selectedClass?.id ?? null

  const handleConfirm = async () => {
    if (!selectedClassId) {
      return
    }

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
      onClose={onClose}
    >
      <div className="space-y-4">
        {enrollment && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3.5 shadow-sm shadow-sky-100/70">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-sky-600">
              Current Class
            </p>
            <p className="text-sm font-semibold text-slate-900">{enrollment.className}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <BookOpen className="h-3 w-3 shrink-0 text-slate-400" />
              <p className="text-xs text-slate-500">{enrollment.classCode}</p>
            </div>
          </div>
        )}

        <SearchableList
          title="Select Destination Class"
          description="Only active classes other than the current class are shown."
          searchPlaceholder="Search active destination classes..."
          searchValue={classSearchQuery}
          isLoading={isClassesLoading}
          selectedId={selectedClassId}
          items={availableClasses}
          emptyMessage="No eligible destination classes matched your search."
          errorMessage={classLoadError}
          onSearchChange={setClassSearchQuery}
          onSelect={setSelectedClass}
          getId={(availableClass) => availableClass.id}
          getPrimaryText={(availableClass) => availableClass.className}
          getSecondaryText={(availableClass) => availableClass.classCode}
          getAriaLabel={(availableClass) => `Select destination class ${availableClass.className}`}
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
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRightLeft className="h-4 w-4" />
            )}
            Transfer Student
          </button>
        </div>
      </div>
    </EnrollmentModalFrame>
  )
}
