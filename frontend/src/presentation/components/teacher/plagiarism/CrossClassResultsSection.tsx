import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  BookOpen,
  ChevronDown,
  CircleHelp,
  Download,
  FileCode,
  GitCompare,
  Info,
  Layers,
  Loader2,
  School,
  Users,
  X,
} from "lucide-react"
import { Card, CardContent } from "@/presentation/components/ui/Card"
import { SummaryStatCard } from "@/presentation/components/ui/SummaryStatCard"
import { TablePaginationFooter } from "@/presentation/components/ui/TablePaginationFooter"
import { SimilarityBadge } from "@/presentation/components/teacher/plagiarism/SimilarityBadge"
import { PairComparison } from "@/presentation/components/teacher/plagiarism/PairComparison"
import { PairCodeDiff } from "@/presentation/components/teacher/plagiarism/PairCodeDiff"
import { SimilarityThresholdSlider } from "@/presentation/components/teacher/plagiarism/SimilarityThresholdSlider"
import type { FilePair } from "@/presentation/components/teacher/plagiarism/types"
import {
  buildCrossClassReportData,
  buildCrossClassPairReportData,
  ClassSimilarityReportDocument,
  PairSimilarityReportDocument,
  toFileNameSegment,
} from "@/presentation/components/teacher/plagiarism/pdf/similarityReportPdf"
import { downloadPdfDocument } from "@/presentation/utils/pdfDownload"
import {
  analyzeCrossClassSimilarity,
  getLatestCrossClassReport,
  getCrossClassResultDetails,
} from "@/business/services/crossClassPlagiarismService"
import type {
  CrossClassAnalysisResponse,
  CrossClassResultDTO,
} from "@/business/services/crossClassPlagiarismService"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { useToastStore } from "@/shared/store/useToastStore"
import { detectLanguageFromFilename } from "@/shared/utils/languageDetection"

type CodeViewMode = "match" | "diff"
type SortableColumn = "hybridScore" | "structuralScore" | "semanticScore"
type SortDirection = "asc" | "desc"

const SortIndicator: React.FC<{
  column: SortableColumn
  currentSort: SortableColumn
  sortDirection: SortDirection
}> = ({ column, currentSort, sortDirection }) => {
  if (currentSort !== column) return null
  return sortDirection === "desc"
    ? <ArrowDown className="inline h-3.5 w-3.5 text-teal-600" aria-hidden="true" />
    : <ArrowUp className="inline h-3.5 w-3.5 text-teal-600" aria-hidden="true" />
}

interface DownloadClassReportAction {
  action: () => Promise<void>
  isDisabled: boolean
}

interface CrossClassResultsSectionProps {
  /** The source assignment ID. */
  assignmentId: number
  /** Whether the current navigation explicitly requested a fresh comparison. */
  shouldRunInitialAnalysis?: boolean
  /** Setter that exposes the download-class-report action to the parent page header. */
  setDownloadClassReportAction?: React.Dispatch<React.SetStateAction<DownloadClassReportAction | null>>
}

function getCrossClassAnalysisToastConfig(
  analysisReport: CrossClassAnalysisResponse,
): { message: string; type: "success" | "info" } {
  if (analysisReport.matchedAssignments.length === 0) {
    return {
      message: "No matching assignments found across your classes",
      type: "info",
    }
  }

  return {
    message: "Cross-class similarity analysis completed",
    type: "success",
  }
}

function formatWeightPercent(weight: number): string {
  return `${Math.round(weight * 100)}%`
}

function getOverallSimilarityTooltipText(scoringWeights: { structuralWeight: number; semanticWeight: number }): string {
  return `Overall Similarity = ${formatWeightPercent(scoringWeights.structuralWeight)} Structural + ${formatWeightPercent(scoringWeights.semanticWeight)} Semantic. This hybrid score combines both analyses to produce a single confidence metric.`
}

function getStructuralSimilarityTooltipText(): string {
  return "Structural Similarity measures how closely two code files share the same code structure using k-gram fingerprinting (Winnowing algorithm). It detects copied patterns, renamed variables, and reordered statements."
}

function getSemanticSimilarityTooltipText(): string {
  return "Semantic Similarity uses AI (GraphCodeBERT) to detect meaning-level similarity. It catches code that solves problems the same way even if written with different syntax or structure."
}

