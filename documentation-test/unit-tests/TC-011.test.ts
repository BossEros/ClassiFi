/**
 * TC-011: Assignment Creation Rejects Missing Language
 *
 * Module: Assignment Management
 * Unit: Create assignment
 * Date Tested: 4/13/26
 * Description: Verify that assignment creation rejects a missing language.
 * Expected Result: A required field error is shown for the programming language.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-011 Unit Test Pass - Missing Programming Language Rejected
 * Suggested Figure Title (System UI): Assignment Management UI - Create Assignment Form Showing Language Error
 */

import { describe, expect, it } from "vitest"
import { assignmentFormSchema } from "../../frontend/src/presentation/schemas/assignment/assignmentSchemas"

describe("TC-011: Assignment Creation Rejects Missing Language", () => {
  it("should reject assignment creation when the programming language is empty", () => {
    const assignmentParseResult = assignmentFormSchema.safeParse({
      assignmentName: "Loops Exercise",
      instructions: "Solve the given problem.",
      instructionsImageUrl: null,
      programmingLanguage: "",
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
        "Programming language is required",
      )
      expect(assignmentParseResult.error.issues[0]?.path).toEqual([
        "programmingLanguage",
      ])
    }
  })
})
