import type { Module } from "@/modules/modules/module.model.js"
import type { AssignmentDTO } from "@/modules/assignments/assignment.mapper.js"

/** Module DTO returned by the API */
export interface ModuleDTO {
  id: number
  classId: number
  name: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
  assignments: AssignmentDTO[]
}

/**
 * Maps a Module entity to a ModuleDTO.
 *
 * @param module - The module DB entity.
 * @param assignments - The assignments within this module (already mapped to DTOs).
 * @returns The mapped ModuleDTO.
 */
export function toModuleDTO(module: Module, assignments: AssignmentDTO[] = []): ModuleDTO {
  return {
    id: module.id,
    classId: module.classId,
    name: module.name,
    isPublished: module.isPublished,
    createdAt: module.createdAt.toISOString(),
    updatedAt: module.updatedAt.toISOString(),
    assignments,
  }
}
