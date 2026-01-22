import { describe, it, expect } from "vitest";

import {
  mapSubmission,
  mapSubmissionWithAssignment,
  mapSubmissionWithStudent,
  type SubmissionDTO,
} from "@/data/mappers";

describe("mappers", () => {
  // ============================================================================
  // Test Fixtures
  // ============================================================================

  const baseSubmissionDTO: SubmissionDTO = {
    id: 1,
    assignmentId: 10,
    studentId: 100,
    fileName: "solution.py",
    fileSize: 1024,
    submissionNumber: 1,
    submittedAt: "2024-06-15T12:00:00.000Z",
    isLatest: true,
    grade: 95,
  };

  // ============================================================================
  // mapSubmission Tests
  // ============================================================================

  describe("mapSubmission", () => {
    it("maps all basic fields correctly", () => {
      const result = mapSubmission(baseSubmissionDTO);

      expect(result).toEqual({
        id: 1,
        assignmentId: 10,
        studentId: 100,
        fileName: "solution.py",
        fileSize: 1024,
        submissionNumber: 1,
        submittedAt: "2024-06-15T12:00:00.000Z",
        isLatest: true,
        grade: 95,
      });
    });

    it("converts Date submittedAt to ISO string", () => {
      const dto: SubmissionDTO = {
        ...baseSubmissionDTO,
        submittedAt: new Date("2024-06-15T12:00:00.000Z"),
      };

      const result = mapSubmission(dto);

      expect(result.submittedAt).toBe("2024-06-15T12:00:00.000Z");
    });

    it("keeps string submittedAt as is", () => {
      const dto: SubmissionDTO = {
        ...baseSubmissionDTO,
        submittedAt: "2024-12-25T00:00:00Z",
      };

      const result = mapSubmission(dto);

      expect(result.submittedAt).toBe("2024-12-25T00:00:00Z");
    });

    it("converts null grade to undefined", () => {
      const dto: SubmissionDTO = {
        ...baseSubmissionDTO,
        grade: null,
      };

      const result = mapSubmission(dto);

      expect(result.grade).toBeUndefined();
    });

    it("preserves grade when present", () => {
      const dto: SubmissionDTO = {
        ...baseSubmissionDTO,
        grade: 85,
      };

      const result = mapSubmission(dto);

      expect(result.grade).toBe(85);
    });

    it("handles zero grade correctly", () => {
      const dto: SubmissionDTO = {
        ...baseSubmissionDTO,
        grade: 0,
      };

      const result = mapSubmission(dto);

      expect(result.grade).toBe(0);
    });

    it("handles isLatest: false", () => {
      const dto: SubmissionDTO = {
        ...baseSubmissionDTO,
        isLatest: false,
      };

      const result = mapSubmission(dto);

      expect(result.isLatest).toBe(false);
    });
  });

  // ============================================================================
  // mapSubmissionWithAssignment Tests
  // ============================================================================

  describe("mapSubmissionWithAssignment", () => {
    it("includes assignmentName in the result", () => {
      const dto: SubmissionDTO = {
        ...baseSubmissionDTO,
        assignmentName: "Hello World Assignment",
      };

      const result = mapSubmissionWithAssignment(dto);

      expect(result.assignmentName).toBe("Hello World Assignment");
    });

    it("includes all base submission fields", () => {
      const dto: SubmissionDTO = {
        ...baseSubmissionDTO,
        assignmentName: "Test Assignment",
      };

      const result = mapSubmissionWithAssignment(dto);

      expect(result.id).toBe(1);
      expect(result.assignmentId).toBe(10);
      expect(result.studentId).toBe(100);
      expect(result.fileName).toBe("solution.py");
    });

    it("throws error when assignmentName is missing", () => {
      const dto: SubmissionDTO = {
        ...baseSubmissionDTO,
        // assignmentName is not set
      };

      expect(() => mapSubmissionWithAssignment(dto)).toThrow(
        "[mapSubmissionWithAssignment] Missing required property 'assignmentName' for submission ID 1",
      );
    });

    it("throws error when assignmentName is empty string", () => {
      const dto: SubmissionDTO = {
        ...baseSubmissionDTO,
        assignmentName: "",
      };

      // Empty string is falsy, so it should throw
      expect(() => mapSubmissionWithAssignment(dto)).toThrow(
        "[mapSubmissionWithAssignment] Missing required property 'assignmentName' for submission ID 1",
      );
    });
  });

  // ============================================================================
  // mapSubmissionWithStudent Tests
  // ============================================================================

  describe("mapSubmissionWithStudent", () => {
    it("includes studentName in the result", () => {
      const dto: SubmissionDTO = {
        ...baseSubmissionDTO,
        studentName: "John Doe",
      };

      const result = mapSubmissionWithStudent(dto);

      expect(result.studentName).toBe("John Doe");
    });

    it("includes all base submission fields", () => {
      const dto: SubmissionDTO = {
        ...baseSubmissionDTO,
        studentName: "Jane Smith",
      };

      const result = mapSubmissionWithStudent(dto);

      expect(result.id).toBe(1);
      expect(result.assignmentId).toBe(10);
      expect(result.studentId).toBe(100);
      expect(result.isLatest).toBe(true);
    });

    it("throws error when studentName is missing", () => {
      const dto: SubmissionDTO = {
        ...baseSubmissionDTO,
        // studentName is not set
      };

      expect(() => mapSubmissionWithStudent(dto)).toThrow(
        "[mapSubmissionWithStudent] Missing required property 'studentName' for submission ID 1",
      );
    });

    it("throws error when studentName is empty string", () => {
      const dto: SubmissionDTO = {
        ...baseSubmissionDTO,
        studentName: "",
      };

      // Empty string is falsy, so it should throw
      expect(() => mapSubmissionWithStudent(dto)).toThrow(
        "[mapSubmissionWithStudent] Missing required property 'studentName' for submission ID 1",
      );
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe("edge cases", () => {
    it("handles large file sizes", () => {
      const dto: SubmissionDTO = {
        ...baseSubmissionDTO,
        fileSize: 1073741824, // 1 GB
      };

      const result = mapSubmission(dto);

      expect(result.fileSize).toBe(1073741824);
    });

    it("handles high submission numbers", () => {
      const dto: SubmissionDTO = {
        ...baseSubmissionDTO,
        submissionNumber: 999,
      };

      const result = mapSubmission(dto);

      expect(result.submissionNumber).toBe(999);
    });

    it("handles various file names", () => {
      const dto: SubmissionDTO = {
        ...baseSubmissionDTO,
        fileName: "my-solution.java",
      };

      const result = mapSubmission(dto);

      expect(result.fileName).toBe("my-solution.java");
    });
  });
});
