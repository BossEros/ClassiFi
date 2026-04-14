/**
 * TC-032: Late Submission Penalty Calculation
 *
 * Module: Assignment Management
 * Unit: Configure Late Penalty
 * Date Tested: 4/10/26
 * Description: Verify that the correct penalty tier is applied based on how many hours late a submission is.
 * Expected Result: 10% penalty applied for submission within 24 hours of the deadline. No penalty for on-time submission.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-032 Unit Test Pass - Late Penalty Tier Calculated Correctly
 * Suggested Figure Title (System UI): Assignment Management UI - Late Penalty Configuration Settings
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { LatePenaltyService } from "../../backend-ts/src/modules/assignments/late-penalty.service.js"
import type { LatePenaltyConfig } from "../../backend-ts/src/modules/assignments/assignment.model.js"

vi.mock("../../backend-ts/src/modules/assignments/assignment.repository.js")

describe("TC-032: Late Submission Penalty Calculation", () => {
  let latePenaltyService: LatePenaltyService
  let mockAssignmentRepo: any

  const testPenaltyConfig: LatePenaltyConfig = {
    tiers: [
      { hoursLate: 24, penaltyPercent: 10 },
      { hoursLate: 48, penaltyPercent: 25 },
    ],
    rejectAfterHours: 72,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockAssignmentRepo = { getLatePenaltyConfig: vi.fn() }
    latePenaltyService = new LatePenaltyService(mockAssignmentRepo)
  })

  afterEach(() => { vi.clearAllMocks() })

  it("should apply 10% penalty for a submission 12 hours past the deadline", () => {
    const deadline = new Date("2026-03-01T08:00:00.000Z")
    const submissionDate = new Date("2026-03-01T20:00:00.000Z")

    const result = latePenaltyService.calculatePenalty(submissionDate, deadline, testPenaltyConfig)

    expect(result.isLate).toBe(true)
    expect(result.penaltyPercent).toBe(10)
    expect(result.gradeMultiplier).toBe(0.9)
  })

  it("should return no penalty for an on-time submission", () => {
    const deadline = new Date("2026-03-01T08:00:00.000Z")
    const submissionDate = new Date("2026-03-01T07:00:00.000Z")

    const result = latePenaltyService.calculatePenalty(submissionDate, deadline, testPenaltyConfig)

    expect(result.isLate).toBe(false)
    expect(result.penaltyPercent).toBe(0)
    expect(result.gradeMultiplier).toBe(1.0)
  })
})
