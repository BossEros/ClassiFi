import { describe, it, expect, vi, beforeEach } from "vitest"

import * as classService from "@/business/services/classService"
import * as classRepository from "@/data/repositories/classRepository"
import * as assignmentRepository from "@/data/repositories/assignmentRepository"
import type { ISODateString } from "@/shared/types/class"

// Mock the repositories
vi.mock("@/data/repositories/classRepository")
vi.mock("@/data/repositories/assignmentRepository")

// Helper to create ISO date string
const toISO = (date: Date): ISODateString => date.toISOString() as ISODateString

describe("classService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // Fixtures
  // ============================================================================

  const mockClass = {
    id: 1,
    teacherId: 1,
    className: "Test Class",
    classCode: "TEST123",
    description: "A test class",
    isActive: true,
    createdAt: toISO(new Date()),
    yearLevel: 1,
    semester: 1,
    academicYear: "2024-2025",
    schedule: {
      days: ["monday" as const],
      startTime: "09:00",
      endTime: "10:00",
    },
  }

  const mockAssignment = {
    id: 1,
    classId: 1,
    assignmentName: "Test Assignment",
    deadline: toISO(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    programmingLanguage: "python",
    maxGrade: 100,
  }

  const mockStudent = {
    id: 1,
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    avatarUrl: null,
    enrolledAt: toISO(new Date()),
  }

  // ============================================================================
  // createClass Tests
  // ============================================================================

  describe("createClass", () => {
    const validCreateRequest = {
      teacherId: 1,
      className: "New Class",
      classCode: "NEW123",
      description: "A new class",
      yearLevel: 1 as const,
      semester: 1 as const,
      academicYear: "2024-2025",
      schedule: {
        days: ["monday" as const],
        startTime: "09:00",
        endTime: "10:00",
      },
    }

    it("creates a class with valid data", async () => {
      vi.mocked(classRepository.createNewClass).mockResolvedValue(mockClass)

      const result = await classService.createClass(validCreateRequest)

      expect(classRepository.createNewClass).toHaveBeenCalledWith(
        validCreateRequest,
      )
      expect(result).toEqual(mockClass)
    })

    it("throws error for invalid teacher ID", async () => {
      const invalidRequest = { ...validCreateRequest, teacherId: 0 }

      await expect(classService.createClass(invalidRequest)).rejects.toThrow(
        "Invalid teacher ID",
      )
      expect(classRepository.createNewClass).not.toHaveBeenCalled()
    })

    it("throws error for empty class name", async () => {
      const invalidRequest = { ...validCreateRequest, className: "" }

      await expect(classService.createClass(invalidRequest)).rejects.toThrow(
        "Class name is required",
      )
    })

    it("throws error for description exceeding max length", async () => {
      const invalidRequest = {
        ...validCreateRequest,
        description: "A".repeat(1001),
      }

      await expect(classService.createClass(invalidRequest)).rejects.toThrow(
        "Description must not exceed 1000 characters",
      )
    })

    it("throws error for invalid year level", async () => {
      const invalidRequest = {
        ...validCreateRequest,
        yearLevel: 0 as unknown as 1 | 2 | 3 | 4,
      }

      await expect(classService.createClass(invalidRequest)).rejects.toThrow(
        "Year level must be 1, 2, 3, or 4",
      )
    })
  })

  // ============================================================================
  // generateClassCode Tests
  // ============================================================================

  describe("generateClassCode", () => {
    it("returns a generated class code", async () => {
      vi.mocked(classRepository.generateUniqueClassCode).mockResolvedValue(
        "ABC123",
      )

      const result = await classService.generateClassCode()

      expect(classRepository.generateUniqueClassCode).toHaveBeenCalled()
      expect(result).toBe("ABC123")
    })
  })

  // ============================================================================
  // getAllClasses Tests
  // ============================================================================

  describe("getAllClasses", () => {
    it("fetches all classes for a teacher", async () => {
      vi.mocked(classRepository.getAllClassesForTeacherId).mockResolvedValue([
        mockClass,
      ])

      const result = await classService.getAllClasses(1)

      expect(classRepository.getAllClassesForTeacherId).toHaveBeenCalledWith(
        1,
        undefined,
      )
      expect(result).toHaveLength(1)
    })

    it("passes activeOnly filter to repository", async () => {
      vi.mocked(classRepository.getAllClassesForTeacherId).mockResolvedValue([])

      await classService.getAllClasses(1, true)

      expect(classRepository.getAllClassesForTeacherId).toHaveBeenCalledWith(
        1,
        true,
      )
    })

    it("throws error for invalid teacher ID", async () => {
      await expect(classService.getAllClasses(0)).rejects.toThrow(
        "Invalid teacher ID",
      )
    })
  })

  // ============================================================================
  // getClassById Tests
  // ============================================================================

  describe("getClassById", () => {
    it("fetches a class by ID", async () => {
      vi.mocked(classRepository.getClassDetailsById).mockResolvedValue(
        mockClass,
      )

      const result = await classService.getClassById(1)

      expect(classRepository.getClassDetailsById).toHaveBeenCalledWith(
        1,
        undefined,
      )
      expect(result).toEqual(mockClass)
    })

    it("passes teacherId when provided", async () => {
      vi.mocked(classRepository.getClassDetailsById).mockResolvedValue(
        mockClass,
      )

      await classService.getClassById(1, 5)

      expect(classRepository.getClassDetailsById).toHaveBeenCalledWith(1, 5)
    })

    it("throws error for invalid class ID", async () => {
      await expect(classService.getClassById(0)).rejects.toThrow(
        "Invalid class ID",
      )
    })
  })

  // ============================================================================
  // getClassAssignments Tests
  // ============================================================================

  describe("getClassAssignments", () => {
    it("fetches assignments for a class", async () => {
      vi.mocked(classRepository.getAllAssignmentsForClassId).mockResolvedValue([
        mockAssignment,
      ])

      const result = await classService.getClassAssignments(1)

      expect(classRepository.getAllAssignmentsForClassId).toHaveBeenCalledWith(
        1,
      )
      expect(result).toHaveLength(1)
    })

    it("throws error for invalid class ID", async () => {
      await expect(classService.getClassAssignments(-1)).rejects.toThrow(
        "Invalid class ID",
      )
    })
  })

  // ============================================================================
  // getClassStudents Tests
  // ============================================================================

  describe("getClassStudents", () => {
    it("fetches students with fullName added", async () => {
      vi.mocked(
        classRepository.getAllEnrolledStudentsForClassId,
      ).mockResolvedValue([mockStudent])

      const result = await classService.getClassStudents(1)

      expect(result).toHaveLength(1)
      expect(result[0].fullName).toBe("John Doe")
    })

    it("handles empty student list", async () => {
      vi.mocked(
        classRepository.getAllEnrolledStudentsForClassId,
      ).mockResolvedValue([])

      const result = await classService.getClassStudents(1)

      expect(result).toEqual([])
    })

    it("throws error for invalid class ID", async () => {
      await expect(classService.getClassStudents(0)).rejects.toThrow(
        "Invalid class ID",
      )
    })
  })

  // ============================================================================
  // getClassDetailData Tests
  // ============================================================================

  describe("getClassDetailData", () => {
    it("fetches all class details in parallel", async () => {
      vi.mocked(classRepository.getClassDetailsById).mockResolvedValue(
        mockClass,
      )
      vi.mocked(classRepository.getAllAssignmentsForClassId).mockResolvedValue([
        mockAssignment,
      ])
      vi.mocked(
        classRepository.getAllEnrolledStudentsForClassId,
      ).mockResolvedValue([mockStudent])

      const result = await classService.getClassDetailData(1)

      expect(result.classInfo).toEqual(mockClass)
      expect(result.assignments).toHaveLength(1)
      expect(result.students).toHaveLength(1)
      expect(result.students[0].fullName).toBe("John Doe")
    })

    it("throws error for invalid class ID", async () => {
      await expect(classService.getClassDetailData(0)).rejects.toThrow(
        "Invalid class ID",
      )
    })
  })

  // ============================================================================
  // deleteClass Tests
  // ============================================================================

  describe("deleteClass", () => {
    it("deletes a class successfully", async () => {
      vi.mocked(classRepository.deleteClassByIdForTeacher).mockResolvedValue(
        undefined,
      )

      await expect(classService.deleteClass(1, 5)).resolves.toBeUndefined()

      expect(classRepository.deleteClassByIdForTeacher).toHaveBeenCalledWith(
        1,
        5,
      )
    })

    it("throws error for invalid class ID", async () => {
      await expect(classService.deleteClass(0, 5)).rejects.toThrow(
        "Invalid class ID",
      )
    })

    it("throws error for invalid teacher ID", async () => {
      await expect(classService.deleteClass(1, 0)).rejects.toThrow(
        "Invalid teacher ID",
      )
    })
  })

  // ============================================================================
  // updateClass Tests
  // ============================================================================

  describe("updateClass", () => {
    const updateRequest = {
      teacherId: 1,
      className: "Updated Class",
    }

    it("updates a class successfully", async () => {
      const updatedClass = { ...mockClass, className: "Updated Class" }
      vi.mocked(classRepository.updateClassDetailsById).mockResolvedValue(
        updatedClass,
      )

      const result = await classService.updateClass(1, updateRequest)

      expect(result.className).toBe("Updated Class")
    })

    it("trims className and description", async () => {
      vi.mocked(classRepository.updateClassDetailsById).mockResolvedValue(
        mockClass,
      )

      await classService.updateClass(1, {
        teacherId: 1,
        className: "  Trimmed Name  ",
        description: "  Trimmed Description  ",
      })

      expect(classRepository.updateClassDetailsById).toHaveBeenCalledWith(1, {
        teacherId: 1,
        className: "Trimmed Name",
        description: "Trimmed Description",
      })
    })

    it("throws error for invalid class ID", async () => {
      await expect(classService.updateClass(0, updateRequest)).rejects.toThrow(
        "Invalid class ID",
      )
    })
  })

  // ============================================================================
  // deleteAssignment Tests
  // ============================================================================

  describe("deleteAssignment", () => {
    it("deletes an assignment successfully", async () => {
      vi.mocked(
        assignmentRepository.deleteAssignmentByIdForTeacher,
      ).mockResolvedValue(undefined)

      await expect(classService.deleteAssignment(1, 5)).resolves.toBeUndefined()

      expect(
        assignmentRepository.deleteAssignmentByIdForTeacher,
      ).toHaveBeenCalledWith(1, 5)
    })

    it("throws error for invalid assignment ID", async () => {
      await expect(classService.deleteAssignment(0, 5)).rejects.toThrow(
        "Invalid assignment ID",
      )
    })

    it("throws error for invalid teacher ID", async () => {
      await expect(classService.deleteAssignment(1, 0)).rejects.toThrow(
        "Invalid teacher ID",
      )
    })
  })

  // ============================================================================
  // removeStudent Tests
  // ============================================================================

  describe("removeStudent", () => {
    it("removes a student successfully", async () => {
      vi.mocked(
        classRepository.unenrollStudentFromClassByTeacher,
      ).mockResolvedValue(undefined)

      await expect(
        classService.removeStudent(1, 10, 5),
      ).resolves.toBeUndefined()

      expect(
        classRepository.unenrollStudentFromClassByTeacher,
      ).toHaveBeenCalledWith(1, 10, 5)
    })

    it("throws error for invalid class ID", async () => {
      await expect(classService.removeStudent(0, 10, 5)).rejects.toThrow(
        "Invalid class ID",
      )
    })

    it("throws error for invalid student ID", async () => {
      await expect(classService.removeStudent(1, 0, 5)).rejects.toThrow(
        "Invalid student ID",
      )
    })

    it("throws error for invalid teacher ID", async () => {
      await expect(classService.removeStudent(1, 10, 0)).rejects.toThrow(
        "Invalid teacher ID",
      )
    })
  })
})
