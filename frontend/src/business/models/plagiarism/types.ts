export interface FileResponse {
  id: number
  path: string
  filename: string
  lineCount: number
  studentId?: string
  studentName?: string
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

export interface AnalyzeResponse {
  reportId: string
  isReusedReport: boolean
  summary: {
    totalFiles: number
    totalPairs: number
    suspiciousPairs: number
    averageSimilarity: number
    maxSimilarity: number
  }
  pairs: PairResponse[]
  warnings: string[]
}

export interface AssignmentSimilarityStatusResponse {
  hasReusableReport: boolean
  reusableReportId: string | null
}

export interface ResultDetailsResponse {
  result: {
    id: number
    submission1Id: number
    submission2Id: number
    structuralScore: string
    overlap: number
    longestFragment: number
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
  }>
  leftFile: {
    filename: string
    content: string
    lineCount: number
    studentName: string
  }
  rightFile: {
    filename: string
    content: string
    lineCount: number
    studentName: string
  }
}
