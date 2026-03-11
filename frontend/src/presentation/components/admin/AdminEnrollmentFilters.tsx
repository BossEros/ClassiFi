import { useMemo, useState } from "react"
import { CheckCircle, ChevronDown, Filter, Search } from "lucide-react"
import { useDocumentClick } from "@/presentation/hooks/shared/useDocumentClick"

export type EnrollmentStatusFilter = "all" | "active" | "archived"

interface AdminEnrollmentFiltersProps {
  searchQuery: string
  statusFilter: EnrollmentStatusFilter
  semesterFilter: number | "all"
  academicYearFilter: string
  onSearchQueryChange: (query: string) => void
  onStatusFilterChange: (status: EnrollmentStatusFilter) => void
  onSemesterFilterChange: (semester: number | "all") => void
  onAcademicYearFilterChange: (academicYear: string) => void
}

function getSemesterLabel(semester: number | "all"): string {
  if (semester === "all") return "All Semesters"
  if (semester === 1) return "1st Semester"

  return "2nd Semester"
}

export function AdminEnrollmentFilters({
  searchQuery,
  statusFilter,
  semesterFilter,
  academicYearFilter,
  onSearchQueryChange,
  onStatusFilterChange,
  onSemesterFilterChange,
  onAcademicYearFilterChange,
}: AdminEnrollmentFiltersProps) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showSemesterDropdown, setShowSemesterDropdown] = useState(false)
  const [showAcademicYearDropdown, setShowAcademicYearDropdown] = useState(false)

  const academicYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()

    return [
      { value: "all", label: "All A.Y." },
      ...Array.from({ length: 4 }).map((_, index) => {
        const startYear = currentYear - index
        const endYear = startYear + 1

        return {
          value: `${startYear}-${endYear}`,
          label: `${startYear}-${endYear}`,
        }
      }),
    ]
  }, [])

  useDocumentClick(() => {
    setShowStatusDropdown(false)
    setShowSemesterDropdown(false)
    setShowAcademicYearDropdown(false)
  })

  return (
    <div className="relative z-50">
      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search students, classes, or teachers..."
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            className="w-full rounded-xl border border-slate-400 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-md shadow-slate-200/70 transition-all hover:border-slate-500 hover:bg-white focus:border-transparent focus:outline-none focus:ring-4 focus:ring-teal-500/15"
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap xl:flex-nowrap">
          <div className="relative">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setShowSemesterDropdown(!showSemesterDropdown)
                setShowStatusDropdown(false)
                setShowAcademicYearDropdown(false)
              }}
              className="flex min-w-[150px] cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-400 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-md shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <span>{getSemesterLabel(semesterFilter)}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform ${showSemesterDropdown ? "rotate-180" : ""}`} />
            </button>

            {showSemesterDropdown && (
              <div className="absolute right-0 top-full mt-2 w-full min-w-[150px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/90 ring-1 ring-slate-200/80">
                <div className="space-y-0.5 p-1.5">
                  {[
                    { value: "all", label: "All Semesters" },
                    { value: 1, label: "1st Semester" },
                    { value: 2, label: "2nd Semester" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onSemesterFilterChange(option.value as number | "all")
                        setShowSemesterDropdown(false)
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all duration-150 ${
                        semesterFilter === option.value
                          ? "border-teal-200 bg-teal-50 text-teal-700 shadow-sm"
                          : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm"
                      }`}
                    >
                      <span className="font-medium">{option.label}</span>
                      {semesterFilter === option.value && <CheckCircle className="h-3.5 w-3.5 text-teal-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setShowAcademicYearDropdown(!showAcademicYearDropdown)
                setShowStatusDropdown(false)
                setShowSemesterDropdown(false)
              }}
              className="flex min-w-[150px] cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-400 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-md shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <span>{academicYearFilter === "all" ? "All A.Y." : academicYearFilter}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform ${showAcademicYearDropdown ? "rotate-180" : ""}`} />
            </button>

            {showAcademicYearDropdown && (
              <div className="absolute right-0 top-full mt-2 w-full min-w-[150px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/90 ring-1 ring-slate-200/80">
                <div className="space-y-0.5 p-1.5">
                  {academicYearOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onAcademicYearFilterChange(option.value)
                        setShowAcademicYearDropdown(false)
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all duration-150 ${
                        academicYearFilter === option.value
                          ? "border-teal-200 bg-teal-50 text-teal-700 shadow-sm"
                          : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm"
                      }`}
                    >
                      <span className="font-medium">{option.label}</span>
                      {academicYearFilter === option.value && <CheckCircle className="h-3.5 w-3.5 text-teal-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setShowStatusDropdown(!showStatusDropdown)
                setShowSemesterDropdown(false)
                setShowAcademicYearDropdown(false)
              }}
              className="flex min-w-[150px] cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-400 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-md shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <span className="capitalize">
                  {statusFilter === "all" ? "All Status" : statusFilter}
                </span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`} />
            </button>

            {showStatusDropdown && (
              <div className="absolute right-0 top-full mt-2 w-full min-w-[160px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/90 ring-1 ring-slate-200/80">
                <div className="space-y-0.5 p-1.5">
                  {(["all", "active", "archived"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        onStatusFilterChange(status)
                        setShowStatusDropdown(false)
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all duration-150 ${
                        statusFilter === status
                          ? "border-teal-200 bg-teal-50 text-teal-700 shadow-sm"
                          : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm"
                      }`}
                    >
                      <span className="capitalize font-medium">
                        {status === "all" ? "All Status" : status}
                      </span>
                      {statusFilter === status && <CheckCircle className="h-3.5 w-3.5 text-teal-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
