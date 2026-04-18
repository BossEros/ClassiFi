/**
 * IT-026: Similarity Result Details Return Both Files For Side-By-Side Comparison
 *
 * Module: Similarity Detection
 * Unit: Get result details
 * Date Tested: 4/16/26
 * Description: Verify that result details return both compared submissions for side-by-side review.
 * Expected Result: The system returns left and right submission records with distinct file paths.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-026 Integration Test Pass - Similarity Result Details Return Both Files
 * Suggested Figure Title (System UI): Similarity Review UI - Side-By-Side Comparison Panel Showing Both Student Files
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { PlagiarismPersistenceService } from "../../backend-ts/src/modules/plagiarism/plagiarism-persistence.service.js"
import { SimilarityRepository } from "../../backend-ts/src/modules/plagiarism/similarity.repository.js"
import { SubmissionRepository } from "../../backend-ts/src/modules/submissions/submission.repository.js"

describe("IT-026: Similarity Result Details Return Both Files For Side-By-Side Comparison", () => {
  let plagiarismPersistenceService: PlagiarismPersistenceService
  let mockSimilarityRepo: {
    getResultWithFragments: ReturnType<typeof vi.fn>
  }
  let mockSubmissionRepo: {
    getSubmissionWithStudent: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockSimilarityRepo = {
      getResultWithFragments: vi.fn().mockResolvedValue({
        result: {
          id: 501,
          submission1Id: 101,
          submission2Id: 202,
        },
        fragments: [],
      }),
    }

    mockSubmissionRepo = {
      getSubmissionWithStudent: vi.fn().mockImplementation(async (submissionId: number) => {
        if (submissionId === 101) {
          return {
            submission: { id: 101, filePath: "submissions/student-a.py" },
            studentName: "Student A",
          }
        }

        return {
          submission: { id: 202, filePath: "submissions/student-b.py" },
          studentName: "Student B",
        }
      }),
    }

    plagiarismPersistenceService = new PlagiarismPersistenceService(
      mockSimilarityRepo as unknown as SimilarityRepository,
      mockSubmissionRepo as unknown as SubmissionRepository,
    )
  })

  it("should return both compared submissions with distinct file paths", async () => {
    const result = await plagiarismPersistenceService.getResultData(501)

    expect(result).not.toBeNull()
    expect(result?.submission1?.submission.filePath).toBe("submissions/student-a.py")
    expect(result?.submission2?.submission.filePath).toBe("submissions/student-b.py")
    expect(result?.submission1?.studentName).toBe("Student A")
    expect(result?.submission2?.studentName).toBe("Student B")
  })
})
