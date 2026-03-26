import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MockedObject } from "vitest"
import { AdminEnrollmentService } from "../../src/modules/admin/admin-enrollment.service.js"
import type { ClassRepository } from "../../src/modules/classes/class.repository.js"
import type { UserRepository } from "../../src/modules/users/user.repository.js"
import type { EnrollmentRepository } from "../../src/modules/enrollments/enrollment.repository.js"
import {
  AlreadyEnrolledError,
  BadRequestError,
  ClassInactiveError,
  StudentNotInClassError,
} from "../../src/shared/errors.js"
import { createMockClass, createMockTeacher, createMockUser } from "../utils/factories.js"

const { withTransactionMock } = vi.hoisted(() => ({
  withTransactionMock: vi.fn(),
}))

vi.mock("../../src/shared/transaction.js", () => ({
  withTransaction: withTransactionMock,
}))

describe("AdminEnrollmentService", () => {
  let adminEnrollmentService: AdminEnrollmentService
  let mockClassRepo: Partial<MockedObject<ClassRepository>>
  let mockUserRepo: Partial<MockedObject<UserRepository>>
  let mockEnrollmentRepo: Partial<MockedObject<EnrollmentRepository>>
  let mockEnrollmentRepoWithContext: Partial<MockedObject<EnrollmentRepository>>

  beforeEach(() => {
    vi.clearAllMocks()

    mockClassRepo = {
      getClassById: vi.fn(),
    } as any

    mockUserRepo = {
      getUserById: vi.fn(),
    } as any

    mockEnrollmentRepoWithContext = {
      enrollStudent: vi.fn(),
      unenrollStudent: vi.fn(),
    } as any

    mockEnrollmentRepo = {
      getEnrolledStudentsWithInfo: vi.fn(),
      getAllEnrollmentsFiltered: vi.fn(),
      isEnrolled: vi.fn(),
      enrollStudent: vi.fn(),
      unenrollStudent: vi.fn(),
      withContext: vi.fn().mockReturnValue(mockEnrollmentRepoWithContext),
    } as any

    withTransactionMock.mockImplementation(async (callback) =>
      callback({} as never),
    )

    adminEnrollmentService = new AdminEnrollmentService(
      mockClassRepo as ClassRepository,
      mockUserRepo as UserRepository,
      mockEnrollmentRepo as EnrollmentRepository,
    )
  })

  describe("getAllEnrollments", () => {
    it("should return paginated enrollment data with ISO timestamps", async () => {
      const enrolledAt = new Date("2026-03-08T09:30:00.000Z")
      mockEnrollmentRepo.getAllEnrollmentsFiltered!.mockResolvedValue({
        data: [
          {
            id: 1,
            studentId: 10,
            studentFirstName: "Ana",
            studentLastName: "Santos",
            studentEmail: "ana@example.com",
            studentAvatarUrl: null,
            studentIsActive: true,
            classId: 20,
            className: "Programming 1",
            classCode: "PROG101",
            classIsActive: true,
            teacherId: 30,
            teacherName: "Teacher Name   ",
            teacherAvatarUrl: null,
            semester: 1,
            academicYear: "2025-2026",
            enrolledAt,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      })

      const result = await adminEnrollmentService.getAllEnrollments({
        page: 1,
        limit: 20,
      })

      expect(mockEnrollmentRepo.getAllEnrollmentsFiltered).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      })
      expect(result.data[0]?.teacherName).toBe("Teacher Name")
      expect(result.data[0]?.enrolledAt).toBe(enrolledAt.toISOString())
    })
  })

  describe("addStudentToClass", () => {
    it("should reject enrollment into archived classes", async () => {
      mockClassRepo.getClassById!.mockResolvedValue(
        createMockClass({ isActive: false }),
      )

      await expect(adminEnrollmentService.addStudentToClass(1, 1)).rejects.toThrow(
        ClassInactiveError,
      )
    })

    it("should reject when the student is already enrolled", async () => {
      mockClassRepo.getClassById!.mockResolvedValue(createMockClass())
      mockUserRepo.getUserById!.mockResolvedValue(
        createMockUser({ id: 1, isActive: true }),
      )
      mockEnrollmentRepo.isEnrolled!.mockResolvedValue(true)

      await expect(adminEnrollmentService.addStudentToClass(1, 1)).rejects.toThrow(
        AlreadyEnrolledError,
      )
    })
  })

  describe("transferStudent", () => {
    it("should transfer the student within a transaction", async () => {
      mockClassRepo.getClassById!
        .mockResolvedValueOnce(createMockClass({ id: 10 }))
        .mockResolvedValueOnce(createMockClass({ id: 20 }))
      mockUserRepo.getUserById!.mockResolvedValue(
        createMockUser({ id: 5, isActive: true }),
      )
      mockEnrollmentRepo.isEnrolled!
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
      mockEnrollmentRepoWithContext.unenrollStudent!.mockResolvedValue(true)
      mockEnrollmentRepoWithContext.enrollStudent!.mockResolvedValue({
        id: 99,
        studentId: 5,
        classId: 20,
        enrolledAt: new Date(),
      })

      await adminEnrollmentService.transferStudent({
        studentId: 5,
        fromClassId: 10,
        toClassId: 20,
      })

      expect(withTransactionMock).toHaveBeenCalledOnce()
      expect(mockEnrollmentRepo.withContext).toHaveBeenCalledOnce()
      expect(mockEnrollmentRepoWithContext.unenrollStudent).toHaveBeenCalledWith(
        5,
        10,
      )
      expect(mockEnrollmentRepoWithContext.enrollStudent).toHaveBeenCalledWith(
        5,
        20,
      )
    })

    it("should reject transfers that keep the same class", async () => {
      await expect(
        adminEnrollmentService.transferStudent({
          studentId: 5,
          fromClassId: 10,
          toClassId: 10,
        }),
      ).rejects.toThrow(BadRequestError)
    })

    it("should reject transfers when the student is not enrolled in the source class", async () => {
      mockClassRepo.getClassById!
        .mockResolvedValueOnce(createMockClass({ id: 10 }))
        .mockResolvedValueOnce(createMockClass({ id: 20 }))
      mockUserRepo.getUserById!.mockResolvedValue(
        createMockUser({ id: 5, isActive: true }),
      )
      mockEnrollmentRepo.isEnrolled!
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)

      await expect(
        adminEnrollmentService.transferStudent({
          studentId: 5,
          fromClassId: 10,
          toClassId: 20,
        }),
      ).rejects.toThrow(StudentNotInClassError)
    })

    it("should reject transfers to archived classes", async () => {
      mockClassRepo.getClassById!
        .mockResolvedValueOnce(createMockClass({ id: 10 }))
        .mockResolvedValueOnce(createMockClass({ id: 20, isActive: false }))
      mockUserRepo.getUserById!.mockResolvedValue(
        createMockUser({ id: 5, isActive: true }),
      )
      mockEnrollmentRepo.isEnrolled!
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)

      await expect(
        adminEnrollmentService.transferStudent({
          studentId: 5,
          fromClassId: 10,
          toClassId: 20,
        }),
      ).rejects.toThrow(ClassInactiveError)
    })
  })

  describe("getClassStudents", () => {
    it("should return enrolled students with ISO timestamps", async () => {
      const student = createMockUser({ id: 7, isActive: true })
      const teacher = createMockTeacher()
      mockClassRepo.getClassById!.mockResolvedValue(createMockClass({ teacherId: teacher.id }))
      mockEnrollmentRepo.getEnrolledStudentsWithInfo!.mockResolvedValue([
        {
          user: student,
          enrolledAt: new Date("2026-03-08T10:00:00.000Z"),
        },
      ])

      const result = await adminEnrollmentService.getClassStudents(1)

      expect(result[0]?.id).toBe(7)
      expect(result[0]?.enrolledAt).toBe("2026-03-08T10:00:00.000Z")
    })
  })
})


