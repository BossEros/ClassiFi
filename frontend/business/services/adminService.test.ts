import { describe, it, expect, vi, beforeEach } from "vitest";

import * as adminService from "./adminService";
import * as adminRepository from "@/data/repositories/adminRepository";
import * as authValidation from "@/business/validation/authValidation";
import type { AdminUser, AdminClass } from "@/data/api/types";

// Mock dependencies
vi.mock("@/data/repositories/adminRepository");
vi.mock("@/business/validation/authValidation");

// Local Factories (or import if available)
const createMockAdminUser = (overrides?: Partial<AdminUser>): AdminUser => ({
  id: 1,
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  role: "student",
  avatarUrl: null,
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z",
  ...overrides,
});

const createMockAdminClass = (overrides?: Partial<AdminClass>): AdminClass => ({
  id: 1,
  className: "Test Class",
  classCode: "ABC1234",
  teacherId: 2,
  teacherName: "Teacher User",
  yearLevel: 10,
  semester: 1,
  academicYear: "2024-2025",
  schedule: {
    days: ["monday"],
    startTime: "09:00",
    endTime: "10:30",
  },
  description: null,
  isActive: true,
  studentCount: 25,
  createdAt: "2024-01-01T00:00:00Z",
  ...overrides,
});

describe("adminService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // User Management Tests
  // ============================================================================

  describe("getUserById", () => {
    it("fetches user successfully", async () => {
      const mockUser = createMockAdminUser();
      vi.mocked(adminRepository.getUserById).mockResolvedValue({
        success: true,
        user: mockUser as any,
      });

      const result = await adminService.getUserById(1);

      expect(adminRepository.getUserById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    it("throws error when user not found", async () => {
      vi.mocked(adminRepository.getUserById).mockResolvedValue({
        success: false,
        user: null as any,
      });

      await expect(adminService.getUserById(1)).rejects.toThrow(
        "User with ID 1 not found",
      );
    });
  });

  describe("createUser", () => {
    const createData = {
      email: "new@example.com",
      password: "password123",
      firstName: "New",
      lastName: "User",
      role: "student" as const,
    };

    it("creates user successfully when validation passes", async () => {
      vi.mocked(authValidation.validateEmail).mockReturnValue(null);
      vi.mocked(authValidation.validateRole).mockReturnValue(null);
      const newUser = createMockAdminUser(createData);
      vi.mocked(adminRepository.createUser).mockResolvedValue({
        success: true,
        user: newUser as any,
      });

      const result = await adminService.createUser(createData);

      expect(authValidation.validateEmail).toHaveBeenCalledWith(
        createData.email,
      );
      expect(authValidation.validateRole).toHaveBeenCalledWith(createData.role);
      expect(adminRepository.createUser).toHaveBeenCalledWith(createData);
      expect(result).toEqual(newUser);
    });

    it("throws error when email validation fails", async () => {
      vi.mocked(authValidation.validateEmail).mockReturnValue("Invalid email");

      await expect(adminService.createUser(createData)).rejects.toThrow(
        "Invalid email",
      );

      expect(adminRepository.createUser).not.toHaveBeenCalled();
    });

    it("throws error when role validation fails", async () => {
      vi.mocked(authValidation.validateEmail).mockReturnValue(null);
      vi.mocked(authValidation.validateRole).mockReturnValue("Invalid role");

      await expect(adminService.createUser(createData)).rejects.toThrow(
        "Invalid role",
      );

      expect(adminRepository.createUser).not.toHaveBeenCalled();
    });
  });

  describe("updateUserRole", () => {
    it("updates role successfully", async () => {
      const updatedUser = createMockAdminUser({ role: "teacher" });
      vi.mocked(authValidation.validateRole).mockReturnValue(null);
      vi.mocked(adminRepository.updateUserRole).mockResolvedValue({
        success: true,
        user: updatedUser as any,
      });

      const result = await adminService.updateUserRole(1, "teacher");

      expect(adminRepository.updateUserRole).toHaveBeenCalledWith(1, "teacher");
      expect(result).toEqual(updatedUser);
    });

    it("throws error when update fails", async () => {
      vi.mocked(authValidation.validateRole).mockReturnValue(null);
      vi.mocked(adminRepository.updateUserRole).mockResolvedValue({
        success: false,
        user: null as any,
      });

      await expect(adminService.updateUserRole(1, "teacher")).rejects.toThrow(
        "Failed to update role for user 1",
      );
    });
  });

  describe("toggleUserStatus", () => {
    it("toggles status successfully", async () => {
      const updatedUser = createMockAdminUser({ isActive: false });
      vi.mocked(adminRepository.toggleUserStatus).mockResolvedValue({
        success: true,
        user: updatedUser as any,
      });

      const result = await adminService.toggleUserStatus(1);

      expect(adminRepository.toggleUserStatus).toHaveBeenCalledWith(1);
      expect(result).toEqual(updatedUser);
    });
  });

  // ============================================================================
  // Class Management Tests
  // ============================================================================

  describe("getClassById", () => {
    it("fetches class successfully", async () => {
      const mockClass = createMockAdminClass();
      vi.mocked(adminRepository.getClassById).mockResolvedValue({
        success: true,
        class: mockClass as any,
      });

      const result = await adminService.getClassById(1);

      expect(adminRepository.getClassById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockClass);
    });

    it("throws error when class not found", async () => {
      vi.mocked(adminRepository.getClassById).mockResolvedValue({
        success: false,
        class: null as any,
      });

      await expect(adminService.getClassById(1)).rejects.toThrow(
        "getClassById: class with ID 1 not found",
      );
    });
  });

  describe("createClass", () => {
    const classData = {
      name: "Math 101",
      code: "MATH101",
      teacherId: 2,
      yearLevel: 10,
      semester: 1,
      academicYear: "2024-2025",
      schedule: { days: ["monday"], startTime: "09:00", endTime: "10:00" },
    };

    it("creates class successfully", async () => {
      const newClass = createMockAdminClass();
      vi.mocked(adminRepository.createClass).mockResolvedValue({
        success: true,
        class: newClass as any,
      });

      const result = await adminService.createClass(classData as any);

      expect(adminRepository.createClass).toHaveBeenCalledWith(classData);
      expect(result).toEqual(newClass);
    });

    it("throws error when creation fails", async () => {
      vi.mocked(adminRepository.createClass).mockResolvedValue({
        success: false,
        class: null as any,
      });

      await expect(adminService.createClass(classData as any)).rejects.toThrow(
        "createClass: failed to create class",
      );
    });
  });

  // ============================================================================
  // Student Enrollment Tests
  // ============================================================================

  describe("getClassStudents", () => {
    it("fetches and transforms students", async () => {
      const mockStudents = [
        { id: 1, firstName: "John", lastName: "Doe", email: "john@test.com" },
      ];
      vi.mocked(adminRepository.getClassStudents).mockResolvedValue({
        success: true,
        students: mockStudents as any,
      });

      const result = await adminService.getClassStudents(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockStudents[0],
        fullName: "John Doe",
      });
    });

    it("returns empty array when no students found", async () => {
      vi.mocked(adminRepository.getClassStudents).mockResolvedValue({
        success: true,
        students: null as any,
      });

      const result = await adminService.getClassStudents(1);

      expect(result).toEqual([]);
    });
  });

  // ============================================================================
  // Aggregation Tests
  // ============================================================================

  describe("getAdminClassDetailData", () => {
    it("aggregates data from multiple sources", async () => {
      const mockClass = createMockAdminClass();
      const mockAssignments = [{ id: 1, title: "HW1" }];
      const mockStudents = [{ id: 1, firstName: "John", lastName: "Doe" }];

      vi.mocked(adminRepository.getClassById).mockResolvedValue({
        success: true,
        class: mockClass as any,
      });
      vi.mocked(adminRepository.getClassAssignments).mockResolvedValue({
        success: true,
        assignments: mockAssignments as any,
      });
      vi.mocked(adminRepository.getClassStudents).mockResolvedValue({
        success: true,
        students: mockStudents as any,
      });

      const result = await adminService.getAdminClassDetailData(1);

      expect(result.classInfo).toEqual(mockClass);
      expect(result.assignments).toEqual(mockAssignments);
      expect(result.students).toHaveLength(1);
      expect(result.students[0].fullName).toBe("John Doe"); // Verify transformation happened via getClassStudents
    });
  });
});
