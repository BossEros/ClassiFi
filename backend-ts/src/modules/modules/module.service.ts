import { inject, injectable } from "tsyringe"
import { ModuleRepository } from "@/modules/modules/module.repository.js"
import { AssignmentRepository } from "@/modules/assignments/assignment.repository.js"
import { ClassRepository } from "@/modules/classes/class.repository.js"
import { SubmissionRepository } from "@/modules/submissions/submission.repository.js"
import { toModuleDTO, type ModuleDTO } from "@/modules/modules/module.mapper.js"
import { toAssignmentDTO } from "@/modules/assignments/assignment.mapper.js"
import { requireClassOwnership } from "@/modules/classes/class.guard.js"
import { NotFoundError } from "@/shared/errors.js"
import type {
  CreateModuleServiceDTO,
  RenameModuleServiceDTO,
  ToggleModulePublishServiceDTO,
  DeleteModuleServiceDTO,
} from "@/modules/modules/module.dtos.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

/**
 * Business logic for module-related operations.
 * Handles creating, renaming, toggling publish state, and deleting modules.
 */
@injectable()
export class ModuleService {
  constructor(
    @inject(DI_TOKENS.repositories.module)
    private moduleRepo: ModuleRepository,
    @inject(DI_TOKENS.repositories.class)
    private classRepo: ClassRepository,
    @inject(DI_TOKENS.repositories.assignment)
    private assignmentRepo: AssignmentRepository,
    @inject(DI_TOKENS.repositories.submission)
    private submissionRepo: SubmissionRepository,
  ) {}

  /**
   * Creates a new module in a class.
   *
   * @param data - The module creation data including classId, teacherId, and name.
   * @returns The created module DTO.
   */
  async createModule(data: CreateModuleServiceDTO): Promise<ModuleDTO> {
    await requireClassOwnership(this.classRepo, data.classId, data.teacherId)

    const module = await this.moduleRepo.createModule({
      classId: data.classId,
      name: data.name,
    })

    return toModuleDTO(module, [])
  }

  /**
   * Gets all modules for a class with their nested assignments.
   * Teachers see all modules; students see only published modules.
   *
   * @param classId - The class ID.
   * @param isStudent - Whether the requester is a student.
   * @returns Array of module DTOs with nested assignment DTOs.
   */
  async getModulesWithAssignments(classId: number, isStudent: boolean): Promise<ModuleDTO[]> {
    const moduleList = isStudent
      ? await this.moduleRepo.getPublishedModulesByClassId(classId)
      : await this.moduleRepo.getModulesByClassId(classId)

    const allAssignments = await this.assignmentRepo.getAssignmentsByClassId(classId)
    const studentCount = await this.classRepo.getActiveStudentCount(classId)

    const assignmentIds = allAssignments.map((a) => a.id)
    const submissionCounts = assignmentIds.length
      ? await this.submissionRepo.getLatestSubmissionCountsByAssignmentIds(assignmentIds)
      : new Map<number, number>()

    // Group assignments by moduleId
    const assignmentsByModuleId = new Map<number, typeof allAssignments>()

    for (const assignment of allAssignments) {
      if (assignment.moduleId == null) continue

      const existing = assignmentsByModuleId.get(assignment.moduleId) ?? []
      existing.push(assignment)
      assignmentsByModuleId.set(assignment.moduleId, existing)
    }

    return moduleList.map((module) => {
      const moduleAssignments = assignmentsByModuleId.get(module.id) ?? []
      const assignmentDTOs = moduleAssignments.map((assignment) =>
        toAssignmentDTO(assignment, {
          submissionCount: submissionCounts.get(assignment.id) ?? 0,
          studentCount,
        }),
      )

      return toModuleDTO(module, assignmentDTOs)
    })
  }

  /**
   * Renames a module.
   *
   * @param data - The rename data including moduleId, teacherId, and new name.
   * @returns The updated module DTO.
   */
  async renameModule(data: RenameModuleServiceDTO): Promise<ModuleDTO> {
    await this.requireModuleOwnership(data.moduleId, data.teacherId)

    const updatedModule = await this.moduleRepo.updateModule(data.moduleId, {
      name: data.name,
    })

    if (!updatedModule) {
      throw new NotFoundError(`Module not found: ${data.moduleId}`)
    }

    return toModuleDTO(updatedModule)
  }

  /**
   * Toggles the publish state of a module.
   *
   * @param data - The toggle data including moduleId, teacherId, and isPublished.
   * @returns The updated module DTO.
   */
  async toggleModulePublish(data: ToggleModulePublishServiceDTO): Promise<ModuleDTO> {
    await this.requireModuleOwnership(data.moduleId, data.teacherId)

    const updatedModule = await this.moduleRepo.updateModule(data.moduleId, {
      isPublished: data.isPublished,
    })

    if (!updatedModule) {
      throw new NotFoundError(`Module not found: ${data.moduleId}`)
    }

    return toModuleDTO(updatedModule)
  }

  /**
   * Deletes a module and all its assignments (cascaded by FK).
   *
   * @param data - The delete data including moduleId and teacherId.
   */
  async deleteModule(data: DeleteModuleServiceDTO): Promise<void> {
    await this.requireModuleOwnership(data.moduleId, data.teacherId)

    const deleted = await this.moduleRepo.deleteModule(data.moduleId)

    if (!deleted) {
      throw new NotFoundError(`Module not found: ${data.moduleId}`)
    }
  }

  /**
   * Verifies that a module exists and the teacher owns its class.
   *
   * @param moduleId - The module ID to check.
   * @param teacherId - The teacher ID to verify ownership.
   * @returns The module entity.
   */
  private async requireModuleOwnership(moduleId: number, teacherId: number) {
    const module = await this.moduleRepo.getModuleById(moduleId)

    if (!module) {
      throw new NotFoundError(`Module not found: ${moduleId}`)
    }

    await requireClassOwnership(this.classRepo, module.classId, teacherId)

    return module
  }
}
