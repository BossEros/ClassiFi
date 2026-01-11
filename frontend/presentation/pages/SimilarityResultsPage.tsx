import { useState, useEffect, useMemo } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { DashboardLayout } from '@/presentation/components/dashboard/DashboardLayout'
import { Card, CardContent } from '@/presentation/components/ui/Card'
import { Input } from '@/presentation/components/ui/Input'
import { BackButton } from '@/presentation/components/ui/BackButton'
import { Search, AlertTriangle, FileCode, BarChart3, Users, Loader2, X, Layers, GitCompare } from 'lucide-react'
import { SimilarityBadge } from '@/src/components/plagiarism/SimilarityBadge'
import { PairComparison } from '@/src/components/plagiarism/PairComparison'
import { PairCodeDiff } from '@/src/components/plagiarism/PairCodeDiff'
import { getResultDetails } from '@/business/services/plagiarismService'
import type { AnalyzeResponse, PairResponse } from '@/data/repositories/plagiarismRepository'
import type { FilePair } from '@/src/components/plagiarism/types'

interface LocationState {
    results: AnalyzeResponse
}

export function SimilarityResultsPage() {
    const { assignmentId } = useParams<{ assignmentId: string }>()
    const location = useLocation()

    const [results, setResults] = useState<AnalyzeResponse | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedPair, setSelectedPair] = useState<PairResponse | null>(null)
    const [sortBy, setSortBy] = useState<'similarity' | 'overlap' | 'longest'>('similarity')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    // State for code comparison
    const [isLoadingDetails, setIsLoadingDetails] = useState(false)
    const [pairDetails, setPairDetails] = useState<FilePair | null>(null)
    const [viewMode, setViewMode] = useState<'match' | 'diff'>('match')
    const [detailsError, setDetailsError] = useState<string | null>(null)

    // Load results from location state
    useEffect(() => {
        const state = location.state as LocationState | null
        if (state?.results) {
            setResults(state.results)
        }
    }, [location.state])

    // Filter and sort pairs
    const filteredPairs = useMemo(() => {
        if (!results) return []

        let pairs = [...results.pairs]

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            pairs = pairs.filter(pair =>
                pair.leftFile.studentName?.toLowerCase().includes(query) ||
                pair.rightFile.studentName?.toLowerCase().includes(query) ||
                pair.leftFile.filename.toLowerCase().includes(query) ||
                pair.rightFile.filename.toLowerCase().includes(query)
            )
        }

        // Sort
        pairs.sort((a, b) => {
            let valueA: number, valueB: number
            switch (sortBy) {
                case 'similarity':
                    valueA = a.structuralScore
                    valueB = b.structuralScore
                    break
                case 'overlap':
                    valueA = a.overlap
                    valueB = b.overlap
                    break
                case 'longest':
                    valueA = a.longest
                    valueB = b.longest
                    break
                default:
                    valueA = a.structuralScore
                    valueB = b.structuralScore
            }
            return sortOrder === 'desc' ? valueB - valueA : valueA - valueB
        })

        return pairs
    }, [results, searchQuery, sortBy, sortOrder])

    const handleSort = (key: 'similarity' | 'overlap' | 'longest') => {
        if (sortBy === key) {
            setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
        } else {
            setSortBy(key)
            setSortOrder('desc')
        }
    }

    // Handle viewing pair details with code comparison
    const handleViewDetails = async (pair: PairResponse) => {
        setSelectedPair(pair)
        setIsLoadingDetails(true)
        setDetailsError(null)
        setPairDetails(null)

        try {
            // We need to get the result ID from the database
            // For now, we use the pair's leftFile and rightFile IDs as a workaround
            // In production, the API response should include the similarity_result ID
            const details = await getResultDetails(pair.id)

            // Convert to FilePair format for PairComparison component
            const filePair: FilePair = {
                id: details.result.id,
                leftFile: {
                    id: details.result.submission1Id,
                    path: details.leftFile.filename,
                    filename: details.leftFile.filename,
                    content: details.leftFile.content,
                    lineCount: details.leftFile.lineCount,
                },
                rightFile: {
                    id: details.result.submission2Id,
                    path: details.rightFile.filename,
                    filename: details.rightFile.filename,
                    content: details.rightFile.content,
                    lineCount: details.rightFile.lineCount,
                },
                similarity: parseFloat(details.result.structuralScore),
                overlap: details.result.overlap,
                longest: details.result.longestFragment,
                fragments: details.fragments.map((f, i) => ({
                    id: f.id || i,
                    leftSelection: f.leftSelection,
                    rightSelection: f.rightSelection,
                    length: f.length,
                })),
            }

            setPairDetails(filePair)
        } catch (error) {
            console.error('Failed to fetch pair details:', error)
            setDetailsError(error instanceof Error ? error.message : 'Failed to load code comparison')
        } finally {
            setIsLoadingDetails(false)
        }
    }

    const handleCloseDetails = () => {
        setSelectedPair(null)
        setPairDetails(null)
        setDetailsError(null)
    }

    // No results state
    if (!results) {
        return (
            <DashboardLayout>
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                    <CardContent className="p-12">
                        <div className="text-center space-y-4">
                            <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto" />
                            <h3 className="text-lg font-semibold text-white">No Results Available</h3>
                            <p className="text-gray-400">Please run a similarity check first.</p>
                            <BackButton
                                to={`/dashboard/assignments/${assignmentId}/submissions`}
                                label="Go Back"
                                className="mx-auto mt-4"
                            />
                        </div>
                    </CardContent>
                </Card>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-[1600px]">
                {/* Back Button */}
                {/* Back Button */}
                <BackButton
                    to={`/dashboard/assignments/${assignmentId}/submissions`}
                    label="Back to Submissions"
                />

                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white">Similarity Analysis Results</h1>
                    <p className="text-gray-400">Report ID: {results.reportId}</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Total Pairs</p>
                                    <p className="text-xl font-bold text-white">{results.summary.totalPairs}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Suspicious</p>
                                    <p className="text-xl font-bold text-white">{results.summary.suspiciousPairs}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Avg Similarity</p>
                                    <p className="text-xl font-bold text-white">
                                        {(results.summary.averageSimilarity * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                    <FileCode className="w-5 h-5 text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Max Similarity</p>
                                    <p className="text-xl font-bold text-white">
                                        {(results.summary.maxSimilarity * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                    <div className="flex-1 max-w-md relative group">
                        <Input
                            type="text"
                            placeholder="Search by student name or file..."
                            className="pl-14 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl transition-all duration-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors">
                            <Search className="w-6 h-6 text-purple-400 group-focus-within:text-purple-300 transition-colors" />
                        </div>
                    </div>
                </div>

                {/* Pairs Table */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-4 text-sm font-medium text-gray-400">Student 1</th>
                                    <th className="text-left p-4 text-sm font-medium text-gray-400">Student 2</th>
                                    <th
                                        className="text-left p-4 text-sm font-medium text-gray-400 cursor-pointer hover:text-white"
                                        onClick={() => handleSort('similarity')}
                                    >
                                        Similarity {sortBy === 'similarity' && (sortOrder === 'desc' ? '↓' : '↑')}
                                    </th>
                                    <th
                                        className="text-left p-4 text-sm font-medium text-gray-400 cursor-pointer hover:text-white"
                                        onClick={() => handleSort('overlap')}
                                    >
                                        Overlap {sortBy === 'overlap' && (sortOrder === 'desc' ? '↓' : '↑')}
                                    </th>
                                    <th
                                        className="text-left p-4 text-sm font-medium text-gray-400 cursor-pointer hover:text-white"
                                        onClick={() => handleSort('longest')}
                                    >
                                        Longest {sortBy === 'longest' && (sortOrder === 'desc' ? '↓' : '↑')}
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPairs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-400">
                                            {searchQuery ? 'No pairs match your search' : 'No pairs to display'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPairs.map((pair) => (
                                        <tr
                                            key={`${pair.leftFile.id}-${pair.rightFile.id}`}
                                            className={`border-b border-white/5 hover:bg-white/5 transition-colors ${selectedPair === pair ? 'bg-purple-500/10' : ''
                                                }`}
                                        >
                                            <td className="p-4">
                                                <div>
                                                    <p className="text-white font-medium">
                                                        {pair.leftFile.studentName || 'Unknown'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{pair.leftFile.filename}</p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div>
                                                    <p className="text-white font-medium">
                                                        {pair.rightFile.studentName || 'Unknown'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{pair.rightFile.filename}</p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <SimilarityBadge similarity={pair.structuralScore} />
                                            </td>
                                            <td className="p-4 text-gray-300">{pair.overlap}</td>
                                            <td className="p-4 text-gray-300">{pair.longest}</td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleViewDetails(pair)}
                                                    disabled={isLoadingDetails && selectedPair === pair}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transform hover:scale-105"
                                                >
                                                    {isLoadingDetails && selectedPair === pair ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <GitCompare className="w-3.5 h-3.5" />
                                                            Compare Code
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Code Comparison Panel */}
                {selectedPair && (
                    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                        <CardContent className="p-6">
                            {/* Header row with title and close button */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-white">
                                    Code Comparison: {selectedPair.leftFile.studentName} vs {selectedPair.rightFile.studentName}
                                </h2>
                                <button
                                    onClick={handleCloseDetails}
                                    className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 backdrop-blur-sm"
                                >
                                    <X className="w-4 h-4 text-purple-200 group-hover:text-white transition-colors" />
                                    <span className="text-sm font-medium text-purple-200 group-hover:text-white transition-colors">Close</span>
                                </button>
                            </div>

                            {/* View mode toggle - separate row */}
                            <div className="flex justify-center mb-6">
                                <div className="flex bg-black/20 backdrop-blur-md border border-white/5 rounded-xl p-1 gap-1">
                                    <button
                                        onClick={() => setViewMode('match')}
                                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${viewMode === 'match'
                                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <Layers className="w-4 h-4" />
                                        Match View
                                    </button>
                                    <button
                                        onClick={() => setViewMode('diff')}
                                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${viewMode === 'diff'
                                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <GitCompare className="w-4 h-4" />
                                        Diff View
                                    </button>
                                </div>
                            </div>

                            {isLoadingDetails && (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                                    <span className="ml-3 text-gray-400">Loading code comparison...</span>
                                </div>
                            )}

                            {detailsError && (
                                <div className="text-center py-8">
                                    <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                                    <p className="text-red-400">{detailsError}</p>
                                </div>
                            )}

                            {pairDetails && viewMode === 'match' && (
                                <PairComparison
                                    pair={pairDetails}
                                    language="java"
                                    editorHeight={500}
                                    showFragmentsTable={false}
                                />
                            )}

                            {pairDetails && viewMode === 'diff' && (
                                <PairCodeDiff
                                    leftFile={pairDetails.leftFile}
                                    rightFile={pairDetails.rightFile}
                                    language="java"
                                    height={500}
                                />
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Warnings */}
                {results.warnings.length > 0 && (
                    <Card className="bg-yellow-500/10 border-yellow-500/20">
                        <CardContent className="p-4">
                            <h3 className="font-medium text-yellow-400 mb-2">Warnings</h3>
                            <ul className="list-disc list-inside text-sm text-yellow-300">
                                {results.warnings.map((warning, i) => (
                                    <li key={i}>{warning}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    )
}
