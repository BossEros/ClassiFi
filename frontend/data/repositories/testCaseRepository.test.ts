import { describe, it, expect, vi, beforeEach } from "vitest";

import * as testCaseRepository from "./testCaseRepository";
import { apiClient } from "@/data/api/apiClient";

// Mock the apiClient
vi.mock("@/data/api/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("testCaseRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Fixtures
  // ============================================================================

  const mockTestCase = {
    id: 1,
    assignmentId: 1,
    name: "Test Case 1",
    input: "hello",
    expectedOutput: "HELLO",
    isHidden: false,
    timeLimit: 5,
    sortOrder: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
  };

  // ============================================================================
  // getTestCases Tests
  // ============================================================================

  describe("getTestCases", () => {
    it("fetches test cases for an assignment", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, testCases: [mockTestCase] },
        status: 200,
      });

      const result = await testCaseRepository.getTestCases(1);

      expect(apiClient.get).toHaveBeenCalledWith("/assignments/1/test-cases");
      expect(result.data?.testCases).toHaveLength(1);
    });

    it("returns error when API fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Not found",
        status: 404,
      });

      const result = await testCaseRepository.getTestCases(999);

      expect(result.error).toBe("Not found");
    });
  });

  // ============================================================================
  // createTestCase Tests
  // ============================================================================

  describe("createTestCase", () => {
    const createRequest = {
      name: "New Test",
      input: "input",
      expectedOutput: "output",
    };

    it("creates a test case successfully", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { success: true, testCase: mockTestCase },
        status: 201,
      });

      const result = await testCaseRepository.createTestCase(1, createRequest);

      expect(apiClient.post).toHaveBeenCalledWith(
        "/assignments/1/test-cases",
        createRequest,
      );
      expect(result.data?.testCase).toBeDefined();
    });

    it("returns error on failure", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        error: "Validation failed",
        status: 400,
      });

      const result = await testCaseRepository.createTestCase(1, createRequest);

      expect(result.error).toBe("Validation failed");
    });
  });

  // ============================================================================
  // updateTestCase Tests
  // ============================================================================

  describe("updateTestCase", () => {
    const updateRequest = { name: "Updated Name" };

    it("updates a test case successfully", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({
        data: {
          success: true,
          testCase: { ...mockTestCase, name: "Updated Name" },
        },
        status: 200,
      });

      const result = await testCaseRepository.updateTestCase(1, updateRequest);

      expect(apiClient.put).toHaveBeenCalledWith(
        "/test-cases/1",
        updateRequest,
      );
      expect(result.data?.testCase.name).toBe("Updated Name");
    });

    it("returns error on failure", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({
        error: "Not found",
        status: 404,
      });

      const result = await testCaseRepository.updateTestCase(
        999,
        updateRequest,
      );

      expect(result.error).toBe("Not found");
    });
  });

  // ============================================================================
  // deleteTestCase Tests
  // ============================================================================

  describe("deleteTestCase", () => {
    it("deletes a test case successfully", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        data: { success: true, message: "Deleted" },
        status: 200,
      });

      const result = await testCaseRepository.deleteTestCase(1);

      expect(apiClient.delete).toHaveBeenCalledWith("/test-cases/1");
      expect(result.data?.success).toBe(true);
    });

    it("returns error on failure", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        error: "Not found",
        status: 404,
      });

      const result = await testCaseRepository.deleteTestCase(999);

      expect(result.error).toBe("Not found");
    });
  });

  // ============================================================================
  // reorderTestCases Tests
  // ============================================================================

  describe("reorderTestCases", () => {
    const order = [
      { id: 1, sortOrder: 2 },
      { id: 2, sortOrder: 1 },
    ];

    it("reorders test cases successfully", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({
        data: { success: true, message: "Reordered" },
        status: 200,
      });

      const result = await testCaseRepository.reorderTestCases(1, order);

      expect(apiClient.put).toHaveBeenCalledWith(
        "/assignments/1/test-cases/reorder",
        { order },
      );
      expect(result.data?.success).toBe(true);
    });

    it("returns error on failure", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({
        error: "Assignment not found",
        status: 404,
      });

      const result = await testCaseRepository.reorderTestCases(999, order);

      expect(result.error).toBe("Assignment not found");
    });
  });

  // ============================================================================
  // runTestsPreview Tests
  // ============================================================================

  describe("runTestsPreview", () => {
    it("runs tests in preview mode", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          success: true,
          data: { results: [], passedCount: 0, totalCount: 0, score: 0 },
        },
        status: 200,
      });

      const result = await testCaseRepository.runTestsPreview(
        "print('hello')",
        "python",
        1,
      );

      expect(apiClient.post).toHaveBeenCalledWith("/code/run-tests", {
        sourceCode: "print('hello')",
        language: "python",
        assignmentId: 1,
      });
      expect(result.data?.success).toBe(true);
    });

    it("returns error on execution failure", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        error: "Execution timeout",
        status: 500,
      });

      const result = await testCaseRepository.runTestsPreview(
        "while True: pass",
        "python",
        1,
      );

      expect(result.error).toBe("Execution timeout");
    });

    it("returns error when API returns non-success response", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          success: false,
          message: "Compilation error: syntax error on line 1",
        },
        status: 200,
      });

      const result = await testCaseRepository.runTestsPreview(
        "invalid code",
        "python",
        1,
      );

      expect(result.data?.success).toBe(false);
      expect(result.data?.message).toBe(
        "Compilation error: syntax error on line 1",
      );
    });
  });

  // ============================================================================
  // getTestResults Tests
  // ============================================================================

  describe("getTestResults", () => {
    it("fetches test results for a submission", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          success: true,
          data: {
            results: [],
            passedCount: 3,
            totalCount: 5,
            score: 60,
          },
        },
        status: 200,
      });

      const result = await testCaseRepository.getTestResults(1);

      expect(apiClient.get).toHaveBeenCalledWith("/submissions/1/test-results");
      expect(result.data?.data.passedCount).toBe(3);
    });

    it("returns error when submission not found", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Submission not found",
        status: 404,
      });

      const result = await testCaseRepository.getTestResults(999);

      expect(result.error).toBe("Submission not found");
    });

    it("returns error on server failure", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Internal server error",
        status: 500,
      });

      const result = await testCaseRepository.getTestResults(1);

      expect(result.error).toBe("Internal server error");
    });
  });

  // ============================================================================
  // runTestsForSubmission Tests
  // ============================================================================

  describe("runTestsForSubmission", () => {
    it("runs tests for a submission", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          success: true,
          data: { results: [], passedCount: 5, totalCount: 5, score: 100 },
        },
        status: 200,
      });

      const result = await testCaseRepository.runTestsForSubmission(1);

      expect(apiClient.post).toHaveBeenCalledWith(
        "/submissions/1/run-tests",
        {},
      );
      expect(result.data?.data.score).toBe(100);
    });

    it("returns error when submission not found", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        error: "Submission not found",
        status: 404,
      });

      const result = await testCaseRepository.runTestsForSubmission(999);

      expect(result.error).toBe("Submission not found");
    });

    it("returns error on execution failure", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        error: "Execution service unavailable",
        status: 503,
      });

      const result = await testCaseRepository.runTestsForSubmission(1);

      expect(result.error).toBe("Execution service unavailable");
    });

    it("returns error when tests fail due to runtime error", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          success: false,
          message: "Runtime error: segmentation fault",
          data: { results: [], passedCount: 0, totalCount: 5, score: 0 },
        },
        status: 200,
      });

      const result = await testCaseRepository.runTestsForSubmission(1);

      expect(result.data?.success).toBe(false);
      expect(result.data?.message).toBe("Runtime error: segmentation fault");
    });
  });
});
