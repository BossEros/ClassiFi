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
