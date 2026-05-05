export interface FileResponse {
  id: number
  path: string
  filename: string
  lineCount: number
  studentId?: string
  studentName?: string
  submittedAt?: string
}

export interface PairResponse {
  id: number
  leftFile: FileResponse
  rightFile: FileResponse
  structuralScore: number
  semanticScore: number
  hybridScore: number
  overlap: number
  longest: number
}

/** Weights used to compute the hybrid similarity score */
export interface ScoringWeights {
  structuralWeight: number
  semanticWeight: number
}

export type FragmentExplanationCategory =
  | "library_import"
  | "identifier_names"
  | "control_flow"
  | "function_structure"
  | "code_structure"

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
  explanation: DiffFragmentExplanation
}

export interface AnalyzeResponse {
  reportId: string
  isReusedReport: boolean
  generatedAt: string
  summary: {
    totalFiles: number
    totalPairs: number
    averageSimilarity: number
    maxSimilarity: number
  }
  submissions: FileResponse[]
  pairs: PairResponse[]
  warnings: string[]
  scoringWeights: ScoringWeights
}

export interface AssignmentSimilarityStatusResponse {
  hasReusableReport: boolean
  reusableReportId: string | null
}

/** Result details response with fragments and file content */
export interface ResultDetailsResponse {
  result: {
    id: number
    submission1Id: number
    submission2Id: number
    structuralScore: string
    overlap: number
    longestFragment: number
    leftCovered: number
    rightCovered: number
    leftTotal: number
    rightTotal: number
  }
  fragments: Array<{
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
    explanation?: FragmentExplanation
    diffExplanation?: DiffFragmentExplanation
    diffExplanationTargets?: DiffFragmentExplanationTarget[]
  }>
  leftFile: {
    filename: string
    content: string
    lineCount: number
    studentName: string
    submittedAt: string | null
  }
  rightFile: {
    filename: string
    content: string
    lineCount: number
    studentName: string
    submittedAt: string | null
  }
}


