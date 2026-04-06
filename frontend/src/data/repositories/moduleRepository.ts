import { apiClient, unwrapApiResponse } from "@/data/api/apiClient"
import type { Module, ModuleListResponse, ModuleDetailResponse, DeleteResponse } from "@/data/api/class.types"

/**
 * Fetches all modules for a class with their nested assignments.
 *
 * @param classId - The class ID.
 * @returns Array of modules with nested assignments.
 */
export async function getModulesByClassId(classId: number): Promise<Module[]> {
  const apiResponse = await apiClient.get<ModuleListResponse>(
    `/classes/${classId}/modules`,
  )
  const data = unwrapApiResponse(apiResponse, "Failed to fetch modules", "modules")

  return data.modules
}

/**
 * Creates a new module in a class.
 *
 * @param classId - The class ID.
 * @param name - The module name.
 * @returns The created module.
 */
export async function createModule(classId: number, name: string): Promise<Module> {
  const apiResponse = await apiClient.post<ModuleDetailResponse>(
    `/classes/${classId}/modules`,
    { name },
  )
  const data = unwrapApiResponse(apiResponse, "Failed to create module", "module")

  return data.module
}

/**
 * Renames a module.
 *
 * @param moduleId - The module ID.
 * @param name - The new module name.
 * @returns The updated module.
 */
export async function renameModule(moduleId: number, name: string): Promise<Module> {
  const apiResponse = await apiClient.put<ModuleDetailResponse>(
    `/modules/${moduleId}`,
    { name },
  )
  const data = unwrapApiResponse(apiResponse, "Failed to rename module", "module")

  return data.module
}

/**
 * Toggles the publish state of a module.
 *
 * @param moduleId - The module ID.
 * @param isPublished - The new publish state.
 * @returns The updated module.
 */
export async function toggleModulePublish(
  moduleId: number,
  isPublished: boolean,
): Promise<Module> {
  const apiResponse = await apiClient.patch<ModuleDetailResponse>(
    `/modules/${moduleId}/publish`,
    { isPublished },
  )
  const data = unwrapApiResponse(apiResponse, "Failed to update module", "module")

  return data.module
}

/**
 * Deletes a module and all its assignments.
 *
 * @param moduleId - The module ID.
 */
export async function deleteModule(moduleId: number): Promise<void> {
  const apiResponse = await apiClient.delete<DeleteResponse>(
    `/modules/${moduleId}`,
  )
  unwrapApiResponse(apiResponse, "Failed to delete module")
}
