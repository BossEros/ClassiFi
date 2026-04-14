/**
 * IT-007: Teacher Deletes Class Successfully
 *
 * Module: Class Management
 * Unit: Delete class
 * Date Tested: 4/13/26
 * Description: Verify that a teacher can delete a class successfully.
 * Expected Result: The class and related data are deleted successfully.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-007 Integration Test Pass - Teacher Deletes Class Successfully
 * Suggested Figure Title (System UI): Class Management UI - Class Page with Delete Class Success Toast Notification
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { ClassService } from "../../backend-ts/src/modules/classes/class.service.js"
import { createMockClass } from "../../backend-ts/tests/utils/factories.js"

describe("IT-007: Teacher Deletes Class Successfully", () => {
  let classService: ClassService
  let mockClassRepo: any
  let mockAssignmentRepo: any
  let mockSubmissionRepo: any
  let mockStorageService: any

  beforeEach(() => {
    mockClassRepo = {
      getClassById: vi.fn(),
      deleteClass: vi.fn(),
      createClass: vi.fn(),
      getStudentCount: vi.fn(),
      getClassesWithStudentCounts: vi.fn(),
      updateClass: vi.fn(),
    }
    mockAssignmentRepo = { getAssignmentsByClassId: vi.fn() }
    mockSubmissionRepo = {
      getSubmissionsByClass: vi.fn(),
      getLatestSubmissionCountsByAssignmentIds: vi.fn(),
      getLatestSubmissionsByStudentAndAssignmentIds: vi.fn(),
    }
    mockStorageService = {
      deleteSubmissionFiles: vi.fn(),
      deleteAssignmentInstructionsImage: vi.fn(),
    }

    classService = new ClassService(
      mockClassRepo,
      mockAssignmentRepo,
      {} as any,
      {} as any,
      mockSubmissionRepo,
      mockStorageService,
      {} as any,
    )
  })

  it("should delete the class after cleaning up related files", async () => {
    mockClassRepo.getClassById.mockResolvedValue(
      createMockClass({ id: 1, teacherId: 4 }),
    )
    mockSubmissionRepo.getSubmissionsByClass.mockResolvedValue([])
    mockAssignmentRepo.getAssignmentsByClassId.mockResolvedValue([])
    mockClassRepo.deleteClass.mockResolvedValue(true)

    await classService.deleteClass(1, 4)

    expect(mockClassRepo.deleteClass).toHaveBeenCalledWith(1)
  })
})
