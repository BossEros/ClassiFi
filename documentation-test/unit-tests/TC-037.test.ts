/**
 * TC-037: Update Class
 *
 * Module: Class Management
 * Unit: Create, Update, and Delete Class
 * Date Tested: 4/11/26
 * Description: Verify that a teacher can update their class name and description.
 * Expected Result: The class is updated and the new details are returned.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-037 Unit Test Pass - Class Updated Successfully
 * Suggested Figure Title (System UI): Class Management UI - Edit Class Form
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import type { MockedObject } from "vitest"
import { ClassService } from "../../backend-ts/src/modules/classes/class.service.js"
import { ClassRepository } from "../../backend-ts/src/modules/classes/class.repository.js"
import { AssignmentRepository } from "../../backend-ts/src/modules/assignments/assignment.repository.js"
import { EnrollmentRepository } from "../../backend-ts/src/modules/enrollments/enrollment.repository.js"
import { UserRepository } from "../../backend-ts/src/modules/users/user.repository.js"
import { SubmissionRepository } from "../../backend-ts/src/modules/submissions/submission.repository.js"
import { StorageService } from "../../backend-ts/src/services/storage.service.js"
import { createMockClass } from "../../backend-ts/tests/utils/factories.js"

describe("TC-037: Update Class", () => {
  let classService: ClassService
  let mockClassRepo: Partial<MockedObject<ClassRepository>>
  let mockAssignmentRepo: Partial<MockedObject<AssignmentRepository>>
  let mockEnrollmentRepo: Partial<MockedObject<EnrollmentRepository>>
  let mockUserRepo: Partial<MockedObject<UserRepository>>
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
    mockEnrollmentRepo = { isEnrolled: vi.fn(), unenrollStudent: vi.fn(), getEnrolledStudentsWithInfo: vi.fn() } as any
    mockUserRepo = { getUserById: vi.fn() } as any
    mockSubmissionRepo = {
      getSubmissionsByClass: vi.fn(),
      getLatestSubmissionCountsByAssignmentIds: vi.fn(),
      getLatestSubmissionsByStudentAndAssignmentIds: vi.fn(),
    } as any
    mockStorageService = { deleteSubmissionFiles: vi.fn(), deleteAssignmentInstructionsImage: vi.fn() } as any

    classService = new ClassService(
      mockClassRepo as unknown as ClassRepository,
      mockAssignmentRepo as unknown as AssignmentRepository,
      mockEnrollmentRepo as unknown as EnrollmentRepository,
      mockUserRepo as unknown as UserRepository,
      mockSubmissionRepo as unknown as SubmissionRepository,
      mockStorageService as unknown as StorageService,
      { createNotification: vi.fn(), sendEmailNotificationIfEnabled: vi.fn(), withContext: vi.fn().mockReturnThis() } as any,
    )
  })

  afterEach(() => { vi.clearAllMocks() })

  it("should update the class name and description successfully", async () => {
    const existingClass = createMockClass({ id: 1, teacherId: 2, className: "Old Name" })
    const updatedClass = { ...existingClass, className: "Updated Class Name", description: "New description" }

    mockClassRepo.getClassById!.mockResolvedValue(existingClass)
    mockClassRepo.updateClass!.mockResolvedValue(updatedClass)
    mockClassRepo.getStudentCount!.mockResolvedValue(10)

    const result = await classService.updateClass({
      classId: 1,
      teacherId: 2,
      className: "Updated Class Name",
      description: "New description",
    })

    expect(result.className).toBe("Updated Class Name")
    expect(mockClassRepo.updateClass).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ className: "Updated Class Name", description: "New description" }),
    )
  })
})
