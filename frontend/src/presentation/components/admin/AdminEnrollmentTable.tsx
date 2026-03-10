import { Avatar } from "@/presentation/components/ui/Avatar"
import type { AdminEnrollmentRecord } from "@/business/services/adminService"
import {
  ArrowRightLeft,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Loader2,
  Mail,
  Search,
  Trash2,
  UserRoundCheck,
  UserX,
} from "lucide-react"

interface AdminEnrollmentTableProps {
  enrollments: AdminEnrollmentRecord[]
  isLoading: boolean
  page: number
  totalPages: number
  totalEnrollments: number
  onPreviousPage: () => void
  onNextPage: () => void
  onOpenTransferModal: (enrollment: AdminEnrollmentRecord) => void
  onOpenRemoveModal: (enrollment: AdminEnrollmentRecord) => void
  onOpenClassDetail: (classId: number) => void
}

function getOrdinalSuffix(value: number): string {
  if (value === 1) return "st"
  if (value === 2) return "nd"
  if (value === 3) return "rd"

  return "th"
}

function formatEnrollmentDate(enrolledAt: string): string {
  return new Date(enrolledAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getEnrollmentStatusBadge(enrollment: AdminEnrollmentRecord): {
  label: string
  className: string
  Icon: typeof UserRoundCheck
} {
  if (!enrollment.classIsActive) {
    return {
      label: "Archived Class",
      className: "border-slate-200 bg-slate-100 text-slate-600",
      Icon: UserX,
    }
  }

  if (!enrollment.studentIsActive) {
    return {
      label: "Inactive Student",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      Icon: UserX,
    }
  }

  return {
    label: "Active Enrollment",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Icon: UserRoundCheck,
  }
}

export function AdminEnrollmentTable({
  enrollments,
  isLoading,
  page,
  totalPages,
  totalEnrollments,
  onPreviousPage,
  onNextPage,
  onOpenTransferModal,
  onOpenRemoveModal,
  onOpenClassDetail,
}: AdminEnrollmentTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-md shadow-slate-200/80">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-200/85">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Student</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Class</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Teacher</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Academic Info</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Enrolled</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Status</th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300/70">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100" />
                      <div className="space-y-2">
                        <div className="h-4 w-36 rounded bg-slate-100" />
                        <div className="h-3 w-28 rounded bg-slate-100" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><div className="h-4 w-40 rounded bg-slate-100" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-28 rounded bg-slate-100" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-slate-100" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-slate-100" /></td>
                  <td className="px-6 py-4"><div className="h-6 w-28 rounded-full bg-slate-100" /></td>
                  <td className="px-6 py-4">
                    <div className="ml-auto flex justify-end gap-2">
                      <div className="h-9 w-24 rounded-xl bg-slate-100" />
                      <div className="h-9 w-24 rounded-xl bg-slate-100" />
                    </div>
                  </td>
                </tr>
              ))
            ) : enrollments.length > 0 ? (
              enrollments.map((enrollment) => {
                const enrollmentStatus = getEnrollmentStatusBadge(enrollment)
                const StatusIcon = enrollmentStatus.Icon

                return (
                  <tr key={enrollment.id} className="group transition-colors duration-200 hover:bg-slate-100">
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <Avatar
                          fallback={`${enrollment.studentFirstName[0] ?? "?"}${enrollment.studentLastName[0] ?? ""}`}
                          src={enrollment.studentAvatarUrl ?? undefined}
                          size="sm"
                          className="ring-2 ring-transparent transition-all group-hover:ring-teal-100"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900 transition-colors group-hover:text-teal-700">
                            {enrollment.studentFirstName} {enrollment.studentLastName}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{enrollment.studentEmail}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <button
                        type="button"
                        onClick={() => onOpenClassDetail(enrollment.classId)}
                        aria-label={`Open class ${enrollment.className} details`}
                        className="group/class flex cursor-pointer items-start gap-2 text-left"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900 transition-colors group-hover/class:text-teal-700">
                            {enrollment.className}
                          </p>
                          <p className="mt-1 text-xs font-mono text-slate-500">{enrollment.classCode}</p>
                        </div>
                        <ExternalLink className="mt-0.5 h-3.5 w-3.5 text-slate-400 transition-colors group-hover/class:text-teal-600" />
                      </button>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">{enrollment.teacherName}</p>
                        <p className="mt-1 text-xs text-slate-500">Teacher ID: {enrollment.teacherId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                          <span>{enrollment.yearLevel}{getOrdinalSuffix(enrollment.yearLevel)} Year</span>
                        </div>
                        <p>{enrollment.semester}{getOrdinalSuffix(enrollment.semester)} Semester</p>
                        <p>{enrollment.academicYear}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatEnrollmentDate(enrollment.enrolledAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${enrollmentStatus.className}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {enrollmentStatus.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenTransferModal(enrollment)}
                          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-100"
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                          Transfer
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenRemoveModal(enrollment)}
                          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-slate-100 p-4">
                      <Search className="h-8 w-8 opacity-40" />
                    </div>
                    <p className="text-lg font-medium text-slate-700">No enrollments found</p>
                    <p className="text-sm">Try adjusting your search or filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isLoading && (
        <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-4 text-sm text-slate-500">
          <div className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading enrollment records...
          </div>
        </div>
      )}

      {!isLoading && totalEnrollments > 0 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-6 py-4">
          <p className="text-sm text-slate-500">
            Page <span className="font-medium text-slate-900">{page}</span> of <span className="font-medium text-slate-900">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onPreviousPage}
              disabled={page === 1}
              className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onNextPage}
              disabled={page === totalPages}
              className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}



