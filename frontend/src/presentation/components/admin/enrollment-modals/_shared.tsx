import { useEffect, type ReactNode } from "react"
import { BookOpen, Loader2, Mail, Search, X } from "lucide-react"
import type { AdminClass, AdminUser } from "@/business/services/adminService"
import { Avatar } from "@/presentation/components/ui/Avatar"
import { cn } from "@/shared/utils/cn"

export interface EnrollmentModalFrameProps {
  title: string
  description: string
  isOpen: boolean
  isBusy: boolean
  icon?: ReactNode
  onClose: () => void
  children: ReactNode
}

export interface SearchableListProps<TItem> {
  title: string
  description: string
  searchPlaceholder: string
  searchValue: string
  isLoading: boolean
  selectedId: number | null
  items: TItem[]
  emptyMessage: string
  errorMessage?: string | null
  onSearchChange: (query: string) => void
  onSelect: (item: TItem) => void
  getId: (item: TItem) => number
  getPrimaryText: (item: TItem) => string
  getSecondaryText: (item: TItem) => string
  getMetadataText?: (item: TItem) => string
  getAriaLabel?: (item: TItem) => string
  renderLeadingVisual?: (item: TItem) => ReactNode
  renderItemContent?: (item: TItem) => ReactNode
}

export function useEnrollmentModalLifecycle(
  isOpen: boolean,
  isBusy: boolean,
  onClose: () => void,
) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

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

export function EnrollmentModalFrame({
  title,
  description,
  isOpen,
  isBusy,
  icon,
  onClose,
  children,
}: EnrollmentModalFrameProps) {
  useEnrollmentModalLifecycle(isOpen, isBusy, onClose)

  const titleId = `${title.toLowerCase().replace(/\s+/g, "-")}-title`
  const descriptionId = `${title.toLowerCase().replace(/\s+/g, "-")}-description`

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isBusy ? onClose : undefined}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isBusy}
          aria-label={`Close ${title}`}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-slate-200/80 px-6 pb-5 pt-6">
          <div className={cn("flex items-start gap-4", !icon && "gap-0")}>
            {icon ? (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-200 bg-teal-50 text-teal-700">
                {icon}
              </div>
            ) : null}
            <div>
              <h2 id={titleId} className="text-xl font-semibold text-slate-900">
                {title}
              </h2>
              <p id={descriptionId} className="mt-1 text-sm leading-6 text-slate-500">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

export function getOrdinalSuffix(value: number): string {
  if (value === 1) return "st"
  if (value === 2) return "nd"
  if (value === 3) return "rd"

  return "th"
}

export function getSemesterAndAcademicYearLabel(semester: number, academicYear: string): string {
  return `${semester}${getOrdinalSuffix(semester)} Semester - ${academicYear}`
}

export function SearchableList<TItem>({
  title,
  description,
  searchPlaceholder,
  searchValue,
  isLoading,
  selectedId,
  items,
  emptyMessage,
  errorMessage,
  onSearchChange,
  onSelect,
  getId,
  getPrimaryText,
  getSecondaryText,
  getMetadataText,
  getAriaLabel,
  renderLeadingVisual,
  renderItemContent,
}: SearchableListProps<TItem>) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-300 bg-white p-5 shadow-md shadow-slate-200/70">
      <div>
        <p className="text-base font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>

      <div className="group relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-hover:text-slate-500 group-focus-within:text-teal-600" />
        <input
          type="text"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
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
          items.map((item) => {
            const itemId = getId(item)
            const isSelected = selectedId === itemId

            return (
              <button
                key={itemId}
                type="button"
                onClick={() => onSelect(item)}
                aria-label={getAriaLabel?.(item)}
                className={cn(
                  "w-full cursor-pointer rounded-2xl border px-5 py-4 text-left shadow-sm shadow-slate-200/60 transition-all duration-150",
                  isSelected
                    ? "border-teal-300 bg-teal-50 shadow-md shadow-teal-100/70"
                    : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md hover:shadow-slate-200/70",
                )}
              >
                {renderItemContent ? (
                  renderItemContent(item)
                ) : (
                  <div className="flex items-center gap-3">
                    {renderLeadingVisual ? (
                      <div className="shrink-0">{renderLeadingVisual(item)}</div>
                    ) : null}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {getPrimaryText(item)}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                        <p className="truncate text-xs text-slate-500">
                          {getSecondaryText(item)}
                        </p>
                      </div>
                      {getMetadataText && (
                        <p className="mt-1 text-xs text-slate-400">
                          {getMetadataText(item)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
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

export function SelectionSummaryCard({
  student,
  selectedClass,
}: {
  student: AdminUser | null
  selectedClass: AdminClass | null
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Selected Student
          </p>
          {student ? (
            <div className="flex items-center gap-3">
              <Avatar
                fallback={`${student.firstName[0] ?? "?"}${student.lastName[0] ?? ""}`}
                src={student.avatarUrl ?? undefined}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {student.firstName} {student.lastName}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                  <p className="truncate text-xs text-slate-500">{student.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-900">Choose a student</p>
              <p className="text-xs text-slate-500">
                Only active student accounts are shown here.
              </p>
            </>
          )}
        </div>

        <div className="hidden h-12 w-px bg-slate-200 md:block" />

        <div className="space-y-2 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Selected Class
          </p>
          {selectedClass ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">
                {selectedClass.className}
              </p>
              <div className="flex items-center justify-end gap-1.5">
                <BookOpen className="h-3 w-3 shrink-0 text-slate-400" />
                <p className="text-xs text-slate-500">{selectedClass.classCode}</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-900">Choose a class</p>
              <p className="text-xs text-slate-500">
                Only active classes are eligible for manual enrollment.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
