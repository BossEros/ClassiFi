/**
 * IT-005: Teacher Reads Own Classes
 *
 * Module: Class Management
 * Unit: Read classes
 * Date Tested: 4/13/26
 * Description: Verify that a teacher can read their own classes.
 * Expected Result: Only the classes assigned to the teacher are displayed.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-005 Integration Test Pass - Teacher Reads Own Classes
 * Suggested Figure Title (System UI): Class Management UI - Teacher Class List
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { ClassService } from "../../backend-ts/src/modules/classes/class.service.js"
import { createMockClass } from "../../backend-ts/tests/utils/factories.js"

describe("IT-005: Teacher Reads Own Classes", () => {
  let classService: ClassService
  let mockClassRepo: any

  beforeEach(() => {
    mockClassRepo = {
      getClassesWithStudentCounts: vi.fn(),
      createClass: vi.fn(),
      getClassById: vi.fn(),
      getStudentCount: vi.fn(),
      updateClass: vi.fn(),
      deleteClass: vi.fn(),
    }

    classService = new ClassService(
      mockClassRepo,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    )
  })

  it("should return the classes assigned to the teacher", async () => {
    mockClassRepo.getClassesWithStudentCounts.mockResolvedValue([
      { ...createMockClass({ id: 1, teacherId: 9 }), studentCount: 20 },
      { ...createMockClass({ id: 2, teacherId: 9 }), studentCount: 15 },
    ])

    const result = await classService.getClassesByTeacher(9)

    expect(result).toHaveLength(2)
    expect(result[0].teacherId).toBe(9)
    expect(mockClassRepo.getClassesWithStudentCounts).toHaveBeenCalledWith(9, true)
  })
})
