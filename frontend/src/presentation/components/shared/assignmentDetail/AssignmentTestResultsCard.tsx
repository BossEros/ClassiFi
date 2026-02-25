import { ChevronDown, Code, Lock } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/Card"
import type { AssignmentTestCase } from "@/business/models/assignment/types"
import type { TestPreviewResult } from "@/business/models/test/types"

interface AssignmentTestResultsCardProps {
  previewResults: TestPreviewResult | null
  submissionTestResults: TestPreviewResult | null
  assignmentTestCases?: AssignmentTestCase[]
  showHiddenCases?: boolean
  expandedPreviewTests: Set<number>
  expandedSubmissionTests: Set<number>
  expandedInitialTests: Set<number>
  onTogglePreviewTestExpand: (index: number) => void
  onToggleSubmissionTestExpand: (index: number) => void
  onToggleInitialTestExpand: (index: number) => void
}

function HiddenCasesCard({ hiddenCount }: { hiddenCount: number }) {
  return (
    <div className="relative rounded-lg border border-white/5 overflow-hidden bg-black/20 group select-none">
      <div className="absolute inset-0 flex flex-col pointer-events-none opacity-40 blur-[2px]">
        <div className="flex items-center justify-between p-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-teal-500/10 border border-teal-500/20"></div>
            <div className="h-4 w-32 bg-gray-700/20 rounded"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 bg-gray-700/20 rounded"></div>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-teal-500/10 border border-teal-500/20"></div>
            <div className="h-4 w-24 bg-gray-700/20 rounded"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 bg-gray-700/20 rounded"></div>
          </div>
        </div>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-teal-500/10 border border-teal-500/20"></div>
            <div className="h-4 w-40 bg-gray-700/20 rounded"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 bg-gray-700/20 rounded"></div>
          </div>
        </div>
      </div>

      <div className="relative p-8 flex flex-col items-center justify-center text-center z-10 bg-black/40 backdrop-blur-sm">
        <div className="w-12 h-12 rounded-full bg-gradient-to-b from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-3 shadow-xl">
          <Lock className="w-5 h-5 text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-200">
          {hiddenCount} Hidden Case{hiddenCount !== 1 ? "s" : ""}
        </p>
        <p className="text-xs text-gray-500 mt-1 max-w-[240px]">
          These test cases are hidden to test your solution against edge cases.
        </p>
      </div>
    </div>
  )
}

