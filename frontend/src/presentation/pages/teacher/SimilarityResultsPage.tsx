import { useState, useEffect, useMemo } from "react"
import { useParams, useLocation } from "react-router-dom"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import { Card, CardContent } from "@/presentation/components/ui/Card"
import { BackButton } from "@/presentation/components/ui/BackButton"
import { SummaryStatCard } from "@/presentation/components/ui/SummaryStatCard"
import {
  AlertTriangle,
  FileCode,
  BarChart3,
  Loader2,
  X,
  Layers,
  GitCompare,
} from "lucide-react"
import {
  PairComparison,
  PairCodeDiff,
  PairwiseTriageTable,
  type FilePair,
} from "@/presentation/components/teacher/plagiarism"
import {
  getResultDetails,
  type AnalyzeResponse,
  type PairResponse,
} from "@/business/services/plagiarismService"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import { useAuthStore } from "@/shared/store/useAuthStore"

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

/**
 * Displays assignment-level similarity analysis with pairwise triage as the primary workflow.
 *
 * @returns Similarity results page with summary metrics, pairwise triage table, and code comparison panel.
 */
export function SimilarityResultsPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
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

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user, userInitials })

  useEffect(() => {
    if (locationState?.results) {
      setResults(locationState.results)
      setFilteredPairCount(locationState.results.pairs.length)
    }
  }, [locationState])

  const handleViewDetails = async (pair: PairResponse) => {
    setSelectedPair(pair)
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

  const handleCloseDetails = () => {
    setSelectedPair(null)
    setPairDetails(null)
    setDetailsError(null)
  }

  const detectedLanguage = useMemo(() => {
    if (!pairDetails) return "plaintext"

    return detectLanguage(pairDetails.leftFile.filename)
  }, [pairDetails])

  if (!results) {
    return (
      <DashboardLayout topBar={topBar}>
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto" />
              <h3 className="text-lg font-semibold text-white">
                No Results Available
              </h3>
              <p className="text-gray-400">
                Please run a similarity check first.
              </p>
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
    <DashboardLayout topBar={topBar}>
      <div className="space-y-6 max-w-[1600px]">
        <BackButton
          to={`/dashboard/assignments/${assignmentId}/submissions`}
          label="Back to Submissions"
        />

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">
            Similarity Analysis Results
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryStatCard
            label="Suspicious"
            value={filteredPairCount}
            helperText={
              minimumSimilarityPercent === 0
                ? undefined
                : `of ${results.pairs.length} total pairs`
            }
            icon={AlertTriangle}
            iconContainerClassName="bg-red-500/20"
            iconClassName="text-red-400"
          />

          <SummaryStatCard
            label="Avg Similarity"
            value={`${(results.summary.averageSimilarity * 100).toFixed(1)}%`}
            icon={BarChart3}
            iconContainerClassName="bg-blue-500/20"
            iconClassName="text-blue-400"
          />

          <SummaryStatCard
            label="Max Similarity"
            value={`${(results.summary.maxSimilarity * 100).toFixed(1)}%`}
            icon={FileCode}
            iconContainerClassName="bg-orange-500/20"
            iconClassName="text-orange-400"
          />
        </div>

        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardContent className="p-6">
            <PairwiseTriageTable
              pairs={results.pairs}
              onPairSelect={handleViewDetails}
              onFilteredCountChange={setFilteredPairCount}
              onMinimumSimilarityPercentChange={setMinimumSimilarityPercent}
              selectedPairId={selectedPair?.id ?? null}
            />
          </CardContent>
        </Card>

        {selectedPair && (
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  Code Comparison: {selectedPair.leftFile.studentName} vs{" "}
                  {selectedPair.rightFile.studentName}
                </h2>
                <button
                  onClick={handleCloseDetails}
                  className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 hover:border-teal-500/40 transition-colors duration-200 backdrop-blur-sm"
                >
                  <X className="w-4 h-4 text-teal-200 group-hover:text-white transition-colors" />
                  <span className="text-sm font-medium text-teal-200 group-hover:text-white transition-colors">
                    Close
                  </span>
                </button>
              </div>

              <div className="flex justify-center mb-6">
                <div className="flex bg-black/20 backdrop-blur-md border border-white/5 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setCodeViewMode("match")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      codeViewMode === "match"
                        ? "bg-teal-600 text-white border border-teal-500/40"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    Match View
                  </button>
                  <button
                    onClick={() => setCodeViewMode("diff")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      codeViewMode === "diff"
                        ? "bg-teal-600 text-white border border-teal-500/40"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <GitCompare className="w-4 h-4" />
                    Diff View
                  </button>
                </div>
              </div>

              {isLoadingDetails && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                  <span className="ml-3 text-slate-300">
                    Loading code comparison...
                  </span>
                </div>
              )}

              {detailsError && (
                <div className="text-center py-8">
                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-red-400">{detailsError}</p>
                </div>
              )}

              {pairDetails && codeViewMode === "match" && (
                <PairComparison
                  pair={pairDetails}
                  language={detectedLanguage}
                  editorHeight={500}
                />
              )}

              {pairDetails && codeViewMode === "diff" && (
                <PairCodeDiff
                  leftFile={pairDetails.leftFile}
                  rightFile={pairDetails.rightFile}
                  language={detectedLanguage}
                  height={500}
                />
              )}
            </CardContent>
          </Card>
        )}

        {results.warnings.length > 0 && (
          <Card className="bg-yellow-500/10 border-yellow-500/20">
            <CardContent className="p-4">
              <h3 className="font-medium text-yellow-400 mb-2">Warnings</h3>
              <ul className="list-disc list-inside text-sm text-yellow-300">
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
