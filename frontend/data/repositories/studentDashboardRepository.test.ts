import { describe, it, expect, vi, beforeEach } from "vitest";

import * as studentDashboardRepository from "@/data/repositories/studentDashboardRepository";
import { apiClient } from "@/data/api/apiClient";
// Mock the apiClient module
vi.mock("@/data/api/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("studentDashboardRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Fixtures
  // ============================================================================

  const mockClass = {
    id: 1,
    teacherId: 2,
    className: "Introduction to Programming",
    classCode: "CS101",
    description: "Learn programming basics",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  };

  const mockAssignment = {
    id: 1,
    classId: 1,
    assignmentName: "Hello World",
    deadline: "2024-12-31T23:59:59Z",
    programmingLanguage: "python",
    className: "Introduction to Programming",
  };

  // ============================================================================
  // getDashboardData Tests
  // ============================================================================

  describe("getDashboardData", () => {
    const mockDashboardResponse = {
      success: true,
      enrolledClasses: [mockClass],
      pendingAssignments: [mockAssignment],
      totalEnrolledClasses: 1,
      totalPendingAssignments: 1,
    };

    it("fetches complete dashboard data", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockDashboardResponse,
        status: 200,
      });

      const result = await studentDashboardRepository.getDashboardData(1);

      expect(apiClient.get).toHaveBeenCalledWith(
        "/student/dashboard/1?enrolledClassesLimit=12&pendingAssignmentsLimit=10",
      );
      expect(result).toEqual(mockDashboardResponse);
    });

    it("passes custom limits to API", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockDashboardResponse,
        status: 200,
      });

      await studentDashboardRepository.getDashboardData(1, 20, 15);

      expect(apiClient.get).toHaveBeenCalledWith(
        "/student/dashboard/1?enrolledClassesLimit=20&pendingAssignmentsLimit=15",
      );
    });

    it("throws error when API returns error", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Student not found",
        status: 404,
      });

      await expect(
        studentDashboardRepository.getDashboardData(999),
      ).rejects.toThrow("Student not found");
    });

    it("throws default error when no data returned", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: undefined,
        status: 200,
      });

      await expect(
        studentDashboardRepository.getDashboardData(1),
      ).rejects.toThrow("Failed to fetch dashboard data");
    });
  });

  // ============================================================================
  // getEnrolledClasses Tests
  // ============================================================================

  describe("getEnrolledClasses", () => {
    const mockResponse = {
      success: true,
      classes: [mockClass],
    };

    it("fetches enrolled classes for a student", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockResponse,
        status: 200,
      });

      const result = await studentDashboardRepository.getEnrolledClasses(1);

      expect(apiClient.get).toHaveBeenCalledWith(
        "/student/dashboard/1/classes",
      );
      expect(result).toEqual(mockResponse);
    });

    it("passes limit parameter when provided", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockResponse,
        status: 200,
      });

      await studentDashboardRepository.getEnrolledClasses(1, 5);

      expect(apiClient.get).toHaveBeenCalledWith(
        "/student/dashboard/1/classes?limit=5",
      );
    });

    it("throws error when API fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Unauthorized",
        status: 401,
      });

      await expect(
        studentDashboardRepository.getEnrolledClasses(1),
      ).rejects.toThrow("Unauthorized");
    });

    it("throws default error when no data returned", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: undefined,
        status: 200,
      });

      await expect(
        studentDashboardRepository.getEnrolledClasses(1),
      ).rejects.toThrow("Failed to fetch enrolled classes");
    });
  });

  // ============================================================================
  // getPendingAssignments Tests
  // ============================================================================

  describe("getPendingAssignments", () => {
    const mockResponse = {
      success: true,
      assignments: [mockAssignment],
    };

    it("fetches pending assignments with default limit", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockResponse,
        status: 200,
      });

      const result = await studentDashboardRepository.getPendingAssignments(1);

      expect(apiClient.get).toHaveBeenCalledWith(
        "/student/dashboard/1/assignments?limit=10",
      );
      expect(result).toEqual(mockResponse);
    });

    it("passes custom limit to API", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockResponse,
        status: 200,
      });

      await studentDashboardRepository.getPendingAssignments(1, 20);

      expect(apiClient.get).toHaveBeenCalledWith(
        "/student/dashboard/1/assignments?limit=20",
      );
    });

    it("throws error when API fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Server error",
        status: 500,
      });

      await expect(
        studentDashboardRepository.getPendingAssignments(1),
      ).rejects.toThrow("Server error");
    });

    it("throws default error when no data returned", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: undefined,
        status: 200,
      });

      await expect(
        studentDashboardRepository.getPendingAssignments(1),
      ).rejects.toThrow("Failed to fetch pending assignments");
    });
  });

  // ============================================================================
  // joinClass Tests
  // ============================================================================

  describe("joinClass", () => {
    const mockJoinResponse = {
      success: true,
      message: "Successfully joined class",
      class: mockClass,
    };

    it("joins a class with valid code", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockJoinResponse,
        status: 200,
      });

      const result = await studentDashboardRepository.joinClass(1, "CS101");

      expect(apiClient.post).toHaveBeenCalledWith("/student/dashboard/join", {
        studentId: 1,
        classCode: "CS101",
      });
      expect(result).toEqual(mockJoinResponse);
    });

    it("throws error for invalid class code", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        error: "Class not found",
        status: 404,
      });

      await expect(
        studentDashboardRepository.joinClass(1, "INVALID"),
      ).rejects.toThrow("Class not found");
    });

    it("throws error when already enrolled", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        error: "Already enrolled in this class",
        status: 409,
      });

      await expect(
        studentDashboardRepository.joinClass(1, "CS101"),
      ).rejects.toThrow("Already enrolled in this class");
    });

    it("throws default error when no data returned", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: undefined,
        status: 200,
      });

      await expect(
        studentDashboardRepository.joinClass(1, "CS101"),
      ).rejects.toThrow("Failed to join class");
    });
  });

  // ============================================================================
  // leaveClass Tests
  // ============================================================================

  describe("leaveClass", () => {
    const mockLeaveResponse = {
      success: true,
      message: "Successfully left the class",
    };

    it("leaves a class successfully", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockLeaveResponse,
        status: 200,
      });

      const result = await studentDashboardRepository.leaveClass(1, 1);

      expect(apiClient.post).toHaveBeenCalledWith("/student/dashboard/leave", {
        studentId: 1,
        classId: 1,
      });
      expect(result).toEqual(mockLeaveResponse);
    });

    it("throws error when not enrolled in class", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        error: "Not enrolled in this class",
        status: 400,
      });

      await expect(
        studentDashboardRepository.leaveClass(1, 999),
      ).rejects.toThrow("Not enrolled in this class");
    });

    it("throws error on server failure", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        error: "Internal server error",
        status: 500,
      });

      await expect(studentDashboardRepository.leaveClass(1, 1)).rejects.toThrow(
        "Internal server error",
      );
    });

    it("throws default error when no data returned", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: undefined,
        status: 200,
      });

      await expect(studentDashboardRepository.leaveClass(1, 1)).rejects.toThrow(
        "Failed to leave class",
      );
    });
  });
});
