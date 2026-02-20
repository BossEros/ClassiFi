import { describe, it, expect, vi, beforeEach } from "vitest"

import * as assignmentService from "@/business/services/assignmentService"
import * as assignmentRepository from "@/data/repositories/assignmentRepository"
import * as assignmentValidation from "@/business/validation/submissionFileValidation"
import {
  createMockSubmission,
  createMockAssignment,
} from "@/tests/utils/factories"
import type { AssignmentDetail } from "@/data/api/assignment.types"

// Mock dependencies
vi.mock("@/data/repositories/assignmentRepository")
vi.mock("@/business/validation/submissionFileValidation")

describe("assignmentService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // submitAssignment Tests
  // ============================================================================

  describe("submitAssignment", () => {
    const mockRequest = {
      assignmentId: 1,
      studentId: 1,
      file: new File(["content"], "test.py", { type: "text/x-python" }),
      programmingLanguage: "python" as const,
    }

    const mockSubmission = createMockSubmission()

    it("submits assignment successfully when validation passes", async () => {
      vi.mocked(assignmentValidation.validateFile).mockReturnValue(null)
      vi.mocked(
        assignmentRepository.submitAssignmentWithFile,
      ).mockResolvedValue({
        data: { success: true, submission: mockSubmission },
        status: 200,
      })

      const result = await assignmentService.submitAssignment(mockRequest)

      expect(assignmentValidation.validateFile).toHaveBeenCalledWith(
        mockRequest.file,
        mockRequest.programmingLanguage,
      )
      expect(
        assignmentRepository.submitAssignmentWithFile,
      ).toHaveBeenCalledWith(mockRequest)
      expect(result).toEqual(mockSubmission)
    })

    it("throws error when file validation fails", async () => {
      vi.mocked(assignmentValidation.validateFile).mockReturnValue(
        "Invalid file type",
      )

      await expect(
        assignmentService.submitAssignment(mockRequest),
      ).rejects.toThrow("Invalid file type")

      expect(
        assignmentRepository.submitAssignmentWithFile,
      ).not.toHaveBeenCalled()
    })

    it("throws error when repository call fails", async () => {
      vi.mocked(assignmentValidation.validateFile).mockReturnValue(null)
      vi.mocked(
        assignmentRepository.submitAssignmentWithFile,
      ).mockResolvedValue({
        error: "Submission failed",
        status: 400,
      })

      await expect(
        assignmentService.submitAssignment(mockRequest),
      ).rejects.toThrow("Submission failed")
    })

    it("throws error when ID validation fails", async () => {
      const invalidRequest = { ...mockRequest, assignmentId: -1 }

      await expect(
        assignmentService.submitAssignment(invalidRequest),
      ).rejects.toThrow() // validateId helper throws generic error or message
    })
  })

  // ============================================================================
  // getSubmissionHistory Tests
  // ============================================================================

  describe("getSubmissionHistory", () => {
    const mockHistory = {
      success: true,
      submissions: [createMockSubmission()],
      totalSubmissions: 1,
    }

    it("fetches submission history successfully", async () => {
      vi.mocked(
        assignmentRepository.getSubmissionHistoryForStudentAndAssignment,
      ).mockResolvedValue({
        data: mockHistory,
        status: 200,
      })

      const result = await assignmentService.getSubmissionHistory(1, 1)

      expect(
        assignmentRepository.getSubmissionHistoryForStudentAndAssignment,
      ).toHaveBeenCalledWith(1, 1)
      expect(result).toEqual(mockHistory)
    })

    it("throws error when repository returns error", async () => {
      vi.mocked(
        assignmentRepository.getSubmissionHistoryForStudentAndAssignment,
      ).mockResolvedValue({
        error: "Fetch failed",
        status: 400,
      })

      await expect(
        assignmentService.getSubmissionHistory(1, 1),
      ).rejects.toThrow("Fetch failed")
    })

    it("throws error when data is missing", async () => {
      vi.mocked(
        assignmentRepository.getSubmissionHistoryForStudentAndAssignment,
      ).mockResolvedValue({
        data: undefined,
        status: 200,
      })

      await expect(
        assignmentService.getSubmissionHistory(1, 1),
      ).rejects.toThrow("Failed to fetch submission history")
    })
  })

  // ============================================================================
  // getStudentSubmissions Tests
  // ============================================================================

  describe("getStudentSubmissions", () => {
    const mockSubmissions = [createMockSubmission()]

    it("fetches student submissions successfully", async () => {
      vi.mocked(
        assignmentRepository.getAllSubmissionsByStudentId,
      ).mockResolvedValue({
        data: { success: true, submissions: mockSubmissions },
        status: 200,
      })

      const result = await assignmentService.getStudentSubmissions(1, true)

      expect(
        assignmentRepository.getAllSubmissionsByStudentId,
      ).toHaveBeenCalledWith(1, true)
      expect(result).toEqual(mockSubmissions)
    })

    it("throws error when repository fails", async () => {
      vi.mocked(
        assignmentRepository.getAllSubmissionsByStudentId,
      ).mockResolvedValue({
        error: "API Error",
        status: 400,
      })

      await expect(assignmentService.getStudentSubmissions(1)).rejects.toThrow(
        "API Error",
      )
    })
  })

  // ============================================================================
  // getAssignmentSubmissions Tests
  // ============================================================================

  describe("getAssignmentSubmissions", () => {
    const mockSubmissions = [createMockSubmission()]

    it("fetches assignment submissions successfully", async () => {
      vi.mocked(
        assignmentRepository.getAllSubmissionsForAssignmentId,
      ).mockResolvedValue({
        data: { success: true, submissions: mockSubmissions },
        status: 200,
      })

      const result = await assignmentService.getAssignmentSubmissions(100)

      expect(
        assignmentRepository.getAllSubmissionsForAssignmentId,
      ).toHaveBeenCalledWith(100, true)
      expect(result).toEqual(mockSubmissions)
    })

    it("throws error when repository fails", async () => {
      vi.mocked(
        assignmentRepository.getAllSubmissionsForAssignmentId,
      ).mockResolvedValue({
        error: "Not found",
        status: 404,
      })

      await expect(
        assignmentService.getAssignmentSubmissions(100),
      ).rejects.toThrow("Not found")
    })
  })

  // ============================================================================
  // getAssignmentById Tests
  // ============================================================================

  describe("getAssignmentById", () => {
    const mockAssignment = createMockAssignment()
    const mockDetail = {
      ...mockAssignment,
      className: "Test Class",
      deadline: new Date().toISOString(),
      instructions: mockAssignment.instructions || "Test description",
      programmingLanguage: mockAssignment.programmingLanguage as
        | "python"
        | "java"
        | "c",
      allowResubmission: mockAssignment.allowResubmission ?? true,
      isActive: mockAssignment.isActive ?? true,
    } as AssignmentDetail

    it("fetches assignment details successfully", async () => {
      vi.mocked(
        assignmentRepository.getAssignmentDetailsByIdForUser,
      ).mockResolvedValue({
        data: { success: true, assignment: mockDetail },
        status: 200,
      })

      const result = await assignmentService.getAssignmentById(1, 1)

      expect(
        assignmentRepository.getAssignmentDetailsByIdForUser,
      ).toHaveBeenCalledWith(1, 1)
      expect(result).toEqual(mockDetail)
    })

    it("throws error when assignment not found", async () => {
      vi.mocked(
        assignmentRepository.getAssignmentDetailsByIdForUser,
      ).mockResolvedValue({
        error: "Assignment not found",
        status: 404,
      })

      await expect(assignmentService.getAssignmentById(999, 1)).rejects.toThrow(
        "Assignment not found",
      )
    })

    it("throws error when data is incomplete", async () => {
      vi.mocked(
        assignmentRepository.getAssignmentDetailsByIdForUser,
      ).mockResolvedValue({
        data: { success: true, assignment: undefined },
        status: 200,
      })

      await expect(assignmentService.getAssignmentById(1, 1)).rejects.toThrow(
        "Failed to fetch assignment details",
      )
    })
  })

  // ============================================================================
  // getSubmissionContent Tests
  // ============================================================================

  describe("getSubmissionContent", () => {
    const mockContent = {
      success: true,
      content: "print('hello')",
      language: "python",
    }

    it("fetches submission content successfully", async () => {
      vi.mocked(
        assignmentRepository.getSubmissionFileContentById,
      ).mockResolvedValue({
        data: mockContent,
        status: 200,
      })

      const result = await assignmentService.getSubmissionContent(123)

      expect(
        assignmentRepository.getSubmissionFileContentById,
      ).toHaveBeenCalledWith(123)
      expect(result).toEqual(mockContent)
    })

    it("throws error when fetch fails", async () => {
      vi.mocked(
        assignmentRepository.getSubmissionFileContentById,
      ).mockResolvedValue({
        error: "Content unavailable",
        status: 404,
      })

      await expect(assignmentService.getSubmissionContent(123)).rejects.toThrow(
        "Content unavailable",
      )
    })
  })

  // ============================================================================
  // getSubmissionDownloadUrl Tests
  // ============================================================================

  describe("getSubmissionDownloadUrl", () => {
    it("fetches download URL successfully", async () => {
      vi.mocked(
        assignmentRepository.getSubmissionFileDownloadUrlById,
      ).mockResolvedValue({
        data: {
          success: true,
          message: "URL generated",
          downloadUrl: "https://example.com/file.py",
        },
        status: 200,
      })

      const result = await assignmentService.getSubmissionDownloadUrl(123)

      expect(
        assignmentRepository.getSubmissionFileDownloadUrlById,
      ).toHaveBeenCalledWith(123)
      expect(result).toBe("https://example.com/file.py")
    })

    it("throws error when URL generation fails", async () => {
      vi.mocked(
        assignmentRepository.getSubmissionFileDownloadUrlById,
      ).mockResolvedValue({
        error: "Generation failed",
        status: 400,
      })

      await expect(
        assignmentService.getSubmissionDownloadUrl(123),
      ).rejects.toThrow("Generation failed")
    })
  })
})

