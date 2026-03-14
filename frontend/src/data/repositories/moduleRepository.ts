import { apiClient } from "@/data/api/apiClient"
import type { Module } from "@/shared/types/class"

/** Response for module list operations */
interface ModuleListResponse {
  success: boolean
  message?: string
  modules: Module[]
}

/** Response for single module operations */
interface ModuleDetailResponse {
  success: boolean
  message?: string
  module: Module
}

/** Response for delete operations */
interface DeleteResponse {
  success: boolean
  message?: string
}

/**
 * Fetches all modules for a class with their nested assignments.
 *
 * @param classId - The class ID.
 * @param isStudent - Whether the requester is a student.
 * @returns Array of modules with nested assignments.
 */
export async function getModulesByClassId(classId: number, isStudent: boolean = false): Promise<Module[]> {
  const apiResponse = await apiClient.get<ModuleListResponse>(
    `/classes/${classId}/modules?isStudent=${isStudent}`,
  )

  if (apiResponse.error || !apiResponse.data?.success) {
    throw new Error(apiResponse.error || apiResponse.data?.message || "Failed to fetch modules")
  }

  return apiResponse.data.modules
}

/**
 * Creates a new module in a class.
 *
 * @param classId - The class ID.
 * @param teacherId - The teacher ID.
 * @param name - The module name.
 * @returns The created module.
 */
export async function createModule(classId: number, teacherId: number, name: string): Promise<Module> {
  const apiResponse = await apiClient.post<ModuleDetailResponse>(
    `/classes/${classId}/modules`,
    { teacherId, name },
  )

  if (apiResponse.error || !apiResponse.data?.success || !apiResponse.data.module) {
    throw new Error(apiResponse.error || apiResponse.data?.message || "Failed to create module")
  }

  return apiResponse.data.module
}

/**
 * Renames a module.
 *
 * @param moduleId - The module ID.
 * @param teacherId - The teacher ID.
 * @param name - The new module name.
 * @returns The updated module.
 */
export async function renameModule(moduleId: number, teacherId: number, name: string): Promise<Module> {
  const apiResponse = await apiClient.put<ModuleDetailResponse>(
    `/modules/${moduleId}`,
    { teacherId, name },
  )

  if (apiResponse.error || !apiResponse.data?.success || !apiResponse.data.module) {
    throw new Error(apiResponse.error || apiResponse.data?.message || "Failed to rename module")
  }

  return apiResponse.data.module
}

/**
 * Toggles the publish state of a module.
 *
 * @param moduleId - The module ID.
 * @param teacherId - The teacher ID.
 * @param isPublished - The new publish state.
 * @returns The updated module.
 */
export async function toggleModulePublish(
  moduleId: number,
  teacherId: number,
  isPublished: boolean,
): Promise<Module> {
  const apiResponse = await apiClient.patch<ModuleDetailResponse>(
    `/modules/${moduleId}/publish`,
    { teacherId, isPublished },
  )

  if (apiResponse.error || !apiResponse.data?.success || !apiResponse.data.module) {
    throw new Error(apiResponse.error || apiResponse.data?.message || "Failed to update module")
  }

  return apiResponse.data.module
}

/**
 * Deletes a module and all its assignments.
 *
 * @param moduleId - The module ID.
 * @param teacherId - The teacher ID.
 */
export async function deleteModule(moduleId: number, teacherId: number): Promise<void> {
  const apiResponse = await apiClient.delete<DeleteResponse>(
    `/modules/${moduleId}`,
    { teacherId },
  )

  if (apiResponse.error || !apiResponse.data?.success) {
    throw new Error(apiResponse.error || apiResponse.data?.message || "Failed to delete module")
  }
}
