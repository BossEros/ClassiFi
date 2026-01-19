import { describe, it, expect, beforeEach, vi } from "vitest";
import { AssignmentService } from "../../src/services/assignment.service.js";
import type { ClassRepository } from "../../src/repositories/class.repository.js";
import type { AssignmentRepository } from "../../src/repositories/assignment.repository.js";
import type { TestCaseRepository } from "../../src/repositories/testCase.repository.js";
import {
  ClassNotFoundError,
  NotClassOwnerError,
  AssignmentNotFoundError,
} from "../../src/shared/errors.js";
import { createMockClass, createMockAssignment } from "../utils/factories.js";

describe("AssignmentService", () => {
  let assignmentService: AssignmentService;
  let mockClassRepo: any;
  let mockAssignmentRepo: any;
  let mockTestCaseRepo: any;

  beforeEach(() => {
    mockClassRepo = {
      getClassById: vi.fn(),
    } as any;

    mockAssignmentRepo = {
      createAssignment: vi.fn(),
      getAssignmentById: vi.fn(),
      getAssignmentsByClassId: vi.fn(),
      updateAssignment: vi.fn(),
      deleteAssignment: vi.fn(),
    } as any;

    mockTestCaseRepo = {
      getByAssignmentId: vi.fn(),
    } as any;

    assignmentService = new AssignmentService(
      mockAssignmentRepo as AssignmentRepository,
      mockClassRepo as ClassRepository,
      mockTestCaseRepo as TestCaseRepository
    );
  });

  // ============================================
  // createAssignment Tests
  // ============================================
  describe("createAssignment", () => {
    const validAssignmentData = {
      assignmentName: "Test Assignment",
      description: "Test description for the assignment",
      programmingLanguage: "python" as const,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      allowResubmission: true,
      maxAttempts: 3,
    };

    it("should create an assignment successfully", async () => {
      const mockClass = createMockClass({ teacherId: 1 });
      const mockAssignment = createMockAssignment({ classId: 1 });

      mockClassRepo.getClassById!.mockResolvedValue(mockClass);
      mockAssignmentRepo.createAssignment!.mockResolvedValue(mockAssignment);

      const result = await assignmentService.createAssignment(
        1,
        1,
        validAssignmentData
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(mockAssignment.id);
      expect(result.assignmentName).toBe(mockAssignment.assignmentName);
      expect(mockAssignmentRepo.createAssignment).toHaveBeenCalledWith({
        classId: 1,
        ...validAssignmentData,
      });
    });

    it("should throw ClassNotFoundError if class does not exist", async () => {
      mockClassRepo.getClassById!.mockResolvedValue(undefined);

      await expect(
        assignmentService.createAssignment(999, 1, validAssignmentData)
      ).rejects.toThrow(ClassNotFoundError);
    });

    it("should throw NotClassOwnerError if teacher is not the class owner", async () => {
      const mockClass = createMockClass({ teacherId: 1 });
      mockClassRepo.getClassById!.mockResolvedValue(mockClass);

      // Teacher ID 999 is different from class owner (1)
      await expect(
        assignmentService.createAssignment(1, 999, validAssignmentData)
      ).rejects.toThrow(NotClassOwnerError);
    });

    it("should create assignment with default allowResubmission", async () => {
      const mockClass = createMockClass({ teacherId: 1 });
      const mockAssignment = createMockAssignment();

      mockClassRepo.getClassById!.mockResolvedValue(mockClass);
      mockAssignmentRepo.createAssignment!.mockResolvedValue(mockAssignment);

      const dataWithoutResubmission = {
        assignmentName: "Test",
        description: "Test description",
        programmingLanguage: "java" as const,
        deadline: new Date(Date.now() + 86400000),
      };

      await assignmentService.createAssignment(1, 1, dataWithoutResubmission);

      expect(mockAssignmentRepo.createAssignment).toHaveBeenCalledWith(
        expect.objectContaining({
          classId: 1,
          assignmentName: "Test",
        })
      );
    });
  });

  // ============================================
  // getClassAssignments Tests
  // ============================================
  describe("getClassAssignments", () => {
    it("should return all assignments for a class", async () => {
      const mockAssignments = [
        createMockAssignment({ id: 1, assignmentName: "Assignment 1" }),
        createMockAssignment({ id: 2, assignmentName: "Assignment 2" }),
        createMockAssignment({ id: 3, assignmentName: "Assignment 3" }),
      ];

      mockAssignmentRepo.getAssignmentsByClassId!.mockResolvedValue(
        mockAssignments
      );

      const result = await assignmentService.getClassAssignments(1);

      expect(result).toHaveLength(3);
      expect(result[0].assignmentName).toBe("Assignment 1");
      expect(result[1].assignmentName).toBe("Assignment 2");
      expect(mockAssignmentRepo.getAssignmentsByClassId).toHaveBeenCalledWith(
        1
      );
    });

    it("should return empty array when class has no assignments", async () => {
      mockAssignmentRepo.getAssignmentsByClassId!.mockResolvedValue([]);

      const result = await assignmentService.getClassAssignments(1);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });

  // ============================================
  // getAssignmentDetails Tests
  // ============================================
  describe("getAssignmentDetails", () => {
    it("should return assignment details with class name", async () => {
      const mockAssignment = createMockAssignment({ id: 1, classId: 1 });
      const mockClass = createMockClass({ id: 1, className: "Test Class" });

      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(mockAssignment);
      mockClassRepo.getClassById!.mockResolvedValue(mockClass);
      const mockTestCases = [{ id: 1, name: "Test 1", isHidden: false }];
      mockTestCaseRepo.getByAssignmentId.mockResolvedValue(mockTestCases);

      const result = await assignmentService.getAssignmentDetails(1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.className).toBe("Test Class");
      expect(result.testCases).toEqual(mockTestCases);
    });

    it("should throw AssignmentNotFoundError if assignment does not exist", async () => {
      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(undefined);

      await expect(assignmentService.getAssignmentDetails(999)).rejects.toThrow(
        AssignmentNotFoundError
      );
    });

    it("should return assignment even if class is null", async () => {
      const mockAssignment = createMockAssignment({ id: 1, classId: 999 });

      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(mockAssignment);
      mockClassRepo.getClassById!.mockResolvedValue(undefined);
      mockTestCaseRepo.getByAssignmentId.mockResolvedValue([]);

      const result = await assignmentService.getAssignmentDetails(1);

      expect(result).toBeDefined();
      expect(result.className).toBeUndefined();
    });
  });

  // ============================================
  // updateAssignment Tests
  // ============================================
  describe("updateAssignment", () => {
    it("should update assignment successfully", async () => {
      const mockAssignment = createMockAssignment({ id: 1, classId: 1 });
      const mockClass = createMockClass({ id: 1, teacherId: 1 });
      const updatedAssignment = {
        ...mockAssignment,
        assignmentName: "Updated Name",
      };

      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(mockAssignment);
      mockClassRepo.getClassById!.mockResolvedValue(mockClass);
      mockAssignmentRepo.updateAssignment!.mockResolvedValue(updatedAssignment);

      const result = await assignmentService.updateAssignment(1, 1, {
        assignmentName: "Updated Name",
      });

      expect(result.assignmentName).toBe("Updated Name");
      expect(mockAssignmentRepo.updateAssignment).toHaveBeenCalledWith(1, {
        assignmentName: "Updated Name",
      });
    });

    it("should throw AssignmentNotFoundError if assignment does not exist", async () => {
      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(undefined);

      await expect(
        assignmentService.updateAssignment(999, 1, { assignmentName: "New" })
      ).rejects.toThrow(AssignmentNotFoundError);
    });

    it("should throw NotClassOwnerError if teacher is not the class owner", async () => {
      const mockAssignment = createMockAssignment({ id: 1, classId: 1 });
      const mockClass = createMockClass({ id: 1, teacherId: 1 });

      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(mockAssignment);
      mockClassRepo.getClassById!.mockResolvedValue(mockClass);

      // Teacher ID 999 is different from class owner (1)
      await expect(
        assignmentService.updateAssignment(1, 999, { assignmentName: "New" })
      ).rejects.toThrow(NotClassOwnerError);
    });

    it("should throw ClassNotFoundError if class is not found during update", async () => {
      const mockAssignment = createMockAssignment({ id: 1, classId: 1 });

      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(mockAssignment);
      mockClassRepo.getClassById!.mockResolvedValue(undefined);

      await expect(
        assignmentService.updateAssignment(1, 1, { assignmentName: "New" })
      ).rejects.toThrow(ClassNotFoundError);
    });

    it("should throw AssignmentNotFoundError if update returns undefined", async () => {
      const mockAssignment = createMockAssignment({ id: 1, classId: 1 });
      const mockClass = createMockClass({ id: 1, teacherId: 1 });

      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(mockAssignment);
      mockClassRepo.getClassById!.mockResolvedValue(mockClass);
      mockAssignmentRepo.updateAssignment!.mockResolvedValue(undefined);

      await expect(
        assignmentService.updateAssignment(1, 1, { assignmentName: "New" })
      ).rejects.toThrow(AssignmentNotFoundError);
    });

    it("should update multiple fields at once", async () => {
      const mockAssignment = createMockAssignment({ id: 1, classId: 1 });
      const mockClass = createMockClass({ id: 1, teacherId: 1 });
      const newDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const updatedData = {
        assignmentName: "Updated",
        description: "New description",
        programmingLanguage: "java" as const,
        deadline: newDeadline,
        allowResubmission: false,
        maxAttempts: 5,
      };
      const updatedAssignment = { ...mockAssignment, ...updatedData };

      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(mockAssignment);
      mockClassRepo.getClassById!.mockResolvedValue(mockClass);
      mockAssignmentRepo.updateAssignment!.mockResolvedValue(updatedAssignment);

      const result = await assignmentService.updateAssignment(
        1,
        1,
        updatedData
      );

      expect(result.assignmentName).toBe("Updated");
      expect(result.description).toBe("New description");
      expect(mockAssignmentRepo.updateAssignment).toHaveBeenCalledWith(
        1,
        updatedData
      );
    });
  });

  // ============================================
  // deleteAssignment Tests
  // ============================================
  describe("deleteAssignment", () => {
    it("should delete assignment successfully", async () => {
      const mockAssignment = createMockAssignment({ id: 1, classId: 1 });
      const mockClass = createMockClass({ id: 1, teacherId: 1 });

      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(mockAssignment);
      mockClassRepo.getClassById!.mockResolvedValue(mockClass);
      mockAssignmentRepo.deleteAssignment!.mockResolvedValue(true);

      await assignmentService.deleteAssignment(1, 1);

      expect(mockAssignmentRepo.deleteAssignment).toHaveBeenCalledWith(1);
    });

    it("should throw AssignmentNotFoundError if assignment does not exist", async () => {
      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(undefined);

      await expect(assignmentService.deleteAssignment(999, 1)).rejects.toThrow(
        AssignmentNotFoundError
      );
    });

    it("should throw NotClassOwnerError if teacher is not the class owner", async () => {
      const mockAssignment = createMockAssignment({ id: 1, classId: 1 });
      const mockClass = createMockClass({ id: 1, teacherId: 1 });

      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(mockAssignment);
      mockClassRepo.getClassById!.mockResolvedValue(mockClass);

      // Teacher ID 999 is different from class owner (1)
      await expect(assignmentService.deleteAssignment(1, 999)).rejects.toThrow(
        NotClassOwnerError
      );
    });

    it("should throw ClassNotFoundError if class is not found during delete", async () => {
      const mockAssignment = createMockAssignment({ id: 1, classId: 1 });

      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(mockAssignment);
      mockClassRepo.getClassById!.mockResolvedValue(undefined);

      await expect(assignmentService.deleteAssignment(1, 1)).rejects.toThrow(
        ClassNotFoundError
      );
    });
  });

  // ============================================
  // getAssignmentById Tests
  // ============================================
  describe("getAssignmentById", () => {
    it("should return assignment DTO when found", async () => {
      const mockAssignment = createMockAssignment({ id: 1 });
      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(mockAssignment);

      const result = await assignmentService.getAssignmentById(1);

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
    });

    it("should return null when assignment not found", async () => {
      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(undefined);

      const result = await assignmentService.getAssignmentById(999);

      expect(result).toBeNull();
    });
  });
});
