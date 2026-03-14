import * as moduleRepository from "@/data/repositories/moduleRepository"
import type { Module } from "@/shared/types/class"

/**
 * Fetches all modules for a class with their nested assignments.
 *
 * @param classId - The class ID.
 * @returns Array of modules with nested assignments.
 */
export async function getModulesByClassId(classId: number): Promise<Module[]> {
  return await moduleRepository.getModulesByClassId(classId)
}

/**
 * Creates a new module in a class.
 *
 * @param classId - The class ID.
 * @param name - The module name.
 * @returns The created module.
 */
export async function createModule(classId: number, name: string): Promise<Module> {
  return await moduleRepository.createModule(classId, name)
}

/**
 * Renames a module.
 *
 * @param moduleId - The module ID.
 * @param name - The new module name.
 * @returns The updated module.
 */
export async function renameModule(moduleId: number, name: string): Promise<Module> {
  return await moduleRepository.renameModule(moduleId, name)
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
  return await moduleRepository.toggleModulePublish(moduleId, isPublished)
}

/**
 * Deletes a module and all its assignments.
 *
 * @param moduleId - The module ID.
 */
export async function deleteModule(moduleId: number): Promise<void> {
  return await moduleRepository.deleteModule(moduleId)
}
