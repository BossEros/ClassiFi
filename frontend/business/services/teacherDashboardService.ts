import * as dashboardRepository from '@/data/repositories/teacherDashboardRepository'
import type { DashboardData, Class, Task, DayOfWeek } from '@/business/models/dashboard/types'

/**
 * Maps raw backend class response to business model Class
 */
function mapClassResponseToModel(rawClass: dashboardRepository.ClassResponse): Class {
    // These default values should ideally come from backend or be handled more gracefully
    // But since the current backend response is limited, we provide sensible defaults
    return {
        id: rawClass.id,
        className: rawClass.className,
        classCode: rawClass.classCode,
        description: rawClass.description,
        isActive: rawClass.isActive,
        createdAt: rawClass.createdAt,
        teacherId: rawClass.teacherId,
        // Default values for missing properties
        yearLevel: 0,
        semester: 1,
        academicYear: new Date().getFullYear().toString(),
        schedule: {
            days: [] as DayOfWeek[],
            startTime: '00:00',
            endTime: '00:00'
        },
        studentCount: 0,
        assignmentCount: 0
    }
}

/**
 * Maps raw backend task response to business model Task
 */
function mapTaskResponseToModel(rawTask: dashboardRepository.TaskResponse): Task {
    return {
        id: rawTask.id,
        assignmentName: rawTask.assignmentName,
        description: rawTask.description,
        programmingLanguage: rawTask.programmingLanguage,
        deadline: rawTask.deadline,
        allowResubmission: rawTask.allowResubmission,
        isActive: rawTask.isActive,
        createdAt: rawTask.createdAt,
        submissionCount: rawTask.submissionCount || 0,
        className: rawTask.className
    }
}

/**
 * Fetches complete dashboard data for a teacher
 *
 * @param teacherId - ID of the teacher
 * @returns Dashboard data with recent classes and pending tasks
 */
export async function getDashboardData(teacherId: number): Promise<DashboardData> {
  try {
    const rawData = await dashboardRepository.getDashboardData(teacherId)

    return {
        recentClasses: rawData.recentClasses.map(mapClassResponseToModel),
        pendingTasks: rawData.pendingTasks.map(mapTaskResponseToModel)
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    throw error
  }
}

/**
 * Fetches recent classes for a teacher
 *
 * @param teacherId - ID of the teacher
 * @param limit - Maximum number of classes to return (default: 5)
 * @returns List of recent classes
 */
export async function getRecentClasses(teacherId: number, limit: number = 5): Promise<Class[]> {
  try {
    const response = await dashboardRepository.getRecentClasses(teacherId, limit)
    return response.classes.map(mapClassResponseToModel)
  } catch (error) {
    console.error('Error fetching recent classes:', error)
    throw error
  }
}

/**
 * Fetches pending tasks for a teacher
 *
 * @param teacherId - ID of the teacher
 * @param limit - Maximum number of tasks to return (default: 10)
 * @returns List of pending tasks
 */
export async function getPendingTasks(teacherId: number, limit: number = 10): Promise<Task[]> {
  try {
    const response = await dashboardRepository.getPendingTasks(teacherId, limit)
    return response.tasks.map(mapTaskResponseToModel)
  } catch (error) {
    console.error('Error fetching pending tasks:', error)
    throw error
  }
}
