/**
 * Types for plagiarism detection UI components.
 * These map to the data structures from the plagiarism-detection library.
 */

/**
 * A file with its content and metadata.
 */
export interface FileData {
  id: number
  path: string
  filename: string
  content: string
  lineCount: number
}

/**
 * A region in source code (0-indexed).
 */
export interface CodeRegion {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

/**
 * A matching fragment between two files.
 */
export interface MatchFragment {
  id: number
  leftSelection: CodeRegion
  rightSelection: CodeRegion
  length: number // Number of k-grams in this fragment
}

/**
 * A pair of files being compared.
 */
export interface FilePair {
  id: number
  leftFile: FileData
  rightFile: FileData
  similarity: number // 0-1
  overlap: number
  longest: number
  fragments: MatchFragment[]
}

/**
 * Colors for highlighting matches.
 */
export const MATCH_COLORS = {
  /** Normal match background */
  match: "rgba(60, 115, 168, 0.2)",
  /** Hovering over a match */
  matchHover: "rgba(60, 115, 168, 0.3)",
  /** Selected match */
  matchSelected: "rgba(26, 188, 156, 0.5)",
  /** Ignored/template code */
  matchIgnored: "rgba(220, 220, 220, 1)",
} as const

/**
 * Convert a Region from the library to a Monaco IRange (1-indexed).
 */
export function regionToMonacoRange(region: CodeRegion): {
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
} {
  return {
    startLineNumber: region.startRow + 1,
    startColumn: region.startCol + 1,
    endLineNumber: region.endRow + 1,
    endColumn: region.endCol + 1,
  }
}
