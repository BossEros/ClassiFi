import { describe, it, expect, vi, beforeEach, afterAll } from "vitest"

import * as assignmentRepository from "./assignmentRepository"
import { apiClient } from "@/data/api/apiClient"

// Mock the apiClient module
vi.mock("@/data/api/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

// Mock supabase client
vi.mock("@/data/api/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "mock-token" } },
      }),
    },
  },
}))

// Mock fetch for file upload tests
const originalFetch = global.fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe("assignmentRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  // ============================================================================
  // Fixtures
  // ============================================================================

  const mockSubmission = {
    id: 1,
    assignmentId: 1,
    studentId: 1,
    fileName: "solution.py",
    fileSize: 1024,
    submissionNumber: 1,
    submittedAt: "2024-01-15T10:00:00Z",
    isLatest: true,
    grade: 95,
  }

  const mockSubmissionWithAssignment = {
    ...mockSubmission,
    assignmentName: "Hello World",
  }

  const mockSubmissionWithStudent = {
    ...mockSubmission,
    studentName: "John Doe",
  }

  // ============================================================================
  // submitAssignmentWithFile Tests
  // ============================================================================

  describe("submitAssignmentWithFile", () => {
    const mockFile = new File(["print('hello')"], "solution.py", {
      type: "text/x-python",
    })

    const mockRequest = {
      assignmentId: 1,
      studentId: 1,
      file: mockFile,
      programmingLanguage: "python" as const,
    }

    // Helper to create a proper Response-like mock
    function createMockResponse(
      ok: boolean,
      status: number,
      jsonData: unknown,
    ) {
      return {
        ok,
        status,
        statusText: ok ? "OK" : "Error",
        json: vi.fn().mockResolvedValue(jsonData),
        clone: vi.fn().mockReturnThis(),
        headers: new Headers(),
        redirected: false,
        type: "basic" as ResponseType,
        url: "",
        body: null,
        bodyUsed: false,
        arrayBuffer: vi.fn(),
        blob: vi.fn(),
        formData: vi.fn(),
        text: vi.fn(),
      }
    }

    it("submits an assignment successfully", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse(true, 201, {
          success: true,
          message: "Submission successful",
          submission: mockSubmission,
        }),
      )

      const result =
        await assignmentRepository.submitAssignmentWithFile(mockRequest)

      expect(mockFetch).toHaveBeenCalled()
      expect(result.data?.success).toBe(true)
      expect(result.data?.submission).toBeDefined()
    })

    it("returns error for failed submission", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse(false, 400, {
          detail: "File type not allowed",
        }),
      )

      const result =
        await assignmentRepository.submitAssignmentWithFile(mockRequest)

      expect(result.error).toContain("File type not allowed")
      expect(result.status).toBe(400)
    })

    it("returns error for deadline passed", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse(false, 400, {
          message: "Submission deadline has passed",
        }),
      )

      const result =
        await assignmentRepository.submitAssignmentWithFile(mockRequest)

      expect(result.error).toContain("Submission deadline has passed")
    })

    it("handles network errors gracefully", async () => {
      mockFetch.mockRejectedValue(new Error("Network failure"))

      const result =
        await assignmentRepository.submitAssignmentWithFile(mockRequest)

      expect(result.error).toContain("Network error")
      expect(result.status).toBe(0)
    })
  })

  // ============================================================================
  // getSubmissionHistoryForStudentAndAssignment Tests
  // ============================================================================

  describe("getSubmissionHistoryForStudentAndAssignment", () => {
    const mockHistoryResponse = {
      success: true,
      submissions: [mockSubmission],
      totalSubmissions: 1,
    }

    it("fetches submission history", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockHistoryResponse,
        status: 200,
      })

      const result =
        await assignmentRepository.getSubmissionHistoryForStudentAndAssignment(
          1,
          1,
        )

      expect(apiClient.get).toHaveBeenCalledWith("/submissions/history/1/1")
      expect(result.data?.submissions).toHaveLength(1)
    })

    it("returns empty array for no submissions", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, submissions: [], totalSubmissions: 0 },
        status: 200,
      })

      const result =
        await assignmentRepository.getSubmissionHistoryForStudentAndAssignment(
          1,
          1,
        )

      expect(result.data?.submissions).toHaveLength(0)
    })

    it("returns error when API fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Assignment not found",
        status: 404,
      })

      const result =
        await assignmentRepository.getSubmissionHistoryForStudentAndAssignment(
          999,
          1,
        )

      expect(result.error).toBe("Assignment not found")
    })
  })

  // ============================================================================
  // getAllSubmissionsByStudentId Tests
  // ============================================================================

  describe("getAllSubmissionsByStudentId", () => {
    const mockListResponse = {
      success: true,
      submissions: [mockSubmissionWithAssignment],
    }

    it("fetches student submissions with default latestOnly=true", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockListResponse,
        status: 200,
      })

      const result = await assignmentRepository.getAllSubmissionsByStudentId(1)

      expect(apiClient.get).toHaveBeenCalledWith(
        "/submissions/student/1?latestOnly=true",
      )
      expect(result.data?.submissions).toHaveLength(1)
    })

    it("fetches all submissions when latestOnly=false", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockListResponse,
        status: 200,
      })

      await assignmentRepository.getAllSubmissionsByStudentId(1, false)

      expect(apiClient.get).toHaveBeenCalledWith(
        "/submissions/student/1?latestOnly=false",
      )
    })

    it("returns error when student not found", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Student not found",
        status: 404,
      })

      const result =
        await assignmentRepository.getAllSubmissionsByStudentId(999)

      expect(result.error).toBe("Student not found")
    })
  })

  // ============================================================================
  // getAllSubmissionsForAssignmentId Tests
  // ============================================================================

  describe("getAllSubmissionsForAssignmentId", () => {
    const mockListResponse = {
      success: true,
      submissions: [mockSubmissionWithStudent],
    }

    it("fetches assignment submissions with default latestOnly=true", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockListResponse,
        status: 200,
      })

      const result =
        await assignmentRepository.getAllSubmissionsForAssignmentId(1)

      expect(apiClient.get).toHaveBeenCalledWith(
        "/submissions/assignment/1?latestOnly=true",
      )
      expect(result.data?.submissions).toHaveLength(1)
    })

    it("fetches all submissions when latestOnly=false", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockListResponse,
        status: 200,
      })

      await assignmentRepository.getAllSubmissionsForAssignmentId(1, false)

      expect(apiClient.get).toHaveBeenCalledWith(
        "/submissions/assignment/1?latestOnly=false",
      )
    })

    it("returns error when assignment not found", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Assignment not found",
        status: 404,
      })

      const result =
        await assignmentRepository.getAllSubmissionsForAssignmentId(999)

      expect(result.error).toBe("Assignment not found")
    })
  })

  // ============================================================================
  // getAssignmentDetailsByIdForUser Tests
  // ============================================================================

  describe("getAssignmentDetailsByIdForUser", () => {
    const mockAssignmentResponse = {
      success: true,
      assignment: {
        id: 1,
        classId: 1,
        className: "Introduction to Programming",
        assignmentName: "Hello World",
        description: "Write Hello World program",
        programmingLanguage: "python",
        deadline: "2024-12-31T23:59:59Z",
        allowResubmission: true,
        maxAttempts: 3,
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
        templateCode: null,
        hasTemplateCode: false,
        totalScore: 100,
        scheduledDate: null,
        testCases: [],
      },
    }

    it("fetches assignment details by ID", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockAssignmentResponse,
        status: 200,
      })

      const result = await assignmentRepository.getAssignmentDetailsByIdForUser(
        1,
        1,
      )

      expect(apiClient.get).toHaveBeenCalledWith("/assignments/1?userId=1")
      expect(result.data?.assignment).toBeDefined()
      expect(result.data?.assignment!.deadline).toBe("2024-12-31T23:59:59Z")
    })

    it("handles scheduledDate conversion", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          success: true,
          assignment: {
            ...mockAssignmentResponse.assignment,
            scheduledDate: "2024-01-10T00:00:00Z",
          },
        },
        status: 200,
      })

      const result = await assignmentRepository.getAssignmentDetailsByIdForUser(
        1,
        1,
      )

      expect(result.data?.assignment!.scheduledDate).toBe(
        "2024-01-10T00:00:00Z",
      )
    })

    it("returns error when assignment not found", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Assignment not found",
        status: 404,
      })

      const result = await assignmentRepository.getAssignmentDetailsByIdForUser(
        999,
        1,
      )

      expect(result.error).toBe("Assignment not found")
    })
  })

  // ============================================================================
  // getSubmissionFileContentById Tests
  // ============================================================================

  describe("getSubmissionFileContentById", () => {
    const mockContent = {
      success: true,
      content: 'print("Hello World")',
      language: "python",
    }

    it("fetches submission content for preview", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockContent,
        status: 200,
      })

      const result = await assignmentRepository.getSubmissionFileContentById(1)

      expect(apiClient.get).toHaveBeenCalledWith("/submissions/1/content")
      expect(result.data?.content).toBe('print("Hello World")')
      expect(result.data?.language).toBe("python")
    })

    it("returns error when submission not found", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Submission not found",
        status: 404,
      })

      const result =
        await assignmentRepository.getSubmissionFileContentById(999)

      expect(result.error).toBe("Submission not found")
    })
  })

  // ============================================================================
  // getSubmissionFileDownloadUrlById Tests
  // ============================================================================

  describe("getSubmissionFileDownloadUrlById", () => {
    const mockDownloadResponse = {
      success: true,
      message: "Download URL generated",
      downloadUrl: "https://storage.example.com/submissions/1/solution.py",
    }

    it("fetches download URL for a submission", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockDownloadResponse,
        status: 200,
      })

      const result =
        await assignmentRepository.getSubmissionFileDownloadUrlById(1)

      expect(apiClient.get).toHaveBeenCalledWith("/submissions/1/download")
      expect(result.data?.downloadUrl).toBeDefined()
    })

    it("returns error when submission not found", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Submission not found",
        status: 404,
      })

      const result =
        await assignmentRepository.getSubmissionFileDownloadUrlById(999)

      expect(result.error).toBe("Submission not found")
    })

    it("returns error when download not available", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Download not available",
        status: 501,
      })

      const result =
        await assignmentRepository.getSubmissionFileDownloadUrlById(1)

      expect(result.error).toBe("Download not available")
    })
  })
})
