/**
 * TC-021: Assignment Creation Rejects Scheduled Release Without Time
 *
 * Module: Assignment Management
 * Unit: Create assignment
 * Date Tested: 4/14/26
 * Description: Verify that assignment creation rejects a scheduled release date when no release time is provided.
 * Expected Result: A required field error is shown for the release time.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-021 Unit Test Pass - Scheduled Release Without Time Rejected
 * Suggested Figure Title (System UI): Assignment Management UI - Create Assignment Form Showing Release Time Error
 */

import { describe, expect, it } from "vitest"
import { assignmentFormSchema } from "../../frontend/src/presentation/schemas/assignment/assignmentSchemas"

describe("TC-021: Assignment Creation Rejects Scheduled Release Without Time", () => {
  it("should reject assignment creation when a scheduled release date has no time", () => {
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
      scheduledDate: "2026-03-10",
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
        "Release time is required",
      )
      expect(assignmentParseResult.error.issues[0]?.path).toEqual([
        "scheduledDate",
      ])
    }
  })
})
