import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  filterAssignments,
  groupAssignments,
  calculateFilterCounts,
} from "./assignmentFilters"
import type { Assignment } from "@/shared/types/class"

describe("assignmentFilters", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const createAssignment = (
    overrides: Partial<Assignment> = {},
  ): Assignment => ({
    id: 1,
    classId: 1,
    assignmentName: "Test",
    deadline: "2024-01-20T23:59:59Z" as any,
    programmingLanguage: "python",
    hasSubmitted: false,
    maxGrade: 100,
    ...overrides,
  })

  describe("filterAssignments", () => {
    it("returns all assignments when filter is 'all'", () => {
      const assignments = [
        createAssignment({ id: 1 }),
        createAssignment({ id: 2 }),
        createAssignment({ id: 3 }),
      ]

      const result = filterAssignments(assignments, "all")
      expect(result).toHaveLength(3)
      expect(result).toEqual(assignments)
    })

    it("filters pending and not-started assignments", () => {
      const assignments = [
        createAssignment({ id: 1, hasSubmitted: false }), // not-started
        createAssignment({ id: 2, hasSubmitted: true }), // pending
        createAssignment({ id: 3, hasSubmitted: true, grade: 95 }), // submitted
      ]

      const result = filterAssignments(assignments, "pending")
      expect(result).toHaveLength(2)
      expect(result.map((a) => a.id)).toEqual([1, 2])
    })

    it("filters submitted and late assignments", () => {
      const assignments = [
        createAssignment({ id: 1, hasSubmitted: false }), // not-started
        createAssignment({ id: 2, hasSubmitted: true, grade: 95 }), // submitted
        createAssignment({
          id: 3,
          hasSubmitted: true,
          deadline: "2024-01-10T23:59:59Z" as any,
          submittedAt: "2024-01-12T10:00:00Z" as any,
        }), // late
      ]

      const result = filterAssignments(assignments, "submitted")
      expect(result).toHaveLength(2)
      expect(result.map((a) => a.id)).toEqual([2, 3])
    })
  })

  describe("groupAssignments", () => {
    it("groups assignments into current and past", () => {
      const assignments = [
        createAssignment({ id: 1, deadline: "2024-01-20T23:59:59Z" as any }), // future
        createAssignment({ id: 2, deadline: "2024-01-10T23:59:59Z" as any }), // past
        createAssignment({ id: 3, deadline: "2024-01-25T23:59:59Z" as any }), // future
        createAssignment({ id: 4, deadline: "2024-01-05T23:59:59Z" as any }), // past
      ]

      const result = groupAssignments(assignments)

      expect(result.current).toHaveLength(2)
      expect(result.current.map((a) => a.id)).toEqual([1, 3])

      expect(result.past).toHaveLength(2)
      expect(result.past.map((a) => a.id)).toEqual([4, 2])
    })

    it("sorts current assignments by deadline (earliest first)", () => {
      const assignments = [
        createAssignment({ id: 1, deadline: "2024-01-25T23:59:59Z" as any }),
        createAssignment({ id: 2, deadline: "2024-01-20T23:59:59Z" as any }),
        createAssignment({ id: 3, deadline: "2024-01-30T23:59:59Z" as any }),
      ]

      const result = groupAssignments(assignments)

      expect(result.current.map((a) => a.id)).toEqual([2, 1, 3])
    })

    it("sorts past assignments by deadline (earliest first)", () => {
      const assignments = [
        createAssignment({ id: 1, deadline: "2024-01-10T23:59:59Z" as any }),
        createAssignment({ id: 2, deadline: "2024-01-05T23:59:59Z" as any }),
        createAssignment({ id: 3, deadline: "2024-01-12T23:59:59Z" as any }),
      ]

      const result = groupAssignments(assignments)

      expect(result.past.map((a) => a.id)).toEqual([2, 1, 3])
    })
  })

  describe("calculateFilterCounts", () => {
    it("calculates correct counts for all categories", () => {
      const assignments = [
        createAssignment({ id: 1, hasSubmitted: false }), // not-started (pending)
        createAssignment({ id: 2, hasSubmitted: true }), // pending
        createAssignment({ id: 3, hasSubmitted: true, grade: 95 }), // submitted
        createAssignment({
          id: 4,
          hasSubmitted: true,
          deadline: "2024-01-10T23:59:59Z" as any,
          submittedAt: "2024-01-12T10:00:00Z" as any,
        }), // late (submitted)
      ]

      const result = calculateFilterCounts(assignments)

      expect(result.all).toBe(4)
      expect(result.pending).toBe(2)
      expect(result.submitted).toBe(2)
    })

    it("handles empty array", () => {
      const result = calculateFilterCounts([])

      expect(result.all).toBe(0)
      expect(result.pending).toBe(0)
      expect(result.submitted).toBe(0)
    })
  })
})
