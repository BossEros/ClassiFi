import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"

import { useTestResults } from "@/presentation/hooks/shared/useTestResults"
import * as testCaseService from "@/business/services/testCaseService"

// Mock the service
vi.mock("@/business/services/testCaseService")

describe("useTestResults", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // Fixtures
  // ============================================================================

  const mockResults = {
    submissionId: 1,
    passed: 3,
    total: 5,
    percentage: 60,
    results: [
      {
        testCaseId: 1,
        name: "Test 1",
        status: "Passed",
        isHidden: false,
        executionTimeMs: 100,
        memoryUsedKb: 1024,
      },
    ],
  }

  // ============================================================================
  // Initial Loading Tests
  // ============================================================================

  describe("initial loading", () => {
    it("starts with loading state", () => {
      vi.mocked(testCaseService.getTestResults).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      )

      const { result } = renderHook(() => useTestResults(1))

      expect(result.current.isLoading).toBe(true)
      expect(result.current.results).toBeNull()
      expect(result.current.error).toBeNull()
    })

    it("fetches results on mount", async () => {
      vi.mocked(testCaseService.getTestResults).mockResolvedValue(mockResults)

      const { result } = renderHook(() => useTestResults(1))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(testCaseService.getTestResults).toHaveBeenCalledWith(1)
      expect(result.current.results).toEqual(mockResults)
    })
  })

  // ============================================================================
  // Success State Tests
  // ============================================================================

  describe("success state", () => {
    it("returns test results after loading", async () => {
      vi.mocked(testCaseService.getTestResults).mockResolvedValue(mockResults)

      const { result } = renderHook(() => useTestResults(1))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.results).not.toBeNull()
      expect(result.current.results!.passed).toBe(3)
      expect(result.current.results!.total).toBe(5)
      expect(result.current.error).toBeNull()
    })

    it("handles null results (no test run yet)", async () => {
      vi.mocked(testCaseService.getTestResults).mockResolvedValue(null)

      const { result } = renderHook(() => useTestResults(1))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.results).toBeNull()
      expect(result.current.error).toBeNull()
    })
  })

  // ============================================================================
  // Error State Tests
  // ============================================================================

  describe("error state", () => {
    it("sets error when fetch fails", async () => {
      vi.mocked(testCaseService.getTestResults).mockRejectedValue(
        new Error("Network error"),
      )

      const { result } = renderHook(() => useTestResults(1))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe("Failed to load test results")
      expect(result.current.results).toBeNull()
    })
  })

  // ============================================================================
  // Refetch Tests
  // ============================================================================

  describe("refetch", () => {
    it("provides a refetch function", async () => {
      vi.mocked(testCaseService.getTestResults).mockResolvedValue(mockResults)

      const { result } = renderHook(() => useTestResults(1))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(typeof result.current.refetch).toBe("function")
    })

    it("refetch calls the service again", async () => {
      vi.mocked(testCaseService.getTestResults).mockResolvedValue(mockResults)

      const { result } = renderHook(() => useTestResults(1))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Clear mock and call refetch
      vi.mocked(testCaseService.getTestResults).mockClear()
      vi.mocked(testCaseService.getTestResults).mockResolvedValue({
        ...mockResults,
        passed: 4,
      })

      await act(async () => {
        await result.current.refetch()
      })

      await waitFor(() => {
        expect(result.current.results?.passed).toBe(4)
      })

      expect(testCaseService.getTestResults).toHaveBeenCalledTimes(1)
    })
  })

  // ============================================================================
  // Submission ID Change Tests
  // ============================================================================

  describe("submission ID changes", () => {
    it("refetches when submission ID changes", async () => {
      vi.mocked(testCaseService.getTestResults).mockResolvedValue(mockResults)

      const { result, rerender } = renderHook(({ id }) => useTestResults(id), {
        initialProps: { id: 1 },
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(testCaseService.getTestResults).toHaveBeenCalledWith(1)

      // Change submission ID
      vi.mocked(testCaseService.getTestResults).mockClear()
      vi.mocked(testCaseService.getTestResults).mockResolvedValue({
        ...mockResults,
        submissionId: 2,
      })

      rerender({ id: 2 })

      await waitFor(() => {
        expect(testCaseService.getTestResults).toHaveBeenCalledWith(2)
      })
    })
  })
})
