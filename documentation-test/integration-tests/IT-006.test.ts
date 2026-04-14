/**
 * IT-006: Teacher Updates Class Successfully
 *
 * Module: Class Management
 * Unit: Update class
 * Date Tested: 4/13/26
 * Description: Verify that a teacher can update a class successfully.
 * Expected Result: The class information is updated successfully.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-006 Integration Test Pass - Teacher Updates Class Successfully
 * Suggested Figure Title (System UI): Class Management UI - Class View with Updated Information and Update Success Toast Notification
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { ClassService } from "../../backend-ts/src/modules/classes/class.service.js"
import { createMockClass } from "../../backend-ts/tests/utils/factories.js"

describe("IT-006: Teacher Updates Class Successfully", () => {
  let classService: ClassService
  let mockClassRepo: any

  beforeEach(() => {
    mockClassRepo = {
      getClassById: vi.fn(),
      updateClass: vi.fn(),
      getStudentCount: vi.fn(),
      createClass: vi.fn(),
      getClassesWithStudentCounts: vi.fn(),
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

  it("should update the class and return the updated class data", async () => {
    const existingClass = createMockClass({ id: 1, teacherId: 7 })
    const updatedClass = { ...existingClass, className: "Updated Class Name" }

    mockClassRepo.getClassById.mockResolvedValue(existingClass)
    mockClassRepo.updateClass.mockResolvedValue(updatedClass)
    mockClassRepo.getStudentCount.mockResolvedValue(18)

    const result = await classService.updateClass({
      classId: 1,
      teacherId: 7,
      className: "Updated Class Name",
    })

    expect(result.className).toBe("Updated Class Name")
    expect(mockClassRepo.updateClass).toHaveBeenCalledWith(1, {
      className: "Updated Class Name",
    })
  })
})
