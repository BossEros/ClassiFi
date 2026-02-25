import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import {
  useClassGradebook,
  useStudentGrades,
  useGradeOverride,
  useGradebookExport,
} from "@/presentation/hooks/teacher/useGradebook"
import * as gradebookService from "@/business/services/gradebookService"

// Mock the business service
vi.mock("@/business/services/gradebookService")

describe("useGradebook Hooks", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe("useClassGradebook", () => {
    const mockClassId = 1
    const mockGradebook = {
      students: [],
      assignments: [],
    }

    it("should fetch gradebook", async () => {
      vi.mocked(gradebookService.getClassGradebook).mockResolvedValue(
        mockGradebook as any,
      )

      const { result } = renderHook(() => useClassGradebook(mockClassId))

      expect(result.current.isLoading).toBe(true)
      expect(result.current.gradebook).toBeNull()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.gradebook).toEqual(mockGradebook)
      expect(result.current.error).toBeNull()
    })

    it("should handle error during fetch", async () => {
      vi.mocked(gradebookService.getClassGradebook).mockRejectedValue(
        new Error("Fetch failed"),
      )

      const { result } = renderHook(() => useClassGradebook(mockClassId))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe("Fetch failed")
      expect(result.current.gradebook).toBeNull()
    })
  })

  describe("useStudentGrades", () => {
    const mockStudentId = 101
    const mockClassId = 1
    const mockGrades = [{ classId: 1, className: "Math", grades: [] }]

    it("should fetch all grades when no classId provided", async () => {
      vi.mocked(gradebookService.getStudentGrades).mockResolvedValue(
        mockGrades as any,
      )

      const { result } = renderHook(() => useStudentGrades(mockStudentId))

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.grades).toEqual(mockGrades)
      expect(gradebookService.getStudentGrades).toHaveBeenCalledWith(
        mockStudentId,
      )
    })

    it("should fetch specific class grades and rank when classId provided", async () => {
      const mockClassGrades = { ...mockGrades[0] }
      const mockRank = { rank: 5, totalStudents: 30, percentile: 85 }

      vi.mocked(gradebookService.getStudentClassGrades).mockResolvedValue(
        mockClassGrades as any,
      )
      vi.mocked(gradebookService.getStudentRank).mockResolvedValue(
        mockRank as any,
      )

      const { result } = renderHook(() =>
        useStudentGrades(mockStudentId, mockClassId),
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.grades).toEqual([mockClassGrades])
      expect(result.current.rank).toEqual(mockRank)
      expect(gradebookService.getStudentClassGrades).toHaveBeenCalledWith(
        mockStudentId,
        mockClassId,
      )
    })
  })

  describe("useGradeOverride", () => {
    const mockOnSuccess = vi.fn()

    beforeEach(() => {
      mockOnSuccess.mockClear()
    })

    it("should override grade successfully", async () => {
      vi.mocked(gradebookService.overrideGrade).mockResolvedValue(undefined)

      const { result } = renderHook(() => useGradeOverride(mockOnSuccess))

      await act(async () => {
        await result.current.override(1, 95, "Good job")
      })

      expect(result.current.isOverriding).toBe(false)
      expect(result.current.error).toBeNull()
      expect(gradebookService.overrideGrade).toHaveBeenCalledWith(
        1,
        95,
        "Good job",
      )
      expect(mockOnSuccess).toHaveBeenCalled()
    })

    it("should remove override successfully", async () => {
      vi.mocked(gradebookService.removeGradeOverride).mockResolvedValue(
        undefined,
      )

      const { result } = renderHook(() => useGradeOverride(mockOnSuccess))

      await act(async () => {
        await result.current.removeOverride(1)
      })

      expect(gradebookService.removeGradeOverride).toHaveBeenCalledWith(1)
      expect(mockOnSuccess).toHaveBeenCalled()
    })
    it("should handle error in override", async () => {
      vi.mocked(gradebookService.overrideGrade).mockRejectedValue(
        new Error("Update failed"),
      )

      const { result } = renderHook(() => useGradeOverride(mockOnSuccess))

      await act(async () => {
        await expect(result.current.override(1, 95)).rejects.toThrow(
          "Update failed",
        )
      })

      await waitFor(() => {
        expect(result.current.error).toBe("Update failed")
      })
    })
  })

  describe("useGradebookExport", () => {
    it("should export CSV", async () => {
      vi.mocked(gradebookService.downloadGradebookCSV).mockResolvedValue(
        undefined,
      )

      const { result } = renderHook(() => useGradebookExport())

      await act(async () => {
        await result.current.exportCSV(1, "grades.csv")
      })

      expect(result.current.isExporting).toBe(false)
      expect(gradebookService.downloadGradebookCSV).toHaveBeenCalledWith(
        1,
        "grades.csv",
      )
    })
  })
})
