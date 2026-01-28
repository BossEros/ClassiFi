import { describe, it, expect } from "vitest"
import {
  validateId,
  validateIds,
  validateImageFile,
  FILE_VALIDATION,
} from "@/shared/utils/validators"

describe("validators", () => {
  // ============================================================================
  // validateId Tests
  // ============================================================================

  describe("validateId", () => {
    it("does not throw for valid positive ID", () => {
      expect(() => validateId(1, "user")).not.toThrow()
      expect(() => validateId(100, "class")).not.toThrow()
      expect(() => validateId(999999, "assignment")).not.toThrow()
    })

    it("throws for zero ID", () => {
      expect(() => validateId(0, "user")).toThrow("Invalid user ID")
    })

    it("throws for negative ID", () => {
      expect(() => validateId(-1, "class")).toThrow("Invalid class ID")
      expect(() => validateId(-100, "teacher")).toThrow("Invalid teacher ID")
    })

    it("throws for undefined ID", () => {
      expect(() => validateId(undefined, "student")).toThrow(
        "Invalid student ID",
      )
    })

    it("throws for null ID", () => {
      expect(() => validateId(null, "assignment")).toThrow(
        "Invalid assignment ID",
      )
    })

    it("includes field name in error message", () => {
      expect(() => validateId(0, "customField")).toThrow(
        "Invalid customField ID",
      )
    })
  })

  // ============================================================================
  // validateIds Tests
  // ============================================================================

  describe("validateIds", () => {
    it("does not throw when all IDs are valid", () => {
      expect(() =>
        validateIds({
          user: 1,
          class: 2,
          assignment: 3,
        }),
      ).not.toThrow()
    })

    it("throws for first invalid ID found", () => {
      expect(() =>
        validateIds({
          user: 1,
          class: 0,
          assignment: 3,
        }),
      ).toThrow("Invalid class ID")
    })

    it("throws for undefined ID in object", () => {
      expect(() =>
        validateIds({
          user: 1,
          class: undefined,
        }),
      ).toThrow("Invalid class ID")
    })

    it("throws for null ID in object", () => {
      expect(() =>
        validateIds({
          teacher: null,
        }),
      ).toThrow("Invalid teacher ID")
    })

    it("handles empty object", () => {
      expect(() => validateIds({})).not.toThrow()
    })

    it("throws when any entry is invalid", () => {
      expect(() =>
        validateIds({
          a: 0,
          b: 0,
          c: 0,
        }),
      ).toThrow(/Invalid .* ID/)
    })
  })

  // ============================================================================
  // validateImageFile Tests
  // ============================================================================

  describe("validateImageFile", () => {
    const createMockFile = (
      type: string,
      size: number,
      name = "test.jpg",
    ): File => {
      const blob = new Blob(["x".repeat(size)], { type })
      return new File([blob], name, { type })
    }

    it("returns null for valid JPEG file", () => {
      const file = createMockFile("image/jpeg", 1024 * 1024) // 1MB
      expect(validateImageFile(file)).toBeNull()
    })

    it("returns null for valid PNG file", () => {
      const file = createMockFile("image/png", 2 * 1024 * 1024) // 2MB
      expect(validateImageFile(file)).toBeNull()
    })

    it("returns null for valid GIF file", () => {
      const file = createMockFile("image/gif", 500 * 1024) // 500KB
      expect(validateImageFile(file)).toBeNull()
    })

    it("returns null for valid WebP file", () => {
      const file = createMockFile("image/webp", 3 * 1024 * 1024) // 3MB
      expect(validateImageFile(file)).toBeNull()
    })

    it("returns null for file at max size limit", () => {
      const file = createMockFile("image/jpeg", FILE_VALIDATION.MAX_IMAGE_SIZE)
      expect(validateImageFile(file)).toBeNull()
    })

    it("returns error for invalid file type", () => {
      const file = createMockFile("application/pdf", 1024)
      expect(validateImageFile(file)).toBe(
        "Please select a valid image file (JPEG, PNG, GIF, or WebP)",
      )
    })

    it("returns error for text file", () => {
      const file = createMockFile("text/plain", 1024)
      expect(validateImageFile(file)).toBe(
        "Please select a valid image file (JPEG, PNG, GIF, or WebP)",
      )
    })

    it("returns error for file exceeding size limit", () => {
      const file = createMockFile(
        "image/jpeg",
        FILE_VALIDATION.MAX_IMAGE_SIZE + 1,
      )
      expect(validateImageFile(file)).toBe("File size must be less than 5MB")
    })

    it("returns error for very large file", () => {
      const file = createMockFile("image/png", 10 * 1024 * 1024) // 10MB
      expect(validateImageFile(file)).toBe("File size must be less than 5MB")
    })

    it("prioritizes type error over size error", () => {
      const file = createMockFile(
        "application/pdf",
        FILE_VALIDATION.MAX_IMAGE_SIZE + 1,
      )
      expect(validateImageFile(file)).toBe(
        "Please select a valid image file (JPEG, PNG, GIF, or WebP)",
      )
    })
  })
})
