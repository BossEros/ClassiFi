/**
 * TC-020: Assignment Creation Rejects Score Below One
 *
 * Module: Assignment Management
 * Unit: Create assignment
 * Date Tested: 4/13/26
 * Description: Verify that assignment creation rejects a score below one.
 * Expected Result: A minimum score error is shown for the assignment score.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-020 Unit Test Pass - Invalid Assignment Score Rejected
 * Suggested Figure Title (System UI): Assignment Management UI - Create Assignment Form Showing Score Rule Error
 */

import { describe, expect, it } from "vitest"
import { assignmentFormSchema } from "../../frontend/src/presentation/schemas/assignment/assignmentSchemas"

describe("TC-020: Assignment Creation Rejects Score Below One", () => {
  it("should reject assignment creation when the total score is below one", () => {
    const assignmentParseResult = assignmentFormSchema.safeParse({
      assignmentName: "Loops Exercise",
      instructions: "Solve the given problem.",
      instructionsImageUrl: null,
      programmingLanguage: "python",
      deadline: "",
      allowResubmission: true,
      maxAttempts: null,
      templateCode: "",
      totalScore: 0,
      scheduledDate: null,
      allowLateSubmissions: false,
      latePenaltyConfig: { tiers: [], rejectAfterHours: null },
      enableSimilarityPenalty: false,
      similarityPenaltyConfig: {
        warningThreshold: 75,
        deductionBands: [],
        maxPenaltyPercent: 20,
        applyHighestPairOnly: true,
      },
      moduleId: 1,
    })

    expect(assignmentParseResult.success).toBe(false)

    if (!assignmentParseResult.success) {
      expect(assignmentParseResult.error.issues[0]?.message).toBe(
        "Total score must be at least 1",
      )
      expect(assignmentParseResult.error.issues[0]?.path).toEqual([
        "totalScore",
      ])
    }
  })
})
