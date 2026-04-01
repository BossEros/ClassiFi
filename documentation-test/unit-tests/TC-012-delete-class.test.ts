/**
 * TC-012: Delete Class
 *
 * Module: Class Management
 * Unit: Delete Class
 * Date Tested: 3/28/26
 * Description: Verify that a class owner can delete their class.
 * Expected Result: Class record is removed from the database.
 * Actual Result: As Expected.
 * Remarks: Passed
 */
import { describe, it, expect, beforeEach, vi } from "vitest"
import type { MockedObject } from "vitest"
import { ClassService } from "../../backend-ts/src/modules/classes/class.service.js"
import type { ClassRepository } from "../../backend-ts/src/modules/classes/class.repository.js"
import type { AssignmentRepository } from "../../backend-ts/src/modules/assignments/assignment.repository.js"
import type { EnrollmentRepository } from "../../backend-ts/src/modules/enrollments/enrollment.repository.js"
import type { UserRepository } from "../../backend-ts/src/modules/users/user.repository.js"
import type { SubmissionRepository } from "../../backend-ts/src/modules/submissions/submission.repository.js"
import type { StorageService } from "../../backend-ts/src/services/storage.service.js"
import { NotClassOwnerError } from "../../backend-ts/src/shared/errors.js"
import { createMockClass } from "../../backend-ts/tests/utils/factories.js"

describe("TC-012: Delete Class", () => {
  let classService: ClassService
  let mockClassRepo: Partial<MockedObject<ClassRepository>>
  let mockAssignmentRepo: Partial<MockedObject<AssignmentRepository>>
  let mockSubmissionRepo: Partial<MockedObject<SubmissionRepository>>
  let mockStorageService: Partial<MockedObject<StorageService>>

  beforeEach(() => {
    mockClassRepo = {
      createClass: vi.fn(),
      getClassById: vi.fn(),
      checkClassCodeExists: vi.fn(),
      getStudentCount: vi.fn(),
      getClassesWithStudentCounts: vi.fn(),
      updateClass: vi.fn(),
      deleteClass: vi.fn(),
    } as any
    mockAssignmentRepo = { getAssignmentsByClassId: vi.fn() } as any
    mockSubmissionRepo = {
      getSubmissionsByClass: vi.fn(),
      getLatestSubmissionCountsByAssignmentIds: vi.fn(),
      getLatestSubmissionsByStudentAndAssignmentIds: vi.fn(),
    } as any
    mockStorageService = { deleteSubmissionFiles: vi.fn(), deleteAssignmentInstructionsImage: vi.fn() } as any

    classService = new ClassService(
      mockClassRepo as unknown as ClassRepository,
      mockAssignmentRepo as unknown as AssignmentRepository,
      {} as unknown as EnrollmentRepository,
      {} as unknown as UserRepository,
      mockSubmissionRepo as unknown as SubmissionRepository,
      mockStorageService as unknown as StorageService,
    )
  })

  it("should delete class successfully when teacher is owner", async () => {
    const existingClass = createMockClass({ teacherId: 1 })
    mockClassRepo.getClassById!.mockResolvedValue(existingClass)
    mockClassRepo.deleteClass!.mockResolvedValue(true)
    mockSubmissionRepo.getSubmissionsByClass!.mockResolvedValue([])
    mockAssignmentRepo.getAssignmentsByClassId!.mockResolvedValue([])

    await classService.deleteClass(1, 1)

    expect(mockClassRepo.deleteClass).toHaveBeenCalledWith(1)
  })

  it("should throw NotClassOwnerError if teacher is not owner", async () => {
    const existingClass = createMockClass({ teacherId: 1 })
    mockClassRepo.getClassById!.mockResolvedValue(existingClass)

    const deleteClassPromise = classService.deleteClass(1, 999)

    await expect(deleteClassPromise).rejects.toThrow(NotClassOwnerError)
    await expect(deleteClassPromise).rejects.toThrow("not the owner")
  })
})
