import { useState } from "react"
import {
  FlaskConical,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  EyeOff,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/Card"
import { useTestResults } from "@/presentation/hooks/shared/useTestResults"
import type { TestResultDetail } from "@/shared/types/testCase"

interface TestResultsPanelProps {
  submissionId: number
}

const STATUS_CONFIG: Record<
  string,
  { icon: typeof CheckCircle; color: string; bgColor: string }
> = {
  Accepted: {
    icon: CheckCircle,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
  },
  "Wrong Answer": {
    icon: XCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
  },
  "Time Limit Exceeded": {
    icon: Clock,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
  },
  "Memory Limit Exceeded": {
    icon: AlertTriangle,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
  },
  "Compilation Error": {
    icon: XCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
  },
  "Runtime Error": {
    icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
  },
  Processing: {
    icon: RefreshCw,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  "Internal Error": {
    icon: AlertTriangle,
    color: "text-gray-400",
    bgColor: "bg-gray-500/20",
  },
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG["Internal Error"]
}

export function TestResultsPanel({ submissionId }: TestResultsPanelProps) {
  const { results, isLoading, error } = useTestResults(submissionId)
  const [expandedTests, setExpandedTests] = useState<Set<number>>(new Set())

  const toggleExpand = (testCaseId: number) => {
    setExpandedTests((prev) => {
      const next = new Set(prev)
      if (next.has(testCaseId)) {
        next.delete(testCaseId)
      } else {
        next.add(testCaseId)
      }
      return next
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mr-3" />
            <span className="text-gray-400">Loading test results...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-500/20">
            <FlaskConical className="w-5 h-5 text-teal-400" />
          </div>
          <CardTitle>Test Results</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}

        {!results ? (
          <div className="text-center py-8">
            <FlaskConical className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">No test results available</p>
            <p className="text-sm text-gray-500">
              Tests were not run before this submission
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Score Summary */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <div>
                <p className="text-sm text-gray-400">Score</p>
                <p className="text-2xl font-bold text-white">
                  {results.percentage}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Tests Passed</p>
                <p className="text-lg text-white">
                  <span className="text-green-400">{results.passed}</span>
                  <span className="text-gray-500"> / </span>
                  <span>{results.total}</span>
                </p>
              </div>
            </div>

            {/* Test Results List */}
            <div className="space-y-2">
              {results.results.map((result, index) => (
                <TestResultItem
                  key={result.testCaseId}
                  result={result}
                  index={index}
                  isExpanded={expandedTests.has(result.testCaseId)}
                  onToggle={() => toggleExpand(result.testCaseId)}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface TestResultItemProps {
  result: TestResultDetail
  index: number
  isExpanded: boolean
  onToggle: () => void
}

function TestResultItem({
  result,
  index,
  isExpanded,
  onToggle,
}: TestResultItemProps) {
  const config = getStatusConfig(result.status)
  const StatusIcon = config.icon
  const isAccepted = result.status === "Accepted"

  return (
    <div className="rounded-lg border border-white/10 overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/[0.08] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 flex items-center justify-center rounded bg-white/10 text-xs text-gray-400">
            {index + 1}
          </span>
          <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
            <StatusIcon className={`w-4 h-4 ${config.color}`} />
          </div>
          <span className="text-sm text-white">{result.name}</span>
          {result.isHidden && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-500/20 text-xs text-gray-400">
              <EyeOff className="w-3 h-3" />
              Hidden
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-sm px-2 py-0.5 rounded ${config.bgColor} ${config.color}`}
          >
            {result.status}
          </span>
          {!result.isHidden && (
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          )}
        </div>
      </button>

      {/* Expanded Details (only for non-hidden tests) */}
      {isExpanded && !result.isHidden && (
        <div className="p-4 border-t border-white/10 space-y-3 bg-black/20">
          {/* Metrics */}
          <div className="flex gap-4 text-xs text-gray-500">
            <span>Time: {result.executionTimeMs.toFixed(2)}ms</span>
            <span>Memory: {result.memoryUsedKb} KB</span>
          </div>

          {/* Input */}
          {result.input && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Input:</p>
              <pre className="p-2 bg-white/5 rounded text-xs text-gray-300 overflow-x-auto font-mono">
                {result.input}
              </pre>
            </div>
          )}

          {/* Expected Output */}
          {result.expectedOutput && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Expected Output:</p>
              <pre className="p-2 bg-white/5 rounded text-xs text-gray-300 overflow-x-auto font-mono">
                {result.expectedOutput}
              </pre>
            </div>
          )}

          {/* Actual Output */}
          {result.actualOutput && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Your Output:</p>
              <pre
                className={`p-2 rounded text-xs overflow-x-auto font-mono ${
                  isAccepted
                    ? "bg-green-500/10 text-green-300"
                    : "bg-red-500/10 text-red-300"
                }`}
              >
                {result.actualOutput}
              </pre>
            </div>
          )}

          {/* Error Message */}
          {result.errorMessage && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Error:</p>
              <pre className="p-2 bg-red-500/10 rounded text-xs text-red-300 overflow-x-auto font-mono">
                {result.errorMessage}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TestResultsPanel