export function AssignmentTestResultsCard({
  previewResults,
  submissionTestResults,
  assignmentTestCases,
  showHiddenCases = false,
  expandedPreviewTests,
  expandedSubmissionTests,
  expandedInitialTests,
  onTogglePreviewTestExpand,
  onToggleSubmissionTestExpand,
  onToggleInitialTestExpand,
}: AssignmentTestResultsCardProps) {
  const activeResults = previewResults || submissionTestResults
  const isPreview = !!previewResults

  if (
    !activeResults &&
    (!assignmentTestCases || assignmentTestCases.length === 0)
  ) {
    return null
  }

  if (activeResults) {
    const expandedSet = isPreview
      ? expandedPreviewTests
      : expandedSubmissionTests
    const toggleFn = isPreview
      ? onTogglePreviewTestExpand
      : onToggleSubmissionTestExpand
    const resultCount = activeResults.results.length
    const hiddenCount = showHiddenCases
      ? 0
      : activeResults.results.filter((result) => result.isHidden).length

    return (
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-purple-400" />
            {resultCount === 1 ? "Test Case" : "Test Cases"}
          </CardTitle>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              activeResults.percentage === 100
                ? "bg-green-500/10 text-green-400 border-green-500/20"
                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
            }`}
          >
            {activeResults.passed}/{activeResults.total} Passed (
            {activeResults.percentage}%)
          </span>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeResults.results
              .map((result, index) => ({ ...result, originalIndex: index }))
              .filter((result) => showHiddenCases || !result.isHidden)
              .map(({ originalIndex, ...result }) => {
                const isAccepted = result.status === "Accepted"
                const isExpanded = expandedSet.has(originalIndex)

                return (
                  <div
                    key={originalIndex}
                    className="rounded-lg border border-white/5 overflow-hidden bg-black/20"
                  >
                    <button
                      onClick={() => toggleFn(originalIndex)}
                      className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono border ${
                            isAccepted
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {originalIndex + 1}
                        </span>
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-200">
                              {result.name}
                            </span>
                            {showHiddenCases && result.isHidden && (
                              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Hidden
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-xs ${
                              isAccepted
                                ? "text-green-500/70"
                                : "text-red-500/70"
                            }`}
                          >
                            {result.status}
                          </span>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="border-t border-white/5 bg-gray-950/50 p-4 space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                              Input
                            </p>
                            <div className="p-3 bg-black/40 rounded-lg border border-white/5 max-h-60 overflow-y-auto custom-scrollbar">
                              <pre
                                className={`text-xs font-mono whitespace-pre-wrap ${
                                  !result.input
                                    ? "text-gray-500 italic"
                                    : "text-gray-300"
                                }`}
                              >
                                {result.input || "(No input required)"}
                              </pre>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {result.expectedOutput && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                                Expected
                              </p>
                              <div className="p-3 bg-black/40 rounded-lg border border-white/5 max-h-60 overflow-y-auto custom-scrollbar">
                                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                                  {result.expectedOutput}
                                </pre>
                              </div>
                            </div>
                          )}

                          {(result.actualOutput || !isAccepted) && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                                <span
                                  className={`w-1 h-1 rounded-full ${
                                    isAccepted ? "bg-green-500" : "bg-red-500"
                                  }`}
                                ></span>
                                Actual
                              </p>
                              <div
                                className={`p-3 rounded-lg border max-h-60 overflow-y-auto custom-scrollbar ${
                                  isAccepted
                                    ? "bg-green-500/5 border-green-500/10"
                                    : "bg-red-500/5 border-red-500/10"
                                }`}
                              >
                                <pre
                                  className={`text-xs font-mono whitespace-pre-wrap ${
                                    isAccepted
                                      ? "text-green-300"
                                      : "text-red-300"
                                  } ${!result.actualOutput ? "italic opacity-50" : ""}`}
                                >
                                  {result.actualOutput ||
                                    "(No output generated)"}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>

                        {result.errorMessage && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-red-500 mb-1.5 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-red-500"></span>
                              Error
                            </p>
                            <div className="p-3 bg-red-950/20 rounded-lg border border-red-500/20 max-h-60 overflow-y-auto custom-scrollbar">
                              <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap">
                                {result.errorMessage}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

            {hiddenCount > 0 && <HiddenCasesCard hiddenCount={hiddenCount} />}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!assignmentTestCases || assignmentTestCases.length === 0) {
    return null
  }

  const resultCount = assignmentTestCases.length
  const hiddenCount = showHiddenCases
    ? 0
    : assignmentTestCases.filter((testCase) => testCase.isHidden).length

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5 text-teal-400" />
          {resultCount === 1 ? "Test Case" : "Test Cases"}
        </CardTitle>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20">
          {resultCount} {resultCount === 1 ? "Case" : "Cases"}
        </span>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {assignmentTestCases
            .map((testCase, index) => ({ ...testCase, originalIndex: index }))
            .filter((testCase) => showHiddenCases || !testCase.isHidden)
            .map(({ originalIndex, ...testCase }) => {
              const isExpanded = expandedInitialTests.has(originalIndex)

              return (
                <div
                  key={testCase.id}
                  className="rounded-lg border border-white/5 overflow-hidden bg-black/20"
                >
                  <button
                    onClick={() => onToggleInitialTestExpand(originalIndex)}
                    className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono border bg-teal-500/10 text-teal-400 border-teal-500/20">
                        {originalIndex + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-200">
                          {testCase.name}
                        </span>
                        {showHiddenCases && testCase.isHidden && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Hidden
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500 -rotate-90" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-white/5 bg-gray-950/50 p-4 space-y-4">
                      {testCase.input || testCase.expectedOutput ? (
                        <>
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                                Input
                              </p>
                              <div className="p-3 bg-black/40 rounded-lg border border-white/5 max-h-60 overflow-y-auto custom-scrollbar">
                                <pre
                                  className={`text-xs font-mono whitespace-pre-wrap ${
                                    !testCase.input
                                      ? "text-gray-500 italic"
                                      : "text-gray-300"
                                  }`}
                                >
                                  {testCase.input || "(No input required)"}
                                </pre>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            {testCase.expectedOutput && (
                              <div>
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                                  Expected Output
                                </p>
                                <div className="p-3 bg-black/40 rounded-lg border border-white/5 max-h-60 overflow-y-auto custom-scrollbar">
                                  <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                                    {testCase.expectedOutput}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-gray-500 italic">
                          No details available.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

          {hiddenCount > 0 && <HiddenCasesCard hiddenCount={hiddenCount} />}
        </div>
      </CardContent>
    </Card>
  )
}
