import type { Pair, Fragment } from "@/lib/plagiarism/index.js"

/** Configuration for plagiarism detection */
export const PLAGIARISM_CONFIG = {
  /** Default similarity threshold for flagging suspicious pairs */
  DEFAULT_THRESHOLD: 0.5,
  /** Default k-gram length for fingerprinting */
  DEFAULT_KGRAM_LENGTH: 23,
  /** Default number of k-grams in a window */
  DEFAULT_KGRAMS_IN_WINDOW: 17,
  /** Minimum number of files required for analysis */
  MINIMUM_FILES_REQUIRED: 2,
} as const

/** Supported languages for plagiarism detection */
export const PLAGIARISM_LANGUAGE_MAP: Record<string, "python" | "java" | "c"> =
  {
    python: "python",
    java: "java",
    c: "c",
  }

/** DTO for a file in plagiarism results */
export interface PlagiarismFileDTO {
  id: number
  path: string
  filename: string
  lineCount: number
  studentId?: string
  studentName?: string
}

/** DTO for a plagiarism pair comparison */
export interface PlagiarismPairDTO {
  id: number
  leftFile: PlagiarismFileDTO
  rightFile: PlagiarismFileDTO
  structuralScore: number
  semanticScore: number
  hybridScore: number
  overlap: number
  longest: number
}

/** DTO for a code fragment match */
export interface PlagiarismFragmentDTO {
  id: number
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

/** DTO for plagiarism analysis summary */
export interface PlagiarismSummaryDTO {
  totalFiles: number
  totalPairs: number
  suspiciousPairs: number
  averageSimilarity: number
  maxSimilarity: number
}

/** Convert a Pair to PlagiarismPairDTO */
export function toPlagiarismPairDTO(
  pair: Pair,
  resultId?: number,
): PlagiarismPairDTO {
  return {
    id: resultId ?? pair.id,
    leftFile: {
      id: pair.leftFile.id,
      path: pair.leftFile.path,
      filename: pair.leftFile.filename,
      lineCount: pair.leftFile.lineCount,
      studentId: pair.leftFile.info?.studentId,
      studentName: pair.leftFile.info?.studentName,
    },
    rightFile: {
      id: pair.rightFile.id,
      path: pair.rightFile.path,
      filename: pair.rightFile.filename,
      lineCount: pair.rightFile.lineCount,
      studentId: pair.rightFile.info?.studentId,
      studentName: pair.rightFile.info?.studentName,
    },
    structuralScore: pair.similarity,
    semanticScore: 0,
    hybridScore: 0,
    overlap: pair.overlap,
    longest: pair.longest,
  }
}

/** Convert a Fragment to PlagiarismFragmentDTO */
export function toPlagiarismFragmentDTO(
  fragment: Fragment,
  index: number,
): PlagiarismFragmentDTO {
  return {
    id: index,
    leftSelection: {
      startRow: fragment.leftSelection.startRow,
      startCol: fragment.leftSelection.startCol,
      endRow: fragment.leftSelection.endRow,
      endCol: fragment.leftSelection.endCol,
    },
    rightSelection: {
      startRow: fragment.rightSelection.startRow,
      startCol: fragment.rightSelection.startCol,
      endRow: fragment.rightSelection.endRow,
      endCol: fragment.rightSelection.endCol,
    },
    length: fragment.length,
  }
}
