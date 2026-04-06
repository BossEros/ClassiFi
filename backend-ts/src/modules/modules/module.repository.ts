import { eq, and, asc } from "drizzle-orm"
import { modules, type Module, type NewModule } from "@/modules/modules/module.model.js"
import { BaseRepository } from "@/repositories/base.repository.js"
import { injectable } from "tsyringe"

/** Data required to create a new module */
export interface CreateModuleData {
  classId: number
  name: string
  isPublished?: boolean
}

/** Data for updating an existing module */
export interface UpdateModuleData {
  name?: string
  isPublished?: boolean
}

/**
 * Repository for module-related database operations.
 */
@injectable()
export class ModuleRepository extends BaseRepository<
  typeof modules,
  Module,
  NewModule
> {
  constructor() {
    super(modules)
  }

  /**
   * Gets a module by ID.
   *
   * @param moduleId - The unique identifier of the module.
   * @returns The module if found, undefined otherwise.
   */
  async getModuleById(moduleId: number): Promise<Module | undefined> {
    return await this.findById(moduleId)
  }

  /**
   * Gets all modules for a class, ordered by creation date ascending.
   *
   * @param classId - The class ID to fetch modules for.
   * @returns Array of modules ordered by createdAt ASC.
   */
  async getModulesByClassId(classId: number): Promise<Module[]> {
    return await this.db
      .select()
      .from(modules)
      .where(eq(modules.classId, classId))
      .orderBy(asc(modules.createdAt))
  }

  /**
   * Gets all published modules for a class (for student view).
   *
   * @param classId - The class ID to fetch modules for.
   * @returns Array of published modules ordered by createdAt ASC.
   */
  async getPublishedModulesByClassId(classId: number): Promise<Module[]> {
    return await this.db
      .select()
      .from(modules)
      .where(and(eq(modules.classId, classId), eq(modules.isPublished, true)))
      .orderBy(asc(modules.createdAt))
  }

  /**
   * Creates a new module.
   *
   * @param data - The data for the new module.
   * @returns The created module.
   */
  async createModule(data: CreateModuleData): Promise<Module> {
    return await this.create({
      classId: data.classId,
      name: data.name,
      isPublished: data.isPublished ?? true,
    })
  }

  /**
   * Updates an existing module.
   *
   * @param moduleId - The ID of the module to update.
   * @param data - The fields to update.
   * @returns The updated module, or undefined if not found.
   */
  async updateModule(moduleId: number, data: UpdateModuleData): Promise<Module | undefined> {
    return await this.update(moduleId, {
      ...data,
      updatedAt: new Date(),
    })
  }

  /**
   * Deletes a module by ID (assignments cascade-delete via FK).
   *
   * @param moduleId - The ID of the module to delete.
   * @returns True if the module was deleted.
   */
  async deleteModule(moduleId: number): Promise<boolean> {
    return await this.delete(moduleId)
  }
}
