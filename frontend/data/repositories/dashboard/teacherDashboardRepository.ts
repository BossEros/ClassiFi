/**
 * Teacher Dashboard Repository
 * Part of the Data Access Layer - Handles API calls for teacher dashboard
 */

import { apiClient } from '../../api/apiClient'
import type { DashboardData, Class, Task } from '../../../business/models/dashboard/types'

/**
 * Backend class data structure (snake_case from API)
 */
interface BackendClass {
  id: number
  name: string
  code: string
  description?: string
  student_count?: number
  created_at?: string
}

/**
 * Backend task data structure (snake_case from API)
 */
interface BackendTask {
  id: number
  title: string
  description?: string
  class_id: number
  class_name: string
  programming_language: string
  deadline: string
  allow_resubmission: boolean
  created_at?: string
}

/**
 * Backend response structure for dashboard data
 */
interface DashboardBackendResponse {
  success: boolean
  message?: string
  recent_classes: BackendClass[]
  pending_tasks: BackendTask[]
}

/**
 * Transforms backend class response (snake_case) to frontend Class interface (camelCase)
 */
function transformClassResponse(backendClass: BackendClass): Class {
  return {
    id: backendClass.id,
    name: backendClass.name,
    code: backendClass.code,
    description: backendClass.description,
    studentCount: backendClass.student_count ?? 0,
    createdAt: backendClass.created_at ? new Date(backendClass.created_at) : undefined
  }
}

/**
 * Transforms backend task response (snake_case) to frontend Task interface (camelCase)
 */
function transformTaskResponse(backendTask: BackendTask): Task {
  return {
    id: backendTask.id,
    title: backendTask.title,
    description: backendTask.description ?? '',
    classId: backendTask.class_id,
    className: backendTask.class_name,
    programmingLanguage: backendTask.programming_language,
    deadline: new Date(backendTask.deadline),
    allowResubmission: backendTask.allow_resubmission,
    createdAt: backendTask.created_at ? new Date(backendTask.created_at) : undefined
  }
}

/**
 * Fetches complete dashboard data for a teacher
 *
 * @param teacherId - ID of the teacher
 * @param recentClassesLimit - Maximum number of recent classes to return (default: 12)
 * @param pendingTasksLimit - Maximum number of pending tasks to return (default: 10)
 * @returns Dashboard data with recent classes and pending tasks
 */
export async function getDashboardData(
  teacherId: number,
  recentClassesLimit: number = 12,
  pendingTasksLimit: number = 10
): Promise<DashboardData> {
  const response = await apiClient.get<DashboardBackendResponse>(
    `/teacher/dashboard/${teacherId}?recent_classes_limit=${recentClassesLimit}&pending_tasks_limit=${pendingTasksLimit}`
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch dashboard data')
  }

  const data = response.data

  return {
    recentClasses: data.recent_classes.map(transformClassResponse),
    pendingTasks: data.pending_tasks.map(transformTaskResponse)
  }
}

/**
 * Fetches recent classes for a teacher
 *
 * @param teacherId - ID of the teacher
 * @param limit - Maximum number of classes to return
 * @returns List of recent classes
 */
export async function getRecentClasses(teacherId: number, limit: number = 5): Promise<Class[]> {
  const response = await apiClient.get<{ success: boolean; message?: string; classes: BackendClass[] }>(
    `/teacher/dashboard/${teacherId}/classes?limit=${limit}`
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch recent classes')
  }

  return response.data.classes.map(transformClassResponse)
}

/**
 * Fetches pending tasks for a teacher
 *
 * @param teacherId - ID of the teacher
 * @param limit - Maximum number of tasks to return
 * @returns List of pending tasks
 */
export async function getPendingTasks(teacherId: number, limit: number = 10): Promise<Task[]> {
  const response = await apiClient.get<{ success: boolean; message?: string; tasks: BackendTask[] }>(
    `/teacher/dashboard/${teacherId}/tasks?limit=${limit}`
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch pending tasks')
  }

  return response.data.tasks.map(transformTaskResponse)
}
