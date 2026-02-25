import React, { useState, useMemo, useEffect } from "react"
import type { StudentSummary } from "@/business/services/plagiarismService"
import { OriginalityBadge } from "./OriginalityBadge"
import { TablePaginationFooter } from "@/presentation/components/ui/TablePaginationFooter"

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
  /** Optional external search query. */
  searchQuery?: string
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
  searchQuery = "",
}) => {
  const [sortKey, setSortKey] = useState<SortKey>("originality")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

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
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage))
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading students...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
                Suspicious
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
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
                    <td className="px-6 py-4 text-center">
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
      <TablePaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredStudents.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}

export default StudentSummaryTable
