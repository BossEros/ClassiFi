import { describe, expect, it, vi } from "vitest"
import { File, PlagiarismDetector, Options, Report } from "../../../src/lib/plagiarism/index.js"

describe("plagiarism report fragment handling", () => {
  it("passes the configured minimum fragment occurrences to pair fragment generation", () => {
    const buildFragments = vi.fn().mockReturnValue([])
    const report = new Report(
      new Options({ minFragmentLength: 2 }),
      null,
      [],
      {} as never,
    )

    report.getFragments({ buildFragments } as never)

    expect(buildFragments).toHaveBeenCalledWith(2)
  })

  it("returns mapped fragments for longer exact-copy matches", async () => {
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
