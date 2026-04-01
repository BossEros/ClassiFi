import { describe, it, expect } from "vitest"
import { getClassColor, CLASS_COLOR_PALETTE } from "@/shared/utils/colorUtils"

describe("colorUtils", () => {
  describe("CLASS_COLOR_PALETTE", () => {
    it("should contain 16 colors", () => {
      expect(CLASS_COLOR_PALETTE).toHaveLength(16)
    })

    it("should contain valid hex color strings", () => {
      for (const color of CLASS_COLOR_PALETTE) {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      }
    })
  })

  describe("getClassColor", () => {
    it("should return a color from the palette", () => {
      const color = getClassColor(1)

      expect(CLASS_COLOR_PALETTE).toContain(color)
    })

    it("should be deterministic for the same classId", () => {
      const first = getClassColor(42)
      const second = getClassColor(42)

      expect(first).toBe(second)
    })

    it("should return different colors for different classIds", () => {
      const colors = new Set(
        Array.from({ length: 16 }, (_, i) => getClassColor(i + 1)),
      )

      // At least some should be different (not all the same)
      expect(colors.size).toBeGreaterThan(1)
    })

    it("should handle large classIds without errors", () => {
      expect(() => getClassColor(999999)).not.toThrow()
      expect(CLASS_COLOR_PALETTE).toContain(getClassColor(999999))
    })

    it("should handle classId of 0", () => {
      const color = getClassColor(0)

      expect(CLASS_COLOR_PALETTE).toContain(color)
    })
  })
})
