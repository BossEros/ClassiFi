import { ChevronDown, Code, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/Card"
import type { AssignmentTestCase } from "@/data/api/assignment.types"
import type { TestPreviewResult } from "@/data/api/test-case.types"
import { cn } from "@/shared/utils/cn"

interface AssignmentTestResultsCardProps {
  previewResults: TestPreviewResult | null
  submissionTestResults: TestPreviewResult | null
  assignmentTestCases?: AssignmentTestCase[]
  showHiddenCases?: boolean
  variant?: "dark" | "light"
  expandedPreviewTests: Set<number>
  expandedSubmissionTests: Set<number>
  expandedInitialTests: Set<number>
  onTogglePreviewTestExpand: (index: number) => void
  onToggleSubmissionTestExpand: (index: number) => void
  onToggleInitialTestExpand: (index: number) => void
}

interface HiddenCasesCardProps {
  hiddenCount: number
  variant: "dark" | "light"
}

function HiddenCasesCard({ hiddenCount, variant }: HiddenCasesCardProps) {
  const isLight = variant === "light"

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border select-none",
        isLight ? "border-violet-200 bg-violet-50/60 shadow-sm" : "border-white/5 bg-black/20",
      )}
    >
      <div className={cn("absolute inset-0 flex flex-col pointer-events-none opacity-40 blur-[2px]", isLight ? "" : "")}>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={cn(
              "flex items-center justify-between p-3",
              index < 2 && (isLight ? "border-b border-slate-200" : "border-b border-white/5"),
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-6 w-6 rounded-md border",
                  isLight ? "border-teal-200 bg-teal-100" : "border-teal-500/20 bg-teal-500/10",
                )}
              />
              <div className={cn("h-4 rounded", index === 2 ? "w-40" : index === 1 ? "w-24" : "w-32", isLight ? "bg-slate-300/70" : "bg-gray-700/20")} />
            </div>
            <div className={cn("h-4 w-4 rounded", isLight ? "bg-slate-300/70" : "bg-gray-700/20")} />
          </div>
        ))}
      </div>

      <div
        className={cn(
          "relative z-10 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm",
          isLight ? "bg-violet-50/90" : "bg-black/40",
        )}
      >
        <Lock className={`mb-3 h-8 w-8 ${isLight ? "text-violet-600" : "text-gray-300"}`} />
        <p className={`text-sm font-medium ${isLight ? "text-slate-900" : "text-gray-200"}`}>
          {hiddenCount} Hidden Case{hiddenCount !== 1 ? "s" : ""}
        </p>
        <p className={`mt-1 max-w-[240px] text-xs ${isLight ? "text-slate-500" : "text-gray-500"}`}>
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
  variant = "dark",
  expandedPreviewTests,
  expandedSubmissionTests,
  expandedInitialTests,
  onTogglePreviewTestExpand,
  onToggleSubmissionTestExpand,
  onToggleInitialTestExpand,
}: AssignmentTestResultsCardProps) {
  const activeResults = previewResults || submissionTestResults
  const isPreview = !!previewResults
  const isLight = variant === "light"

  if (!activeResults && (!assignmentTestCases || assignmentTestCases.length === 0)) {
    return null
  }

  if (activeResults) {
    const expandedSet = isPreview ? expandedPreviewTests : expandedSubmissionTests
    const toggleFn = isPreview ? onTogglePreviewTestExpand : onToggleSubmissionTestExpand
    const resultCount = activeResults.results.length
    const hiddenCount = showHiddenCases ? 0 : activeResults.results.filter((result) => result.isHidden).length

    return (
      <Card className={isLight ? "border-slate-200 bg-white shadow-sm" : "border-white/10 bg-white/5 backdrop-blur-sm"}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className={`flex items-center gap-2 ${isLight ? "text-slate-900" : "text-white"}`}>
            <Code className={`h-5 w-5 ${isPreview ? (isLight ? "text-indigo-600" : "text-purple-400") : isLight ? "text-teal-600" : "text-purple-400"}`} />
            {resultCount === 1 ? "Test Case" : "Test Cases"}
          </CardTitle>
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-semibold",
              activeResults.percentage === 100
                ? isLight
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-green-500/20 bg-green-500/10 text-green-400"
                : isLight
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
            )}
          >
            {activeResults.passed}/{activeResults.total} Passed ({activeResults.percentage}%)
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
                    className={cn(
                      "overflow-hidden rounded-xl border",
                      isLight
                        ? isAccepted
                          ? "border-emerald-200 bg-emerald-100/70 shadow-sm"
                          : "border-rose-200 bg-rose-100/70 shadow-sm"
                        : "border-white/5 bg-black/20",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFn(originalIndex)}
                      className={cn(
                        "flex w-full items-center justify-between p-3 text-left transition-colors",
                        isLight
                          ? isAccepted
                            ? "hover:bg-emerald-100"
                            : "hover:bg-rose-100"
                          : "hover:bg-white/5",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-md border text-xs font-mono shadow-sm",
                            isAccepted
                              ? isLight
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-green-500/20 bg-green-500/10 text-green-400"
                              : isLight
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-red-500/20 bg-red-500/10 text-red-400",
                          )}
                        >
                          {originalIndex + 1}
                        </span>
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-gray-200"}`}>{result.name}</span>
                            {showHiddenCases && result.isHidden && (
                              <span
                                className={cn(
                                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                  isLight
                                    ? "border-violet-200 bg-violet-50 text-violet-700"
                                    : "border-purple-500/30 bg-purple-500/20 text-purple-300",
                                )}
                              >
                                Hidden
                              </span>
                            )}
                          </div>
                          <span className={`text-xs font-medium ${isAccepted ? (isLight ? "text-emerald-700" : "text-green-500/70") : isLight ? "text-rose-700" : "text-red-500/70"}`}>
                            {result.status}
                          </span>
                        </div>
                      </div>
                      <ChevronDown className={`h-4 w-4 ${isLight ? "text-slate-400" : "text-gray-500"} transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    </button>

                    {isExpanded && (
                      <div className={cn("space-y-4 border-t p-3", isLight ? "border-slate-200 bg-white" : "border-white/5 bg-gray-950/50")}>
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <p className={`mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-gray-500"}`}>
                              <span className="h-1 w-1 rounded-full bg-blue-500"></span>
                              Input
                            </p>
                            <div className={cn("max-h-40 overflow-y-auto rounded-lg border p-3 custom-scrollbar", isLight ? "border-blue-200 bg-blue-50/60" : "border-white/5 bg-black/40")}>
                              <pre className={`text-xs font-mono whitespace-pre-wrap leading-5 ${!result.input ? (isLight ? "italic text-slate-400" : "italic text-gray-500") : isLight ? "text-slate-800" : "text-gray-300"}`}>
                                {result.input || "(No input required)"}
                              </pre>
                            </div>
                          </div>

                          {result.expectedOutput && (
                            <div>
                              <p className={`mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-gray-500"}`}>
                                <span className="h-1 w-1 rounded-full bg-slate-500"></span>
                                Expected Output
                              </p>
                              <div className={cn("max-h-40 overflow-y-auto rounded-lg border p-3 custom-scrollbar", isLight ? "border-slate-300 bg-slate-100" : "border-white/5 bg-black/40")}>
                                <pre className={`text-xs font-mono whitespace-pre-wrap leading-5 ${isLight ? "text-slate-800" : "text-gray-300"}`}>{result.expectedOutput}</pre>
                              </div>
                            </div>
                          )}
                        </div>

                        {(result.actualOutput || !isAccepted) && (
                          <div>
                            <p className={`mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-gray-500"}`}>
                              <span className={`h-1 w-1 rounded-full ${isAccepted ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                              Actual Output
                            </p>
                            <div
                              className={cn(
                                "max-h-40 overflow-y-auto rounded-lg border p-3 custom-scrollbar",
                                isAccepted
                                  ? isLight
                                    ? "border-emerald-200 bg-emerald-50"
                                    : "border-green-500/10 bg-green-500/5"
                                  : isLight
                                    ? "border-rose-200 bg-rose-50"
                                    : "border-red-500/10 bg-red-500/5",
                              )}
                            >
                              <pre
                                className={cn(
                                  "text-xs font-mono whitespace-pre-wrap leading-5",
                                  isAccepted
                                    ? isLight
                                      ? "text-emerald-800"
                                      : "text-green-300"
                                    : isLight
                                      ? "text-rose-700"
                                      : "text-red-300",
                                  !result.actualOutput && "italic opacity-50",
                                )}
                              >
                                {result.actualOutput || "(No output generated)"}
                              </pre>
                            </div>
                          </div>
                        )}

                        {result.errorMessage && (
                          <div>
                            <p className={`mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${isLight ? "text-rose-600" : "text-red-500"}`}>
                              <span className="h-1 w-1 rounded-full bg-rose-500"></span>
                              Error
                            </p>
                            <div className={cn("max-h-60 overflow-y-auto rounded-lg border p-3 custom-scrollbar", isLight ? "border-rose-200 bg-rose-50" : "border-red-500/20 bg-red-950/20")}>
                              <pre className={`text-xs font-mono whitespace-pre-wrap ${isLight ? "text-rose-700" : "text-red-400"}`}>{result.errorMessage}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

            {hiddenCount > 0 && <HiddenCasesCard hiddenCount={hiddenCount} variant={variant} />}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!assignmentTestCases || assignmentTestCases.length === 0) {
    return null
  }

  const resultCount = assignmentTestCases.length
  const hiddenCount = showHiddenCases ? 0 : assignmentTestCases.filter((testCase) => testCase.isHidden).length

  return (
    <Card className={isLight ? "border-slate-200 bg-white shadow-sm" : "border-white/10 bg-white/5 backdrop-blur-sm"}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className={`flex items-center gap-2 ${isLight ? "text-slate-900" : "text-white"}`}>
          <Code className={`h-5 w-5 ${isLight ? "text-teal-600" : "text-teal-400"}`} />
          {resultCount === 1 ? "Test Case" : "Test Cases"}
        </CardTitle>
        <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", isLight ? "border-blue-200 bg-blue-50 text-blue-700" : "border-blue-500/20 bg-blue-500/10 text-blue-400")}>
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
                  className={cn(
                    "overflow-hidden rounded-xl border",
                    isLight ? "border-teal-200 bg-teal-100/70 shadow-sm" : "border-white/5 bg-black/20",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onToggleInitialTestExpand(originalIndex)}
                    className={cn(
                      "flex w-full items-center justify-between p-3 text-left transition-colors",
                      isLight ? "hover:bg-teal-100" : "hover:bg-white/5",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-md border text-xs font-mono shadow-sm",
                          isLight ? "border-teal-200 bg-teal-50 text-teal-700" : "border-teal-500/20 bg-teal-500/10 text-teal-400",
                        )}
                      >
                        {originalIndex + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-gray-200"}`}>{testCase.name}</span>
                        {showHiddenCases && testCase.isHidden && (
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                              isLight ? "border-violet-200 bg-violet-50 text-violet-700" : "border-purple-500/30 bg-purple-500/20 text-purple-300",
                            )}
                          >
                            Hidden
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 ${isLight ? "text-slate-400" : "text-gray-500"} ${isExpanded ? "" : "-rotate-90"}`} />
                  </button>

                  {isExpanded && (
                    <div className={cn("space-y-4 border-t p-3", isLight ? "border-slate-200 bg-white" : "border-white/5 bg-gray-950/50")}>
                      {testCase.input || testCase.expectedOutput ? (
                        <>
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <p className={`mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-gray-500"}`}>
                                <span className="h-1 w-1 rounded-full bg-blue-500"></span>
                                Input
                              </p>
                              <div className={cn("max-h-40 overflow-y-auto rounded-lg border p-3 custom-scrollbar", isLight ? "border-blue-200 bg-blue-50/60" : "border-white/5 bg-black/40")}>
                                <pre className={`text-xs font-mono whitespace-pre-wrap leading-5 ${!testCase.input ? (isLight ? "italic text-slate-400" : "italic text-gray-500") : isLight ? "text-slate-800" : "text-gray-300"}`}>
                                  {testCase.input || "(No input required)"}
                                </pre>
                              </div>
                            </div>

                            {testCase.expectedOutput && (
                              <div>
                                <p className={`mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-gray-500"}`}>
                                  <span className="h-1 w-1 rounded-full bg-slate-500"></span>
                                  Expected Output
                                </p>
                                <div className={cn("max-h-40 overflow-y-auto rounded-lg border p-3 custom-scrollbar", isLight ? "border-slate-300 bg-slate-100" : "border-white/5 bg-black/40")}>
                                  <pre className={`text-xs font-mono whitespace-pre-wrap leading-5 ${isLight ? "text-slate-800" : "text-gray-300"}`}>{testCase.expectedOutput}</pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className={`text-xs italic ${isLight ? "text-slate-400" : "text-gray-500"}`}>No details available.</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

          {hiddenCount > 0 && <HiddenCasesCard hiddenCount={hiddenCount} variant={variant} />}
        </div>
      </CardContent>
    </Card>
  )
}
