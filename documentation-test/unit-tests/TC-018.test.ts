/**
 * TC-018: Plagiarism Detection - Analyze Files
 *
 * Module: Similarity Detection
 * Unit: Structural Analysis
 * Date Tested: 3/28/26
 * Description: Verify that files are analyzed for structural similarity.
 * Expected Result: Similarity report is shown after analysis.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-018 Unit Test Pass - Structural Similarity Analysis Completed
 * Suggested Figure Title (System UI): Similarity Detection UI - Pairwise Analysis Results View
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { PlagiarismService } from "../../backend-ts/src/modules/plagiarism/plagiarism.service.js"
import { createMockAssignment } from "../../backend-ts/tests/utils/factories.js"

vi.mock("../../backend-ts/src/modules/assignments/assignment.repository.js")
vi.mock("../../backend-ts/src/modules/plagiarism/plagiarism-persistence.service.js")
vi.mock("../../backend-ts/src/modules/plagiarism/plagiarism-submission-file.service.js")
vi.mock("../../backend-ts/src/shared/config.js", () => ({
  settings: {
    plagiarismStructuralWeight: 0.7,
    plagiarismSemanticWeight: 0.3,
    semanticSimilarityMaxConcurrentRequests: 4,
  },
}))
vi.mock("../../backend-ts/src/modules/plagiarism/plagiarism.mapper.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../backend-ts/src/modules/plagiarism/plagiarism.mapper.js")>()
  return { ...actual, createPlagiarismDetector: vi.fn() }
})

const mockReport = {
  getSummary: () => ({
    totalFiles: 2,
    totalPairs: 1,
    averageSimilarity: 0.8,
    maxSimilarity: 0.8,
    warnings: [],
  }),
  getPairs: () => [
    {
      id: 1,
      similarity: 0.8,
      overlap: 50,
      longest: 10,
      leftCovered: 40,
      rightCovered: 45,
      leftTotal: 80,
      rightTotal: 90,
      leftFile: {
        path: "student-a.py",
        filename: "student-a.py",
        content: 'print("hello")',
        lineCount: 1,
        info: { submissionId: "1", studentId: "1", studentName: "Student A" },
      },
      rightFile: {
        path: "student-b.py",
        filename: "student-b.py",
        content: 'print("hello")',
        lineCount: 1,
        info: { submissionId: "2", studentId: "2", studentName: "Student B" },
      },
      buildFragments: () => [],
    },
  ],
  getFragments: () => [],
  files: [{ path: "student-a.py" }, { path: "student-b.py" }],
}

describe("TC-018: Plagiarism Detection - Analyze Files", () => {
  let plagiarismService: PlagiarismService
  let mockAssignmentRepo: any
  let mockFileService: any
  let mockPersistenceService: any
  let mockSimilarityPenaltyService: any
  let mockSemanticClient: any
  let mockDetector: any

  beforeEach(async () => {
    vi.clearAllMocks()

    mockDetector = { analyze: vi.fn().mockResolvedValue(mockReport) }

    const { createPlagiarismDetector } = await import("../../backend-ts/src/modules/plagiarism/plagiarism.mapper.js")
    vi.mocked(createPlagiarismDetector).mockReturnValue(mockDetector as any)

    mockAssignmentRepo = { getAssignmentById: vi.fn() }

    mockFileService = {
      fetchSubmissionFiles: vi.fn().mockResolvedValue([
        { path: "student-a.py", content: 'print("hello")', info: {} },
        { path: "student-b.py", content: 'print("hello")', info: {} },
      ]),
    }

    mockPersistenceService = {
      getReusableAssignmentReport: vi.fn().mockResolvedValue(null),
      persistReport: vi.fn().mockResolvedValue({
        dbReport: { id: 1, generatedAt: new Date("2026-03-10T10:00:00.000Z") },
        resultIdMap: new Map(),
      }),
    }

    mockSimilarityPenaltyService = {
      applyAssignmentPenaltyFromReport: vi.fn().mockResolvedValue(undefined),
      syncAssignmentPenaltyState: vi.fn().mockResolvedValue(undefined),
    }

    mockSemanticClient = {
      getEmbedding: vi.fn().mockResolvedValue(null),
      getSemanticScore: vi.fn().mockResolvedValue(0),
    }

    plagiarismService = new PlagiarismService(
      mockAssignmentRepo,
      mockFileService,
      mockPersistenceService,
      mockSimilarityPenaltyService,
      mockSemanticClient,
    )
  })

  afterEach(() => { vi.clearAllMocks() })

  it("should return a similarity report after analyzing files", async () => {
    const assignment = createMockAssignment({ programmingLanguage: "python" })
    mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment)

    const result = await plagiarismService.analyzeAssignmentSubmissions(1, 1)

    expect(result).toBeDefined()
    expect(result.reportId).toBeDefined()
    expect(result.summary.totalFiles).toBeGreaterThanOrEqual(2)
    expect(result.summary.totalPairs).toBeGreaterThanOrEqual(1)
    expect(result.pairs).toHaveLength(1)
    expect(result.pairs[0].structuralScore).toBeDefined()
    expect(mockFileService.fetchSubmissionFiles).toHaveBeenCalledWith(1)
    expect(mockDetector.analyze).toHaveBeenCalled()
    expect(mockPersistenceService.persistReport).toHaveBeenCalled()
  })
})
