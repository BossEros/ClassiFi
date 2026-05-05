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
  studentName?: string
  submittedAt?: string | null
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
  length: number // Number of matched structural fingerprints in this fragment
  explanation?: FragmentExplanation
  diffExplanation?: DiffFragmentExplanation
  diffExplanationTargets?: DiffFragmentExplanationTarget[]
}

export type FragmentExplanationCategory =
  | "library_import"
  | "identifier_names"
  | "control_flow"
  | "function_structure"
  | "code_structure"
  | "comment_text"

export interface FragmentExplanation {
  category: FragmentExplanationCategory
  label: string
  reasons: string[]
}

export type DiffFragmentExplanationCategory =
  | "identifier_renaming"
  | "conditional_logic_changed"
  | "loop_logic_changed"
  | "output_logic_changed"
  | "statement_added"
  | "statement_removed"
  | "comment_changed"
  | "code_changed"

export type DiffFragmentExplanationSource = "ai" | "fallback"

export interface DiffFragmentExplanation {
  category: DiffFragmentExplanationCategory
  label: string
  reasons: string[]
  confidence: number
  source: DiffFragmentExplanationSource
}

export interface DiffFragmentExplanationTarget {
  targetId: string
  targetKind?: "changed" | "added" | "removed"
  leftSelection: CodeRegion | null
  rightSelection: CodeRegion | null
  explanation: DiffFragmentExplanation
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
  diffExplanationTargets?: DiffFragmentExplanationTarget[]
  /** How many k-grams from the left file are matched */
  leftCovered?: number
  /** How many k-grams from the right file are matched */
  rightCovered?: number
  /** Total k-grams in the left file */
  leftTotal?: number
  /** Total k-grams in the right file */
  rightTotal?: number
}

/**
 * Colors for highlighting matches.
 */
export const MATCH_COLORS = {
  /**
   * Normal match background.
   * A soft sky-blue wash that marks shared code without implying "success" or "failure."
   * This keeps suspicious overlap visually prominent while preserving syntax readability.
   */
  match: "rgba(56, 189, 248, 0.18)",

  /**
   * Hovering over a match.
   * Slightly stronger tint so teachers can track the fragment under inspection quickly.
   */
  matchHover: "rgba(56, 189, 248, 0.26)",

  /**
   * Hover outline.
   * Adds a faint edge so overlapping fragments remain easy to distinguish on light surfaces.
   */
  matchHoverOutline: "rgba(14, 165, 233, 0.34)",

  /**
   * Selected match.
   * A more deliberate sky-blue fill that anchors the active fragment immediately.
   */
  matchSelected: "rgba(14, 165, 233, 0.38)",

  /**
   * Selected match outline.
   * Stronger than hover so the active fragment stays obvious even in dense overlap regions.
   */
  matchSelectedOutline: "rgba(2, 132, 199, 0.85)",

  /**
   * Ignored/template code.
   * A quiet slate tint that remains visible on the light review surface without competing with true matches.
   */
  matchIgnored: "rgba(148, 163, 184, 0.10)",

  /**
   * Ignored/template outline.
   * Keeps ignored blocks discoverable while staying visually subordinate to selected and hovered matches.
   */
  matchIgnoredOutline: "rgba(148, 163, 184, 0.18)",
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
