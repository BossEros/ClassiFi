import { describe, expect, it } from "vitest"
import { File, PlagiarismDetector } from "../../../src/lib/plagiarism/index.js"

function buildPythonFile(path: string, lines: string[]): File {
  return new File(path, lines.join("\n"))
}

describe("FingerprintIndex ignored-template bookkeeping", () => {
  it("tracks ignored k-gram coverage per file instead of only ignored fingerprint objects", async () => {
    const detector = new PlagiarismDetector({
      language: "python",
      kgramLength: 5,
      kgramsInWindow: 4,
      minFragmentLength: 2,
    })
    const teacherTemplateFile = buildPythonFile("template.py", [
      "DEFAULT_RESULT = 0",
      "",
      "def normalize(values):",
      "    return [int(value) for value in values]",
    ])
    const studentSubmissionFiles = [
      buildPythonFile("student-a.py", [
        "DEFAULT_RESULT = 0",
        "",
        "def normalize(values):",
        "    return [int(value) for value in values]",
        "",
        "def solve(values):",
        "    normalized = normalize(values)",
        "    even_total = 0",
        "    for value in normalized:",
        "        if value % 2 == 0:",
        "            even_total += value",
        "    return even_total + len(normalized)",
      ]),
      buildPythonFile("student-b.py", [
        "DEFAULT_RESULT = 0",
        "",
        "def normalize(values):",
        "    return [int(value) for value in values]",
        "",
        "def solve(values):",
        "    normalized = normalize(values)",
        "    even_total = 0",
        "    for value in normalized:",
        "        if value % 2 == 0:",
        "            even_total += value",
        "    return even_total + max(normalized)",
      ]),
    ]

    const report = await detector.analyze(
      studentSubmissionFiles,
      teacherTemplateFile,
    )
    const pair = report.getPairs()[0]

    expect(pair.leftIgnored).toBe(pair.leftEntry.ignoredKgramIndices.size)
    expect(pair.rightIgnored).toBe(pair.rightEntry.ignoredKgramIndices.size)
    expect(pair.leftIgnored).toBeGreaterThan(pair.leftEntry.ignored.size)
    expect(pair.rightIgnored).toBeGreaterThan(pair.rightEntry.ignored.size)
  })

  it("matches custom-only structural similarity when teacher template code is ignored", async () => {
    const detectorOptions = {
      language: "python",
      kgramLength: 5,
      kgramsInWindow: 4,
      minFragmentLength: 2,
    } as const
    const teacherTemplateFile = buildPythonFile("template.py", [
      "DEFAULT_RESULT = 0",
      "",
      "def normalize(values):",
      "    return [int(value) for value in values]",
    ])
    const customOnlySubmissionFiles = [
      buildPythonFile("custom-a.py", [
        "def solve(values):",
        "    normalized = normalize(values)",
        "    even_total = 0",
        "    for value in normalized:",
        "        if value % 2 == 0:",
        "            even_total += value",
        "    return even_total + len(normalized)",
      ]),
      buildPythonFile("custom-b.py", [
        "def solve(values):",
        "    normalized = normalize(values)",
        "    even_total = 0",
        "    for value in normalized:",
        "        if value % 2 == 0:",
        "            even_total += value",
        "    return even_total + max(normalized)",
      ]),
    ]
    const templateWrappedSubmissionFiles = [
      buildPythonFile("student-a.py", [
        "DEFAULT_RESULT = 0",
        "",
        "def normalize(values):",
        "    return [int(value) for value in values]",
        "",
        "def solve(values):",
        "    normalized = normalize(values)",
        "    even_total = 0",
        "    for value in normalized:",
        "        if value % 2 == 0:",
        "            even_total += value",
        "    return even_total + len(normalized)",
      ]),
      buildPythonFile("student-b.py", [
        "DEFAULT_RESULT = 0",
        "",
        "def normalize(values):",
        "    return [int(value) for value in values]",
        "",
        "def solve(values):",
        "    normalized = normalize(values)",
        "    even_total = 0",
        "    for value in normalized:",
        "        if value % 2 == 0:",
        "            even_total += value",
        "    return even_total + max(normalized)",
      ]),
    ]

    const customOnlyReport = await new PlagiarismDetector(
      detectorOptions,
    ).analyze(customOnlySubmissionFiles)
    const templateIgnoredReport = await new PlagiarismDetector(
      detectorOptions,
    ).analyze(templateWrappedSubmissionFiles, teacherTemplateFile)
    const customOnlyPair = customOnlyReport.getPairs()[0]
    const templateIgnoredPair = templateIgnoredReport.getPairs()[0]

    expect(templateIgnoredPair.similarity).toBeCloseTo(
      customOnlyPair.similarity,
      6,
    )
  })
})
