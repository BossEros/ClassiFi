/**
 * IT-004: Teacher Creates Class Successfully
 *
 * Module: Class Management
 * Unit: Create class
 * Date Tested: 4/13/26
 * Description: Verify that a teacher can create a class successfully.
 * Expected Result: A new class is created successfully.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-004 Integration Test Pass - Teacher Creates Class Successfully
 * Suggested Figure Title (System UI): Class Management UI - Created Class Shown in Teacher Classes View
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MockedObject } from "vitest"
import { ClassService } from "../../backend-ts/src/modules/classes/class.service.js"
import type { ClassRepository } from "../../backend-ts/src/modules/classes/class.repository.js"
import type { AssignmentRepository } from "../../backend-ts/src/modules/assignments/assignment.repository.js"
import type { EnrollmentRepository } from "../../backend-ts/src/modules/enrollments/enrollment.repository.js"
import type { UserRepository } from "../../backend-ts/src/modules/users/user.repository.js"
import type { SubmissionRepository } from "../../backend-ts/src/modules/submissions/submission.repository.js"
import type { StorageService } from "../../backend-ts/src/services/storage.service.js"
import { createMockClass, createMockTeacher } from "../../backend-ts/tests/utils/factories.js"

describe("IT-004: Teacher Creates Class Successfully", () => {
  let classService: ClassService
  let mockClassRepo: Partial<MockedObject<ClassRepository>>
  let mockUserRepo: Partial<MockedObject<UserRepository>>

  beforeEach(() => {
    mockClassRepo = {
      createClass: vi.fn(),
      getStudentCount: vi.fn(),
      getClassById: vi.fn(),
      getClassesWithStudentCounts: vi.fn(),
      updateClass: vi.fn(),
      deleteClass: vi.fn(),
    } as any
    mockUserRepo = { getUserById: vi.fn() } as any

    classService = new ClassService(
      mockClassRepo as ClassRepository,
      { getAssignmentsByClassId: vi.fn() } as unknown as AssignmentRepository,
      { isEnrolled: vi.fn(), unenrollStudent: vi.fn(), getEnrolledStudentsWithInfo: vi.fn() } as unknown as EnrollmentRepository,
      mockUserRepo as UserRepository,
      { getSubmissionsByClass: vi.fn(), getLatestSubmissionCountsByAssignmentIds: vi.fn(), getLatestSubmissionsByStudentAndAssignmentIds: vi.fn() } as unknown as SubmissionRepository,
      { deleteSubmissionFiles: vi.fn(), deleteAssignmentInstructionsImage: vi.fn() } as unknown as StorageService,
      { createNotification: vi.fn(), sendEmailNotificationIfEnabled: vi.fn(), withContext: vi.fn().mockReturnThis() } as any,
    )
  })

  it("should create a class and return the new class data", async () => {
    const teacher = createMockTeacher()
    const createdClass = createMockClass({ teacherId: teacher.id })

    mockUserRepo.getUserById!.mockResolvedValue(teacher)
    mockClassRepo.createClass!.mockResolvedValue(createdClass)
    mockClassRepo.getStudentCount!.mockResolvedValue(0)

    const result = await classService.createClass({
      teacherId: teacher.id,
      className: createdClass.className,
      classCode: "ABC12345",
      semester: createdClass.semester,
      academicYear: createdClass.academicYear,
      schedule: createdClass.schedule,
    })

    expect(result.id).toBe(createdClass.id)
    expect(mockClassRepo.createClass).toHaveBeenCalled()
  })
})
