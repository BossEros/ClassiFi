import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Task } from "@/data/api/class.types"
import {
  calculateTeacherAssignmentStatusCounts,
  getTeacherAssignmentCloseDate,
  hasTeacherAssignmentNoSubmissions,
  isTeacherAssignmentClosed,
  isTeacherAssignmentPending,
  matchesTeacherAssignmentStatusFilter,
} from "@/shared/utils/teacherAssignmentStatus"

describe("teacherAssignmentStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-04-23T08:00:00.000Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function createTeacherAssignment(overrides: Partial<Task> = {}): Task {
    return {
      id: 1,
      classId: 1,
      moduleId: null,
      assignmentName: "Dynamic Programming",
      className: "Algorithms",
      classCode: "ALG-101",
      deadline: "2026-04-23T12:00:00.000Z" as Task["deadline"],
      programmingLanguage: "python",
      allowLateSubmissions: false,
      latePenaltyConfig: null,
      submissionCount: 0,
      submittedCount: 0,
      studentCount: 30,
      ...overrides,
    }
  }

  it("treats assignments without late submissions as closed after the deadline", () => {
    const assignment = createTeacherAssignment({
      deadline: "2026-04-22T12:00:00.000Z" as Task["deadline"],
    })

    expect(isTeacherAssignmentClosed(assignment)).toBe(true)
    expect(isTeacherAssignmentPending(assignment)).toBe(false)
  })

  it("keeps assignments pending during the allowed late-submission window", () => {
    const assignment = createTeacherAssignment({
      deadline: "2026-04-22T12:00:00.000Z" as Task["deadline"],
      allowLateSubmissions: true,
      latePenaltyConfig: {
        tiers: [{ id: "tier-1", hoursLate: 24, penaltyPercent: 10 }],
        rejectAfterHours: 48,
      },
      submissionCount: 12,
      studentCount: 30,
    })

    expect(isTeacherAssignmentClosed(assignment)).toBe(false)
    expect(isTeacherAssignmentPending(assignment)).toBe(true)
  })

  it("closes assignments after the reject-after window expires", () => {
    const assignment = createTeacherAssignment({
      deadline: "2026-04-20T12:00:00.000Z" as Task["deadline"],
      allowLateSubmissions: true,
      latePenaltyConfig: {
        tiers: [{ id: "tier-1", hoursLate: 24, penaltyPercent: 10 }],
        rejectAfterHours: 48,
      },
    })

    const closeDate = getTeacherAssignmentCloseDate(assignment)

    expect(closeDate?.toISOString()).toBe("2026-04-22T12:00:00.000Z")
    expect(isTeacherAssignmentClosed(assignment)).toBe(true)
  })

  it("uses the default reject-after window when late submissions are enabled without custom config", () => {
    const assignment = createTeacherAssignment({
      deadline: "2026-04-18T08:00:01.000Z" as Task["deadline"],
      allowLateSubmissions: true,
      latePenaltyConfig: null,
    })

    expect(isTeacherAssignmentClosed(assignment)).toBe(false)
  })

  it("treats a null reject-after cutoff as indefinitely open", () => {
    const assignment = createTeacherAssignment({
      deadline: "2026-04-01T12:00:00.000Z" as Task["deadline"],
      allowLateSubmissions: true,
      latePenaltyConfig: {
        tiers: [{ id: "tier-1", hoursLate: 24, penaltyPercent: 10 }],
        rejectAfterHours: null,
      },
    })

    expect(getTeacherAssignmentCloseDate(assignment)).toBeNull()
    expect(isTeacherAssignmentClosed(assignment)).toBe(false)
  })

  it("detects the no-submissions bucket only while the assignment is still open", () => {
    const openAssignment = createTeacherAssignment({
      deadline: "2026-04-23T12:00:00.000Z" as Task["deadline"],
      submissionCount: 0,
    })
    const closedAssignment = createTeacherAssignment({
      deadline: "2026-04-22T12:00:00.000Z" as Task["deadline"],
      submissionCount: 0,
    })

    expect(hasTeacherAssignmentNoSubmissions(openAssignment)).toBe(true)
    expect(hasTeacherAssignmentNoSubmissions(closedAssignment)).toBe(false)
  })

  it("matches the expected teacher status filters", () => {
    const pendingAssignment = createTeacherAssignment({
      deadline: "2026-04-22T12:00:00.000Z" as Task["deadline"],
      allowLateSubmissions: true,
      latePenaltyConfig: {
        tiers: [{ id: "tier-1", hoursLate: 24, penaltyPercent: 10 }],
        rejectAfterHours: 48,
      },
      submissionCount: 5,
    })
    const closedAssignment = createTeacherAssignment({
      id: 2,
      deadline: "2026-04-22T12:00:00.000Z" as Task["deadline"],
      allowLateSubmissions: false,
    })
    const noSubmissionAssignment = createTeacherAssignment({
      id: 3,
      deadline: "2026-04-23T12:00:00.000Z" as Task["deadline"],
      submissionCount: 0,
    })

    expect(matchesTeacherAssignmentStatusFilter(pendingAssignment, "pending")).toBe(true)
    expect(matchesTeacherAssignmentStatusFilter(closedAssignment, "closed")).toBe(true)
    expect(
      matchesTeacherAssignmentStatusFilter(
        noSubmissionAssignment,
        "no-submissions",
      ),
    ).toBe(true)
  })

  it("calculates counts from the provided assignment subset", () => {
    const assignments = [
      createTeacherAssignment({
        id: 1,
        deadline: "2026-04-22T12:00:00.000Z" as Task["deadline"],
        allowLateSubmissions: true,
        latePenaltyConfig: {
          tiers: [{ id: "tier-1", hoursLate: 24, penaltyPercent: 10 }],
          rejectAfterHours: 48,
        },
        submissionCount: 10,
      }),
      createTeacherAssignment({
        id: 2,
        deadline: "2026-04-22T12:00:00.000Z" as Task["deadline"],
        allowLateSubmissions: false,
      }),
      createTeacherAssignment({
        id: 3,
        deadline: "2026-04-23T12:00:00.000Z" as Task["deadline"],
        submissionCount: 0,
      }),
    ]

    expect(calculateTeacherAssignmentStatusCounts(assignments)).toEqual({
      all: 3,
      pending: 2,
      closed: 1,
      "no-submissions": 1,
    })
  })
})
