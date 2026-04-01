/**
 * TC-018: Analyze Files Successfully
 *
 * Module: Plagiarism Detection
 * Unit: Analyze Files
 * Date Tested: 3/28/26
 * Description: Verify that files are analyzed for structural similarity.
 * Expected Result: Similarity report with scores is returned.
 * Actual Result: As Expected.
 * Remarks: Passed
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { PlagiarismService, type AnalyzeRequest } from "../../backend-ts/src/modules/plagiarism/plagiarism.service.js"

vi.mock("../../backend-ts/src/modules/assignments/assignment.repository.js")
vi.mock("../../backend-ts/src/shared/config.js", () => ({
  settings: {
    plagiarismStructuralWeight: 0.7,
    plagiarismSemanticWeight: 0.3,
    plagiarismHybridThreshold: 0.5,
    semanticSimilarityMaxConcurrentRequests: 4,
  },
}))
vi.mock("../../backend-ts/src/modules/plagiarism/plagiarism-persistence.service.js")
vi.mock("../../backend-ts/src/modules/plagiarism/plagiarism-submission-file.service.js")
vi.mock("../../backend-ts/src/modules/plagiarism/plagiarism-detector.factory.js")

const mockReport = {
  getSummary: () => ({ totalFiles: 2, totalPairs: 1, averageSimilarity: 0.5, maxSimilarity: 0.8, warnings: [] }),
  getPairs: () => [{
    id: 1, similarity: 0.8, overlap: 50, longest: 10,
    leftCovered: 40, rightCovered: 45, leftTotal: 80, rightTotal: 90,
    leftFile: { path: "file1.py", filename: "file1.py", content: 'print("hello")', lineCount: 1, info: { submissionId: "1", studentId: "1", studentName: "Student 1" } },
    rightFile: { path: "file2.py", filename: "file2.py", content: 'print("hello")', lineCount: 1, info: { submissionId: "2", studentId: "2", studentName: "Student 2" } },
    buildFragments: () => [],
  }],
  getFragments: () => [{ leftSelection: { startRow: 1, startCol: 1, endRow: 1, endCol: 10 }, rightSelection: { startRow: 1, startCol: 1, endRow: 1, endCol: 10 }, length: 10 }],
  files: [{ path: "file1.py" }, { path: "file2.py" }],
}

const mockDetector = { analyze: vi.fn().mockResolvedValue(mockReport) }

describe("TC-018: Analyze Files Successfully", () => {
  let plagiarismService: PlagiarismService
  let mockDetectorFactory: any
  let mockSemanticClient: any

  beforeEach(() => {
    mockDetectorFactory = { create: vi.fn().mockReturnValue(mockDetector) }
    mockSemanticClient = { getSemanticScore: vi.fn().mockResolvedValue(0), healthCheck: vi.fn() }
    ;(PlagiarismService as any).prototype.legacyReportsStore = new Map()

    plagiarismService = new PlagiarismService(
      { getAssignmentById: vi.fn() } as any,
      mockDetectorFactory,
      { fetchSubmissionFiles: vi.fn(), downloadSubmissionFiles: vi.fn() } as any,
      { getReusableAssignmentReport: vi.fn().mockResolvedValue(null), persistReport: vi.fn().mockResolvedValue({ dbReport: { id: 1 }, resultIdMap: new Map() }), getReport: vi.fn(), getResultData: vi.fn(), deleteReport: vi.fn() } as any,
      mockSemanticClient,
    )
  })

  afterEach(() => { vi.clearAllMocks() })

  it("should successfully analyze two files for plagiarism", async () => {
    const request: AnalyzeRequest = {
      files: [
        { path: "file1.py", content: 'print("hello")' },
        { path: "file2.py", content: 'print("hello")' },
      ],
      language: "python",
    }

    const result = await plagiarismService.analyzeFiles(request)

    expect(result).toBeDefined()
    expect(result.reportId).toBeDefined()
    expect(result.summary).toBeDefined()
    expect(result.pairs).toHaveLength(1)
    expect(result.pairs[0].hybridScore).toBe(0.8)
    expect(mockDetectorFactory.create).toHaveBeenCalled()
    expect(mockDetector.analyze).toHaveBeenCalled()
  })
})
