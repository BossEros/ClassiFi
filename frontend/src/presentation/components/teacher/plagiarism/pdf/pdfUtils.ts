import {
  getPairOverallSimilarityRatio,
  getThresholdQualifiedPairs,
  normalizeSimilarityToRatio,
} from "@/presentation/utils/plagiarismClusterUtils"
import {
  getSignalLevel,
  getSimilarityBadgeSeverity,
} from "@/presentation/utils/plagiarismSignalUtils"
import type { PairResponse } from "@/business/services/plagiarismService"
import type { User } from "@/data/api/auth.types"
import type {
  DiffLine,
  LineDiff,
  QualitativeSignalBadgeValue,
  SimilarityBadgeValue,
  TextSegment,
} from "./pdfTypes"
import type { MatchFragment } from "../types"

// ─── Text Formatters ───────────────────────────────────────────────────────────

export function formatPercent(value: number): string {
  return `${(normalizeSimilarityToRatio(value) * 100).toFixed(1)}%`
}

export function formatDateTimeValue(value: string): string {
  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unavailable"
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate)
}

export function formatCodeRange(startRow: number, endRow: number): string {
  const displayStart = startRow + 1
  const displayEnd = endRow + 1

  if (displayStart === displayEnd) {
    return `Line ${displayStart}`
  }

  return `Lines ${displayStart}–${displayEnd}`
}

export function toFileNameSegment(value: string): string {
  const normalizedValue = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")

  return normalizedValue.replace(/^-+|-+$/g, "") || "report"
}

// ─── Display Label Builders ────────────────────────────────────────────────────

export function buildTeacherDisplayName(teacher: User | null): string {
  if (!teacher) {
    return "Unknown Teacher"
  }

  return `${teacher.firstName} ${teacher.lastName}`.trim()
}

export function buildSimilarityBadgeValue(
  similarity: number,
): SimilarityBadgeValue {
  return {
    label: formatPercent(similarity),
    severity: getSimilarityBadgeSeverity(similarity),
  }
}

export function buildQualitativeSignalValue(
  normalizedSignalRatio: number,
): QualitativeSignalBadgeValue {
  const signalLevel = getSignalLevel(normalizedSignalRatio)

  return {
    label: getSignalLabel(signalLevel),
    level: signalLevel,
  }
}

export function getSignalLabel(level: "high" | "medium" | "low"): string {
  switch (level) {
    case "high":
      return "High"
    case "medium":
      return "Medium"
    default:
      return "Low"
  }
}

// ─── Pair Utility Helpers ──────────────────────────────────────────────────────

export function getPairLabel(pair: PairResponse): string {
  const leftStudentName = pair.leftFile.studentName?.trim() || "Unknown Student"
  const rightStudentName =
    pair.rightFile.studentName?.trim() || "Unknown Student"

  return `${leftStudentName} vs ${rightStudentName}`
}

export function getThresholdFilteredPairs(
  pairs: PairResponse[],
  minimumSimilarityPercent: number,
): PairResponse[] {
  return getThresholdQualifiedPairs(pairs, minimumSimilarityPercent)
    .sort(
      (leftPair, rightPair) =>
        getPairOverallSimilarityRatio(rightPair) -
        getPairOverallSimilarityRatio(leftPair),
    )
}

// ─── Diff Utility ──────────────────────────────────────────────────────────────

/**
 * Computes a line-level diff between two source strings using LCS.
 * Returns parallel left/right arrays of annotated lines for side-by-side rendering.
 */
