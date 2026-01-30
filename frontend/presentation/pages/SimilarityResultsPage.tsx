import { useState, useEffect, useMemo } from "react"
import { useParams, useLocation } from "react-router-dom"
import { DashboardLayout } from "@/presentation/components/dashboard/DashboardLayout"
import { Card, CardContent } from "@/presentation/components/ui/Card"
import { BackButton } from "@/presentation/components/ui/BackButton"
import {
  AlertTriangle,
  FileCode,
  BarChart3,
  Users,
  Loader2,
  X,
  Layers,
  GitCompare,
} from "lucide-react"
import {
  PairComparison,
  PairCodeDiff,
  StudentSummaryTable,
  StudentPairsDetail,
  type FilePair,
} from "@/presentation/components/plagiarism"
import {
  getResultDetails,
  getStudentSummary,
  getStudentPairs,
  type AnalyzeResponse,
  type PairResponse,
  type StudentSummary,
} from "@/business/services/plagiarismService"

interface LocationState {
  results: AnalyzeResponse
}

/** Code comparison view mode */
type CodeViewMode = "match" | "diff"

/**
 * Detect the syntax highlighting language from a filename extension.
 */
function detectLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || ""
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

  return extensionMap[ext] || "plaintext"
}

export function SimilarityResultsPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const location = useLocation()

  // Results from analysis
  const [results, setResults] = useState<AnalyzeResponse | null>(null)

  // Student-centric view state
  const [studentSummaries, setStudentSummaries] = useState<StudentSummary[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [studentSummaryError, setStudentSummaryError] = useState<string | null>(
    null,
  )
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(
    null,
  )
  const [studentPairs, setStudentPairs] = useState<PairResponse[]>([])
  const [isLoadingStudentPairs, setIsLoadingStudentPairs] = useState(false)

  // Code comparison state
  const [selectedPair, setSelectedPair] = useState<PairResponse | null>(null)

  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [pairDetails, setPairDetails] = useState<FilePair | null>(null)
  const [codeViewMode, setCodeViewMode] = useState<CodeViewMode>("match")
  const [detailsError, setDetailsError] = useState<string | null>(null)

  // Load results from location state
  useEffect(() => {
    const state = location.state as LocationState | null

    if (state?.results) {
      setResults(state.results)
    }
  }, [location.state])

  // Load student summaries when results are available
  useEffect(() => {
    if (!results?.reportId) return

    const loadStudentSummaries = async () => {
      setIsLoadingStudents(true)
      setStudentSummaryError(null)

      try {
        const summaries = await getStudentSummary(results.reportId)
        setStudentSummaries(summaries)
      } catch (error) {
        console.error("Failed to load student summaries:", error)
        setStudentSummaryError(
          error instanceof Error
            ? error.message
            : "Failed to load student summaries",
        )
      } finally {
        setIsLoadingStudents(false)
      }
    }

    loadStudentSummaries()
  }, [results?.reportId])

  // Load student pairs when a student is selected
  useEffect(() => {
    if (!results?.reportId || !selectedStudent) return

    const loadStudentPairs = async () => {
      setIsLoadingStudentPairs(true)

      try {
        const pairs = await getStudentPairs(
          results.reportId,
          selectedStudent.submissionId,
        )
        setStudentPairs(pairs)
      } catch (error) {
        console.error("Failed to load student pairs:", error)
        setStudentPairs([])
      } finally {
        setIsLoadingStudentPairs(false)
      }
    }

    loadStudentPairs()
  }, [results?.reportId, selectedStudent])

  // Handle selecting a student from the summary table
  const handleStudentSelect = (student: StudentSummary) => {
    setSelectedStudent(student)
    setStudentPairs([])
    // Clear any existing code comparison
    setSelectedPair(null)
    setPairDetails(null)
    setDetailsError(null)
  }

  // Handle going back from student details to summary
  const handleBackToStudents = () => {
    setSelectedStudent(null)
    setStudentPairs([])
    setSelectedPair(null)
    setPairDetails(null)
    setDetailsError(null)
  }

  // Handle viewing pair details with code comparison
  const handleViewDetails = async (pair: PairResponse) => {
    setSelectedPair(pair)
    setIsLoadingDetails(true)
    setDetailsError(null)
    setPairDetails(null)

    try {
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
      console.error("Failed to fetch pair details:", error)
      setDetailsError(
        error instanceof Error
          ? error.message
          : "Failed to load code comparison",
      )
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleCloseDetails = () => {
    setSelectedPair(null)
    setPairDetails(null)
    setDetailsError(null)
  }

  // Compute language for code highlighting based on filenames
  const detectedLanguage = useMemo(() => {
    if (!pairDetails) return "plaintext"

    return detectLanguage(pairDetails.leftFile.filename)
  }, [pairDetails])

  // No results state
  if (!results) {
    return (
      <DashboardLayout>
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
    <DashboardLayout>
      <div className="space-y-6 max-w-[1600px]">
        {/* Back Button */}
        <BackButton
          to={`/dashboard/assignments/${assignmentId}/submissions`}
          label="Back to Submissions"
        />

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">
            Similarity Analysis Results
          </h1>
          <p className="text-slate-300">Report ID: {results.reportId}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-300">Total Pairs</p>
                  <p className="text-xl font-bold text-white">
                    {results.summary.totalPairs}
                  </p>
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
                  <p className="text-sm text-slate-300">Suspicious</p>
                  <p className="text-xl font-bold text-white">
                    {results.summary.suspiciousPairs}
                  </p>
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
                  <p className="text-sm text-slate-300">Avg Similarity</p>
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
                  <p className="text-sm text-slate-300">Max Similarity</p>
                  <p className="text-xl font-bold text-white">
                    {(results.summary.maxSimilarity * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student-Centric View */}
        {/* Error State */}
        {studentSummaryError && (
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <p className="text-red-400">{studentSummaryError}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student Summary Table or Detail View */}
        {!selectedStudent ? (
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white mb-1">
                  Student Originality Overview
                </h2>
                <p className="text-sm text-slate-400">
                  Click on a student to view their similarity pairs and compare
                  code
                </p>
              </div>

              <StudentSummaryTable
                students={studentSummaries}
                onStudentSelect={handleStudentSelect}
                selectedStudent={selectedStudent}
                isLoading={isLoadingStudents}
              />
            </CardContent>
          </Card>
        ) : (
          <StudentPairsDetail
            student={selectedStudent}
            pairs={studentPairs}
            onPairSelect={handleViewDetails}
            onBack={handleBackToStudents}
            isLoading={isLoadingStudentPairs}
          />
        )}

        {/* Code Comparison Panel (shared between both views) */}
        {selectedPair && (
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-6">
              {/* Header row with title and close button */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  Code Comparison: {selectedPair.leftFile.studentName} vs{" "}
                  {selectedPair.rightFile.studentName}
                </h2>
                <button
                  onClick={handleCloseDetails}
                  className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 hover:border-teal-500/40 transition-all duration-300 backdrop-blur-sm"
                >
                  <X className="w-4 h-4 text-teal-200 group-hover:text-white transition-colors" />
                  <span className="text-sm font-medium text-teal-200 group-hover:text-white transition-colors">
                    Close
                  </span>
                </button>
              </div>

              {/* View mode toggle - separate row */}
              <div className="flex justify-center mb-6">
                <div className="flex bg-black/20 backdrop-blur-md border border-white/5 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setCodeViewMode("match")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                      codeViewMode === "match"
                        ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    Match View
                  </button>
                  <button
                    onClick={() => setCodeViewMode("diff")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                      codeViewMode === "diff"
                        ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20"
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
