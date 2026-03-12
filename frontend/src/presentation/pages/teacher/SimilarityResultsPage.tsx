import { useState, useEffect, useMemo, useRef } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import { Card, CardContent } from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import { SummaryStatCard } from "@/presentation/components/ui/SummaryStatCard"
import {
  AlertTriangle,
  BarChart3,
  Download,
  FileCode,
  GitCompare,
  Layers,
  Loader2,
  Users,
  X,
} from "lucide-react"
import {
  PairComparison,
  PairCodeDiff,
  PairwiseTriageTable,
  SimilarityGraphView,
  type FilePair,
} from "@/presentation/components/teacher/plagiarism"
import {
  buildClassSimilarityReportData,
  buildPairSimilarityReportData,
  ClassSimilarityReportDocument,
  downloadSimilarityReportDocument,
  PairSimilarityReportDocument,
  toFileNameSegment,
} from "@/presentation/components/teacher/plagiarism/pdf/similarityReportPdf"
import {
  getResultDetails,
  type AnalyzeResponse,
  type PairResponse,
} from "@/business/services/plagiarismService"
import { getAssignmentById } from "@/business/services/assignmentService"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { useToastStore } from "@/shared/store/useToastStore"
import type { AssignmentDetail } from "@/business/models/assignment/types"

interface LocationState {
  results: AnalyzeResponse
}

/** Code comparison view mode */
type CodeViewMode = "match" | "diff"

/**
 * Detect the syntax highlighting language from a filename extension.
 */
function detectLanguage(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase() || ""
  const extensionMap: Record<string, string> = {
    java: "java",
    py: "python",
    js: "javascript",
    ts: "typescript",
    tsx: "typescript",
    jsx: "javascript",
    cpp: "cpp",
    c: "c",
    h: "c",
    cs: "csharp",
    rb: "ruby",
    go: "go",
    rs: "rust",
    php: "php",
    swift: "swift",
    kt: "kotlin",
    scala: "scala",
  }

  return extensionMap[extension] || "plaintext"
}

function buildClassReportFileName(
  assignmentName: string | undefined,
  minimumSimilarityPercent: number,
): string {
  return `${toFileNameSegment(assignmentName || "assignment")}-similarity-threshold-${minimumSimilarityPercent}.pdf`
}

function buildPairReportFileName(
  assignmentName: string | undefined,
  pair: PairResponse,
): string {
  const leftStudentName = pair.leftFile.studentName || "student-a"
  const rightStudentName = pair.rightFile.studentName || "student-b"

  return `${toFileNameSegment(assignmentName || "assignment")}-${toFileNameSegment(leftStudentName)}-vs-${toFileNameSegment(rightStudentName)}.pdf`
}

/**
 * Displays assignment-level similarity analysis with graph and pairwise triage workflows.
 *
 * @returns Similarity results page with summary metrics, graph, pairwise triage table, code comparison panel, and PDF export actions.
 */
