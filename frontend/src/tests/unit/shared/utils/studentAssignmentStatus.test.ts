import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Task } from "@/data/api/class.types"
import {
  calculateStudentAssignmentStatusCounts,
  isStudentAssignmentMissed,
  isStudentAssignmentPending,
  matchesStudentAssignmentStatusFilter,
} from "@/shared/utils/studentAssignmentStatus"

describe("studentAssignmentStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-04-23T08:00:00.000Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function createStudentAssignment(overrides: Partial<Task> = {}): Task {
    return {
      id: 1,
      classId: 1,
      moduleId: null,
      assignmentName: "Recursion Quiz",
      className: "Algorithms",
      classCode: "ALG-101",
      deadline: "2026-04-23T12:00:00.000Z" as Task["deadline"],
      programmingLanguage: "python",
      hasSubmitted: false,
      allowLateSubmissions: false,
      latePenaltyConfig: null,
      ...overrides,
    }
  }

  it("keeps late-allowed assignments pending while the reject-after window is still open", () => {
    const assignment = createStudentAssignment({
      deadline: "2026-04-22T12:00:00.000Z" as Task["deadline"],
      allowLateSubmissions: true,
      latePenaltyConfig: {
        tiers: [{ id: "tier-1", hoursLate: 24, penaltyPercent: 10 }],
        rejectAfterHours: 48,
      },
    })

    expect(isStudentAssignmentPending(assignment)).toBe(true)
    expect(isStudentAssignmentMissed(assignment)).toBe(false)
  })

  it("marks assignments as missed only after the late window closes", () => {
    const assignment = createStudentAssignment({
      deadline: "2026-04-20T12:00:00.000Z" as Task["deadline"],
      allowLateSubmissions: true,
      latePenaltyConfig: {
        tiers: [{ id: "tier-1", hoursLate: 24, penaltyPercent: 10 }],
        rejectAfterHours: 48,
      },
    })

    expect(isStudentAssignmentPending(assignment)).toBe(false)
    expect(isStudentAssignmentMissed(assignment)).toBe(true)
  })

  it("never marks submitted work as missed", () => {
    const assignment = createStudentAssignment({
      deadline: "2026-04-20T12:00:00.000Z" as Task["deadline"],
      hasSubmitted: true,
    })

    expect(isStudentAssignmentMissed(assignment)).toBe(false)
    expect(matchesStudentAssignmentStatusFilter(assignment, "finished")).toBe(true)
  })

  it("calculates counts from the provided assignment subset", () => {
    const assignments = [
      createStudentAssignment({
        id: 1,
        className: "Algorithms",
      }),
      createStudentAssignment({
        id: 2,
        className: "Algorithms",
        deadline: "2026-04-22T12:00:00.000Z" as Task["deadline"],
        allowLateSubmissions: true,
        latePenaltyConfig: {
          tiers: [{ id: "tier-1", hoursLate: 24, penaltyPercent: 10 }],
          rejectAfterHours: 48,
        },
      }),
      createStudentAssignment({
        id: 3,
        className: "Algorithms",
        hasSubmitted: true,
      }),
      createStudentAssignment({
        id: 4,
        className: "Algorithms",
        deadline: "2026-04-20T12:00:00.000Z" as Task["deadline"],
      }),
    ]

    expect(calculateStudentAssignmentStatusCounts(assignments)).toEqual({
      all: 4,
      pending: 2,
      finished: 1,
      missed: 1,
    })
  })
})
