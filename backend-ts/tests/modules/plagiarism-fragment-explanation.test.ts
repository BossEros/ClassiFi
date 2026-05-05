import { describe, expect, it } from "vitest"
import { explainMatchedFragment } from "@/modules/plagiarism/plagiarism-fragment-explanation.js"

const fullRegion = {
  startRow: 0,
  startCol: 0,
  endRow: 0,
  endCol: Number.MAX_SAFE_INTEGER,
}

describe("explainMatchedFragment", () => {
  it("labels shared Java imports as the same library import", () => {
    const explanation = explainMatchedFragment({
      leftContent: "import java.util.Scanner;",
      rightContent: "import java.util.Scanner;",
      leftSelection: fullRegion,
      rightSelection: fullRegion,
    })

    expect(explanation).toEqual({
      category: "library_import",
      label: "Same Library Import",
      reasons: ["Both fragments import java.util.Scanner"],
    })
  })

  it("labels shared non-keyword identifiers as shared identifier names", () => {
    const explanation = explainMatchedFragment({
      leftContent: "totalScore = totalScore + bonusScore",
      rightContent: "totalScore = totalScore + bonusScore",
      leftSelection: fullRegion,
      rightSelection: fullRegion,
    })

    expect(explanation).toEqual({
      category: "identifier_names",
      label: "Shared Identifier Names",
      reasons: ["Both fragments use bonusScore, totalScore"],
    })
  })

  it("uses the fragment column range when extracting single-line snippets", () => {
    const explanation = explainMatchedFragment({
      leftContent: "return totalScore + bonusScore",
      rightContent: "return totalScore + bonusScore",
      leftSelection: {
        startRow: 0,
        startCol: 7,
        endRow: 0,
        endCol: 17,
      },
      rightSelection: {
        startRow: 0,
        startCol: 7,
        endRow: 0,
        endCol: 17,
      },
    })

    expect(explanation).toEqual({
      category: "identifier_names",
      label: "Shared Identifier Names",
      reasons: ["Both fragments use totalScore"],
    })
  })

  it("labels matching loops or conditionals as the same control flow structure", () => {
    const explanation = explainMatchedFragment({
      leftContent: "for value in values:\n    if value > 0:\n        count += 1",
      rightContent: "for value in values:\n    if value > 0:\n        count += 1",
      leftSelection: {
        startRow: 0,
        startCol: 0,
        endRow: 2,
        endCol: Number.MAX_SAFE_INTEGER,
      },
      rightSelection: {
        startRow: 0,
        startCol: 0,
        endRow: 2,
        endCol: Number.MAX_SAFE_INTEGER,
      },
    })

    expect(explanation).toEqual({
      category: "control_flow",
      label: "Same Control Flow Structure",
      reasons: ["Both fragments use for-loop and conditional logic"],
    })
  })

  it("falls back to matched code structure when no specific evidence is detected", () => {
    const explanation = explainMatchedFragment({
      leftContent: "return 1 + 2",
      rightContent: "return 1 + 2",
      leftSelection: fullRegion,
      rightSelection: fullRegion,
    })

    expect(explanation).toEqual({
      category: "code_structure",
      label: "Matched Code Structure",
      reasons: ["The detector matched these fragments by structural code tokens"],
    })
  })
})
