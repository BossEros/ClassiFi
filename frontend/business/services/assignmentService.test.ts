import { describe, it, expect, vi, beforeEach } from "vitest";

import * as assignmentService from "./assignmentService";
import * as assignmentRepository from "@/data/repositories/assignmentRepository";
import * as assignmentValidation from "@/shared/utils/assignmentValidation";
import {
  createMockSubmission,
  createMockAssignment,
} from "@/tests/utils/factories";
import type { AssignmentDetail } from "@/data/api/types";

// Mock dependencies
vi.mock("@/data/repositories/assignmentRepository");
vi.mock("@/shared/utils/assignmentValidation");

describe("assignmentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // submitAssignment Tests
  // ============================================================================

  describe("submitAssignment", () => {
    const mockRequest = {
      assignmentId: 1,
      studentId: 1,
      file: new File(["content"], "test.py", { type: "text/x-python" }),
      programmingLanguage: "python" as const,
    };

    const mockSubmission = createMockSubmission();

    it("submits assignment successfully when validation passes", async () => {
      vi.mocked(assignmentValidation.validateFile).mockReturnValue(null);
      vi.mocked(assignmentRepository.submitAssignment).mockResolvedValue({
        data: { success: true, submission: mockSubmission },
        status: 200,
      });

      const result = await assignmentService.submitAssignment(mockRequest);

      expect(assignmentValidation.validateFile).toHaveBeenCalledWith(
        mockRequest.file,
        mockRequest.programmingLanguage,
      );
      expect(assignmentRepository.submitAssignment).toHaveBeenCalledWith(
        mockRequest,
      );
      expect(result).toEqual(mockSubmission);
    });

    it("throws error when file validation fails", async () => {
      vi.mocked(assignmentValidation.validateFile).mockReturnValue(
        "Invalid file type",
      );

      await expect(
        assignmentService.submitAssignment(mockRequest),
      ).rejects.toThrow("Invalid file type");

      expect(assignmentRepository.submitAssignment).not.toHaveBeenCalled();
    });

    it("throws error when repository call fails", async () => {
      vi.mocked(assignmentValidation.validateFile).mockReturnValue(null);
      vi.mocked(assignmentRepository.submitAssignment).mockResolvedValue({
        error: "Submission failed",
        status: 400,
      });

      await expect(
        assignmentService.submitAssignment(mockRequest),
      ).rejects.toThrow("Submission failed");
    });

    it("throws error when ID validation fails", async () => {
      const invalidRequest = { ...mockRequest, assignmentId: -1 };

      await expect(
        assignmentService.submitAssignment(invalidRequest),
      ).rejects.toThrow(); // validateId helper throws generic error or message
    });
  });

  // ============================================================================
  // getSubmissionHistory Tests
  // ============================================================================

  describe("getSubmissionHistory", () => {
    const mockHistory = {
      success: true,
      submissions: [createMockSubmission()],
      totalSubmissions: 1,
    };

    it("fetches submission history successfully", async () => {
      vi.mocked(assignmentRepository.getSubmissionHistory).mockResolvedValue({
        data: mockHistory,
        status: 200,
      });

      const result = await assignmentService.getSubmissionHistory(1, 1);

      expect(assignmentRepository.getSubmissionHistory).toHaveBeenCalledWith(
        1,
        1,
      );
      expect(result).toEqual(mockHistory);
    });

    it("throws error when repository returns error", async () => {
      vi.mocked(assignmentRepository.getSubmissionHistory).mockResolvedValue({
        error: "Fetch failed",
        status: 400,
      });

      await expect(
        assignmentService.getSubmissionHistory(1, 1),
      ).rejects.toThrow("Fetch failed");
    });

    it("throws error when data is missing", async () => {
      vi.mocked(assignmentRepository.getSubmissionHistory).mockResolvedValue({
        data: undefined,
        status: 200,
      });

      await expect(
        assignmentService.getSubmissionHistory(1, 1),
      ).rejects.toThrow("Failed to fetch submission history");
    });
  });

  // ============================================================================
  // getStudentSubmissions Tests
  // ============================================================================

  describe("getStudentSubmissions", () => {
    const mockSubmissions = [createMockSubmission()];

    it("fetches student submissions successfully", async () => {
      vi.mocked(assignmentRepository.getStudentSubmissions).mockResolvedValue({
        data: { success: true, submissions: mockSubmissions },
        status: 200,
      });

      const result = await assignmentService.getStudentSubmissions(1, true);

      expect(assignmentRepository.getStudentSubmissions).toHaveBeenCalledWith(
        1,
        true,
      );
      expect(result).toEqual(mockSubmissions);
    });

    it("throws error when repository fails", async () => {
      vi.mocked(assignmentRepository.getStudentSubmissions).mockResolvedValue({
        error: "API Error",
        status: 400,
      });

      await expect(assignmentService.getStudentSubmissions(1)).rejects.toThrow(
        "API Error",
      );
    });
  });

  // ============================================================================
  // getAssignmentSubmissions Tests
  // ============================================================================

  describe("getAssignmentSubmissions", () => {
    const mockSubmissions = [createMockSubmission()];

    it("fetches assignment submissions successfully", async () => {
      vi.mocked(
        assignmentRepository.getAssignmentSubmissions,
      ).mockResolvedValue({
        data: { success: true, submissions: mockSubmissions },
        status: 200,
      });

      const result = await assignmentService.getAssignmentSubmissions(100);

      expect(
        assignmentRepository.getAssignmentSubmissions,
      ).toHaveBeenCalledWith(100, true);
      expect(result).toEqual(mockSubmissions);
    });

    it("throws error when repository fails", async () => {
      vi.mocked(
        assignmentRepository.getAssignmentSubmissions,
      ).mockResolvedValue({
        error: "Not found",
        status: 404,
      });

      await expect(
        assignmentService.getAssignmentSubmissions(100),
      ).rejects.toThrow("Not found");
    });
  });

  // ============================================================================
  // getAssignmentById Tests
  // ============================================================================

  describe("getAssignmentById", () => {
    const mockAssignment = createMockAssignment();
    const mockDetail = {
      ...mockAssignment,
      className: "Test Class",
      deadline: new Date().toISOString(),
      description: mockAssignment.description || "Test description",
      programmingLanguage: mockAssignment.programmingLanguage as "python" | "java" | "c",
      allowResubmission: mockAssignment.allowResubmission ?? true,
      isActive: mockAssignment.isActive ?? true,
    } as AssignmentDetail;

    it("fetches assignment details successfully", async () => {
      vi.mocked(assignmentRepository.getAssignmentById).mockResolvedValue({
        data: { success: true, assignment: mockDetail },
        status: 200,
      });

      const result = await assignmentService.getAssignmentById(1, 1);

      expect(assignmentRepository.getAssignmentById).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(mockDetail);
    });

    it("throws error when assignment not found", async () => {
      vi.mocked(assignmentRepository.getAssignmentById).mockResolvedValue({
        error: "Assignment not found",
        status: 404,
      });

      await expect(assignmentService.getAssignmentById(999, 1)).rejects.toThrow(
        "Assignment not found",
      );
    });

    it("throws error when data is incomplete", async () => {
      vi.mocked(assignmentRepository.getAssignmentById).mockResolvedValue({
        data: { success: true, assignment: undefined },
        status: 200,
      });

      await expect(assignmentService.getAssignmentById(1, 1)).rejects.toThrow(
        "Failed to fetch assignment details",
      );
    });
  });

  // ============================================================================
  // getSubmissionContent Tests
  // ============================================================================

  describe("getSubmissionContent", () => {
    const mockContent = { success: true, content: "print('hello')", language: "python" };

    it("fetches submission content successfully", async () => {
      vi.mocked(assignmentRepository.getSubmissionContent).mockResolvedValue({
        data: mockContent,
        status: 200,
      });

      const result = await assignmentService.getSubmissionContent(123);

      expect(assignmentRepository.getSubmissionContent).toHaveBeenCalledWith(
        123,
      );
      expect(result).toEqual(mockContent);
    });

    it("throws error when fetch fails", async () => {
      vi.mocked(assignmentRepository.getSubmissionContent).mockResolvedValue({
        error: "Content unavailable",
        status: 404,
      });

      await expect(assignmentService.getSubmissionContent(123)).rejects.toThrow(
        "Content unavailable",
      );
    });
  });

  // ============================================================================
  // getSubmissionDownloadUrl Tests
  // ============================================================================

  describe("getSubmissionDownloadUrl", () => {
    it("fetches download URL successfully", async () => {
      vi.mocked(
        assignmentRepository.getSubmissionDownloadUrl,
      ).mockResolvedValue({
        data: {
          success: true,
          message: "URL generated",
          downloadUrl: "https://example.com/file.py",
        },
        status: 200,
      });

      const result = await assignmentService.getSubmissionDownloadUrl(123);

      expect(
        assignmentRepository.getSubmissionDownloadUrl,
      ).toHaveBeenCalledWith(123);
      expect(result).toBe("https://example.com/file.py");
    });

    it("throws error when URL generation fails", async () => {
      vi.mocked(
        assignmentRepository.getSubmissionDownloadUrl,
      ).mockResolvedValue({
        error: "Generation failed",
        status: 400,
      });

      await expect(
        assignmentService.getSubmissionDownloadUrl(123),
      ).rejects.toThrow("Generation failed");
    });
  });
});
