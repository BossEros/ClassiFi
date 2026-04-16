/**
 * TC-009: Assignment Creation Rejects Empty Title
 *
 * Module: Assignment Management
 * Unit: Create assignment
 * Date Tested: 4/13/26
 * Description: Verify that assignment creation rejects an empty title.
 * Expected Result: A required field error is shown for the assignment title.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-009 Unit Test Pass - Empty Assignment Title Rejected
 * Suggested Figure Title (System UI): Assignment Management UI - Create Assignment Form Showing Title Error
 */

import { describe, expect, it } from "vitest"
import { assignmentFormSchema } from "../../frontend/src/presentation/schemas/assignment/assignmentSchemas"

describe("TC-009: Assignment Creation Rejects Empty Title", () => {
  it("should reject assignment creation when the title is empty", () => {
    const assignmentParseResult = assignmentFormSchema.safeParse({
      assignmentName: "   ",
      instructions: "Solve the given problem.",
      instructionsImageUrl: null,
      programmingLanguage: "python",
      deadline: "",
      allowResubmission: true,
      maxAttempts: null,
      templateCode: "",
      totalScore: 100,
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
        "Assignment title is required",
      )
      expect(assignmentParseResult.error.issues[0]?.path).toEqual([
        "assignmentName",
      ])
    }
  })
})
