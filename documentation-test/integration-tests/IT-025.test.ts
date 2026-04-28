/**
 * IT-025: Similarity Result Details Preserve Match Fragments For Highlighted Evidence
 *
 * Module: Similarity Detection
 * Unit: Get result details
 * Date Tested: 4/16/26
 * Description: Verify that result details preserve fragment coordinates for highlighted code evidence.
 * Expected Result: Fragment selections are returned with line and column boundaries for both files.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-025 Integration Test Pass - Similarity Result Details Preserve Match Fragments
 * Suggested Figure Title (System UI): Similarity Review UI - Highlighted Matching Code Blocks In Both Editors
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { PlagiarismPersistenceService } from "../../backend-ts/src/modules/plagiarism/plagiarism-persistence.service.js"
import { SimilarityRepository } from "../../backend-ts/src/modules/plagiarism/similarity.repository.js"
import { SubmissionRepository } from "../../backend-ts/src/modules/submissions/submission.repository.js"

describe("IT-025: Similarity Result Details Preserve Match Fragments For Highlighted Evidence", () => {
  let plagiarismPersistenceService: PlagiarismPersistenceService
  let mockSimilarityRepo: {
    getResultWithFragments: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockSimilarityRepo = {
      getResultWithFragments: vi.fn().mockResolvedValue({
        result: {
          id: 601,
          submission1Id: 301,
          submission2Id: 302,
        },
        fragments: [
          {
            id: 1,
            leftSelection: { startRow: 2, startCol: 0, endRow: 5, endCol: 14 },
            rightSelection: { startRow: 3, startCol: 0, endRow: 6, endCol: 14 },
            length: 4,
          },
        ],
      }),
    }

    plagiarismPersistenceService = new PlagiarismPersistenceService(
      mockSimilarityRepo as unknown as SimilarityRepository,
      {
        getSubmissionWithStudent: vi.fn().mockResolvedValue({
          submission: { id: 301, filePath: "submissions/example.py" },
          studentName: "Student Example",
        }),
      } as unknown as SubmissionRepository,
    )
  })

  it("should return fragment boundaries for both compared files", async () => {
    const result = await plagiarismPersistenceService.getResultData(601)

    expect(result).not.toBeNull()
    expect(result?.fragments).toHaveLength(1)
    expect(result?.fragments[0].leftSelection.startRow).toBe(2)
    expect(result?.fragments[0].rightSelection.startRow).toBe(3)
    expect(result?.fragments[0].length).toBe(4)
  })
})