/**
 * Self-contained section for cross-class similarity analysis.
 * Handles triggering analysis, displaying results, and viewing pair details.
 *
 * @param props - Component props containing the assignment ID.
 * @returns The cross-class results section with analysis controls and results display.
 */
export function CrossClassResultsSection({
  assignmentId,
  shouldRunInitialAnalysis = false,
  setDownloadClassReportAction,
}: CrossClassResultsSectionProps) {
  const showToast = useToastStore((state) => state.showToast)
  const user = useAuthStore((state) => state.user)

  const [report, setReport] = useState<CrossClassAnalysisResponse | null>(null)
  const [isInitializingReport, setIsInitializingReport] = useState(true)
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false)
  const [reportLoadError, setReportLoadError] = useState<string | null>(null)

  const [selectedResult, setSelectedResult] = useState<CrossClassResultDTO | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [pairDetails, setPairDetails] = useState<FilePair | null>(null)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [codeViewMode, setCodeViewMode] = useState<CodeViewMode>("match")
  const [minimumSimilarityPercent, setMinimumSimilarityPercent] = useState(50)
  const [sortColumn, setSortColumn] = useState<SortableColumn>("hybridScore")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [isDownloadingClassReport, setIsDownloadingClassReport] = useState(false)
  const [isDownloadingPairReport, setIsDownloadingPairReport] = useState(false)
  const [isMethodologyExpanded, setIsMethodologyExpanded] = useState(false)

  const comparisonRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let isDisposed = false

    setIsInitializingReport(true)
    setIsRunningAnalysis(false)
    setReportLoadError(null)
    setReport(null)
    setSelectedResult(null)
    setPairDetails(null)
    setDetailsError(null)

    const initializeReport = async () => {
      try {
        if (!shouldRunInitialAnalysis) {
          const latestReport = await getLatestCrossClassReport(assignmentId)

          if (isDisposed) {
            return
          }

          if (latestReport) {
            setReport(latestReport)
            return
          }
        }

        setIsRunningAnalysis(true)

        const analysisReport = await analyzeCrossClassSimilarity(assignmentId)

        if (isDisposed) {
          return
        }

        setReport(analysisReport)

        const toastConfig = getCrossClassAnalysisToastConfig(analysisReport)
        showToast(toastConfig.message, toastConfig.type)
      } catch (error) {
        if (isDisposed) {
          return
        }

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load cross-class similarity results"

        setReportLoadError(errorMessage)
        showToast(errorMessage, "error")
      } finally {
        if (!isDisposed) {
          setIsInitializingReport(false)
          setIsRunningAnalysis(false)
        }
      }
    }

    void initializeReport()

    return () => {
      isDisposed = true
    }
  }, [assignmentId, shouldRunInitialAnalysis, showToast])

  const handleRunAnalysis = useCallback(async () => {
    setIsInitializingReport(false)
    setIsRunningAnalysis(true)
    setReportLoadError(null)
    setSelectedResult(null)
    setPairDetails(null)
    setDetailsError(null)

    try {
      const analysisReport = await analyzeCrossClassSimilarity(assignmentId)

      setReport(analysisReport)

      const toastConfig = getCrossClassAnalysisToastConfig(analysisReport)
      showToast(toastConfig.message, toastConfig.type)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Cross-class analysis failed"

      setReportLoadError(errorMessage)
      showToast(errorMessage, "error")
    } finally {
      setIsRunningAnalysis(false)
    }
  }, [assignmentId, showToast])

  const flaggedResults = useMemo(() => {
    if (!report) return []

    return report.results.filter(
      (result) => result.hybridScore * 100 >= minimumSimilarityPercent,
    )
  }, [report, minimumSimilarityPercent])
  const suspiciousPairCount = flaggedResults.length

  const handleSortColumn = useCallback((column: SortableColumn) => {
    if (sortColumn === column) {
      setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"))
    } else {
      setSortColumn(column)
      setSortDirection("desc")
    }
    setCurrentPage(1)
  }, [sortColumn])

  // Reset page when threshold or sort changes
  useEffect(() => {
    setCurrentPage(1)
  }, [minimumSimilarityPercent])

  const ROWS_PER_PAGE = 10

  const sortedResults = useMemo(() => {
    return [...flaggedResults].sort((a, b) => {
      const multiplier = sortDirection === "asc" ? 1 : -1

      return (a[sortColumn] - b[sortColumn]) * multiplier
    })
  }, [flaggedResults, sortColumn, sortDirection])

  const totalPages = Math.max(1, Math.ceil(sortedResults.length / ROWS_PER_PAGE))

  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE

    return sortedResults.slice(startIndex, startIndex + ROWS_PER_PAGE)
  }, [sortedResults, currentPage])

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
          studentName: details.leftFile.studentName,
          submittedAt: details.leftFile.submittedAt,
        },
        rightFile: {
          id: details.result.submission2Id,
          path: details.rightFile.filename,
          filename: details.rightFile.filename,
          content: details.rightFile.content,
          lineCount: details.rightFile.lineCount,
          studentName: details.rightFile.studentName,
          submittedAt: details.rightFile.submittedAt,
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

  const handleDownloadClassReport = useCallback(async () => {
    if (!report) return

    try {
      setIsDownloadingClassReport(true)
      const reportData = buildCrossClassReportData({ report, teacher: user, minimumSimilarityPercent })

      await downloadPdfDocument({
        document: <ClassSimilarityReportDocument data={reportData} />,
        fileName: `${toFileNameSegment(report.sourceAssignment.name)}-cross-class-similarity-threshold-${minimumSimilarityPercent}.pdf`,
      })

      showToast("Cross-class similarity report downloaded successfully")
    } catch {
      showToast("Failed to download cross-class similarity report", "error")
    } finally {
      setIsDownloadingClassReport(false)
    }
  }, [report, user, minimumSimilarityPercent, showToast])

  const handleDownloadPairReport = useCallback(async () => {
    if (!report || !selectedResult || !pairDetails) return

    try {
      setIsDownloadingPairReport(true)
      const reportData = buildCrossClassPairReportData({ report, teacher: user, selectedResult, pairDetails })

      await downloadPdfDocument({
        document: <PairSimilarityReportDocument data={reportData} />,
        fileName: `${toFileNameSegment(report.sourceAssignment.name)}-${toFileNameSegment(selectedResult.student1Name)}-vs-${toFileNameSegment(selectedResult.student2Name)}.pdf`,
      })

      showToast("Pairwise similarity report downloaded successfully")
    } catch {
      showToast("Failed to download pairwise similarity report", "error")
    } finally {
      setIsDownloadingPairReport(false)
    }
  }, [report, user, selectedResult, pairDetails, showToast])

  useEffect(() => {
    if (!setDownloadClassReportAction) return

    setDownloadClassReportAction(
      report
        ? { action: handleDownloadClassReport, isDisabled: isDownloadingClassReport }
        : null,
    )
  }, [report, isDownloadingClassReport, handleDownloadClassReport, setDownloadClassReportAction])

  const detectedLanguage = useMemo(() => {
    if (!pairDetails) return "plaintext"

    return detectLanguageFromFilename(pairDetails.leftFile.filename)
  }, [pairDetails])

  if (!report && isInitializingReport) {
    return (
      <Card className="border-slate-300 bg-white shadow-md shadow-slate-200/80">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium text-slate-500">
              Loading the latest cross-class similarity report...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!report) {
    return (
      <Card className="border-slate-300 bg-white shadow-md shadow-slate-200/80">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <AlertTriangle className="h-8 w-8 text-rose-500" />
            <p className="text-sm font-medium text-slate-700">
              {reportLoadError ?? "No cross-class similarity report is available yet."}
            </p>
            <button
              type="button"
              onClick={() => void handleRunAnalysis()}
              disabled={isRunningAnalysis}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRunningAnalysis ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GitCompare className="h-4 w-4" />
              )}
              <span>
                {isRunningAnalysis ? "Running Comparison..." : "Run Cross-Class Comparison"}
              </span>
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ------- Report loaded: show results -------
  return (
    <div className="space-y-6">
      {/* Matched assignments */}
      {report.matchedAssignments.length > 0 && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
          <h3 className="mb-3 text-sm font-semibold text-indigo-800">
            Matched Assignments ({report.matchedAssignments.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {report.matchedAssignments.map((matched) => (
              <div
                key={matched.id}
                className="inline-flex items-start gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 shadow-sm"
              >
                <School className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-indigo-500" />
                <div>
                  <p className="text-xs font-semibold text-indigo-800">{matched.name}</p>
                  <p className="text-xs text-indigo-600">{matched.className}</p>
                  <div className="mt-0.5 flex items-center gap-1">
                    <BookOpen className="h-2.5 w-2.5 text-indigo-300" />
                    <span className="text-[10px] leading-tight text-indigo-400">{matched.classCode}</span>
                    <span className="text-[10px] leading-tight text-indigo-300">·</span>
                    <span className="text-[10px] leading-tight text-indigo-400">{Math.round(matched.nameSimilarity * 100)}% name match</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryStatCard
          label="Submissions"
          value={report.summary.totalSubmissions}
          icon={Users}
          variant="light"
          className="border-slate-300 shadow-md shadow-slate-200/70"
          iconContainerClassName="h-auto w-auto rounded-none bg-transparent p-0"
          iconClassName="h-7 w-7 text-teal-600"
        />
        <SummaryStatCard
          label="Suspicious Pair"
          value={suspiciousPairCount}
          icon={AlertTriangle}
          variant="light"
          className="border-slate-300 shadow-md shadow-slate-200/70"
          iconContainerClassName="h-auto w-auto rounded-none bg-transparent p-0"
          iconClassName="h-7 w-7 text-rose-600"
        />
        <SummaryStatCard
          label="Average Similarity"
          value={`${(report.summary.averageSimilarity * 100).toFixed(1)}%`}
          icon={BarChart3}
          variant="light"
          className="border-slate-300 shadow-md shadow-slate-200/70"
          iconContainerClassName="h-auto w-auto rounded-none bg-transparent p-0"
          iconClassName="h-7 w-7 text-sky-600"
        />
        <SummaryStatCard
          label="Max Similarity"
          value={`${(report.summary.maxSimilarity * 100).toFixed(1)}%`}
          icon={FileCode}
          variant="light"
          className="border-slate-300 shadow-md shadow-slate-200/70"
          iconContainerClassName="h-auto w-auto rounded-none bg-transparent p-0"
          iconClassName="h-7 w-7 text-amber-600"
        />
      </div>

      {/* Threshold slider */}
      <div className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <SimilarityThresholdSlider
          minimumSimilarityPercent={minimumSimilarityPercent}
          min={25}
          max={100}
          size="large"
          onMinimumSimilarityPercentChange={setMinimumSimilarityPercent}
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

      {/* How Scoring Works */}
      <Card className="border-slate-300 bg-white shadow-md shadow-slate-200/80">
        <CardContent className="p-0">
          <button
            type="button"
            onClick={() => setIsMethodologyExpanded((prev) => !prev)}
            className={`flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-slate-50 ${isMethodologyExpanded ? "rounded-t-xl" : "rounded-xl"}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                <Info className="h-4 w-4 text-teal-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  How Scoring Works
                </h3>
                <p className="text-xs text-slate-500">
                  Understand how similarity scores are calculated
                </p>
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                isMethodologyExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {isMethodologyExpanded && (
            <div className="border-t border-slate-200 px-6 pb-6 pt-4">
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 shadow-sm">
                  <h4 className="mb-2 text-sm font-semibold text-teal-800">
                    Overall Similarity Formula
                  </h4>
                  <div className="mb-3 rounded-lg bg-white px-3 py-2 font-mono text-sm text-slate-700">
                    <span className="font-semibold text-teal-700">
                      {formatWeightPercent(report.scoringWeights.structuralWeight)}
                    </span>{" "}
                    Structural +{" "}
                    <span className="font-semibold text-indigo-700">
                      {formatWeightPercent(report.scoringWeights.semanticWeight)}
                    </span>{" "}
                    Semantic
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600">
                    The Overall Similarity score is a weighted hybrid of both
                    analyses. Pairs meeting or exceeding the threshold set
                    by the slider above are flagged as suspicious.
                  </p>
                </div>

                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
                  <h4 className="mb-2 text-sm font-semibold text-sky-800">
                    Structural Analysis ({formatWeightPercent(report.scoringWeights.structuralWeight)})
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Uses <span className="font-semibold">k-gram fingerprinting</span>{" "}
                    (Winnowing algorithm) to compare code structure. It detects
                    copied code patterns even when variables are renamed,
                    statements are reordered, or formatting is changed. Template
                    and boilerplate code is automatically excluded.
                  </p>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
                  <h4 className="mb-2 text-sm font-semibold text-indigo-800">
                    Semantic Analysis ({formatWeightPercent(report.scoringWeights.semanticWeight)})
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Uses <span className="font-semibold">AI (GraphCodeBERT)</span>{" "}
                    to understand code meaning. It catches submissions that solve
                    problems the same way even when written with completely
                    different syntax, variable names, or code structure.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flagged results table */}
      {flaggedResults.length > 0 && (
        <Card className="border-slate-300 bg-white shadow-md shadow-slate-200/80">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                Flagged Pairs ({flaggedResults.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Student 1</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Class</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Student 2</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Class</th>
                    <th
                      onClick={() => handleSortColumn("hybridScore")}
                      className="cursor-pointer select-none px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 transition-colors hover:text-slate-900"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span>Overall Similarity</span>
                        <span
                          title={getOverallSimilarityTooltipText(report.scoringWeights)}
                          aria-label={getOverallSimilarityTooltipText(report.scoringWeights)}
                          className="text-slate-500"
                        >
                          <CircleHelp className="h-3.5 w-3.5" />
                        </span>
                        <SortIndicator column="hybridScore" currentSort={sortColumn} sortDirection={sortDirection} />
                      </span>
                    </th>
                    <th
                      onClick={() => handleSortColumn("structuralScore")}
                      className="cursor-pointer select-none px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 transition-colors hover:text-slate-900"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span>Structural Similarity</span>
                        <span
                          title={getStructuralSimilarityTooltipText()}
                          aria-label={getStructuralSimilarityTooltipText()}
                          className="text-slate-500"
                        >
                          <CircleHelp className="h-3.5 w-3.5" />
                        </span>
                        <SortIndicator column="structuralScore" currentSort={sortColumn} sortDirection={sortDirection} />
                      </span>
                    </th>
                    <th
                      onClick={() => handleSortColumn("semanticScore")}
                      className="cursor-pointer select-none px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 transition-colors hover:text-slate-900"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span>Semantic Similarity</span>
                        <span
                          title={getSemanticSimilarityTooltipText()}
                          aria-label={getSemanticSimilarityTooltipText()}
                          className="text-slate-500"
                        >
                          <CircleHelp className="h-3.5 w-3.5" />
                        </span>
                        <SortIndicator column="semanticScore" currentSort={sortColumn} sortDirection={sortDirection} />
                      </span>
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedResults.map((result) => (
                    <tr
                      key={result.id}
                      className={`transition-colors duration-150 hover:bg-slate-50 ${
                        selectedResult?.id === result.id ? "bg-indigo-50/60" : ""
                      }`}
                    >
                      <td className="px-3 py-3 font-medium text-slate-800">
                        {result.student1Name}
                      </td>
                      <td className="px-3 py-3">
                        <div className="space-y-0.5">
                          <p className="text-sm text-slate-700">{result.class1Name}</p>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-2.5 w-2.5 text-slate-300" />
                            <p className="text-[10px] leading-tight text-slate-400">{result.class1Code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-800">
                        {result.student2Name}
                      </td>
                      <td className="px-3 py-3">
                        <div className="space-y-0.5">
                          <p className="text-sm text-slate-700">{result.class2Name}</p>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-2.5 w-2.5 text-slate-300" />
                            <p className="text-[10px] leading-tight text-slate-400">{result.class2Code}</p>
                          </div>
                        </div>
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
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                        >
                          Compare <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <TablePaginationFooter
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={sortedResults.length}
              itemsPerPage={ROWS_PER_PAGE}
              onPageChange={setCurrentPage}
              variant="light"
            />
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

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void handleDownloadPairReport()}
                    disabled={isLoadingDetails || !pairDetails || isDownloadingPairReport}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDownloadingPairReport ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>{isDownloadingPairReport ? "Preparing Pair PDF..." : "Download Pair Report"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseDetails}
                    className="group flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <X className="h-4 w-4 transition-colors" />
                    <span className="text-sm font-medium">Close</span>
                  </button>
                </div>
              </div>

              {/* View mode toggle */}
              <div className="mb-6 flex justify-center">
                <div className="flex gap-1 rounded-xl border border-slate-300 bg-slate-100 p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setCodeViewMode("match")}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                      codeViewMode === "match"
                        ? "border border-teal-500/30 bg-teal-600 text-white shadow-sm"
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
                        ? "border border-teal-500/30 bg-teal-600 text-white shadow-sm"
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
