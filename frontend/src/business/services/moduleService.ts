import * as moduleRepository from "@/data/repositories/moduleRepository"
import type { Module } from "@/data/api/class.types"

/**
 * Fetches all modules belonging to a class, each containing their nested assignments.
 * Modules are the primary organizational unit inside a class — teachers use them
 * to group related assignments together under a named topic or week.
 *
 * @param classId - The unique identifier of the class.
 * @returns An array of Module objects, each with a nested list of assignments.
 */
export async function getModulesByClassId(classId: number): Promise<Module[]> {
  return await moduleRepository.getModulesByClassId(classId)
}

/**
 * Creates a new module inside a class with the given name.
 * Modules are created empty and can be populated with assignments afterwards.
 * Teachers typically create modules to represent topics, weeks, or units.
 *
 * @param classId - The unique identifier of the class to add the module to.
 * @param name - The display name for the new module.
 * @returns The newly created Module object.
 */
export async function createModule(classId: number, name: string): Promise<Module> {
  return await moduleRepository.createModule(classId, name)
}

/**
 * Renames an existing module to a new display name.
 * Used when a teacher wants to reorganize topics or correct a module title.
 *
 * @param moduleId - The unique identifier of the module to rename.
 * @param name - The new display name for the module.
 * @returns The updated Module object reflecting the new name.
 */
export async function renameModule(moduleId: number, name: string): Promise<Module> {
  return await moduleRepository.renameModule(moduleId, name)
}

/**
 * Sets the published/unpublished visibility state of a module.
 * Unpublished modules are hidden from students but remain visible to teachers,
 * allowing content to be prepared in advance before being released to the class.
 *
 * @param moduleId - The unique identifier of the module.
 * @param isPublished - Whether the module should be visible to students.
 * @returns The updated Module object with the new publish state applied.
 */
export async function toggleModulePublish(
  moduleId: number,
  isPublished: boolean,
): Promise<Module> {
  return await moduleRepository.toggleModulePublish(moduleId, isPublished)
}

/**
 * Permanently deletes a module and all assignments nested within it.
 * This is a destructive, cascading operation — use with care as it cannot be undone.
 *
 * @param moduleId - The unique identifier of the module to delete.
 * @returns A promise that resolves when the module and its assignments have been removed.
 */
export async function deleteModule(moduleId: number): Promise<void> {
  return await moduleRepository.deleteModule(moduleId)
}
