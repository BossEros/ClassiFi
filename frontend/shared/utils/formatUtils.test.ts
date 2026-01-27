import { describe, it, expect } from "vitest"
import {
  formatFileSize,
  formatFullName,
  withFullName,
  normalizeUserName,
} from "@/shared/utils/formatUtils"

describe("formatUtils", () => {
  // ============================================================================
  // formatFileSize Tests
  // ============================================================================

  describe("formatFileSize", () => {
    it("returns '0 Bytes' for zero bytes", () => {
      expect(formatFileSize(0)).toBe("0 Bytes")
    })

    it("formats bytes correctly", () => {
      expect(formatFileSize(500)).toBe("500 Bytes")
    })

    it("formats kilobytes correctly", () => {
      expect(formatFileSize(1024)).toBe("1 KB")
      expect(formatFileSize(1536)).toBe("1.5 KB")
      expect(formatFileSize(2048)).toBe("2 KB")
    })

    it("formats megabytes correctly", () => {
      expect(formatFileSize(1048576)).toBe("1 MB")
      expect(formatFileSize(1572864)).toBe("1.5 MB")
      expect(formatFileSize(5242880)).toBe("5 MB")
    })

    it("formats gigabytes correctly", () => {
      expect(formatFileSize(1073741824)).toBe("1 GB")
      expect(formatFileSize(2147483648)).toBe("2 GB")
    })

    it("rounds to 2 decimal places", () => {
      expect(formatFileSize(1234567)).toBe("1.18 MB")
    })
  })

  // ============================================================================
  // formatFullName Tests
  // ============================================================================

  describe("formatFullName", () => {
    it("combines first and last name with space", () => {
      expect(formatFullName("John", "Doe")).toBe("John Doe")
    })

    it("handles names with internal whitespace", () => {
      // formatFullName joins with a space and trims the result
      expect(formatFullName("  John  ", "  Doe  ")).toBe("John     Doe")
    })

    it("handles empty first name", () => {
      expect(formatFullName("", "Doe")).toBe("Doe")
    })

    it("handles empty last name", () => {
      expect(formatFullName("John", "")).toBe("John")
    })

    it("handles both names empty", () => {
      expect(formatFullName("", "")).toBe("")
    })
  })

  // ============================================================================
  // withFullName Tests
  // ============================================================================

  describe("withFullName", () => {
    it("adds fullName property to object", () => {
      const person = { firstName: "Jane", lastName: "Smith", id: 1 }
      const result = withFullName(person)

      expect(result.fullName).toBe("Jane Smith")
      expect(result.id).toBe(1)
      expect(result.firstName).toBe("Jane")
      expect(result.lastName).toBe("Smith")
    })

    it("preserves all original properties", () => {
      const person = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        age: 30,
      }
      const result = withFullName(person)

      expect(result.email).toBe("john@example.com")
      expect(result.age).toBe(30)
      expect(result.fullName).toBe("John Doe")
    })

    it("handles empty names", () => {
      const person = { firstName: "", lastName: "", id: 1 }
      const result = withFullName(person)

      expect(result.fullName).toBe("")
    })
  })

  // ============================================================================
  // normalizeUserName Tests
  // ============================================================================

  describe("normalizeUserName", () => {
    it("returns full name when both names provided", () => {
      expect(normalizeUserName("John", "Doe")).toBe("John Doe")
    })

    it("returns first name only when last name is missing", () => {
      expect(normalizeUserName("John", undefined)).toBe("John")
      expect(normalizeUserName("John", null)).toBe("John")
      expect(normalizeUserName("John", "")).toBe("John")
    })

    it("returns last name only when first name is missing", () => {
      expect(normalizeUserName(undefined, "Doe")).toBe("Doe")
      expect(normalizeUserName(null, "Doe")).toBe("Doe")
      expect(normalizeUserName("", "Doe")).toBe("Doe")
    })

    it("returns default fallback when both names are missing", () => {
      expect(normalizeUserName(undefined, undefined)).toBe("Unknown User")
      expect(normalizeUserName(null, null)).toBe("Unknown User")
      expect(normalizeUserName("", "")).toBe("Unknown User")
    })

    it("uses custom fallback when provided", () => {
      expect(normalizeUserName(undefined, undefined, "Anonymous")).toBe(
        "Anonymous",
      )
    })

    it("trims whitespace from names", () => {
      expect(normalizeUserName("  John  ", "  Doe  ")).toBe("John Doe")
    })

    it("handles whitespace-only names as empty", () => {
      expect(normalizeUserName("   ", "   ")).toBe("Unknown User")
    })
  })
})
