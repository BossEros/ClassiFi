import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  validateAssignmentTitle,
  validateInstructions,
  validateProgrammingLanguage,
  validateDeadline,
  validateCreateAssignmentData,
  validateUpdateAssignmentData,
} from "../assignmentValidation"

describe("assignmentValidation", () => {
  // ============ validateAssignmentTitle Tests ============
  describe("validateAssignmentTitle", () => {
    it("should return null for valid title", () => {
      expect(validateAssignmentTitle("Lab 1: Introduction")).toBeNull()
    })

    it("should return error for empty title", () => {
      expect(validateAssignmentTitle("")).toBe("Assignment title is required")
    })

    it("should return error for whitespace-only title", () => {
      expect(validateAssignmentTitle("   ")).toBe(
        "Assignment title is required",
      )
    })

    it("should return null for 150 character title", () => {
      const title = "A".repeat(150)
      expect(validateAssignmentTitle(title)).toBeNull()
    })

    it("should return error for title exceeding 150 characters", () => {
      const title = "A".repeat(151)
      expect(validateAssignmentTitle(title)).toBe(
        "Assignment title must not exceed 150 characters",
      )
    })
  })

  // ============ validateInstructions Tests ============
  describe("validateInstructions", () => {
    it("should return null for valid instructions", () => {
      expect(
        validateInstructions(
          "This is a detailed assignment instructions that is long enough.",
        ),
      ).toBeNull()
    })

    it("should return error when both instructions and image are missing", () => {
      expect(validateInstructions("")).toBe(
        "Add instructions or upload an image",
      )
    })

    it("should allow short instructions when provided", () => {
      expect(validateInstructions("Short")).toBeNull()
    })

    it("should allow image-only instructions", () => {
      expect(
        validateInstructions("", "https://example.com/image.png"),
      ).toBeNull()
    })

    it("should return error for overly long instructions", () => {
      expect(validateInstructions("A".repeat(5001))).toBe(
        "Instructions must not exceed 5000 characters",
      )
    })
  })

  // ============ validateProgrammingLanguage Tests ============
  describe("validateProgrammingLanguage", () => {
    it("should return null for python", () => {
      expect(validateProgrammingLanguage("python")).toBeNull()
    })

    it("should return null for java", () => {
      expect(validateProgrammingLanguage("java")).toBeNull()
    })

    it("should return null for c", () => {
      expect(validateProgrammingLanguage("c")).toBeNull()
    })

    it("should be case insensitive", () => {
      expect(validateProgrammingLanguage("PYTHON")).toBeNull()
      expect(validateProgrammingLanguage("Java")).toBeNull()
    })

    it("should return error for empty language", () => {
      expect(validateProgrammingLanguage("")).toBe(
        "Programming language is required",
      )
    })

    it("should return error for invalid language", () => {
      expect(validateProgrammingLanguage("rust")).toBe(
        "Invalid programming language. Must be Python, Java, or C",
      )
    })
  })

  // ============ validateDeadline Tests ============
  describe("validateDeadline", () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("should return null for future deadline", () => {
      const futureDate = new Date("2024-06-20T12:00:00Z")
      expect(validateDeadline(futureDate)).toBeNull()
    })

    it("should return null for future deadline string", () => {
      expect(validateDeadline("2024-06-20T12:00:00Z")).toBeNull()
    })

    it("should return null for empty deadline", () => {
      expect(validateDeadline("")).toBeNull()
    })

    it("should return null for null deadline", () => {
      expect(validateDeadline(null)).toBeNull()
    })

    it("should return error for invalid date string", () => {
      expect(validateDeadline("not-a-date")).toBe("Invalid deadline date")
    })

    it("should return error for past deadline", () => {
      const pastDate = new Date("2024-06-10T12:00:00Z")
      expect(validateDeadline(pastDate)).toBe("Deadline must be in the future")
    })

    it("should return error for current time (not in future)", () => {
      const now = new Date("2024-06-15T12:00:00Z")
      expect(validateDeadline(now)).toBe("Deadline must be in the future")
    })
  })

  // ============ validateCreateAssignmentData Tests ============
  describe("validateCreateAssignmentData", () => {
    type CreateAssignmentInput = Parameters<
      typeof validateCreateAssignmentData
    >[0]

    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("should return valid result for complete correct data", () => {
      const result = validateCreateAssignmentData({
        assignmentName: "Lab 1: Variables",
        instructions:
          "This assignment covers variables and data types in Python.",
        programmingLanguage: "python",
        deadline: "2024-07-01T12:00:00Z",
      })

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should return error for missing assignmentName", () => {
      const result = validateCreateAssignmentData({
        instructions: "Some valid instructions here.",
        programmingLanguage: "python",
        deadline: "2024-07-01T12:00:00Z",
      })

      expect(result.isValid).toBe(false)
      expect(
        result.errors.find((e) => e.field === "assignmentName")?.message,
      ).toBe("Assignment title is required")
    })

    it("should return error for missing instructions and image", () => {
      const result = validateCreateAssignmentData({
        assignmentName: "Lab 1",
        programmingLanguage: "python",
        deadline: "2024-07-01T12:00:00Z",
      })

      expect(result.isValid).toBe(false)
      expect(
        result.errors.find((e) => e.field === "instructions")?.message,
      ).toBe("Add instructions or upload an image")
    })

    it("should allow create with image-only instructions", () => {
      const result = validateCreateAssignmentData({
        assignmentName: "Lab 1",
        instructions: "",
        instructionsImageUrl: "https://example.com/image.png",
        programmingLanguage: "python",
        deadline: "2024-07-01T12:00:00Z",
      })

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should allow image-only instructions when instructions field is omitted", () => {
      const result = validateCreateAssignmentData({
        assignmentName: "Lab 1",
        instructionsImageUrl: "https://example.com/image.png",
        programmingLanguage: "python",
      })

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should return error for missing programmingLanguage", () => {
      const result = validateCreateAssignmentData({
        assignmentName: "Lab 1",
        instructions: "Some valid instructions here.",
        deadline: "2024-07-01T12:00:00Z",
      })

      expect(result.isValid).toBe(false)
      expect(
        result.errors.find((e) => e.field === "programmingLanguage")?.message,
      ).toBe("Programming language is required")
    })

    it("should allow missing deadline", () => {
      const result = validateCreateAssignmentData({
        assignmentName: "Lab 1",
        instructions: "Some valid instructions here.",
        programmingLanguage: "python",
      })

      expect(result.isValid).toBe(true)
      expect(result.errors.find((e) => e.field === "deadline")).toBeUndefined()
    })

    it("should return multiple errors for multiple invalid fields", () => {
      const result = validateCreateAssignmentData({})

      expect(result.isValid).toBe(false)
      expect(
        result.errors.find((e) => e.field === "assignmentName"),
      ).toBeDefined()
      expect(
        result.errors.find((e) => e.field === "instructions"),
      ).toBeDefined()
      expect(
        result.errors.find((e) => e.field === "programmingLanguage"),
      ).toBeDefined()
      expect(result.errors.find((e) => e.field === "deadline")).toBeUndefined()
    })

    it("should return assignmentName error when provided title is invalid", () => {
      const result = validateCreateAssignmentData({
        assignmentName: "   ",
        instructions: "Valid instructions",
        programmingLanguage: "python",
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: "assignmentName",
        message: "Assignment title is required",
      })
    })

    it("should return instructions error when instructions are provided but invalid", () => {
      const result = validateCreateAssignmentData({
        assignmentName: "Valid title",
        instructions: "   ",
        programmingLanguage: "python",
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: "instructions",
        message: "Add instructions or upload an image",
      })
    })

    it("should return programmingLanguage error when provided language is invalid", () => {
      const invalidLanguageData = {
        assignmentName: "Valid title",
        instructions: "Valid instructions",
        programmingLanguage: "rust",
      } as unknown as CreateAssignmentInput

      const result = validateCreateAssignmentData(invalidLanguageData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: "programmingLanguage",
        message: "Invalid programming language. Must be Python, Java, or C",
      })
    })

    it("should return deadline error when provided deadline is invalid", () => {
      const result = validateCreateAssignmentData({
        assignmentName: "Valid title",
        instructions: "Valid instructions",
        programmingLanguage: "python",
        deadline: "2024-01-01T12:00:00Z",
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: "deadline",
        message: "Deadline must be in the future",
      })
    })
  })

  // ============ validateUpdateAssignmentData Tests ============
  describe("validateUpdateAssignmentData", () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("should not throw for valid update data", () => {
      expect(() =>
        validateUpdateAssignmentData({
          teacherId: 1,
          assignmentName: "Updated Lab 1",
          instructions: "Updated instructions that is long enough.",
          deadline: "2024-07-01T12:00:00Z",
        }),
      ).not.toThrow()
    })

    it("should throw for missing teacherId", () => {
      expect(() =>
        validateUpdateAssignmentData({
          assignmentName: "Updated",
        } as any),
      ).toThrow("Invalid teacher ID")
    })

    it("should throw for invalid teacherId (zero)", () => {
      expect(() =>
        validateUpdateAssignmentData({
          teacherId: 0,
        }),
      ).toThrow("Invalid teacher ID")
    })

    it("should throw for invalid teacherId (negative)", () => {
      expect(() =>
        validateUpdateAssignmentData({
          teacherId: -1,
        }),
      ).toThrow("Invalid teacher ID")
    })

    it("should throw for invalid assignmentName if provided", () => {
      expect(() =>
        validateUpdateAssignmentData({
          teacherId: 1,
          assignmentName: "",
        }),
      ).toThrow("Assignment title is required")
    })

    it("should throw for overly long instructions if provided", () => {
      expect(() =>
        validateUpdateAssignmentData({
          teacherId: 1,
          instructions: "A".repeat(5001),
        }),
      ).toThrow("Instructions must not exceed 5000 characters")
    })

    it("should not throw for image-only instructions update", () => {
      expect(() =>
        validateUpdateAssignmentData({
          teacherId: 1,
          instructions: "",
          instructionsImageUrl: "https://example.com/image.png",
        }),
      ).not.toThrow()
    })

    it("should throw for past deadline if provided", () => {
      expect(() =>
        validateUpdateAssignmentData({
          teacherId: 1,
          deadline: "2024-01-01T12:00:00Z",
        }),
      ).toThrow("Deadline must be in the future")
    })

    it("should throw when both instructions and image are missing", () => {
      expect(() =>
        validateUpdateAssignmentData({
          teacherId: 1,
        }),
      ).toThrow("Add instructions or upload an image")
    })
  })
})
