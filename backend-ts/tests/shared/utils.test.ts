import { describe, it, expect } from "vitest"
import {
  parsePositiveInt,
  parseNumericParam,
  parseDate,
  parseOptionalDate,
  filterUndefined,
} from "../../src/shared/utils.js"
import { BadRequestError } from "../../src/shared/errors.js"

describe("Shared Utils", () => {
  describe("parsePositiveInt", () => {
    it("should parse a valid positive integer string", () => {
      expect(parsePositiveInt("42", "testField")).toBe(42)
    })

    it("should parse single digit", () => {
      expect(parsePositiveInt("1", "testField")).toBe(1)
    })

    it("should throw BadRequestError for undefined", () => {
      expect(() => parsePositiveInt(undefined, "testField")).toThrow(
        BadRequestError,
      )
    })

    it("should throw BadRequestError for empty string", () => {
      expect(() => parsePositiveInt("", "testField")).toThrow(BadRequestError)
    })

    it("should throw BadRequestError for non-numeric string", () => {
      expect(() => parsePositiveInt("abc", "testField")).toThrow(
        BadRequestError,
      )
    })

    it("should throw BadRequestError for negative numbers", () => {
      expect(() => parsePositiveInt("-5", "testField")).toThrow(BadRequestError)
    })

    it("should throw BadRequestError for zero", () => {
      expect(() => parsePositiveInt("0", "testField")).toThrow(BadRequestError)
    })

    it("should throw BadRequestError for decimals", () => {
      expect(() => parsePositiveInt("3.14", "testField")).toThrow(
        BadRequestError,
      )
    })

    it("should throw BadRequestError for mixed alphanumeric", () => {
      expect(() => parsePositiveInt("12abc", "testField")).toThrow(
        BadRequestError,
      )
    })

    it("should include field name in error message", () => {
      expect(() => parsePositiveInt("abc", "userId")).toThrow(
        "userId must be a positive integer",
      )
    })
  })

  describe("parseNumericParam", () => {
    it("should parse a valid number string", () => {
      expect(parseNumericParam("10", "id")).toBe(10)
    })

    it("should throw BadRequestError for non-numeric string", () => {
      expect(() => parseNumericParam("abc", "id")).toThrow(BadRequestError)
    })

    it("should throw BadRequestError for zero", () => {
      expect(() => parseNumericParam("0", "id")).toThrow(BadRequestError)
    })

    it("should throw BadRequestError for negative numbers", () => {
      expect(() => parseNumericParam("-1", "id")).toThrow(BadRequestError)
    })

    it("should include param name in error message", () => {
      expect(() => parseNumericParam("abc", "userId")).toThrow(
        "Invalid userId ID",
      )
    })
  })

  describe("parseDate", () => {
    it("should parse a valid ISO date string", () => {
      const result = parseDate("2026-03-15T10:00:00Z", "deadline")

      expect(result).toBeInstanceOf(Date)
      expect(result.getFullYear()).toBe(2026)
    })

    it("should accept a Date object", () => {
      const date = new Date("2026-06-01")
      const result = parseDate(date, "startDate")

      expect(result).toEqual(date)
    })

    it("should throw BadRequestError for invalid date string", () => {
      expect(() => parseDate("not-a-date", "deadline")).toThrow(
        BadRequestError,
      )
    })

    it("should include field name in error message", () => {
      expect(() => parseDate("invalid", "deadline")).toThrow(
        "Invalid deadline",
      )
    })
  })

  describe("parseOptionalDate", () => {
    it("should return null for null input", () => {
      expect(parseOptionalDate(null, "deadline")).toBeNull()
    })

    it("should return null for undefined input", () => {
      expect(parseOptionalDate(undefined, "deadline")).toBeNull()
    })

    it("should parse a valid date string", () => {
      const result = parseOptionalDate("2026-03-15T10:00:00Z", "deadline")

      expect(result).toBeInstanceOf(Date)
      expect(result!.getFullYear()).toBe(2026)
    })

    it("should throw BadRequestError for invalid date string", () => {
      expect(() => parseOptionalDate("invalid", "deadline")).toThrow(
        BadRequestError,
      )
    })
  })

  describe("filterUndefined", () => {
    it("should remove undefined values from object", () => {
      const result = filterUndefined({
        name: "John",
        age: undefined,
        email: "john@email.com",
      })

      expect(result).toEqual({ name: "John", email: "john@email.com" })
    })

    it("should keep null values", () => {
      const result = filterUndefined({ name: "John", nickname: null })

      expect(result).toEqual({ name: "John", nickname: null })
    })

    it("should keep falsy values that are not undefined", () => {
      const result = filterUndefined({
        count: 0,
        active: false,
        label: "",
      })

      expect(result).toEqual({ count: 0, active: false, label: "" })
    })

    it("should return empty object when all values are undefined", () => {
      const result = filterUndefined({ a: undefined, b: undefined })

      expect(result).toEqual({})
    })

    it("should return same properties when no undefined values", () => {
      const original = { a: 1, b: "test", c: true }
      const result = filterUndefined(original)

      expect(result).toEqual(original)
    })
  })
})
