import type { Pair, FileEntry } from "@/lib/plagiarism/index.js"
import { Region } from "@/lib/plagiarism/index.js"

interface SemanticMaskFileLike {
  content: string
  info?: {
    submissionId?: string
  }
}

interface SemanticMaskPairLike {
  leftFile: SemanticMaskFileLike
  rightFile: SemanticMaskFileLike
  leftEntry?: FileEntry
  rightEntry?: FileEntry
}

/**
 * Build merged ignored source regions for a file entry from its ignored structural fingerprints.
 *
 * @param fileEntry - The indexed plagiarism file entry.
 * @returns Sorted, merged source regions that should be masked for semantic scoring.
 */
export function buildIgnoredSourceRegions(fileEntry: FileEntry): Region[] {
  const ignoredRegions: Region[] = []

  for (const ignoredFingerprint of fileEntry.ignored) {
    for (const occurrence of ignoredFingerprint.occurrencesOf(fileEntry.file)) {
      ignoredRegions.push(cloneRegion(occurrence.side.location))
    }
  }

  return mergeRegions(ignoredRegions)
}

/**
 * Mask ignored structural regions in a file while preserving line breaks and layout.
 *
 * @param fileEntry - The indexed plagiarism file entry.
 * @returns The file content with ignored regions replaced by whitespace.
 */
export function maskFileContent(fileEntry: FileEntry): string {
  const ignoredRegions = buildIgnoredSourceRegions(fileEntry)

  if (ignoredRegions.length === 0) {
    return fileEntry.file.content
  }

  const maskedLines = [...fileEntry.file.lines]

  for (const ignoredRegion of ignoredRegions) {
    applyMaskToLines(maskedLines, ignoredRegion)
  }

  return maskedLines.join("\n")
}

/**
 * Build masked submission content keyed by submission ID for semantic embedding requests.
 *
 * @param pairs - Detector pairs containing submission metadata and optional indexed file entries.
 * @returns A map of submission ID to masked or original file content.
 */
export function buildMaskedSubmissionContentById(
  pairs: ReadonlyArray<Pair | SemanticMaskPairLike>,
): Map<string, string> {
  const submissionContentById = new Map<string, string>()

  for (const pair of pairs) {
    const leftSubmissionId = pair.leftFile.info?.submissionId
    const rightSubmissionId = pair.rightFile.info?.submissionId

    if (
      leftSubmissionId &&
      leftSubmissionId !== "0" &&
      !submissionContentById.has(leftSubmissionId)
    ) {
      submissionContentById.set(
        leftSubmissionId,
        pair.leftEntry
          ? maskFileContent(pair.leftEntry)
          : pair.leftFile.content,
      )
    }

    if (
      rightSubmissionId &&
      rightSubmissionId !== "0" &&
      !submissionContentById.has(rightSubmissionId)
    ) {
      submissionContentById.set(
        rightSubmissionId,
        pair.rightEntry
          ? maskFileContent(pair.rightEntry)
          : pair.rightFile.content,
      )
    }
  }

  return submissionContentById
}

function mergeRegions(regions: Region[]): Region[] {
  if (regions.length <= 1) {
    return regions
  }

  const mergedRegions: Region[] = []
  const sortedRegions = [...regions].sort(Region.compare)

  for (const region of sortedRegions) {
    const lastMergedRegion = mergedRegions.at(-1)

    if (!lastMergedRegion) {
      mergedRegions.push(region)
      continue
    }

    if (regionsTouchOrOverlap(lastMergedRegion, region)) {
      mergedRegions[mergedRegions.length - 1] = Region.merge(
        lastMergedRegion,
        region,
      )
      continue
    }

    mergedRegions.push(region)
  }

  return mergedRegions
}

function regionsTouchOrOverlap(
  leftRegion: Region,
  rightRegion: Region,
): boolean {
  const orderedRegions = [leftRegion, rightRegion].sort(Region.compare)
  const [earlierRegion, laterRegion] = orderedRegions

  if (earlierRegion.overlapsWith(laterRegion)) {
    return true
  }

  return (
    earlierRegion.endRow === laterRegion.startRow &&
    earlierRegion.endCol >= laterRegion.startCol
  )
}

function applyMaskToLines(lines: string[], region: Region): void {
  if (lines.length === 0) {
    return
  }

  const startRow = clamp(region.startRow, 0, lines.length - 1)
  const endRow = clamp(region.endRow, 0, lines.length - 1)

  if (startRow > endRow) {
    return
  }

  if (startRow === endRow) {
    lines[startRow] = maskLineSegment(
      lines[startRow],
      region.startCol,
      region.endCol,
    )
    return
  }

  lines[startRow] = maskLineSegment(
    lines[startRow],
    region.startCol,
    lines[startRow].length,
  )

  for (let rowIndex = startRow + 1; rowIndex < endRow; rowIndex += 1) {
    lines[rowIndex] = " ".repeat(lines[rowIndex].length)
  }

  lines[endRow] = maskLineSegment(lines[endRow], 0, region.endCol)
}

function maskLineSegment(
  line: string,
  rawStartCol: number,
  rawEndCol: number,
): string {
  const startCol = clamp(rawStartCol, 0, line.length)
  const endCol = clamp(rawEndCol, 0, line.length)

  if (startCol >= endCol) {
    return line
  }

  return `${line.slice(0, startCol)}${" ".repeat(endCol - startCol)}${line.slice(endCol)}`
}

function cloneRegion(region: Region): Region {
  return new Region(
    region.startRow,
    region.startCol,
    region.endRow,
    region.endCol,
  )
}

function clamp(value: number, minValue: number, maxValue: number): number {
  return Math.min(Math.max(value, minValue), maxValue)
}
