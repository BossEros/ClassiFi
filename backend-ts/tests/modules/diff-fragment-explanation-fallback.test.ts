import { describe, expect, it } from "vitest"
import { buildFallbackDiffFragmentExplanation } from "@/modules/plagiarism/diff-fragment-explanation-fallback.js"

const fullRegion = (endRow: number, endCol: number) => ({
  startRow: 0,
  startCol: 0,
  endRow,
  endCol,
})

describe("buildFallbackDiffFragmentExplanation", () => {
  it("recognizes identifier renaming while preserving similar code shape", () => {
    const explanation = buildFallbackDiffFragmentExplanation({
      leftContent: [
        "roman = {'I': 1, 'V': 5}",
        "total = sum(roman[char] for char in s)",
        "return total",
      ].join("\n"),
      rightContent: [
        "values = {'I': 1, 'V': 5}",
        "result = sum(values[char] for char in s)",
        "return result",
      ].join("\n"),
      leftSelection: fullRegion(2, 12),
      rightSelection: fullRegion(2, 13),
    })

    expect(explanation).toMatchObject({
      category: "identifier_renaming",
      label: "Identifier Renaming With Same Logic",
      source: "fallback",
    })
    expect(explanation.reasons.join(" ")).toContain("roman to values")
  })

  it("recognizes conditional logic added to the right snippet", () => {
    const explanation = buildFallbackDiffFragmentExplanation({
      leftContent: "return score",
      rightContent: ["if score < 0:", "    return 0", "return score"].join("\n"),
      leftSelection: fullRegion(0, 12),
      rightSelection: fullRegion(2, 12),
    })

    expect(explanation).toMatchObject({
      category: "conditional_logic_changed",
      label: "Right File Adds Conditional Logic",
      source: "fallback",
    })
  })

  it("recognizes output logic changes", () => {
    const explanation = buildFallbackDiffFragmentExplanation({
      leftContent: "return total",
      rightContent: "return result",
      leftSelection: fullRegion(0, 12),
      rightSelection: fullRegion(0, 13),
    })

    expect(explanation).toMatchObject({
      category: "output_logic_changed",
      label: "Output Logic Differs",
      source: "fallback",
    })
  })

  it("falls back to a generic code changed explanation", () => {
    const explanation = buildFallbackDiffFragmentExplanation({
      leftContent: "answer = value + 1",
      rightContent: "answer = value * 2",
      leftSelection: fullRegion(0, 18),
      rightSelection: fullRegion(0, 18),
    })

    expect(explanation).toMatchObject({
      category: "code_changed",
      label: "Highlighted Code Difference",
      source: "fallback",
    })
  })
})
