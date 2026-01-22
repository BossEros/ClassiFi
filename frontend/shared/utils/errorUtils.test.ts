import { describe, it, expect, vi } from "vitest";

import {
  errorResponse,
  successResponse,
  getErrorMessage,
  withErrorHandling,
} from "@/shared/utils/errorUtils";

describe("errorUtils", () => {
  // ============================================================================
  // errorResponse Tests
  // ============================================================================

  describe("errorResponse", () => {
    it("creates an error response with message", () => {
      const result = errorResponse("Something went wrong");

      expect(result).toEqual({
        success: false,
        message: "Something went wrong",
      });
    });

    it("always has success: false", () => {
      const result = errorResponse("Any message");

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // successResponse Tests
  // ============================================================================

  describe("successResponse", () => {
    it("creates a success response without data", () => {
      const result = successResponse();

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
    });

    it("creates a success response with data", () => {
      const data = { id: 1, name: "Test" };
      const result = successResponse(data);

      expect(result).toEqual({
        success: true,
        data: { id: 1, name: "Test" },
      });
    });

    it("creates a success response with message", () => {
      const result = successResponse(undefined, "Operation successful");

      expect(result).toEqual({
        success: true,
        message: "Operation successful",
      });
    });

    it("creates a success response with both data and message", () => {
      const data = { value: 42 };
      const result = successResponse(data, "Created successfully");

      expect(result).toEqual({
        success: true,
        message: "Created successfully",
        data: { value: 42 },
      });
    });
  });

  // ============================================================================
  // getErrorMessage Tests
  // ============================================================================

  describe("getErrorMessage", () => {
    it("extracts message from Error instance", () => {
      const error = new Error("Test error message");
      const result = getErrorMessage(error);

      expect(result).toBe("Test error message");
    });

    it("returns string error directly", () => {
      const result = getErrorMessage("String error");

      expect(result).toBe("String error");
    });

    it("returns default fallback for unknown error types", () => {
      const result = getErrorMessage({ code: 500 });

      expect(result).toBe("An unexpected error occurred");
    });

    it("returns custom fallback when provided", () => {
      const result = getErrorMessage(null, "Custom fallback message");

      expect(result).toBe("Custom fallback message");
    });

    it("handles undefined", () => {
      const result = getErrorMessage(undefined);

      expect(result).toBe("An unexpected error occurred");
    });

    it("handles numbers", () => {
      const result = getErrorMessage(404);

      expect(result).toBe("An unexpected error occurred");
    });
  });

  // ============================================================================
  // withErrorHandling Tests
  // ============================================================================

  describe("withErrorHandling", () => {
    it("returns result from successful function", async () => {
      const fn = async (x: number) => x * 2;
      const wrappedFn = withErrorHandling(fn);

      const result = await wrappedFn(5);

      expect(result).toBe(10);
    });

    it("returns error response when function throws Error", async () => {
      const fn = async () => {
        throw new Error("Function failed");
      };
      const wrappedFn = withErrorHandling(fn);

      const result = await wrappedFn();

      expect(result).toEqual({
        success: false,
        message: "Function failed",
      });
    });

    it("returns error response when function throws string", async () => {
      const fn = async () => {
        throw "String error";
      };
      const wrappedFn = withErrorHandling(fn);

      const result = await wrappedFn();

      expect(result).toEqual({
        success: false,
        message: "String error",
      });
    });

    it("uses custom fallback message for unknown errors", async () => {
      const fn = async () => {
        throw { code: 500 };
      };
      const wrappedFn = withErrorHandling(fn, "Custom fallback");

      const result = await wrappedFn();

      expect(result).toEqual({
        success: false,
        message: "Custom fallback",
      });
    });

    it("preserves function arguments", async () => {
      const fn = vi.fn(async (a: number, b: string) => `${b}-${a}`);
      const wrappedFn = withErrorHandling(fn);

      const result = await wrappedFn(42, "test");

      expect(fn).toHaveBeenCalledWith(42, "test");
      expect(result).toBe("test-42");
    });
  });
});
