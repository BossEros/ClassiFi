import { useCallback, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  GitCompare,
  Layers,
  Loader2,
  School,
  Shield,
  Users,
  X,
} from "lucide-react"
import { Card, CardContent } from "@/presentation/components/ui/Card"
import { SummaryStatCard } from "@/presentation/components/ui/SummaryStatCard"
import { SimilarityBadge } from "@/presentation/components/teacher/plagiarism/SimilarityBadge"
import { PairComparison } from "@/presentation/components/teacher/plagiarism/PairComparison"
import { PairCodeDiff } from "@/presentation/components/teacher/plagiarism/PairCodeDiff"
import type { FilePair } from "@/presentation/components/teacher/plagiarism/types"
import {
  analyzeCrossClassSimilarity,
  getLatestCrossClassReport,
  getCrossClassResultDetails,
} from "@/business/services/crossClassPlagiarismService"
import type {
  CrossClassAnalysisResponse,
  CrossClassResultDTO,
} from "@/business/services/crossClassPlagiarismService"
import { useToastStore } from "@/shared/store/useToastStore"

type CodeViewMode = "match" | "diff"

interface CrossClassResultsSectionProps {
  /** The source assignment ID. */
  assignmentId: number
}

/**
 * Detects the language from a filename extension for Monaco syntax highlighting.
 *
 * @param filename - The filename to extract the language from.
 * @returns The Monaco language identifier.
 */
function detectLanguageFromFilename(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase()

  switch (extension) {
    case "py":
      return "python"
    case "java":
      return "java"
    case "c":
    case "h":
      return "c"
    case "cpp":
    case "cc":
    case "cxx":
      return "cpp"
    case "js":
      return "javascript"
    case "ts":
      return "typescript"
    default:
      return "plaintext"
  }
}

/**
 * Self-contained section for cross-class similarity analysis.
 * Handles triggering analysis, displaying results, and viewing pair details.
 *
 * @param props - Component props containing the assignment ID.
 * @returns The cross-class results section with analysis controls and results display.
 */
