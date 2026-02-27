import { describe, it, expect } from "vitest"
import {
  validateImageFile,
  FILE_VALIDATION,
} from "@/presentation/utils/imageValidation"

describe("imageValidation", () => {
  const createMockFile = (
    type: string,
    size: number,
    name = "test.jpg",
  ): File => {
    const blob = new Blob(["x".repeat(size)], { type })
    return new File([blob], name, { type })
  }

  it("returns null for valid JPEG file", () => {
    const file = createMockFile("image/jpeg", 1024 * 1024)
    expect(validateImageFile(file)).toBeNull()
  })

  it("returns null for valid PNG file", () => {
    const file = createMockFile("image/png", 2 * 1024 * 1024)
    expect(validateImageFile(file)).toBeNull()
  })

  it("returns null for valid GIF file", () => {
    const file = createMockFile("image/gif", 500 * 1024)
    expect(validateImageFile(file)).toBeNull()
  })

  it("returns null for valid WebP file", () => {
    const file = createMockFile("image/webp", 3 * 1024 * 1024)
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
    const file = createMockFile("image/png", 10 * 1024 * 1024)
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
