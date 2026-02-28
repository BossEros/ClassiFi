import { describe, expect, it } from "vitest"
import {
  assignmentFormSchema,
  testCaseFormSchema,
} from "@/presentation/schemas/assignment/assignmentSchemas"

function buildValidAssignmentData() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const futureIsoDate = tomorrow.toISOString().slice(0, 16)

  return {
    assignmentName: "Assignment 1",
    instructions: "Solve the problem",
    instructionsImageUrl: null,
    programmingLanguage: "python",
    deadline: futureIsoDate,
    allowResubmission: false,
    maxAttempts: null,
    templateCode: "",
    totalScore: 100,
    scheduledDate: null,
    allowLateSubmissions: false,
    latePenaltyConfig: {
      tiers: [{ id: "tier-1", hoursLate: 24, penaltyPercent: 10 }],
      rejectAfterHours: 120,
    },
  }
}

describe("assignmentFormSchema", () => {
  it("accepts valid assignment form data", () => {
    const parsedResult = assignmentFormSchema.safeParse(
      buildValidAssignmentData(),
    )

    expect(parsedResult.success).toBe(true)
  })

  it("rejects empty assignment title", () => {
    const parsedResult = assignmentFormSchema.safeParse({
      ...buildValidAssignmentData(),
      assignmentName: "   ",
    })

    expect(parsedResult.success).toBe(false)

    if (!parsedResult.success) {
      expect(parsedResult.error.issues[0]?.message).toBe(
        "Assignment title is required",
      )
    }
  })

  it("rejects when instructions and image are both missing", () => {
    const parsedResult = assignmentFormSchema.safeParse({
      ...buildValidAssignmentData(),
      instructions: "   ",
      instructionsImageUrl: null,
    })

    expect(parsedResult.success).toBe(false)

    if (!parsedResult.success) {
      expect(parsedResult.error.issues[0]?.message).toBe(
        "Add instructions or upload an image",
      )
    }
  })

  it("rejects scheduled release date without time", () => {
    const parsedResult = assignmentFormSchema.safeParse({
      ...buildValidAssignmentData(),
      scheduledDate: "2026-03-10",
    })

    expect(parsedResult.success).toBe(false)

    if (!parsedResult.success) {
      expect(parsedResult.error.issues[0]?.message).toBe(
        "Release time is required",
      )
    }
  })

  it("rejects missing total score", () => {
    const parsedResult = assignmentFormSchema.safeParse({
      ...buildValidAssignmentData(),
      totalScore: null,
    })

    expect(parsedResult.success).toBe(false)

    if (!parsedResult.success) {
      expect(parsedResult.error.issues[0]?.message).toBe(
        "Total score is required",
      )
    }
  })

  it("rejects total score below minimum", () => {
    const parsedResult = assignmentFormSchema.safeParse({
      ...buildValidAssignmentData(),
      totalScore: 0,
    })

    expect(parsedResult.success).toBe(false)

    if (!parsedResult.success) {
      expect(parsedResult.error.issues[0]?.message).toBe(
        "Total score must be at least 1",
      )
    }
  })

  it("rejects invalid max attempts when resubmission is enabled", () => {
    const parsedResult = assignmentFormSchema.safeParse({
      ...buildValidAssignmentData(),
      allowResubmission: true,
      maxAttempts: 0,
    })

    expect(parsedResult.success).toBe(false)

    if (!parsedResult.success) {
      expect(parsedResult.error.issues[0]?.message).toBe(
        "Max attempts must be between 1 and 99",
      )
    }
  })
})

describe("testCaseFormSchema", () => {
  it("accepts valid test case data", () => {
    const parsedResult = testCaseFormSchema.safeParse({
      name: "Basic Case",
      input: "1 2",
      expectedOutput: "3",
      isHidden: false,
      timeLimit: 5,
    })

    expect(parsedResult.success).toBe(true)
  })

  it("rejects missing expected output", () => {
    const parsedResult = testCaseFormSchema.safeParse({
      name: "Case",
      input: "1 2",
      expectedOutput: "   ",
      isHidden: false,
      timeLimit: 5,
    })

    expect(parsedResult.success).toBe(false)

    if (!parsedResult.success) {
      expect(parsedResult.error.issues[0]?.message).toBe(
        "Expected output is required",
      )
    }
  })

  it("rejects test case name above max length", () => {
    const parsedResult = testCaseFormSchema.safeParse({
      name: "x".repeat(101),
      input: "",
      expectedOutput: "ok",
      isHidden: false,
      timeLimit: 5,
    })

    expect(parsedResult.success).toBe(false)

    if (!parsedResult.success) {
      expect(parsedResult.error.issues[0]?.message).toBe(
        "Name must be 100 characters or less",
      )
    }
  })
})
