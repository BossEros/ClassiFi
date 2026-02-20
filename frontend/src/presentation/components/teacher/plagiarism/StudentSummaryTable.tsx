import React, { useState, useMemo } from "react"
import { Search, X } from "lucide-react"
import type { StudentSummary } from "@/business/services/plagiarismService"
import { OriginalityBadge } from "./OriginalityBadge"

type SortKey = "name" | "originality" | "similarity"
type SortOrder = "asc" | "desc"

interface StudentSummaryTableProps {
  /** Array of student summaries to display */
  students: StudentSummary[]
  /** Callback when a student is selected */
  onStudentSelect: (student: StudentSummary) => void
  /** Currently selected student (for highlighting) */
  selectedStudent?: StudentSummary | null
  /** Loading state */
  isLoading?: boolean
}

/**
 * Sort indicator component for table headers
 */
const SortIndicator: React.FC<{
  column: SortKey
  currentSort: SortKey
  sortOrder: SortOrder
}> = ({ column, currentSort, sortOrder }) => {
  if (currentSort !== column) return null
  return (
    <span className="ml-1 text-teal-400">
      {sortOrder === "desc" ? "↓" : "↑"}
    </span>
  )
}

/**
 * Table displaying student originality scores with sorting, search, and pagination.
 * Shows students sorted by originality (lowest first) to highlight concerning cases.
 */
export const StudentSummaryTable: React.FC<StudentSummaryTableProps> = ({
  students,
  onStudentSelect,
  selectedStudent,
  isLoading = false,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>("originality")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const itemsPerPage = 25

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    let result = students

    // Apply search filter
    if (searchQuery) {
      const lowerSearch = searchQuery.toLowerCase()
      result = result.filter((student) =>
        student.studentName.toLowerCase().includes(lowerSearch),
      )
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0
      switch (sortKey) {
        case "name":
          comparison = a.studentName.localeCompare(b.studentName)
          break
        case "originality":
          comparison = a.originalityScore - b.originalityScore
          break
        case "similarity":
          comparison = a.highestSimilarity - b.highestSimilarity
          break
      }
      return sortOrder === "desc" ? -comparison : comparison
    })

    return result
  }, [students, searchQuery, sortKey, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredStudents.slice(start, start + itemsPerPage)
  }, [filteredStudents, currentPage])

  // Handle sort
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder(key === "originality" ? "asc" : "desc")
    }
  }

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading students...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by student name..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full h-10 pl-10 pr-10 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm text-sm text-white placeholder:text-slate-400 transition-all duration-200 hover:bg-white/10 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-teal-600/50 focus:border-teal-600/50 focus:bg-white/10"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20 backdrop-blur-md">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th
                onClick={() => handleSort("name")}
                className="px-6 py-4 text-left text-sm font-semibold text-slate-300 cursor-pointer hover:text-white transition-colors select-none"
              >
                Student Name{" "}
                <SortIndicator
                  column="name"
                  currentSort={sortKey}
                  sortOrder={sortOrder}
                />
              </th>
              <th
                onClick={() => handleSort("originality")}
                className="px-6 py-4 text-center text-sm font-semibold text-slate-300 cursor-pointer hover:text-white transition-colors select-none"
              >
                Originality{" "}
                <SortIndicator
                  column="originality"
                  currentSort={sortKey}
                  sortOrder={sortOrder}
                />
              </th>
              <th
                onClick={() => handleSort("similarity")}
                className="px-6 py-4 text-center text-sm font-semibold text-slate-300 cursor-pointer hover:text-white transition-colors select-none"
              >
                Highest Similarity{" "}
                <SortIndicator
                  column="similarity"
                  currentSort={sortKey}
                  sortOrder={sortOrder}
                />
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                Matched With
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">
                Total Pairs
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">
                Suspicious
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-slate-400"
                >
                  {searchQuery
                    ? "No students found matching your search."
                    : "No students to display."}
                </td>
              </tr>
            ) : (
              paginatedStudents.map((student) => {
                const isSelected =
                  selectedStudent?.studentId === student.studentId
                return (
                  <tr
                    key={student.studentId}
                    className={`border-b border-white/5 transition-all duration-200 cursor-pointer ${
                      isSelected ? "bg-teal-500/10" : "hover:bg-white/5"
                    }`}
                    onClick={() => onStudentSelect(student)}
                  >
                    <td className="px-6 py-4 text-sm text-white font-medium">
                      {student.studentName}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <OriginalityBadge
                          originalityScore={student.originalityScore}
                          size="sm"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-300">
                      {Math.round(student.highestSimilarity * 100)}%
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {student.highestMatchWith.studentName}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-300">
                      {student.totalPairs}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${
                          student.suspiciousPairs > 0
                            ? "bg-red-500/20 text-red-400"
                            : "bg-slate-500/20 text-slate-400"
                        }`}
                      >
                        {student.suspiciousPairs}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onStudentSelect(student)
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 rounded-lg transition-all duration-200"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">
            Showing {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of{" "}
            {filteredStudents.length} students
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentSummaryTable
