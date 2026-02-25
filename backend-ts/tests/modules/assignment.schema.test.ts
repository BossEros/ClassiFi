import { describe, expect, it } from "vitest"
import {
  AssignmentIdParamSchema,
  AssignmentResponseSchema,
  AssignmentListResponseSchema,
  CreateAssignmentRequestSchema,
  CreateAssignmentResponseSchema,
  GetAssignmentResponseSchema,
  LatePenaltyConfigSchema,
  LatePenaltyTierSchema,
  ProgrammingLanguageSchema,
  UpdateAssignmentRequestSchema,
  UpdateAssignmentResponseSchema,
} from "../../src/modules/assignments/assignment.schema.js"

describe("Assignment Schemas", () => {
  const validAssignmentResponse = {
    id: 1,
    classId: 10,
    assignmentName: "Activity 1",
    instructions: "Solve all tasks",
    instructionsImageUrl: null,
    programmingLanguage: "python",
    deadline: null,
    allowResubmission: true,
    maxAttempts: null,
    createdAt: "2025-01-01T00:00:00.000Z",
    isActive: true,
  }

  describe("ProgrammingLanguageSchema", () => {
    it("accepts supported language", () => {
      expect(ProgrammingLanguageSchema.safeParse("python").success).toBe(true)
    })

    it("rejects unsupported language", () => {
      expect(ProgrammingLanguageSchema.safeParse("ruby").success).toBe(false)
    })
  })

  describe("Late penalty schemas", () => {
    it("accepts valid late-penalty tier and config", () => {
      const tierResult = LatePenaltyTierSchema.safeParse({
        id: "tier-1",
        hoursLate: 24,
        penaltyPercent: 10,
      })

      const configResult = LatePenaltyConfigSchema.safeParse({
        tiers: [{ hoursLate: 24, penaltyPercent: 10 }],
        rejectAfterHours: 168,
      })

      expect(tierResult.success).toBe(true)
      expect(configResult.success).toBe(true)
    })

    it("rejects late-penalty tier with invalid percent", () => {
      const result = LatePenaltyTierSchema.safeParse({
        hoursLate: 24,
        penaltyPercent: 110,
      })

      expect(result.success).toBe(false)
    })
  })

  describe("CreateAssignmentRequestSchema", () => {
    it("applies defaults for omitted optional/defaulted fields", () => {
      const parsed = CreateAssignmentRequestSchema.parse({
        teacherId: 1,
        assignmentName: "Activity 1",
        programmingLanguage: "python",
      })

      expect(parsed.instructions).toBe("")
      expect(parsed.allowResubmission).toBe(true)
      expect(parsed.totalScore).toBe(100)
      expect(parsed.allowLateSubmissions).toBe(false)
    })

    it("rejects invalid maxAttempts values", () => {
      const result = CreateAssignmentRequestSchema.safeParse({
        teacherId: 1,
        assignmentName: "Activity 1",
        programmingLanguage: "python",
        maxAttempts: 0,
      })

      expect(result.success).toBe(false)
    })
  })

  describe("UpdateAssignmentRequestSchema", () => {
    it("accepts partial updates", () => {
      const result = UpdateAssignmentRequestSchema.safeParse({
        teacherId: 1,
        assignmentName: "Renamed Activity",
      })

      expect(result.success).toBe(true)
    })
  })

  describe("Assignment response and param schemas", () => {
    it("accepts assignment response payload with optional fields", () => {
      const result = AssignmentResponseSchema.safeParse({
        ...validAssignmentResponse,
        hasTemplateCode: false,
        totalScore: 100,
        allowLateSubmissions: false,
        submissionCount: 4,
        studentCount: 10,
        hasSubmitted: true,
        submittedAt: "2025-01-02T00:00:00.000Z",
        grade: 95,
        maxGrade: 100,
      })

      expect(result.success).toBe(true)
    })

    it("coerces assignmentId param and rejects invalid values", () => {
      expect(AssignmentIdParamSchema.parse({ assignmentId: "5" }).assignmentId).toBe(5)
      expect(
        AssignmentIdParamSchema.safeParse({ assignmentId: "invalid" }).success,
      ).toBe(false)
    })
  })

  describe("Wrapped assignment response schemas", () => {
    it("accepts create/get/update/list response contracts", () => {
      expect(
        CreateAssignmentResponseSchema.safeParse({
          success: true,
          message: "Created",
          assignment: validAssignmentResponse,
        }).success,
      ).toBe(true)

      expect(
        GetAssignmentResponseSchema.safeParse({
          success: true,
          message: "Fetched",
          assignment: {
            ...validAssignmentResponse,
            className: "Programming 101",
            teacherName: "Teacher User",
          },
        }).success,
      ).toBe(true)

      expect(
        UpdateAssignmentResponseSchema.safeParse({
          success: true,
          message: "Updated",
          assignment: validAssignmentResponse,
        }).success,
      ).toBe(true)

      expect(
        AssignmentListResponseSchema.safeParse({
          success: true,
          message: "OK",
          assignments: [validAssignmentResponse],
        }).success,
      ).toBe(true)
    })
  })
})
