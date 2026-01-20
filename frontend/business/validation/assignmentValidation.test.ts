/**
 * Assignment Validation Unit Tests
 * Tests for assignment form validation rules
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  validateAssignmentTitle,
  validateDescription,
  validateProgrammingLanguage,
  validateDeadline,
  validateCreateAssignmentData,
  validateUpdateAssignmentData,
} from "./assignmentValidation";

describe("assignmentValidation", () => {
  // ============ validateAssignmentTitle Tests ============
  describe("validateAssignmentTitle", () => {
    it("should return null for valid title", () => {
      expect(validateAssignmentTitle("Lab 1: Introduction")).toBeNull();
    });

    it("should return error for empty title", () => {
      expect(validateAssignmentTitle("")).toBe("Assignment title is required");
    });

    it("should return error for whitespace-only title", () => {
      expect(validateAssignmentTitle("   ")).toBe(
        "Assignment title is required",
      );
    });

    it("should return null for 150 character title", () => {
      const title = "A".repeat(150);
      expect(validateAssignmentTitle(title)).toBeNull();
    });

    it("should return error for title exceeding 150 characters", () => {
      const title = "A".repeat(151);
      expect(validateAssignmentTitle(title)).toBe(
        "Assignment title must not exceed 150 characters",
      );
    });
  });

  // ============ validateDescription Tests ============
  describe("validateDescription", () => {
    it("should return null for valid description", () => {
      expect(
        validateDescription(
          "This is a detailed assignment description that is long enough.",
        ),
      ).toBeNull();
    });

    it("should return error for empty description", () => {
      expect(validateDescription("")).toBe("Description is required");
    });

    it("should return error for description less than 10 characters", () => {
      expect(validateDescription("Short")).toBe(
        "Description must be at least 10 characters",
      );
    });

    it("should return null for exactly 10 characters", () => {
      expect(validateDescription("1234567890")).toBeNull();
    });

    it("should trim whitespace and validate length", () => {
      expect(validateDescription("   Short   ")).toBe(
        "Description must be at least 10 characters",
      );
    });
  });

  // ============ validateProgrammingLanguage Tests ============
  describe("validateProgrammingLanguage", () => {
    it("should return null for python", () => {
      expect(validateProgrammingLanguage("python")).toBeNull();
    });

    it("should return null for java", () => {
      expect(validateProgrammingLanguage("java")).toBeNull();
    });

    it("should return null for c", () => {
      expect(validateProgrammingLanguage("c")).toBeNull();
    });

    it("should be case insensitive", () => {
      expect(validateProgrammingLanguage("PYTHON")).toBeNull();
      expect(validateProgrammingLanguage("Java")).toBeNull();
    });

    it("should return error for empty language", () => {
      expect(validateProgrammingLanguage("")).toBe(
        "Programming language is required",
      );
    });

    it("should return error for invalid language", () => {
      expect(validateProgrammingLanguage("rust")).toBe(
        "Invalid programming language. Must be Python, Java, or C",
      );
    });
  });

  // ============ validateDeadline Tests ============
  describe("validateDeadline", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return null for future deadline", () => {
      const futureDate = new Date("2024-06-20T12:00:00Z");
      expect(validateDeadline(futureDate)).toBeNull();
    });

    it("should return null for future deadline string", () => {
      expect(validateDeadline("2024-06-20T12:00:00Z")).toBeNull();
    });

    it("should return error for empty deadline", () => {
      expect(validateDeadline("")).toBe("Deadline is required");
    });

    it("should return error for null deadline", () => {
      expect(validateDeadline(null as any)).toBe("Deadline is required");
    });

    it("should return error for invalid date string", () => {
      expect(validateDeadline("not-a-date")).toBe("Invalid deadline date");
    });

    it("should return error for past deadline", () => {
      const pastDate = new Date("2024-06-10T12:00:00Z");
      expect(validateDeadline(pastDate)).toBe("Deadline must be in the future");
    });

    it("should return error for current time (not in future)", () => {
      const now = new Date("2024-06-15T12:00:00Z");
      expect(validateDeadline(now)).toBe("Deadline must be in the future");
    });
  });

  // ============ validateCreateAssignmentData Tests ============
  describe("validateCreateAssignmentData", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return valid result for complete correct data", () => {
      const result = validateCreateAssignmentData({
        assignmentName: "Lab 1: Variables",
        description:
          "This assignment covers variables and data types in Python.",
        programmingLanguage: "python",
        deadline: "2024-07-01T12:00:00Z",
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return error for missing assignmentName", () => {
      const result = validateCreateAssignmentData({
        description: "Some valid description here.",
        programmingLanguage: "python",
        deadline: "2024-07-01T12:00:00Z",
      });

      expect(result.isValid).toBe(false);
      expect(
        result.errors.find((e) => e.field === "assignmentName")?.message,
      ).toBe("Assignment title is required");
    });

    it("should return error for missing description", () => {
      const result = validateCreateAssignmentData({
        assignmentName: "Lab 1",
        programmingLanguage: "python",
        deadline: "2024-07-01T12:00:00Z",
      });

      expect(result.isValid).toBe(false);
      expect(
        result.errors.find((e) => e.field === "description")?.message,
      ).toBe("Description is required");
    });

    it("should return error for missing programmingLanguage", () => {
      const result = validateCreateAssignmentData({
        assignmentName: "Lab 1",
        description: "Some valid description here.",
        deadline: "2024-07-01T12:00:00Z",
      });

      expect(result.isValid).toBe(false);
      expect(
        result.errors.find((e) => e.field === "programmingLanguage")?.message,
      ).toBe("Programming language is required");
    });

    it("should return error for missing deadline", () => {
      const result = validateCreateAssignmentData({
        assignmentName: "Lab 1",
        description: "Some valid description here.",
        programmingLanguage: "python",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.find((e) => e.field === "deadline")?.message).toBe(
        "Deadline is required",
      );
    });

    it("should return multiple errors for multiple invalid fields", () => {
      const result = validateCreateAssignmentData({});

      expect(result.isValid).toBe(false);
      expect(
        result.errors.find((e) => e.field === "assignmentName"),
      ).toBeDefined();
      expect(
        result.errors.find((e) => e.field === "description"),
      ).toBeDefined();
      expect(
        result.errors.find((e) => e.field === "programmingLanguage"),
      ).toBeDefined();
      expect(result.errors.find((e) => e.field === "deadline")).toBeDefined();
    });
  });

  // ============ validateUpdateAssignmentData Tests ============
  describe("validateUpdateAssignmentData", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should not throw for valid update data", () => {
      expect(() =>
        validateUpdateAssignmentData({
          teacherId: 1,
          assignmentName: "Updated Lab 1",
          description: "Updated description that is long enough.",
          deadline: "2024-07-01T12:00:00Z",
        }),
      ).not.toThrow();
    });

    it("should throw for missing teacherId", () => {
      expect(() =>
        validateUpdateAssignmentData({
          assignmentName: "Updated",
        } as any),
      ).toThrow("Invalid teacher ID");
    });

    it("should throw for invalid teacherId (zero)", () => {
      expect(() =>
        validateUpdateAssignmentData({
          teacherId: 0,
        }),
      ).toThrow("Invalid teacher ID");
    });

    it("should throw for invalid teacherId (negative)", () => {
      expect(() =>
        validateUpdateAssignmentData({
          teacherId: -1,
        }),
      ).toThrow("Invalid teacher ID");
    });

    it("should throw for invalid assignmentName if provided", () => {
      expect(() =>
        validateUpdateAssignmentData({
          teacherId: 1,
          assignmentName: "",
        }),
      ).toThrow("Assignment title is required");
    });

    it("should throw for invalid description if provided", () => {
      expect(() =>
        validateUpdateAssignmentData({
          teacherId: 1,
          description: "short",
        }),
      ).toThrow("Description must be at least 10 characters");
    });

    it("should throw for past deadline if provided", () => {
      expect(() =>
        validateUpdateAssignmentData({
          teacherId: 1,
          deadline: "2024-01-01T12:00:00Z",
        }),
      ).toThrow("Deadline must be in the future");
    });

    it("should not validate fields that are not provided", () => {
      expect(() =>
        validateUpdateAssignmentData({
          teacherId: 1,
        }),
      ).not.toThrow();
    });
  });
});
