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
  /**
   * Normal match background.
   * A soft, highly transparent cool blue. Easy on the eyes, clearly indicates a region of interest
   * without feeling alarming or heavy.
   */
  match: "rgba(56, 189, 248, 0.18)",

  /**
   * Hovering over a match.
   * Modest opacity bump to give clear interactive feedback without jarring the eyes.
   */
  matchHover: "rgba(56, 189, 248, 0.22)",

  /**
   * Selected match.
   * A stronger, solid blue to firmly anchor the user's focus on the active fragment
   * while keeping the syntax colors beneath completely readable.
   */
  matchSelected: "rgba(56, 189, 248, 0.34)",

  /**
   * Ignored/template code.
   * A very faint, nearly invisible wash. Opaque gray completely ruins syntax highlighting.
   * This extremely faint transparency marks the area while perfectly preserving readability.
   */
  matchIgnored: "rgba(255, 255, 255, 0.03)",
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
