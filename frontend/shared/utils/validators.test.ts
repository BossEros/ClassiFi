import { describe, it, expect } from "vitest";

import { validateId, validateIds } from "./validators";

describe("validators", () => {
  // ============================================================================
  // validateId Tests
  // ============================================================================

  describe("validateId", () => {
    it("does not throw for valid positive ID", () => {
      expect(() => validateId(1, "user")).not.toThrow();
      expect(() => validateId(100, "class")).not.toThrow();
      expect(() => validateId(999999, "assignment")).not.toThrow();
    });

    it("throws for zero ID", () => {
      expect(() => validateId(0, "user")).toThrow("Invalid user ID");
    });

    it("throws for negative ID", () => {
      expect(() => validateId(-1, "class")).toThrow("Invalid class ID");
      expect(() => validateId(-100, "teacher")).toThrow("Invalid teacher ID");
    });

    it("throws for undefined ID", () => {
      expect(() => validateId(undefined, "student")).toThrow(
        "Invalid student ID",
      );
    });

    it("throws for null ID", () => {
      expect(() => validateId(null, "assignment")).toThrow(
        "Invalid assignment ID",
      );
    });

    it("includes field name in error message", () => {
      expect(() => validateId(0, "customField")).toThrow(
        "Invalid customField ID",
      );
    });
  });

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
      ).not.toThrow();
    });

    it("throws for first invalid ID found", () => {
      expect(() =>
        validateIds({
          user: 1,
          class: 0,
          assignment: 3,
        }),
      ).toThrow("Invalid class ID");
    });

    it("throws for undefined ID in object", () => {
      expect(() =>
        validateIds({
          user: 1,
          class: undefined,
        }),
      ).toThrow("Invalid class ID");
    });

    it("throws for null ID in object", () => {
      expect(() =>
        validateIds({
          teacher: null,
        }),
      ).toThrow("Invalid teacher ID");
    });

    it("handles empty object", () => {
      expect(() => validateIds({})).not.toThrow();
    });

    it("validates all entries", () => {
      // First invalid entry should cause throw
      expect(() =>
        validateIds({
          a: 0,
          b: 0,
          c: 0,
        }),
      ).toThrow(/Invalid .* ID/);
    });
  });
});
