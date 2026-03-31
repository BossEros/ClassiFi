/**
 * TC-008: Create Class Successfully
 *
 * Module: Class Management
 * Unit: Create Class
 * Date Tested: 3/28/26
 * Description: Verify that a teacher can create a new class.
 * Expected Result: Class record is created in the database.
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
import { createMockClass, createMockTeacher } from "../../backend-ts/tests/utils/factories.js"

describe("TC-008: Create Class Successfully", () => {
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
    )
  })

  it("should create a class successfully", async () => {
    const teacher = createMockTeacher()
    const newClass = createMockClass({ teacherId: teacher.id })

    mockUserRepo.getUserById!.mockResolvedValue(teacher)
    mockClassRepo.checkClassCodeExists!.mockResolvedValue(false)
    mockClassRepo.createClass!.mockResolvedValue(newClass)
    mockClassRepo.getStudentCount!.mockResolvedValue(0)

    const result = await classService.createClass({
      teacherId: teacher.id,
      className: newClass.className,
      classCode: "ABC12345",
      semester: newClass.semester,
      academicYear: newClass.academicYear,
      schedule: newClass.schedule,
    })

    expect(result).toBeDefined()
    expect(result.id).toBe(newClass.id)
    expect(result.studentCount).toBe(0)
    expect(mockClassRepo.createClass).toHaveBeenCalled()
  })
})
