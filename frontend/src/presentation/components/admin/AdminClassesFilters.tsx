import { useMemo, useState } from "react"
import {
  CheckCircle,
  ChevronDown,
  Filter,
  Search,
} from "lucide-react"
import { useDocumentClick } from "@/presentation/hooks/shared/useDocumentClick"

type StatusFilter = "all" | "active" | "archived"

interface AdminClassesFiltersProps {
  searchQuery: string
  statusFilter: StatusFilter
  yearLevelFilter: number | "all"
  semesterFilter: number | "all"
  academicYearFilter: string
  onSearchQueryChange: (query: string) => void
  onStatusFilterChange: (status: StatusFilter) => void
  onYearLevelFilterChange: (yearLevel: number | "all") => void
  onSemesterFilterChange: (semester: number | "all") => void
  onAcademicYearFilterChange: (academicYear: string) => void
}

function getYearLabel(yearLevel: number | "all"): string {
  if (yearLevel === "all") {
    return "All Years"
  }

  if (yearLevel === 1) {
    return "1st Year"
  }

  if (yearLevel === 2) {
    return "2nd Year"
  }

  if (yearLevel === 3) {
    return "3rd Year"
  }

  return "4th Year"
}

function getSemesterLabel(semester: number | "all"): string {
  if (semester === "all") {
    return "All Semesters"
  }

  if (semester === 1) {
    return "1st Semester"
  }

  return "2nd Semester"
}

export function AdminClassesFilters({
  searchQuery,
  statusFilter,
  yearLevelFilter,
  semesterFilter,
  academicYearFilter,
  onSearchQueryChange,
  onStatusFilterChange,
  onYearLevelFilterChange,
  onSemesterFilterChange,
  onAcademicYearFilterChange,
}: AdminClassesFiltersProps) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showYearDropdown, setShowYearDropdown] = useState(false)
  const [showSemesterDropdown, setShowSemesterDropdown] = useState(false)
  const [showAcademicYearDropdown, setShowAcademicYearDropdown] =
    useState(false)

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
    setShowYearDropdown(false)
    setShowSemesterDropdown(false)
    setShowAcademicYearDropdown(false)
  })

  return (
    <div className="relative z-50 p-1 rounded-2xl bg-slate-900/50 backdrop-blur-md border border-white/5">
      <div className="flex flex-col md:flex-row gap-4 p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search classes by name or code..."
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all"
          />
        </div>

        <div className="relative">
          <button
            onClick={(event) => {
              event.stopPropagation()
              setShowYearDropdown(!showYearDropdown)
              setShowStatusDropdown(false)
              setShowSemesterDropdown(false)
              setShowAcademicYearDropdown(false)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white transition-all min-w-[140px] justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="capitalize">{getYearLabel(yearLevelFilter)}</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-500 transition-transform ${
                showYearDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showYearDropdown && (
            <div className="absolute top-full right-0 mt-1 min-w-[140px] w-full bg-[#0B1120] backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5">
              <div className="p-1.5 space-y-0.5">
                {[
                  { value: "all", label: "All Years" },
                  { value: 1, label: "1st Year" },
                  { value: 2, label: "2nd Year" },
                  { value: 3, label: "3rd Year" },
                  { value: 4, label: "4th Year" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onYearLevelFilterChange(option.value as number | "all")
                      setShowYearDropdown(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all border border-transparent ${
                      yearLevelFilter === option.value
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/10"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="capitalize font-medium">{option.label}</span>
                    {yearLevelFilter === option.value && (
                      <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={(event) => {
              event.stopPropagation()
              setShowSemesterDropdown(!showSemesterDropdown)
              setShowStatusDropdown(false)
              setShowYearDropdown(false)
              setShowAcademicYearDropdown(false)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white transition-all min-w-[150px] justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="capitalize">{getSemesterLabel(semesterFilter)}</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-500 transition-transform ${
                showSemesterDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showSemesterDropdown && (
            <div className="absolute top-full right-0 mt-1 min-w-[150px] w-full bg-[#0B1120] backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5">
              <div className="p-1.5 space-y-0.5">
                {[
                  { value: "all", label: "All Semesters" },
                  { value: 1, label: "1st Semester" },
                  { value: 2, label: "2nd Semester" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSemesterFilterChange(option.value as number | "all")
                      setShowSemesterDropdown(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all border border-transparent ${
                      semesterFilter === option.value
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/10"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="capitalize font-medium">{option.label}</span>
                    {semesterFilter === option.value && (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={(event) => {
              event.stopPropagation()
              setShowAcademicYearDropdown(!showAcademicYearDropdown)
              setShowStatusDropdown(false)
              setShowYearDropdown(false)
              setShowSemesterDropdown(false)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white transition-all min-w-[150px] justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="capitalize">
                {academicYearFilter === "all" ? "All A.Y." : academicYearFilter}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-500 transition-transform ${
                showAcademicYearDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showAcademicYearDropdown && (
            <div className="absolute top-full right-0 mt-1 min-w-[150px] w-full bg-[#0B1120] backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5">
              <div className="p-1.5 space-y-0.5">
                {academicYearOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onAcademicYearFilterChange(option.value)
                      setShowAcademicYearDropdown(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all border border-transparent ${
                      academicYearFilter === option.value
                        ? "bg-orange-500/10 text-orange-400 border-orange-500/10"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="capitalize font-medium">{option.label}</span>
                    {academicYearFilter === option.value && (
                      <CheckCircle className="w-3.5 h-3.5 text-orange-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={(event) => {
              event.stopPropagation()
              setShowStatusDropdown(!showStatusDropdown)
              setShowYearDropdown(false)
              setShowSemesterDropdown(false)
              setShowAcademicYearDropdown(false)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white transition-all min-w-[150px] justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span className="capitalize">
                {statusFilter === "all" ? "All Status" : statusFilter}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-500 transition-transform ${
                showStatusDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showStatusDropdown && (
            <div className="absolute top-full right-0 mt-1 min-w-[160px] w-full bg-[#0B1120] backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5">
              <div className="p-1.5 space-y-0.5">
                {(["all", "active", "archived"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      onStatusFilterChange(status)
                      setShowStatusDropdown(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all border border-transparent ${
                      statusFilter === status
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="capitalize font-medium">
                      {status === "all" ? "All Status" : status}
                    </span>
                    {statusFilter === status && (
                      <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
