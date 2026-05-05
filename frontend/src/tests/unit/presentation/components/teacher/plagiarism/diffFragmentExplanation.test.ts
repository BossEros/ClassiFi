import { describe, expect, it } from "vitest"
import { buildDiffFragmentExplanation } from "@/presentation/components/teacher/plagiarism/diffFragmentExplanation"

describe("buildDiffFragmentExplanation", () => {
  it("labels identifier renaming when the highlighted region keeps the same logic", () => {
    const explanation = buildDiffFragmentExplanation({
      leftContent: [
        "roman = {",
        "    'I': 1, 'V': 5, 'X': 10, 'L': 50,",
        "}",
        "total = sum(roman[char] for char in s)",
        "return total",
      ].join("\n"),
      rightContent: [
        "values = {",
        "    'I': 1, 'V': 5, 'X': 10, 'L': 50,",
        "}",
        "result = sum(values[c] for c in s)",
        "return result",
      ].join("\n"),
      leftSelection: { startRow: 0, startCol: 0, endRow: 4, endCol: 12 },
      rightSelection: { startRow: 0, startCol: 0, endRow: 4, endCol: 13 },
    })

    expect(explanation.label).toBe("Identifier Renaming With Same Logic")
    expect(explanation.reasons.join(" ")).toContain("roman to values")
    expect(explanation.reasons.join(" ")).toContain("total to result")
  })

  it("labels added conditional logic in the right highlighted region", () => {
    const explanation = buildDiffFragmentExplanation({
      leftContent: "return total",
      rightContent: ["if total < 1:", "    return 0", "return total"].join("\n"),
      leftSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 12 },
      rightSelection: { startRow: 0, startCol: 0, endRow: 2, endCol: 12 },
    })

    expect(explanation.label).toBe("Right File Adds Conditional Logic")
    expect(explanation.reasons).toContain(
      "The right submission adds a conditional branch inside this highlighted region.",
    )
  })

  it("labels output logic differences for changed return values", () => {
    const explanation = buildDiffFragmentExplanation({
      leftContent: "return total",
      rightContent: "return result + penalty",
      leftSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 12 },
      rightSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 23 },
    })

    expect(explanation.label).toBe("Output Logic Differs")
    expect(explanation.reasons).toContain(
      "The matched area is similar, but the printed or returned value differs.",
    )
  })

  it("labels loop condition changes", () => {
    const explanation = buildDiffFragmentExplanation({
      leftContent: "for i in range(len(values)):",
      rightContent: "for i in range(len(values) - 1):",
      leftSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 28 },
      rightSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 32 },
    })

    expect(explanation.label).toBe("Loop Condition Changed")
    expect(explanation.reasons).toContain(
      "Both submissions use a loop, but the right submission changes the loop boundary or condition.",
    )
  })

  it("does not label identifier renaming as a loop change when the loop shape is unchanged", () => {
    const explanation = buildDiffFragmentExplanation({
      leftContent: "total = sum(roman[char] for char in s)",
      rightContent: "result = sum(values[c] for c in s)",
      leftSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 38 },
      rightSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 36 },
    })

    expect(explanation.label).toBe("Identifier Renaming With Same Logic")
    expect(explanation.label).not.toBe("Loop Condition Changed")
  })

  it("labels small identifier rename fragments without falling back to the generic message", () => {
    const explanation = buildDiffFragmentExplanation({
      leftContent: "total -= 400",
      rightContent: "result -= 400",
      leftSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 12 },
      rightSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 13 },
    })

    expect(explanation.label).toBe("Identifier Renaming With Same Logic")
    expect(explanation.reasons.join(" ")).toContain("total to result")
  })
})
