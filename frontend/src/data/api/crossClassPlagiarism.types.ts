/** Cross-class similarity result DTO for API responses */
export interface CrossClassResultDTO {
  id: number
  submission1Id: number
  submission2Id: number
  student1Name: string
  student2Name: string
  class1Name: string
  class1Code: string
  class2Name: string
  class2Code: string
  assignment1Name: string
  assignment2Name: string
  structuralScore: number
  semanticScore: number
  hybridScore: number
  overlap: number
  longestFragment: number
}

/** Cross-class analysis response from the backend */
export interface CrossClassAnalysisResponse {
  reportId: number
  generatedAt: string
  sourceAssignment: { id: number; name: string; className: string }
  matchedAssignments: Array<{
    id: number
    name: string
    className: string
    classCode: string
    nameSimilarity: number
  }>
  summary: {
    totalSubmissions: number
    totalComparisons: number
    averageSimilarity: number
    maxSimilarity: number
  }
  results: CrossClassResultDTO[]
  scoringWeights: { structuralWeight: number; semanticWeight: number }
}

/** Cross-class result details with code contents and fragment positions */
export interface CrossClassResultDetailsResponse {
  result: CrossClassResultDTO
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
