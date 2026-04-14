/**
 * TC-019: Assignment Creation Rejects Missing Module
 *
 * Module: Assignment Management
 * Unit: Create assignment
 * Date Tested: 4/13/26
 * Description: Verify that assignment creation rejects a missing module.
 * Expected Result: A required field error is shown for the module.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-019 Unit Test Pass - Missing Assignment Module Rejected
 * Suggested Figure Title (System UI): Assignment Management UI - Create Assignment Form Showing Module Error
 */

import { describe, expect, it } from "vitest"
import { assignmentFormSchema } from "../../frontend/src/presentation/schemas/assignment/assignmentSchemas"

describe("TC-019: Assignment Creation Rejects Missing Module", () => {
  it("should reject assignment creation when no module is selected", () => {
    const assignmentParseResult = assignmentFormSchema.safeParse({
      assignmentName: "Loops Exercise",
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
      moduleId: null,
    })

    expect(assignmentParseResult.success).toBe(false)

    if (!assignmentParseResult.success) {
      expect(assignmentParseResult.error.issues[0]?.message).toBe(
        "Please select a module for this assignment",
      )
      expect(assignmentParseResult.error.issues[0]?.path).toEqual([
        "moduleId",
      ])
    }
  })
})
