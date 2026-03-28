import { AlertTriangle, BookOpen, Loader2, Mail, Trash2, X } from "lucide-react"
import type { AdminEnrollmentRecord } from "@/business/services/adminService"
import { Avatar } from "@/presentation/components/ui/Avatar"
import { useEnrollmentModalLifecycle } from "./_shared"

interface AdminRemoveEnrollmentModalProps {
  enrollment: AdminEnrollmentRecord | null
  isSubmitting: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function AdminRemoveEnrollmentModal({
  enrollment,
  isSubmitting,
  onClose,
  onConfirm,
}: AdminRemoveEnrollmentModalProps) {
  useEnrollmentModalLifecycle(!!enrollment, isSubmitting, onClose)

  if (!enrollment) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-enrollment-title"
        aria-describedby="remove-enrollment-description"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-rose-200 bg-white shadow-xl animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Close remove enrollment modal"
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-6 pb-4 pt-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <h2
            id="remove-enrollment-title"
            className="text-xl font-semibold text-slate-900"
          >
            Remove Enrollment?
          </h2>
          <p
            id="remove-enrollment-description"
            className="mt-2 text-sm leading-6 text-slate-600"
          >
            This will unenroll{" "}
            <span className="font-semibold text-slate-900">
              {enrollment.studentFirstName} {enrollment.studentLastName}
            </span>{" "}
            from{" "}
            <span className="font-semibold text-slate-900">
              {enrollment.className}
            </span>
            .
          </p>
        </div>

        <div className="mx-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar
              fallback={`${enrollment.studentFirstName[0] ?? "?"}${enrollment.studentLastName[0] ?? ""}`}
              src={enrollment.studentAvatarUrl ?? undefined}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800">
                {enrollment.studentFirstName} {enrollment.studentLastName}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                <p className="truncate text-xs text-slate-500">{enrollment.studentEmail}</p>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <BookOpen className="h-3 w-3 shrink-0 text-slate-400" />
            <p className="text-xs text-slate-500">
              {enrollment.className}{" "}
              <span className="font-mono text-slate-400">({enrollment.classCode})</span>
            </p>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Remove Student
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
