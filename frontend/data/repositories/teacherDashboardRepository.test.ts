import { describe, it, expect, vi, beforeEach } from "vitest";

import * as teacherDashboardRepository from "./teacherDashboardRepository";
import { apiClient } from "@/data/api/apiClient";

// Mock the apiClient module
vi.mock("@/data/api/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe("teacherDashboardRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Fixtures
  // ============================================================================

  const mockClass = {
    id: 1,
    teacherId: 1,
    className: "Introduction to Programming",
    classCode: "CS101",
    description: "Learn programming basics",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  };

  const mockTask = {
    id: 1,
    classId: 1,
    assignmentName: "Hello World",
    description: "Write Hello World",
    programmingLanguage: "python",
    deadline: "2024-12-31T23:59:59Z",
    allowResubmission: true,
    isActive: true,
    createdAt: "2024-01-15T00:00:00Z",
    className: "Introduction to Programming",
    submissionCount: 15,
  };

  // ============================================================================
  // getDashboardData Tests
  // ============================================================================

  describe("getDashboardData", () => {
    const mockDashboardResponse = {
      success: true,
      recentClasses: [mockClass],
      pendingTasks: [mockTask],
    };

    it("fetches complete dashboard data", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockDashboardResponse,
        status: 200,
      });

      const result = await teacherDashboardRepository.getDashboardData(1);

      expect(apiClient.get).toHaveBeenCalledWith(
        "/teacher/dashboard/1?recentClassesLimit=12&pendingTasksLimit=10",
      );
      expect(result).toEqual(mockDashboardResponse);
    });

    it("passes custom limits to API", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockDashboardResponse,
        status: 200,
      });

      await teacherDashboardRepository.getDashboardData(1, 20, 15);

      expect(apiClient.get).toHaveBeenCalledWith(
        "/teacher/dashboard/1?recentClassesLimit=20&pendingTasksLimit=15",
      );
    });

    it("throws error when API returns error", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Teacher not found",
        status: 404,
      });

      await expect(
        teacherDashboardRepository.getDashboardData(999),
      ).rejects.toThrow("Teacher not found");
    });

    it("throws default error when no data returned", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: undefined,
        status: 200,
      });

      await expect(
        teacherDashboardRepository.getDashboardData(1),
      ).rejects.toThrow("Failed to fetch dashboard data");
    });
  });

  // ============================================================================
  // getRecentClasses Tests
  // ============================================================================

  describe("getRecentClasses", () => {
    const mockResponse = {
      success: true,
      classes: [mockClass],
    };

    it("fetches recent classes with default limit", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockResponse,
        status: 200,
      });

      const result = await teacherDashboardRepository.getRecentClasses(1);

      expect(apiClient.get).toHaveBeenCalledWith(
        "/teacher/dashboard/1/classes?limit=5",
      );
      expect(result).toEqual(mockResponse);
    });

    it("passes custom limit to API", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockResponse,
        status: 200,
      });

      await teacherDashboardRepository.getRecentClasses(1, 10);

      expect(apiClient.get).toHaveBeenCalledWith(
        "/teacher/dashboard/1/classes?limit=10",
      );
    });

    it("throws error when API fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Unauthorized",
        status: 401,
      });

      await expect(
        teacherDashboardRepository.getRecentClasses(1),
      ).rejects.toThrow("Unauthorized");
    });

    it("throws default error when no data returned", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: undefined,
        status: 200,
      });

      await expect(
        teacherDashboardRepository.getRecentClasses(1),
      ).rejects.toThrow("Failed to fetch recent classes");
    });

    it("returns empty array when no classes exist", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, classes: [] },
        status: 200,
      });

      const result = await teacherDashboardRepository.getRecentClasses(1);

      expect(result.classes).toEqual([]);
    });
  });

  // ============================================================================
  // getPendingTasks Tests
  // ============================================================================

  describe("getPendingTasks", () => {
    const mockResponse = {
      success: true,
      tasks: [mockTask],
    };

    it("fetches pending tasks with default limit", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockResponse,
        status: 200,
      });

      const result = await teacherDashboardRepository.getPendingTasks(1);

      expect(apiClient.get).toHaveBeenCalledWith(
        "/teacher/dashboard/1/tasks?limit=10",
      );
      expect(result).toEqual(mockResponse);
    });

    it("passes custom limit to API", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockResponse,
        status: 200,
      });

      await teacherDashboardRepository.getPendingTasks(1, 20);

      expect(apiClient.get).toHaveBeenCalledWith(
        "/teacher/dashboard/1/tasks?limit=20",
      );
    });

    it("throws error when API fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Server error",
        status: 500,
      });

      await expect(
        teacherDashboardRepository.getPendingTasks(1),
      ).rejects.toThrow("Server error");
    });

    it("throws default error when no data returned", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: undefined,
        status: 200,
      });

      await expect(
        teacherDashboardRepository.getPendingTasks(1),
      ).rejects.toThrow("Failed to fetch pending tasks");
    });

    it("includes submission count in task response", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockResponse,
        status: 200,
      });

      const result = await teacherDashboardRepository.getPendingTasks(1);

      expect(result.tasks[0].submissionCount).toBe(15);
    });
  });
});
