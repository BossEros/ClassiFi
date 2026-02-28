import { describe, expect, it } from "vitest"
import {
  DownloadResponseSchema,
  HistoryParamsSchema,
  SubmissionContentResponseSchema,
  SubmissionDetailResponseSchema,
  SubmissionHistoryResponseSchema,
  SubmissionIdParamSchema,
  SubmissionListResponseSchema,
  SubmissionResponseSchema,
  SubmitAssignmentResponseSchema,
  TestResultsQuerySchema,
} from "../../src/modules/submissions/submission.schema.js"

describe("Submission Schemas", () => {
  const validSubmission = {
    id: 1,
    assignmentId: 10,
    studentId: 20,
    fileName: "solution.py",
    filePath: "submissions/solution.py",
    fileSize: 100,
    submissionNumber: 1,
    submittedAt: "2025-01-01T00:00:00.000Z",
    isLatest: true,
    grade: 95,
    isGradeOverridden: false,
    overrideReason: null,
    overriddenAt: null,
    teacherFeedback: null,
    feedbackGivenAt: null,
  }

  describe("SubmissionResponseSchema", () => {
    it("accepts valid submission response", () => {
      const parseResult = SubmissionResponseSchema.safeParse(validSubmission)
      expect(parseResult.success).toBe(true)
    })

    it("rejects invalid nullable grade type", () => {
      const parseResult = SubmissionResponseSchema.safeParse({
        ...validSubmission,
        grade: "95",
      })
      expect(parseResult.success).toBe(false)
    })
  })

  describe("Wrapped submission response schemas", () => {
    it("accepts submit assignment response with optional submission omitted", () => {
      const parseResult = SubmitAssignmentResponseSchema.safeParse({
        success: true,
        message: "Submitted",
      })
      expect(parseResult.success).toBe(true)
    })

    it("accepts submission list and history responses", () => {
      const listResult = SubmissionListResponseSchema.safeParse({
        success: true,
        message: "OK",
        submissions: [validSubmission],
      })

      const historyResult = SubmissionHistoryResponseSchema.safeParse({
        success: true,
        message: "OK",
        submissions: [validSubmission],
        totalSubmissions: 1,
      })

      expect(listResult.success).toBe(true)
      expect(historyResult.success).toBe(true)
    })

    it("accepts submission detail response with extra optional fields", () => {
      const parseResult = SubmissionDetailResponseSchema.safeParse({
        ...validSubmission,
        assignmentName: "Activity 1",
        className: "Programming 101",
      })
      expect(parseResult.success).toBe(true)
    })
  })

  describe("Param and query schemas", () => {
    it("coerces ID params from strings", () => {
      expect(SubmissionIdParamSchema.parse({ submissionId: "5" }).submissionId).toBe(5)

      const historyParams = HistoryParamsSchema.parse({
        assignmentId: "10",
        studentId: "20",
      })

      expect(historyParams).toEqual({ assignmentId: 10, studentId: 20 })
    })

    it("defaults test results query includeHiddenDetails to false", () => {
      const parsed = TestResultsQuerySchema.parse({})
      expect(parsed.includeHiddenDetails).toBe(false)
    })

    it("coerces test results query includeHiddenDetails from string", () => {
      const parsed = TestResultsQuerySchema.parse({ includeHiddenDetails: "true" })
      expect(parsed.includeHiddenDetails).toBe(true)
    })
  })

  describe("Non-submission response schemas", () => {
    it("accepts download response", () => {
      const parseResult = DownloadResponseSchema.safeParse({
        success: true,
        message: "URL generated",
        downloadUrl: "https://example.com/download",
      })
      expect(parseResult.success).toBe(true)
    })

    it("accepts submission content response", () => {
      const parseResult = SubmissionContentResponseSchema.safeParse({
        success: true,
        message: "OK",
        content: "print('hello')",
        language: "python",
      })
      expect(parseResult.success).toBe(true)
    })
  })
})
