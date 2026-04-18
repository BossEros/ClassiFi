import { describe, expect, it } from "vitest"
import {
  File,
  Region,
  SharedFingerprint,
  TokenizedFile,
} from "../../src/lib/plagiarism/index.js"
import type { FileEntry } from "../../src/lib/plagiarism/index.js"
import {
  buildIgnoredSourceRegions,
  buildMaskedSubmissionContentById,
  maskFileContent,
} from "../../src/modules/plagiarism/semantic-masking.js"

function buildTokenizedFile(
  path: string,
  content: string,
  submissionId: string,
): TokenizedFile {
  const originalFile = new File(path, content, { submissionId })
  const placeholderRegion = new Region(0, 0, 0, 0)

  return new TokenizedFile(originalFile, ["token"], [placeholderRegion])
}

function buildIgnoredFileEntry(
  file: TokenizedFile,
  ignoredRegions: Region[],
): FileEntry {
  const ignoredFingerprints = ignoredRegions.map(
    (ignoredRegion, ignoredIndex) => {
      const ignoredFingerprint = new SharedFingerprint(ignoredIndex + 1, null)
      ignoredFingerprint.add({
        file,
        side: {
          index: ignoredIndex,
          start: ignoredIndex,
          stop: ignoredIndex,
          location: ignoredRegion,
          data: null,
        },
      })

      return ignoredFingerprint
    },
  )

  return {
    file,
    kgrams: [],
    shared: new Set(),
    ignored: new Set(ignoredFingerprints),
    ignoredKgramIndices: new Set(
      ignoredRegions.map((_, ignoredIndex) => ignoredIndex),
    ),
    isIgnored: false,
  }
}

describe("semantic template masking", () => {
  it("merges overlapping ignored source regions from ignored structural fingerprints", () => {
    const tokenizedFile = buildTokenizedFile(
      "student.py",
      "template_header()\nsolve()\n",
      "101",
    )
    const fileEntry = buildIgnoredFileEntry(tokenizedFile, [
      new Region(0, 0, 0, 10),
      new Region(0, 8, 1, 5),
      new Region(1, 8, 1, 10),
    ])

    expect(buildIgnoredSourceRegions(fileEntry)).toEqual([
      new Region(0, 0, 1, 5),
      new Region(1, 8, 1, 10),
    ])
  })

  it("masks ignored regions while preserving surrounding code and line breaks", () => {
    const tokenizedFile = buildTokenizedFile(
      "student.py",
      "keep template tail\nsolve(value)\n",
      "102",
    )
    const fileEntry = buildIgnoredFileEntry(tokenizedFile, [
      new Region(0, 5, 0, 13),
      new Region(1, 0, 1, 5),
    ])

    expect(maskFileContent(fileEntry)).toBe(
      "keep          tail\n     (value)\n",
    )
  })

  it("builds masked submission content per submission id and leaves untouched files unchanged", () => {
    const leftFile = buildTokenizedFile(
      "left.py",
      "template_line()\nreal_work()\n",
      "201",
    )
    const rightFile = buildTokenizedFile(
      "right.py",
      "independent_work()\n",
      "202",
    )
    const leftEntry = buildIgnoredFileEntry(leftFile, [new Region(0, 0, 0, 15)])
    const rightEntry = buildIgnoredFileEntry(rightFile, [])
    const pair = {
      leftEntry,
      rightEntry,
      leftFile,
      rightFile,
    }

    expect(buildMaskedSubmissionContentById([pair as any])).toEqual(
      new Map([
        ["201", "               \nreal_work()\n"],
        ["202", "independent_work()\n"],
      ]),
    )
  })
})
