/**
 * IT-032: Detector Returns Exact-Copy Fragments For Side-By-Side Diff Evidence
 *
 * Module: Similarity Detection
 * Unit: Generate fragments
 * Date Tested: 4/16/26
 * Description: Verify that exact-copy code produces fragment coordinates that can be used in a side-by-side diff view.
 * Expected Result: The detector returns at least one fragment spanning matching rows in both files.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-032 Integration Test Pass - Detector Returns Exact-Copy Fragments
 * Suggested Figure Title (System UI): Similarity Review UI - Diff Panel Highlighting A Long Matching Fragment
 */

import { describe, expect, it } from "vitest"
import { File, PlagiarismDetector } from "../../backend-ts/src/lib/plagiarism/index.js"

describe("IT-032: Detector Returns Exact-Copy Fragments For Side-By-Side Diff Evidence", () => {
  it("should generate fragment coordinates for a copied code block", async () => {
    const detector = new PlagiarismDetector({
      language: "python",
      minFragmentLength: 2,
    })
    const files = [
      new File(
        "student-a.py",
        [
          "def solve(values):",
          "    total = 0",
          "    for value in values:",
          "        total = total + value",
          "    return total",
        ].join("\n"),
        { submissionId: "1" },
      ),
      new File(
        "student-b.py",
        [
          "def solve(values):",
          "    total = 0",
          "    for value in values:",
          "        total = total + value",
          "    return total",
        ].join("\n"),
        { submissionId: "2" },
      ),
    ]

    const report = await detector.analyze(files)
    const pair = report.getPairs()[0]
    const fragments = report.getFragments(pair)

    expect(fragments.length).toBeGreaterThan(0)
    expect(fragments[0].leftSelection.startRow).toBe(0)
    expect(fragments[0].rightSelection.startRow).toBe(0)
    expect(fragments[0].leftSelection.endRow).toBeGreaterThanOrEqual(4)
    expect(fragments[0].rightSelection.endRow).toBeGreaterThanOrEqual(4)
  })
})
