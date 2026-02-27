import { describe, expect, it } from "vitest"
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  validateFile,
} from "@/business/validation/submissionFileValidation"

describe("submissionFileValidation.validateFile", () => {
  it("returns required error when file is missing", () => {
    const result = validateFile(undefined as unknown as File, "python")

    expect(result).toBe("Please select a file to submit")
  })

  it("returns empty-file error for zero-byte files", () => {
    const file = new File([""], "solution.py", { type: "text/x-python" })
    const result = validateFile(file, "python")

    expect(result).toBe("File is empty")
  })

  it("returns size error when file exceeds max size", () => {
    const oversizedContent = "a".repeat(MAX_FILE_SIZE + 1)
    const file = new File([oversizedContent], "solution.py", {
      type: "text/x-python",
    })

    const result = validateFile(file, "python")

    expect(result).toBe("File size exceeds maximum allowed (10MB)")
  })

  it("returns unsupported language error when language is not configured", () => {
    const file = new File(["print('hello')"], "solution.py", {
      type: "text/x-python",
    })

    const result = validateFile(file, "ruby")

    expect(result).toBe("Unsupported programming language: ruby")
  })

  it("returns extension error when file extension does not match language", () => {
    const file = new File(["print('hello')"], "solution.txt", {
      type: "text/plain",
    })

    const result = validateFile(file, "python")

    expect(result).toBe(
      `Invalid file type. Expected ${ALLOWED_EXTENSIONS.python.join(", ")} for python`,
    )
  })

  it("returns extension error when filename has no extension", () => {
    const file = new File(["print('hello')"], "solution", {
      type: "text/x-python",
    })

    const result = validateFile(file, "python")

    expect(result).toBe(
      `Invalid file type. Expected ${ALLOWED_EXTENSIONS.python.join(", ")} for python`,
    )
  })

  it("accepts a valid file and handles case-insensitive language input", () => {
    const file = new File(["print('hello')"], "solution.PY", {
      type: "text/x-python",
    })

    const result = validateFile(file, "PyThOn")

    expect(result).toBeNull()
  })
})