export function SimilarityResultsPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const showToast = useToastStore((state) => state.showToast)
  const locationState = location.state as LocationState | null

  const [results, setResults] = useState<AnalyzeResponse | null>(
    () => locationState?.results ?? null,
  )
  const [selectedPair, setSelectedPair] = useState<PairResponse | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [pairDetails, setPairDetails] = useState<FilePair | null>(null)
  const [codeViewMode, setCodeViewMode] = useState<CodeViewMode>("match")
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [filteredPairCount, setFilteredPairCount] = useState(
    () => locationState?.results?.pairs.length ?? 0,
  )
  const [minimumSimilarityPercent, setMinimumSimilarityPercent] = useState(75)
  const [showSingletons, setShowSingletons] = useState(true)
  const [comparisonScrollToken, setComparisonScrollToken] = useState(0)
  const [isDownloadingClassReport, setIsDownloadingClassReport] =
    useState(false)
  const [isDownloadingPairReport, setIsDownloadingPairReport] = useState(false)
  const comparisonSectionRef = useRef<HTMLDivElement | null>(null)
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?"

  useEffect(() => {
    if (locationState?.results) {
      setResults(locationState.results)
      setFilteredPairCount(locationState.results.pairs.length)
    }
  }, [locationState])

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId || !user) {
        return
      }

      try {
        const assignmentDetail = await getAssignmentById(
          parseInt(assignmentId, 10),
          parseInt(user.id, 10),
        )
        setAssignment(assignmentDetail)
      } catch (assignmentError) {
        console.error("Failed to fetch assignment details:", assignmentError)
      }
    }

    void fetchAssignment()
  }, [assignmentId, user])

  useEffect(() => {
    if (comparisonScrollToken === 0) {
      return
    }

    comparisonSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }, [comparisonScrollToken])

  const handleViewDetails = async (pair: PairResponse) => {
    setSelectedPair(pair)
    setComparisonScrollToken((previousToken) => previousToken + 1)
    setIsLoadingDetails(true)
    setDetailsError(null)
    setPairDetails(null)

    try {
      const details = await getResultDetails(pair.id)

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
        fragments: details.fragments.map((fragment, index) => ({
          id: fragment.id || index,
          leftSelection: fragment.leftSelection,
          rightSelection: fragment.rightSelection,
          length: fragment.length,
        })),
      }

      setPairDetails(filePair)
    } catch (error) {
      console.error("Failed to fetch pair details:", error)
      setDetailsError(
        error instanceof Error
          ? error.message
          : "Failed to load code comparison",
      )
      setPairDetails(null)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleDownloadClassReport = async () => {
    if (!results) {
      return
    }

    try {
      setIsDownloadingClassReport(true)
      const reportData = buildClassSimilarityReportData({
        assignment,
        teacher: user,
        results,
        minimumSimilarityPercent,
        showSingletons,
      })

      await downloadSimilarityReportDocument({
        document: <ClassSimilarityReportDocument data={reportData} />,
        fileName: buildClassReportFileName(
          assignment?.assignmentName,
          minimumSimilarityPercent,
        ),
      })

      showToast("Class similarity report downloaded successfully")
    } catch (error) {
      console.error("Failed to download class similarity report:", error)
      showToast("Failed to download class similarity report", "error")
    } finally {
      setIsDownloadingClassReport(false)
    }
  }

  const handleDownloadPairReport = async () => {
    if (!results || !selectedPair || !pairDetails) {
      return
    }

    try {
      setIsDownloadingPairReport(true)
      const reportData = buildPairSimilarityReportData({
        assignment,
        teacher: user,
        results,
        selectedPair,
        pairDetails,
        minimumSimilarityPercent,
      })

      await downloadSimilarityReportDocument({
        document: <PairSimilarityReportDocument data={reportData} />,
        fileName: buildPairReportFileName(
          assignment?.assignmentName,
          selectedPair,
        ),
      })

      showToast("Pairwise similarity report downloaded successfully")
    } catch (error) {
      console.error("Failed to download pairwise similarity report:", error)
      showToast("Failed to download pairwise similarity report", "error")
    } finally {
      setIsDownloadingPairReport(false)
    }
  }

  const handleCloseDetails = () => {
    setSelectedPair(null)
    setPairDetails(null)
    setDetailsError(null)
  }

  const detectedLanguage = useMemo(() => {
    if (!pairDetails) return "plaintext"

    return detectLanguage(pairDetails.leftFile.filename)
  }, [pairDetails])

  const breadcrumbItems = [
    { label: "Classes", to: "/dashboard/classes" },
    ...(assignment
      ? [
          {
            label: assignment.className || "Class Overview",
            to: `/dashboard/classes/${assignment.classId}`,
          },
          {
            label: assignment.assignmentName || "Assignment Overview",
            to: `/dashboard/assignments/${assignment.id}/submissions`,
          },
        ]
      : []),
    { label: "Similarity Analysis" },
  ]

  const topBar = useTopBar({ user, userInitials, breadcrumbItems })

  if (!results) {
    return (
      <DashboardLayout topBar={topBar}>
        <Card className="border-amber-200 bg-amber-50/80 shadow-md shadow-amber-100/80">
          <CardContent className="p-12">
            <div className="space-y-4 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
              <h3 className="text-lg font-semibold text-slate-900">
                No Results Available
              </h3>
              <p className="text-slate-500">
                Please run a similarity check first.
              </p>
              <Button
                type="button"
                onClick={() =>
                  assignmentId
                    ? navigate(
                        `/dashboard/assignments/${assignmentId}/submissions`,
                      )
                    : navigate("/dashboard/classes")
                }
                className="mx-auto mt-4 w-auto border border-slate-300 bg-white px-4 text-slate-700 hover:bg-slate-50"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout topBar={topBar}>
      <div className="max-w-[1600px] space-y-6">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Similarity Analysis Results
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Export the threshold-filtered class overview or the selected
              pairwise evidence report.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadClassReport}
            disabled={isDownloadingClassReport}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDownloadingClassReport ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>
              {isDownloadingClassReport
                ? "Preparing Class PDF..."
                : "Download Class Report"}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStatCard
            label="Submissions"
            value={results.submissions.length}
            icon={Users}
            variant="light"
            className="border-slate-300 shadow-md shadow-slate-200/70"
            iconContainerClassName="h-auto w-auto rounded-none bg-transparent p-0"
            iconClassName="h-7 w-7 text-teal-600"
          />

          <SummaryStatCard
            label="Suspicious"
            value={filteredPairCount}
            icon={AlertTriangle}
            variant="light"
            className="border-slate-300 shadow-md shadow-slate-200/70"
            iconContainerClassName="h-auto w-auto rounded-none bg-transparent p-0"
            iconClassName="h-7 w-7 text-rose-600"
          />

          <SummaryStatCard
            label="Average Similarity"
            value={`${(results.summary.averageSimilarity * 100).toFixed(1)}%`}
            icon={BarChart3}
            variant="light"
            className="border-slate-300 shadow-md shadow-slate-200/70"
            iconContainerClassName="h-auto w-auto rounded-none bg-transparent p-0"
            iconClassName="h-7 w-7 text-sky-600"
          />

          <SummaryStatCard
            label="Max Similarity"
            value={`${(results.summary.maxSimilarity * 100).toFixed(1)}%`}
            icon={FileCode}
            variant="light"
            className="border-slate-300 shadow-md shadow-slate-200/70"
            iconContainerClassName="h-auto w-auto rounded-none bg-transparent p-0"
            iconClassName="h-7 w-7 text-amber-600"
          />
        </div>

        <Card className="border-slate-300 bg-white shadow-md shadow-slate-200/80">
          <CardContent className="p-6">
            <SimilarityGraphView
              submissions={results.submissions}
              pairs={results.pairs}
              minimumSimilarityPercent={minimumSimilarityPercent}
              onMinimumSimilarityPercentChange={setMinimumSimilarityPercent}
              onReviewPair={(pair) => {
                void handleViewDetails(pair)
              }}
              selectedPairId={selectedPair?.id ?? null}
              onShowSingletonsChange={setShowSingletons}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-300 bg-white shadow-md shadow-slate-200/80">
          <CardContent className="p-6">
            <PairwiseTriageTable
              pairs={results.pairs}
              onPairSelect={handleViewDetails}
              onFilteredCountChange={setFilteredPairCount}
              minimumSimilarityPercent={minimumSimilarityPercent}
              showThresholdControl={false}
              selectedPairId={selectedPair?.id ?? null}
            />
          </CardContent>
        </Card>

        {selectedPair && (
          <div ref={comparisonSectionRef} className="scroll-mt-24">
            <Card className="border-slate-300 bg-white shadow-md shadow-slate-200/80">
              <CardContent className="p-6">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Code Comparison: {selectedPair.leftFile.studentName} vs{" "}
                    {selectedPair.rightFile.studentName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadPairReport}
                      disabled={
                        isLoadingDetails ||
                        !pairDetails ||
                        isDownloadingPairReport
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDownloadingPairReport ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span>
                        {isDownloadingPairReport
                          ? "Preparing Pair PDF..."
                          : "Download Pair Report"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCloseDetails}
                      className="group flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <X className="h-4 w-4 transition-colors" />
                      <span className="text-sm font-medium transition-colors">
                        Close
                      </span>
                    </button>
                  </div>
                </div>

                <div className="mb-6 flex justify-center">
                  <div className="flex gap-1 rounded-xl border border-slate-300 bg-slate-100 p-1 shadow-sm">
                    <button
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
                    <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                    <span className="ml-3 text-slate-500">
                      Loading code comparison...
                    </span>
                  </div>
                )}

                {detailsError && (
                  <div className="py-8 text-center">
                    <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-rose-500" />
                    <p className="text-rose-700">{detailsError}</p>
                  </div>
                )}

                {pairDetails && codeViewMode === "match" && (
                  <PairComparison
                    pair={pairDetails}
                    language={detectedLanguage}
                    editorHeight={480}
                    variant="light"
                  />
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

        {results.warnings.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/80 shadow-md shadow-amber-100/80">
            <CardContent className="p-4">
              <h3 className="mb-2 font-medium text-amber-700">Warnings</h3>
              <ul className="list-inside list-disc text-sm text-amber-700">
                {results.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