export function computeLineDiff(leftCode: string, rightCode: string): LineDiff {
  const leftLines = leftCode.split("\n")
  const rightLines = rightCode.split("\n")
  const lLen = leftLines.length
  const rLen = rightLines.length

  // Build LCS DP table
  const table: number[][] = Array.from({ length: lLen + 1 }, () =>
    new Array(rLen + 1).fill(0),
  )

  for (let i = 1; i <= lLen; i++) {
    for (let j = 1; j <= rLen; j++) {
      if (leftLines[i - 1] === rightLines[j - 1]) {
        table[i][j] = table[i - 1][j - 1] + 1
      } else {
        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1])
      }
    }
  }

  // Backtrack
  const leftResult: DiffLine[] = []
  const rightResult: DiffLine[] = []
  let i = lLen
  let j = rLen

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && leftLines[i - 1] === rightLines[j - 1]) {
      leftResult.unshift({ kind: "unchanged", text: leftLines[i - 1], lineNumber: i })
      rightResult.unshift({ kind: "unchanged", text: rightLines[j - 1], lineNumber: j })
      i--
      j--
    } else if (j > 0 && (i === 0 || table[i][j - 1] >= table[i - 1][j])) {
      leftResult.unshift({ kind: "unchanged", text: "" })
      rightResult.unshift({ kind: "added", text: rightLines[j - 1], lineNumber: j })
      j--
    } else {
      leftResult.unshift({ kind: "removed", text: leftLines[i - 1], lineNumber: i })
      rightResult.unshift({ kind: "unchanged", text: "" })
      i--
    }
  }

  return { left: leftResult, right: rightResult }
}

// ─── Line Highlight Utility ────────────────────────────────────────────────────

export function isLineHighlighted(
  lineIndex: number,
  ranges: { start: number; end: number }[],
): boolean {
  return ranges.some((r) => lineIndex >= r.start && lineIndex <= r.end)
}

// ─── Column-Level Highlight Segments ───────────────────────────────────────────

/**
 * Computes inline text segments for a single line, marking which character
 * ranges are highlighted by matched fragments. Produces the same column-level
 * precision shown in the Monaco editor UI.
 *
 * @param lineText - The full text content of the line.
 * @param lineIndex - The 0-indexed line number.
 * @param fragments - All matched fragments for the pair.
 * @param side - Which side of the comparison to evaluate.
 * @returns An array of text segments with highlight flags.
 */
export function getLineTextSegments(
  lineText: string,
  lineIndex: number,
  fragments: MatchFragment[],
  side: "left" | "right",
): TextSegment[] {
  const charRanges: { start: number; end: number }[] = []

  for (const fragment of fragments) {
    const region =
      side === "left" ? fragment.leftSelection : fragment.rightSelection

    if (lineIndex < region.startRow || lineIndex > region.endRow) {
      continue
    }

    let rangeStart: number
    let rangeEnd: number

    if (region.startRow === region.endRow) {
      rangeStart = region.startCol
      rangeEnd = region.endCol
    } else if (lineIndex === region.startRow) {
      rangeStart = region.startCol
      rangeEnd = lineText.length
    } else if (lineIndex === region.endRow) {
      rangeStart = 0
      rangeEnd = region.endCol
    } else {
      rangeStart = 0
      rangeEnd = lineText.length
    }

    rangeStart = Math.max(0, Math.min(rangeStart, lineText.length))
    rangeEnd = Math.max(rangeStart, Math.min(rangeEnd, lineText.length))

    if (rangeStart < rangeEnd) {
      charRanges.push({ start: rangeStart, end: rangeEnd })
    }
  }

  if (charRanges.length === 0) {
    return [{ text: lineText || " ", isHighlighted: false }]
  }

  charRanges.sort((a, b) => a.start - b.start)

  const merged: { start: number; end: number }[] = []

  for (const range of charRanges) {
    if (merged.length > 0 && range.start <= merged[merged.length - 1].end) {
      merged[merged.length - 1].end = Math.max(
        merged[merged.length - 1].end,
        range.end,
      )
    } else {
      merged.push({ start: range.start, end: range.end })
    }
  }

  const segments: TextSegment[] = []
  let pos = 0

  for (const range of merged) {
    if (pos < range.start) {
      segments.push({
        text: lineText.substring(pos, range.start),
        isHighlighted: false,
      })
    }

    segments.push({
      text: lineText.substring(range.start, range.end),
      isHighlighted: true,
    })
    pos = range.end
  }

  if (pos < lineText.length) {
    segments.push({
      text: lineText.substring(pos),
      isHighlighted: false,
    })
  }

  if (segments.length === 0 || segments.every((s) => s.text === "")) {
    return [{ text: " ", isHighlighted: false }]
  }

  return segments
}

