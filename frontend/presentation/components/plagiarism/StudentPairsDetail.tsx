import React, { useState, useMemo } from "react"
import { ArrowLeft } from "lucide-react"
import type { StudentSummary } from "@/data/api/types"
import type { PairResponse } from "@/data/api/types"
import { OriginalityBadge } from "./OriginalityBadge"
import { SimilarityBadge } from "./SimilarityBadge"

type SortKey = "similarity" | "overlap" | "longest"
type SortOrder = "asc" | "desc"

interface StudentPairsDetailProps {
    /** The selected student */
    student: StudentSummary
    /** Array of pairs involving this student */
    pairs: PairResponse[]
    /** Callback when a pair is selected for code comparison */
    onPairSelect: (pair: PairResponse) => void
    /** Callback when back button is clicked */
    onBack: () => void
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
 * Component showing all pairwise comparisons for a selected student.
 * Displays student info, originality score, and a table of all their pairs.
 */
export const StudentPairsDetail: React.FC<StudentPairsDetailProps> = ({
    student,
    pairs,
    onPairSelect,
    onBack,
    isLoading = false,
}) => {
    const [sortKey, setSortKey] = useState<SortKey>("similarity")
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

    // Sort pairs
    const sortedPairs = useMemo(() => {
        return [...pairs].sort((a, b) => {
            let comparison = 0
            switch (sortKey) {
                case "similarity":
                    comparison = a.hybridScore - b.hybridScore
                    break
                case "overlap":
                    comparison = a.overlap - b.overlap
                    break
                case "longest":
                    comparison = a.longest - b.longest
                    break
            }
            return sortOrder === "desc" ? -comparison : comparison
        })
    }, [pairs, sortKey, sortOrder])

    // Handle sort
    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortKey(key)
            setSortOrder("desc")
        }
    }

    // Determine which file is the other student
    const getOtherStudent = (pair: PairResponse) => {
        if (pair.leftFile.id === student.submissionId) {
            return {
                name: pair.rightFile.studentName || "Unknown",
                filename: pair.rightFile.filename,
            }
        }
        return {
            name: pair.leftFile.studentName || "Unknown",
            filename: pair.leftFile.filename,
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-xl border border-white/10 bg-black/20 backdrop-blur-md p-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Students
                </button>

                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {student.studentName}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-slate-300">
                            <span>Submission ID: {student.submissionId}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="mb-2">
                            <OriginalityBadge
                                originalityScore={student.originalityScore}
                                size="lg"
                            />
                        </div>
                        <div className="text-xs text-slate-400">
                            Highest similarity: {Math.round(student.highestSimilarity * 100)}%
                        </div>
                    </div>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                            {student.totalPairs}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Total Pairs</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">
                            {student.suspiciousPairs}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Suspicious Pairs</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                            {student.highestMatchWith.studentName}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Highest Match</div>
                    </div>
                </div>
            </div>

            {/* Pairs table */}
            <div className="rounded-xl border border-white/10 bg-black/20 backdrop-blur-md overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-white">
                        Pairwise Comparisons
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        All similarity pairs involving this student
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-slate-400">Loading pairs...</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                                        Other Student
                                    </th>
                                    <th
                                        onClick={() => handleSort("similarity")}
                                        className="px-6 py-4 text-center text-sm font-semibold text-slate-300 cursor-pointer hover:text-white transition-colors select-none"
                                    >
                                        Similarity <SortIndicator column="similarity" currentSort={sortKey} sortOrder={sortOrder} />
                                    </th>
                                    <th
                                        onClick={() => handleSort("overlap")}
                                        className="px-6 py-4 text-center text-sm font-semibold text-slate-300 cursor-pointer hover:text-white transition-colors select-none"
                                    >
                                        Overlap <SortIndicator column="overlap" currentSort={sortKey} sortOrder={sortOrder} />
                                    </th>
                                    <th
                                        onClick={() => handleSort("longest")}
                                        className="px-6 py-4 text-center text-sm font-semibold text-slate-300 cursor-pointer hover:text-white transition-colors select-none"
                                    >
                                        Longest Match <SortIndicator column="longest" currentSort={sortKey} sortOrder={sortOrder} />
                                    </th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedPairs.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-12 text-center text-slate-400"
                                        >
                                            No pairs found for this student.
                                        </td>
                                    </tr>
                                ) : (
                                    sortedPairs.map((pair) => {
                                        const otherStudent = getOtherStudent(pair)
                                        const similarity = pair.hybridScore / 100

                                        return (
                                            <tr
                                                key={pair.id}
                                                className="border-b border-white/5 hover:bg-white/5 transition-all duration-200 cursor-pointer"
                                                onClick={() => onPairSelect(pair)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-white font-medium">
                                                        {otherStudent.name}
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-0.5">
                                                        {otherStudent.filename}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center">
                                                        <SimilarityBadge
                                                            similarity={similarity}
                                                            size="small"
                                                            showLabel={false}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm text-slate-300">
                                                    {pair.overlap}
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm text-slate-300">
                                                    {pair.longest} k-grams
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onPairSelect(pair)
                                                        }}
                                                        className="px-3 py-1.5 text-xs font-medium text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 rounded-lg transition-all duration-200"
                                                    >
                                                        Compare Code
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default StudentPairsDetail
