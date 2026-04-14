/**
 * TC-019: Plagiarism Detection - Insufficient Files Error
 *
 * Module: Similarity Detection
 * Unit: Structural Analysis
 * Date Tested: 3/28/26
 * Description: Verify error handling when fewer than 2 files are provided.
 * Expected Result: Displays "At least 2 files are required" message.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-019 Unit Test Pass - Structural Analysis Requires At Least Two Files
 * Suggested Figure Title (System UI): Similarity Detection UI - Insufficient Files Validation Message
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { PlagiarismService } from "../../backend-ts/src/modules/plagiarism/plagiarism.service.js"
import { InsufficientFilesError } from "../../backend-ts/src/shared/errors.js"
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

describe("TC-019: Plagiarism Detection - Insufficient Files", () => {
  let plagiarismService: PlagiarismService
  let mockAssignmentRepo: any
  let mockFileService: any
  let mockPersistenceService: any
  let mockSimilarityPenaltyService: any
  let mockSemanticClient: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockAssignmentRepo = { getAssignmentById: vi.fn() }

    mockFileService = {
      fetchSubmissionFiles: vi.fn().mockRejectedValue(
        new InsufficientFilesError(2, 1),
      ),
    }

    mockPersistenceService = {
      getReusableAssignmentReport: vi.fn().mockResolvedValue(null),
      persistReport: vi.fn(),
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

  it("should throw InsufficientFilesError when fewer than 2 files are provided", async () => {
    const assignment = createMockAssignment({ programmingLanguage: "python" })
    mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment)

    await expect(
      plagiarismService.analyzeAssignmentSubmissions(1, 1),
    ).rejects.toThrow(InsufficientFilesError)
  })

  it("should include 'At least 2 files are required' in the error message", async () => {
    const assignment = createMockAssignment({ programmingLanguage: "python" })
    mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment)

    await expect(
      plagiarismService.analyzeAssignmentSubmissions(1, 1),
    ).rejects.toThrow("At least 2 files are required")
  })
})
