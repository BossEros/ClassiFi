import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { calculateStudentGradeSummaryMetrics } from "@/presentation/utils/studentGradeMetrics"
import type { StudentGradeEntry } from "@/data/api/gradebook.types"

function createStudentGradeEntry(
  overrides: Partial<StudentGradeEntry> = {},
): StudentGradeEntry {
  return {
    assignmentId: 1,
    assignmentName: "Assignment 1",
    totalScore: 100,
    deadline: "2026-03-20T12:00:00Z",
    grade: null,
    isOverridden: false,
    feedback: null,
    submittedAt: null,
    isLate: false,
    penaltyApplied: 0,
    ...overrides,
  }
}

describe("studentGradeMetrics", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-19T12:00:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("uses graded assignments in the current grade calculation", () => {
    const metrics = calculateStudentGradeSummaryMetrics([
      createStudentGradeEntry({
        grade: 80,
        submittedAt: "2026-03-18T09:00:00Z",
      }),
      createStudentGradeEntry({
        assignmentId: 2,
        assignmentName: "Assignment 2",
        deadline: "2026-03-25T12:00:00Z",
      }),
    ])

    expect(metrics.currentGrade).toBe(80)
    expect(metrics.countedAssignmentCount).toBe(1)
    expect(metrics.gradedCount).toBe(1)
    expect(metrics.notSubmittedCount).toBe(1)
    expect(metrics.overdueMissingCount).toBe(0)
  })

  it("counts overdue missing assignments as zero in the current grade", () => {
    const metrics = calculateStudentGradeSummaryMetrics([
      createStudentGradeEntry({
        grade: 80,
        submittedAt: "2026-03-18T09:00:00Z",
      }),
      createStudentGradeEntry({
        assignmentId: 2,
        assignmentName: "Assignment 2",
        deadline: "2026-03-18T12:00:00Z",
      }),
    ])

    expect(metrics.currentGrade).toBe(40)
    expect(metrics.countedAssignmentCount).toBe(2)
    expect(metrics.overdueMissingCount).toBe(1)
    expect(metrics.notSubmittedCount).toBe(1)
  })

  it("excludes submitted but ungraded work from the current grade", () => {
    const metrics = calculateStudentGradeSummaryMetrics([
      createStudentGradeEntry({
        grade: 70,
        submittedAt: "2026-03-17T09:00:00Z",
      }),
      createStudentGradeEntry({
        assignmentId: 2,
        assignmentName: "Assignment 2",
        submittedAt: "2026-03-18T10:00:00Z",
      }),
    ])

    expect(metrics.currentGrade).toBe(70)
    expect(metrics.countedAssignmentCount).toBe(1)
    expect(metrics.pendingReviewCount).toBe(1)
    expect(metrics.overdueMissingCount).toBe(0)
  })

  it("returns no current grade when only future or pending-review work exists", () => {
    const metrics = calculateStudentGradeSummaryMetrics([
      createStudentGradeEntry({
        submittedAt: "2026-03-18T10:00:00Z",
      }),
      createStudentGradeEntry({
        assignmentId: 2,
        assignmentName: "Assignment 2",
        deadline: "2026-03-25T12:00:00Z",
      }),
    ])

    expect(metrics.currentGrade).toBeNull()
    expect(metrics.countedAssignmentCount).toBe(0)
    expect(metrics.pendingReviewCount).toBe(1)
    expect(metrics.notSubmittedCount).toBe(1)
  })

  it("does not treat undated assignments as overdue missing work", () => {
    const metrics = calculateStudentGradeSummaryMetrics([
      createStudentGradeEntry({
        grade: 90,
        submittedAt: "2026-03-18T10:00:00Z",
      }),
      createStudentGradeEntry({
        assignmentId: 2,
        assignmentName: "Assignment 2",
        deadline: null,
      }),
    ])

    expect(metrics.currentGrade).toBe(90)
    expect(metrics.countedAssignmentCount).toBe(1)
    expect(metrics.overdueMissingCount).toBe(0)
    expect(metrics.notSubmittedCount).toBe(1)
  })
})
