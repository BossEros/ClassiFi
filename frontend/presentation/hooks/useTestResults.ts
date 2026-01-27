import { useState, useCallback, useEffect } from "react"
import { getTestResults } from "@/business/services/testCaseService"
import type { TestExecutionSummary } from "@/shared/types/testCase"

export function useTestResults(submissionId: number) {
  const [results, setResults] = useState<TestExecutionSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchResults = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getTestResults(submissionId)
      setResults(data)
    } catch (err) {
      // In the previous implementation, errors were treated as "no results yet"
      // and simply resulted in an empty state.
      // We set an error here, but the consuming component might want to ignore it
      // if strict "no results" behavior is desired for 404s.
      // For now, we report the error to help debugging, but we could revert to silent failure if needed.
      // console.error(err)
      setError("Failed to load test results")
      setResults(null)
    } finally {
      setIsLoading(false)
    }
  }, [submissionId])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  return { results, isLoading, error, refetch: fetchResults }
}
