import * as moduleRepository from "@/data/repositories/moduleRepository"
import type { Module } from "@/shared/types/class"

/**
 * Fetches all modules for a class with their nested assignments.
 *
 * @param classId - The class ID.
 * @param isStudent - Whether the requester is a student.
 * @returns Array of modules with nested assignments.
 */
export async function getModulesByClassId(classId: number, isStudent: boolean = false): Promise<Module[]> {
  return await moduleRepository.getModulesByClassId(classId, isStudent)
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
  return await moduleRepository.createModule(classId, teacherId, name)
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
  return await moduleRepository.renameModule(moduleId, teacherId, name)
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
  return await moduleRepository.toggleModulePublish(moduleId, teacherId, isPublished)
}

/**
 * Deletes a module and all its assignments.
 *
 * @param moduleId - The module ID.
 * @param teacherId - The teacher ID.
 */
export async function deleteModule(moduleId: number, teacherId: number): Promise<void> {
  return await moduleRepository.deleteModule(moduleId, teacherId)
}
