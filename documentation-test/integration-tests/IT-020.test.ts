/**
 * IT-020: Teacher Removes Student From Class Successfully
 *
 * Module: Class Management
 * Unit: Remove student
 * Date Tested: 4/13/26
 * Description: Verify that a teacher can remove a student from a class.
 * Expected Result: The student is removed from the class successfully.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-020 Integration Test Pass - Teacher Removes Student From Class Successfully
 * Suggested Figure Title (System UI): Class Management UI - Enrolled Student View With One Less Student and Remove Student Success Notification
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
import { createMockClass, createMockTeacher, createMockUser } from "../../backend-ts/tests/utils/factories.js"

describe("IT-020: Teacher Removes Student From Class Successfully", () => {
  let classService: ClassService
  let mockClassRepo: Partial<MockedObject<ClassRepository>>
  let mockEnrollmentRepo: Partial<MockedObject<EnrollmentRepository>>
  let mockUserRepo: Partial<MockedObject<UserRepository>>

  beforeEach(() => {
    mockClassRepo = {
      getClassById: vi.fn(),
    } as any

    mockEnrollmentRepo = {
      isEnrolled: vi.fn(),
      unenrollStudent: vi.fn(),
      getEnrolledStudentsWithInfo: vi.fn(),
    } as any

    mockUserRepo = {
      getUserById: vi.fn(),
    } as any

    classService = new ClassService(
      mockClassRepo as ClassRepository,
      { getAssignmentsByClassId: vi.fn() } as unknown as AssignmentRepository,
      mockEnrollmentRepo as EnrollmentRepository,
      mockUserRepo as UserRepository,
      {
        getSubmissionsByClass: vi.fn(),
        getLatestSubmissionCountsByAssignmentIds: vi.fn(),
        getLatestSubmissionsByStudentAndAssignmentIds: vi.fn(),
      } as unknown as SubmissionRepository,
      {
        deleteSubmissionFiles: vi.fn(),
        deleteAssignmentInstructionsImage: vi.fn(),
      } as unknown as StorageService,
      {
        createNotification: vi.fn().mockResolvedValue(undefined),
        sendEmailNotificationIfEnabled: vi.fn().mockResolvedValue(undefined),
      } as any,
    )
  })

  it("should remove the student enrollment from the class", async () => {
    const classData = createMockClass({ id: 1, teacherId: 2 })
    const teacher = createMockTeacher({ id: 2 })
    const student = createMockUser({ id: 5, email: "student@test.com" })

    mockClassRepo.getClassById!.mockResolvedValue(classData)
    mockEnrollmentRepo.isEnrolled!.mockResolvedValue(true)
    mockEnrollmentRepo.unenrollStudent!.mockResolvedValue(true)
    mockUserRepo.getUserById!
      .mockResolvedValueOnce(teacher)
      .mockResolvedValueOnce(student)

    await classService.removeStudent({
      classId: 1,
      studentId: 5,
      teacherId: 2,
    })

    expect(mockEnrollmentRepo.unenrollStudent).toHaveBeenCalledWith(5, 1)
  })
})
