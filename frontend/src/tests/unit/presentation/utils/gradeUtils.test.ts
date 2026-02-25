import { describe, it, expect } from "vitest"
import { getGradePercentage, getGradeColor, formatGrade } from "@/presentation/utils/gradeUtils"

describe("gradeUtils", () => {
  describe("getGradePercentage", () => {
    it("calculates percentage correctly", () => {
      expect(getGradePercentage(95, 100)).toBe(95)
      expect(getGradePercentage(80, 100)).toBe(80)
      expect(getGradePercentage(50, 100)).toBe(50)
    })

    it("handles different maxGrade values", () => {
      expect(getGradePercentage(45, 50)).toBe(90)
      expect(getGradePercentage(8, 10)).toBe(80)
    })

    it("returns 0 for null grade", () => {
      expect(getGradePercentage(null, 100)).toBe(0)
    })

    it("returns 0 for undefined grade", () => {
      expect(getGradePercentage(undefined, 100)).toBe(0)
    })

    it("returns 0 for zero maxGrade", () => {
      expect(getGradePercentage(50, 0)).toBe(0)
    })
  })

  describe("getGradeColor", () => {
    it("returns green for A grade (90-100%)", () => {
      expect(getGradeColor(100)).toBe("text-green-500")
      expect(getGradeColor(95)).toBe("text-green-500")
      expect(getGradeColor(90)).toBe("text-green-500")
    })

    it("returns teal for B grade (80-89%)", () => {
      expect(getGradeColor(89)).toBe("text-teal-500")
      expect(getGradeColor(85)).toBe("text-teal-500")
      expect(getGradeColor(80)).toBe("text-teal-500")
    })

    it("returns amber for C grade (70-79%)", () => {
      expect(getGradeColor(79)).toBe("text-amber-500")
      expect(getGradeColor(75)).toBe("text-amber-500")
      expect(getGradeColor(70)).toBe("text-amber-500")
    })

    it("returns orange for D grade (60-69%)", () => {
      expect(getGradeColor(69)).toBe("text-orange-500")
      expect(getGradeColor(65)).toBe("text-orange-500")
      expect(getGradeColor(60)).toBe("text-orange-500")
    })

    it("returns red for F grade (<60%)", () => {
      expect(getGradeColor(59)).toBe("text-red-500")
      expect(getGradeColor(50)).toBe("text-red-500")
      expect(getGradeColor(0)).toBe("text-red-500")
    })
  })

  describe("formatGrade", () => {
    it("formats grade correctly", () => {
      expect(formatGrade(95, 100)).toBe("95/100")
      expect(formatGrade(80, 100)).toBe("80/100")
      expect(formatGrade(45, 50)).toBe("45/50")
    })

    it("returns N/A for null grade", () => {
      expect(formatGrade(null, 100)).toBe("N/A")
    })

    it("returns N/A for undefined grade", () => {
      expect(formatGrade(undefined, 100)).toBe("N/A")
    })

    it("uses default maxGrade of 100", () => {
      expect(formatGrade(95)).toBe("95/100")
    })
  })
})
