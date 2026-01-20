import * as dashboardRepository from "@/data/repositories/teacherDashboardRepository";
import type {
  DashboardData,
  Class,
  Task,
} from "@/business/models/dashboard/types";
import { validateId } from "@/shared/utils/validators";

/**
 * Fetches the complete dashboard overview for a specific teacher.
 * Aggregates recent classes and pending tasks into a single view.
 *
 * @param teacherId - The unique identifier of the teacher.
 * @returns The comprehensive teacher dashboard data.
 * @throws Error if the dashboard data cannot be retrieved.
 */
export async function getDashboardData(
  teacherId: number,
): Promise<DashboardData> {
  validateId(teacherId, "teacher");

  try {
    const dashboardResponse =
      await dashboardRepository.getDashboardData(teacherId);

    return {
      recentClasses: dashboardResponse.recentClasses as unknown as Class[],
      pendingTasks: dashboardResponse.pendingTasks as unknown as Task[],
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
}

/**
 * Retrieves the most recently accessed or modified classes for the teacher.
 *
 * @param teacherId - The unique identifier of the teacher.
 * @param limit - The maximum number of classes to return (defaults to 5).
 * @returns A list of recent classes.
 * @throws Error if the recent classes cannot be fetched.
 */
export async function getRecentClasses(
  teacherId: number,
  limit: number = 5,
): Promise<Class[]> {
  validateId(teacherId, "teacher");

  try {
    const classesResponse = await dashboardRepository.getRecentClasses(
      teacherId,
      limit,
    );

    return classesResponse.classes as unknown as Class[];
  } catch (error) {
    console.error("Error fetching recent classes:", error);
    throw error;
  }
}

/**
 * Retrieves a list of pending tasks requiring the teacher's attention.
 * Examples include unmarked assignments or upcoming deadlines.
 *
 * @param teacherId - The unique identifier of the teacher.
 * @param limit - The maximum number of tasks to return (defaults to 10).
 * @returns A list of pending tasks.
 * @throws Error if the pending tasks cannot be fetched.
 */
export async function getPendingTasks(
  teacherId: number,
  limit: number = 10,
): Promise<Task[]> {
  validateId(teacherId, "teacher");

  try {
    const tasksResponse = await dashboardRepository.getPendingTasks(
      teacherId,
      limit,
    );
    
    return tasksResponse.tasks as unknown as Task[];
  } catch (error) {
    console.error("Error fetching pending tasks:", error);
    throw error;
  }
}