export function CrossClassResultsSection({ assignmentId }: CrossClassResultsSectionProps) {
  const showToast = useToastStore((state) => state.showToast)

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoadingExisting, setIsLoadingExisting] = useState(false)
  const [report, setReport] = useState<CrossClassAnalysisResponse | null>(null)
  const [hasCheckedExisting, setHasCheckedExisting] = useState(false)

  const [selectedResult, setSelectedResult] = useState<CrossClassResultDTO | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [pairDetails, setPairDetails] = useState<FilePair | null>(null)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [codeViewMode, setCodeViewMode] = useState<CodeViewMode>("match")
  const [minimumSimilarityPercent, setMinimumSimilarityPercent] = useState(50)

  const comparisonRef = useRef<HTMLDivElement | null>(null)

  const flaggedResults = useMemo(() => {
    if (!report) return []

    return report.results.filter(
      (result) => result.isFlagged && result.hybridScore * 100 >= minimumSimilarityPercent,
    )
  }, [report, minimumSimilarityPercent])

  const handleCheckExisting = useCallback(async () => {
    setIsLoadingExisting(true)

    try {
      const existingReport = await getLatestCrossClassReport(assignmentId)
      setHasCheckedExisting(true)

      if (existingReport) {
        setReport(existingReport)
        showToast("Previous cross-class report loaded")
      }
    } catch (error) {
      console.error("Failed to check for existing cross-class report:", error)
    } finally {
      setIsLoadingExisting(false)
    }
  }, [assignmentId, showToast])

  const handleRunAnalysis = useCallback(async () => {
    setIsAnalyzing(true)
    setReport(null)
    setSelectedResult(null)
    setPairDetails(null)

    try {
      const analysisReport = await analyzeCrossClassSimilarity(assignmentId)
      setReport(analysisReport)
      setHasCheckedExisting(true)

      if (analysisReport.matchedAssignments.length === 0) {
        showToast("No matching assignments found across your classes", "info")
      } else {
        showToast("Cross-class similarity analysis completed")
      }
    } catch (error) {
      console.error("Cross-class analysis failed:", error)
      showToast(
        error instanceof Error ? error.message : "Cross-class analysis failed",
        "error",
      )
    } finally {
      setIsAnalyzing(false)
    }
  }, [assignmentId, showToast])

  const handleViewResultDetails = useCallback(async (result: CrossClassResultDTO) => {
    setSelectedResult(result)
    setIsLoadingDetails(true)
    setDetailsError(null)
    setPairDetails(null)

    try {
      const details = await getCrossClassResultDetails(result.id)

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
        similarity: details.result.structuralScore,
        overlap: details.result.overlap,
        longest: details.result.longestFragment,
        fragments: details.fragments.map((fragment, index) => ({
          id: fragment.id || index,
          leftSelection: fragment.leftSelection,
          rightSelection: fragment.rightSelection,
          length: fragment.length,
        })),
      }

      setPairDetails(filePair)

      setTimeout(() => {
        comparisonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    } catch (error) {
      console.error("Failed to fetch cross-class result details:", error)
      setDetailsError(
        error instanceof Error ? error.message : "Failed to load code comparison",
      )
      setPairDetails(null)
    } finally {
      setIsLoadingDetails(false)
    }
  }, [])

  const handleCloseDetails = useCallback(() => {
    setSelectedResult(null)
    setPairDetails(null)
    setDetailsError(null)
  }, [])

  const detectedLanguage = useMemo(() => {
    if (!pairDetails) return "plaintext"

    return detectLanguageFromFilename(pairDetails.leftFile.filename)
  }, [pairDetails])

  // ------- No report yet: show trigger section -------
  if (!report) {
    return (
      <Card className="border-slate-300 bg-white shadow-md shadow-slate-200/80">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
              <School className="h-7 w-7 text-indigo-600" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Cross-Class Similarity Check
              </h3>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                Compare submissions across your classes to detect similarity between
                students in different sections with matching assignments.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!hasCheckedExisting && (
                <button
                  type="button"
                  onClick={() => void handleCheckExisting()}
                  disabled={isLoadingExisting || isAnalyzing}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoadingExisting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  <span>{isLoadingExisting ? "Checking..." : "Load Existing Report"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => void handleRunAnalysis()}
                disabled={isAnalyzing || isLoadingExisting}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <School className="h-4 w-4" />
                )}
                <span>{isAnalyzing ? "Analyzing Across Classes..." : "Run Cross-Class Check"}</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ------- Report loaded: show results -------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div> 
          <p className="mt-1 text-sm text-slate-500">
            Source: <span className="font-medium text-slate-700">{report.sourceAssignment.name}</span>
            {" "}({report.sourceAssignment.className})
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleRunAnalysis()}
          disabled={isAnalyzing}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAnalyzing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <School className="h-4 w-4" />
          )}
          <span>{isAnalyzing ? "Re-analyzing..." : "Re-run Analysis"}</span>
        </button>
      </div>

      {/* Matched assignments */}
      {report.matchedAssignments.length > 0 && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
          <h3 className="mb-2 text-sm font-semibold text-indigo-800">
            Matched Assignments ({report.matchedAssignments.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {report.matchedAssignments.map((matched) => (
              <span
                key={matched.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-800"
              >
                <School className="h-3 w-3 text-indigo-500" />
                {matched.name}
                <span className="text-indigo-400">·</span>
                <span className="text-indigo-500">{matched.className}</span>
                <span className="text-indigo-400">
                  ({Math.round(matched.nameSimilarity * 100)}% name match)
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Threshold slider */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <span className="shrink-0 text-xs font-semibold text-slate-600">Threshold</span>
        <input
          type="range"
          min={25}
          max={100}
          step={1}
          value={minimumSimilarityPercent}
          onChange={(event) => setMinimumSimilarityPercent(Number(event.target.value))}
          className="h-1.5 w-40 cursor-pointer appearance-none rounded-full bg-slate-200 accent-teal-600"
          aria-label="Similarity threshold"
        />
        <span className="shrink-0 text-xs font-semibold text-slate-700">&gt;= {minimumSimilarityPercent}%</span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryStatCard
          label="Submissions Compared"
          value={report.summary.totalSubmissions}
          icon={Users}
          variant="light"
          className="border-slate-300 shadow-md shadow-slate-200/70"
          iconContainerClassName="h-auto w-auto rounded-none bg-transparent p-0"
          iconClassName="h-7 w-7 text-indigo-600"
        />
        <SummaryStatCard
          label="Total Comparisons"
          value={report.summary.totalComparisons}
          icon={GitCompare}
          variant="light"
          className="border-slate-300 shadow-md shadow-slate-200/70"
          iconContainerClassName="h-auto w-auto rounded-none bg-transparent p-0"
          iconClassName="h-7 w-7 text-sky-600"
        />
        <SummaryStatCard
          label="Flagged Pairs"
          value={report.summary.flaggedPairs}
          icon={AlertTriangle}
          variant="light"
          className="border-slate-300 shadow-md shadow-slate-200/70"
          iconContainerClassName="h-auto w-auto rounded-none bg-transparent p-0"
          iconClassName="h-7 w-7 text-rose-600"
        />
        <SummaryStatCard
          label="Avg Similarity"
          value={`${(report.summary.averageSimilarity * 100).toFixed(1)}%`}
          icon={BarChart3}
          variant="light"
          className="border-slate-300 shadow-md shadow-slate-200/70"
          iconContainerClassName="h-auto w-auto rounded-none bg-transparent p-0"
          iconClassName="h-7 w-7 text-amber-600"
        />
      </div>

      {/* No matches found */}
      {report.matchedAssignments.length === 0 && (
        <Card className="border-amber-200 bg-amber-50/80 shadow-md shadow-amber-100/80">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
              <p className="text-sm text-amber-700">
                No matching assignments were found across your classes.
                Cross-class detection requires at least one other class with an assignment
                that has a similar name and the same programming language.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flagged results table */}
      {flaggedResults.length > 0 && (
        <Card className="border-slate-300 bg-white shadow-md shadow-slate-200/80">
          <CardContent className="p-6">
            <h3 className="mb-4 text-base font-semibold text-slate-900">
              Flagged Pairs ({flaggedResults.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-3">Student 1</th>
                    <th className="px-3 py-3">Class</th>
                    <th className="px-3 py-3">Student 2</th>
                    <th className="px-3 py-3">Class</th>
                    <th className="px-3 py-3 text-center">Hybrid</th>
                    <th className="px-3 py-3 text-center">Structural</th>
                    <th className="px-3 py-3 text-center">Semantic</th>
                    <th className="px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {flaggedResults.map((result) => (
                    <tr
                      key={result.id}
                      className={`transition-colors duration-150 hover:bg-slate-50 ${
                        selectedResult?.id === result.id ? "bg-indigo-50/60" : ""
                      }`}
                    >
                      <td className="px-3 py-3 font-medium text-slate-800">
                        {result.student1Name}
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {result.class1Name}
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-800">
                        {result.student2Name}
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {result.class2Name}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <SimilarityBadge similarity={result.hybridScore} size="small" showLabel={false} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs text-slate-600">
                          {(result.structuralScore * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs text-slate-600">
                          {(result.semanticScore * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => void handleViewResultDetails(result)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          Compare <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Code comparison panel */}
      {selectedResult && (
        <div ref={comparisonRef} className="scroll-mt-24">
          <Card className="border-slate-300 bg-white shadow-md shadow-slate-200/80">
            <CardContent className="p-6">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {selectedResult.student1Name} vs {selectedResult.student2Name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedResult.class1Name} · {selectedResult.assignment1Name}
                    {" ↔ "}
                    {selectedResult.class2Name} · {selectedResult.assignment2Name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseDetails}
                  className="group flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900"
                >
                  <X className="h-4 w-4 transition-colors" />
                  <span className="text-sm font-medium">Close</span>
                </button>
              </div>

              {/* View mode toggle */}
              <div className="mb-6 flex justify-center">
                <div className="flex gap-1 rounded-xl border border-slate-300 bg-slate-100 p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setCodeViewMode("match")}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                      codeViewMode === "match"
                        ? "border border-indigo-500/30 bg-indigo-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    <Layers className="h-4 w-4" />
                    Match View
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeViewMode("diff")}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                      codeViewMode === "diff"
                        ? "border border-indigo-500/30 bg-indigo-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    <GitCompare className="h-4 w-4" />
                    Diff View
                  </button>
                </div>
              </div>

              {isLoadingDetails && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  <span className="ml-3 text-slate-500">Loading code comparison...</span>
                </div>
              )}

              {detailsError && (
                <div className="py-8 text-center">
                  <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-rose-500" />
                  <p className="text-rose-700">{detailsError}</p>
                </div>
              )}

              {pairDetails && codeViewMode === "match" && (
                <PairComparison pair={pairDetails} language={detectedLanguage} editorHeight={480} variant="light" />
              )}

              {pairDetails && codeViewMode === "diff" && (
                <PairCodeDiff
                  leftFile={pairDetails.leftFile}
                  rightFile={pairDetails.rightFile}
                  language={detectedLanguage}
                  height={480}
                  variant="light"
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
