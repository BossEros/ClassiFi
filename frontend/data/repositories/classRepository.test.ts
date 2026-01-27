import { describe, it, expect, vi, beforeEach } from "vitest"

import * as classRepository from "./classRepository"
import { apiClient } from "@/data/api/apiClient"
import type { ISODateString } from "@/shared/types/class"

// Mock the apiClient module
vi.mock("@/data/api/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

// Helper to create ISO date string
const toISO = (date: Date): ISODateString => date.toISOString() as ISODateString

describe("classRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // createNewClass Tests
  // ============================================================================

  describe("createNewClass", () => {
    const mockRequest = {
      teacherId: 1,
      className: "Test Class",
      classCode: "TEST123",
      description: "A test class",
      yearLevel: 1 as const,
      semester: 1 as const,
      academicYear: "2024-2025",
      schedule: {
        days: ["monday" as const],
        startTime: "09:00",
        endTime: "10:00",
      },
    }

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

    it("returns the created class on success", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { success: true, class: mockClass },
        status: 201,
      })

      const result = await classRepository.createNewClass(mockRequest)

      expect(apiClient.post).toHaveBeenCalledWith("/classes", mockRequest)
      expect(result).toEqual(mockClass)
    })

    it("throws error when API returns error", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        error: "Validation failed",
        status: 400,
      })

      await expect(classRepository.createNewClass(mockRequest)).rejects.toThrow(
        "Validation failed",
      )
    })

    it("throws error when response is not successful", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { success: false, message: "Class code already exists" },
        status: 409,
      })

      await expect(classRepository.createNewClass(mockRequest)).rejects.toThrow(
        "Class code already exists",
      )
    })

    it("throws default error when no message provided", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { success: false },
        status: 500,
      })

      await expect(classRepository.createNewClass(mockRequest)).rejects.toThrow(
        "Failed to create class",
      )
    })
  })

  // ============================================================================
  // generateUniqueClassCode Tests
  // ============================================================================

  describe("generateUniqueClassCode", () => {
    it("returns the generated code on success", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, code: "ABC123" },
        status: 200,
      })

      const result = await classRepository.generateUniqueClassCode()

      expect(apiClient.get).toHaveBeenCalledWith("/classes/generate-code")
      expect(result).toBe("ABC123")
    })

    it("throws error when API returns error", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Rate limited",
        status: 429,
      })

      await expect(classRepository.generateUniqueClassCode()).rejects.toThrow(
        "Rate limited",
      )
    })

    it("throws error when response is not successful", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: false, message: "Code generation failed" },
        status: 500,
      })

      await expect(classRepository.generateUniqueClassCode()).rejects.toThrow(
        "Code generation failed",
      )
    })

    it("throws default error when no message provided", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: false },
        status: 500,
      })

      await expect(classRepository.generateUniqueClassCode()).rejects.toThrow(
        "Failed to generate class code",
      )
    })
  })

  // ============================================================================
  // getAllClassesForTeacherId Tests
  // ============================================================================

  describe("getAllClassesForTeacherId", () => {
    const mockClasses = [
      { id: 1, className: "Class 1" },
      { id: 2, className: "Class 2" },
    ]

    it("fetches all classes for a teacher", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, classes: mockClasses },
        status: 200,
      })

      const result = await classRepository.getAllClassesForTeacherId(1)

      expect(apiClient.get).toHaveBeenCalledWith("/classes/teacher/1")
      expect(result).toEqual(mockClasses)
    })

    it("includes activeOnly query parameter when provided", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, classes: mockClasses },
        status: 200,
      })

      await classRepository.getAllClassesForTeacherId(1, true)

      expect(apiClient.get).toHaveBeenCalledWith(
        "/classes/teacher/1?activeOnly=true",
      )
    })

    it("includes activeOnly=false when explicitly set", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, classes: [] },
        status: 200,
      })

      await classRepository.getAllClassesForTeacherId(1, false)

      expect(apiClient.get).toHaveBeenCalledWith(
        "/classes/teacher/1?activeOnly=false",
      )
    })

    it("throws error when API fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Unauthorized",
        status: 401,
      })

      await expect(
        classRepository.getAllClassesForTeacherId(1),
      ).rejects.toThrow("Unauthorized")
    })
  })

  // ============================================================================
  // getClassDetailsById Tests
  // ============================================================================

  describe("getClassDetailsById", () => {
    const mockClass = { id: 1, className: "Test Class" }

    it("fetches a class by ID", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, class: mockClass },
        status: 200,
      })

      const result = await classRepository.getClassDetailsById(1)

      expect(apiClient.get).toHaveBeenCalledWith("/classes/1")
      expect(result).toEqual(mockClass)
    })

    it("includes teacherId when provided", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, class: mockClass },
        status: 200,
      })

      await classRepository.getClassDetailsById(1, 5)

      expect(apiClient.get).toHaveBeenCalledWith("/classes/1?teacherId=5")
    })

    it("throws error when class not found", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: false, message: "Class not found" },
        status: 404,
      })

      await expect(classRepository.getClassDetailsById(999)).rejects.toThrow(
        "Class not found",
      )
    })
  })

  // ============================================================================
  // getAllAssignmentsForClassId Tests
  // ============================================================================

  describe("getAllAssignmentsForClassId", () => {
    const mockAssignments = [
      { id: 1, assignmentName: "Assignment 1" },
      { id: 2, assignmentName: "Assignment 2" },
    ]

    it("fetches all assignments for a class", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, assignments: mockAssignments },
        status: 200,
      })

      const result = await classRepository.getAllAssignmentsForClassId(1)

      expect(apiClient.get).toHaveBeenCalledWith("/classes/1/assignments")
      expect(result).toEqual(mockAssignments)
    })

    it("returns empty array when no assignments", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, assignments: [] },
        status: 200,
      })

      const result = await classRepository.getAllAssignmentsForClassId(1)

      expect(result).toEqual([])
    })

    it("throws error when API fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Server error",
        status: 500,
      })

      await expect(
        classRepository.getAllAssignmentsForClassId(1),
      ).rejects.toThrow("Server error")
    })
  })

  // ============================================================================
  // getAllEnrolledStudentsForClassId Tests
  // ============================================================================

  describe("getAllEnrolledStudentsForClassId", () => {
    const mockStudents = [
      { id: 1, firstName: "John", lastName: "Doe" },
      { id: 2, firstName: "Jane", lastName: "Smith" },
    ]

    it("fetches all students for a class", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, students: mockStudents },
        status: 200,
      })

      const result = await classRepository.getAllEnrolledStudentsForClassId(1)

      expect(apiClient.get).toHaveBeenCalledWith("/classes/1/students")
      expect(result).toEqual(mockStudents)
    })

    it("returns empty array when no students enrolled", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, students: [] },
        status: 200,
      })

      const result = await classRepository.getAllEnrolledStudentsForClassId(1)

      expect(result).toEqual([])
    })

    it("throws error when API fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Class not found",
        status: 404,
      })

      await expect(
        classRepository.getAllEnrolledStudentsForClassId(999),
      ).rejects.toThrow("Class not found")
    })

    it("throws default error when response is not successful", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: false },
        status: 500,
      })

      await expect(
        classRepository.getAllEnrolledStudentsForClassId(1),
      ).rejects.toThrow("Failed to fetch students")
    })
  })

  // ============================================================================
  // deleteClassByIdForTeacher Tests
  // ============================================================================

  describe("deleteClassByIdForTeacher", () => {
    it("deletes a class successfully", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        data: { success: true },
        status: 200,
      })

      await expect(
        classRepository.deleteClassByIdForTeacher(1, 5),
      ).resolves.toBeUndefined()

      expect(apiClient.delete).toHaveBeenCalledWith("/classes/1", {
        teacherId: 5,
      })
    })

    it("throws error when deletion fails", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        data: { success: false, message: "Cannot delete class with students" },
        status: 400,
      })

      await expect(
        classRepository.deleteClassByIdForTeacher(1, 5),
      ).rejects.toThrow("Cannot delete class with students")
    })
  })

  // ============================================================================
  // updateClassDetailsById Tests
  // ============================================================================

  describe("updateClassDetailsById", () => {
    const mockUpdateRequest = { teacherId: 1, className: "Updated Class Name" }
    const mockUpdatedClass = { id: 1, className: "Updated Class Name" }

    it("updates a class successfully", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({
        data: { success: true, classInfo: mockUpdatedClass },
        status: 200,
      })

      const result = await classRepository.updateClassDetailsById(
        1,
        mockUpdateRequest,
      )

      expect(apiClient.put).toHaveBeenCalledWith(
        "/classes/1",
        mockUpdateRequest,
      )
      expect(result).toEqual(mockUpdatedClass)
    })

    it("throws error when update fails", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({
        error: "Validation error",
        status: 400,
      })

      await expect(
        classRepository.updateClassDetailsById(1, mockUpdateRequest),
      ).rejects.toThrow("Validation error")
    })
  })

  // ============================================================================
  // ============================================================================
  // unenrollStudentFromClassByTeacher Tests
  // ============================================================================

  describe("unenrollStudentFromClassByTeacher", () => {
    it("removes a student from a class successfully", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        data: { success: true },
        status: 200,
      })

      await expect(
        classRepository.unenrollStudentFromClassByTeacher(1, 10, 5),
      ).resolves.toBeUndefined()

      expect(apiClient.delete).toHaveBeenCalledWith(
        "/classes/1/students/10?teacherId=5",
      )
    })

    it("throws error when removal fails", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        data: { success: false, message: "Student not found in class" },
        status: 404,
      })

      await expect(
        classRepository.unenrollStudentFromClassByTeacher(1, 999, 5),
      ).rejects.toThrow("Student not found in class")
    })
  })
})
