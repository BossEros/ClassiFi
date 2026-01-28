import type { FilePair, MatchFragment } from "./types"

/**
 * These adapters convert backend API responses to frontend component types.
 */

// Interface for raw pair data from API
interface ApiPairData {
  id: number
  leftFile: {
    id: number
    path: string
    filename: string
    content: string
    lineCount: number
  }
  rightFile: {
    id: number
    path: string
    filename: string
    content: string
    lineCount: number
  }
  similarity: number
  overlap: number
  longest: number
}

// Interface for raw fragment data from API
interface ApiFragmentData {
  id?: number
  leftSelection: {
    startRow: number
    startCol: number
    endRow: number
    endCol: number
  }
  rightSelection: {
    startRow: number
    startCol: number
    endRow: number
    endCol: number
  }
  length: number
}

/**
 * Convert API pair data to FilePair for UI components.
 */
export function pairToFilePair(
  pair: ApiPairData,
  fragments: ApiFragmentData[],
): FilePair {
  return {
    id: pair.id,
    leftFile: {
      id: pair.leftFile.id,
      path: pair.leftFile.path,
      filename: pair.leftFile.filename,
      content: pair.leftFile.content,
      lineCount: pair.leftFile.lineCount,
    },
    rightFile: {
      id: pair.rightFile.id,
      path: pair.rightFile.path,
      filename: pair.rightFile.filename,
      content: pair.rightFile.content,
      lineCount: pair.rightFile.lineCount,
    },
    similarity: pair.similarity,
    overlap: pair.overlap,
    longest: pair.longest,
    fragments: fragments.map((frag, index) =>
      fragmentToMatchFragment(frag, index),
    ),
  }
}

/**
 * Convert API fragment data to MatchFragment for UI.
 */
export function fragmentToMatchFragment(
  fragment: ApiFragmentData,
  id: number,
): MatchFragment {
  return {
    id: fragment.id ?? id,
    leftSelection: fragment.leftSelection,
    rightSelection: fragment.rightSelection,
    length: fragment.length,
  }
}
