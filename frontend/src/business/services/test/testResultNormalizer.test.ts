import { describe, it, expect } from "vitest"

import { normalizeTestResult } from "@/business/services/testResultNormalizer"
import type { RawTestResult } from "@/shared/types/testCase"

describe("testNormalization", () => {
  // ============================================================================
  // normalizeTestResult Tests
  // ============================================================================

  describe("normalizeTestResult", () => {
    it("normalizes a complete raw test result", () => {
      const raw: RawTestResult = {
        testCaseId: 1,
        name: "Test Name",
        status: "Passed",
        isHidden: true,
        executionTimeMs: 150,
        memoryUsedKb: 1024,
        input: "test input",
        expectedOutput: "expected",
        actualOutput: "expected",
      }

      const result = normalizeTestResult(raw)

      expect(result).toEqual({
        testCaseId: 1,
        name: "Test Name",
        status: "Passed",
        isHidden: true,
        executionTimeMs: 150,
        memoryUsedKb: 1024,
        input: "test input",
        expectedOutput: "expected",
        actualOutput: "expected",
        errorMessage: undefined,
      })
    })

    it("falls back to testCase.name when name is missing", () => {
      const raw: RawTestResult = {
        testCaseId: 1,
        testCase: {
          name: "TestCase Name",
          isHidden: false,
          expectedOutput: "output",
        },
        status: "Passed",
        input: "input",
        actualOutput: "output",
      }

      const result = normalizeTestResult(raw)

      expect(result.name).toBe("TestCase Name")
    })

    it("generates default name when both name and testCase.name are missing", () => {
      const raw: RawTestResult = {
        testCaseId: 42,
        status: "Failed",
        input: "input",
        actualOutput: "wrong output",
      }

      const result = normalizeTestResult(raw)

      expect(result.name).toBe("Test Case 42")
    })

    it("falls back to testCase.isHidden when isHidden is missing", () => {
      const raw: RawTestResult = {
        testCaseId: 1,
        testCase: {
          name: "Test",
          isHidden: true,
          expectedOutput: "output",
        },
        status: "Passed",
        input: "input",
        actualOutput: "output",
      }

      const result = normalizeTestResult(raw)

      expect(result.isHidden).toBe(true)
    })

    it("defaults to isHidden: false when not provided", () => {
      const raw: RawTestResult = {
        testCaseId: 1,
        status: "Passed",
        input: "input",
        actualOutput: "output",
      }

      const result = normalizeTestResult(raw)

      expect(result.isHidden).toBe(false)
    })

    it("converts legacy executionTime (seconds string) to milliseconds", () => {
      const raw: RawTestResult = {
        testCaseId: 1,
        status: "Passed",
        executionTime: "0.5", // 0.5 seconds = 500ms
        input: "input",
        actualOutput: "output",
      }

      const result = normalizeTestResult(raw)

      expect(result.executionTimeMs).toBe(500)
    })

    it("prefers executionTimeMs over executionTime when both present", () => {
      const raw: RawTestResult = {
        testCaseId: 1,
        status: "Passed",
        executionTimeMs: 200,
        executionTime: "0.5", // Should be ignored
        input: "input",
        actualOutput: "output",
      }

      const result = normalizeTestResult(raw)

      expect(result.executionTimeMs).toBe(200)
    })

    it("defaults to 0 when no execution time is provided", () => {
      const raw: RawTestResult = {
        testCaseId: 1,
        status: "Passed",
        input: "input",
        actualOutput: "output",
      }

      const result = normalizeTestResult(raw)

      expect(result.executionTimeMs).toBe(0)
    })

    it("uses memoryUsed as fallback for memoryUsedKb", () => {
      const raw: RawTestResult = {
        testCaseId: 1,
        status: "Passed",
        memoryUsed: 2048,
        input: "input",
        actualOutput: "output",
      }

      const result = normalizeTestResult(raw)

      expect(result.memoryUsedKb).toBe(2048)
    })

    it("defaults to 0 when no memory usage is provided", () => {
      const raw: RawTestResult = {
        testCaseId: 1,
        status: "Passed",
        input: "input",
        actualOutput: "output",
      }

      const result = normalizeTestResult(raw)

      expect(result.memoryUsedKb).toBe(0)
    })

    it("falls back to testCase.expectedOutput when expectedOutput is missing", () => {
      const raw: RawTestResult = {
        testCaseId: 1,
        testCase: {
          name: "Test",
          isHidden: false,
          expectedOutput: "expected from testCase",
        },
        status: "Failed",
        input: "input",
        actualOutput: "wrong",
      }

      const result = normalizeTestResult(raw)

      expect(result.expectedOutput).toBe("expected from testCase")
    })

    it("includes errorMessage when present", () => {
      const raw: RawTestResult = {
        testCaseId: 1,
        status: "Failed",
        input: "input",
        actualOutput: "",
        errorMessage: "Runtime error: Division by zero",
      }

      const result = normalizeTestResult(raw)

      expect(result.errorMessage).toBe("Runtime error: Division by zero")
    })

    it("handles Failed status correctly", () => {
      const raw: RawTestResult = {
        testCaseId: 1,
        status: "Failed",
        input: "input",
        actualOutput: "wrong output",
      }

      const result = normalizeTestResult(raw)

      expect(result.status).toBe("Failed")
    })
  })
})
