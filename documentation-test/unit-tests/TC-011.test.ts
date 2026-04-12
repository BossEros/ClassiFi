/**
 * TC-011: Get Class Details
 *
 * Module: Class Management
 * Unit: View Class Details and Students
 * Date Tested: 3/28/26
 * Description: Verify that class details are retrieved by ID.
 * Expected Result: Class details with student count are returned.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-011 Unit Test Pass - Class Details Retrieved Successfully
 * Suggested Figure Title (System UI): Class Management UI - Class Details and Student List View
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
import { ClassNotFoundError } from "../../backend-ts/src/shared/errors.js"
import { createMockClass } from "../../backend-ts/tests/utils/factories.js"

describe("TC-011: Get Class Details", () => {
  let classService: ClassService
  let mockClassRepo: Partial<MockedObject<ClassRepository>>

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

    classService = new ClassService(
      mockClassRepo as unknown as ClassRepository,
      {} as unknown as AssignmentRepository,
      {} as unknown as EnrollmentRepository,
      { getUserById: vi.fn() } as unknown as UserRepository,
      {} as unknown as SubmissionRepository,
      {} as unknown as StorageService,
      { createNotification: vi.fn(), sendEmailNotificationIfEnabled: vi.fn(), withContext: vi.fn().mockReturnThis() } as any,
    )
  })

  it("should return class details with student count", async () => {
    const mockClass = createMockClass()
    mockClassRepo.getClassById!.mockResolvedValue(mockClass)
    mockClassRepo.getStudentCount!.mockResolvedValue(5)

    const result = await classService.getClassById(1)

    expect(result.id).toBe(mockClass.id)
    expect(result.studentCount).toBe(5)
  })

  it("should throw ClassNotFoundError if class does not exist", async () => {
    mockClassRepo.getClassById!.mockResolvedValue(undefined)

    const getClassPromise = classService.getClassById(999)

    await expect(getClassPromise).rejects.toThrow(ClassNotFoundError)
    await expect(getClassPromise).rejects.toThrow("Class not found")
  })
})
