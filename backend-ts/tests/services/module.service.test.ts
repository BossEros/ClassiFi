import { describe, it, expect, beforeEach, vi } from "vitest"
import type { MockedObject } from "vitest"
import { ModuleService } from "../../src/modules/modules/module.service.js"
import type { ModuleRepository } from "../../src/modules/modules/module.repository.js"
import type { ClassRepository } from "../../src/modules/classes/class.repository.js"
import type { AssignmentRepository } from "../../src/modules/assignments/assignment.repository.js"
import type { SubmissionRepository } from "../../src/modules/submissions/submission.repository.js"
import { NotFoundError, ClassNotFoundError, NotClassOwnerError } from "../../src/shared/errors.js"
import type { Module } from "../../src/models/index.js"

/**
 * Helper to create a mock Module entity.
 */
function createMockModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 1,
    classId: 10,
    name: "Module 1",
    isPublished: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  }
}

describe("ModuleService", () => {
  let moduleService: ModuleService
  let mockModuleRepo: Partial<MockedObject<ModuleRepository>>
  let mockClassRepo: Partial<MockedObject<ClassRepository>>
  let mockAssignmentRepo: Partial<MockedObject<AssignmentRepository>>
  let mockSubmissionRepo: Partial<MockedObject<SubmissionRepository>>

  const teacherId = 100
  const classId = 10

  beforeEach(() => {
    vi.clearAllMocks()

    mockModuleRepo = {
      createModule: vi.fn(),
      getModulesByClassId: vi.fn(),
      getPublishedModulesByClassId: vi.fn(),
      getModuleById: vi.fn(),
      updateModule: vi.fn(),
      deleteModule: vi.fn(),
    } as any

    mockClassRepo = {
      getClassById: vi.fn(),
      getStudentCount: vi.fn(),
    } as any

    mockAssignmentRepo = {
      getAssignmentsByClassId: vi.fn(),
    } as any

    mockSubmissionRepo = {
      getLatestSubmissionCountsByAssignmentIds: vi.fn(),
    } as any

    moduleService = new ModuleService(
      mockModuleRepo as unknown as ModuleRepository,
      mockClassRepo as unknown as ClassRepository,
      mockAssignmentRepo as unknown as AssignmentRepository,
      mockSubmissionRepo as unknown as SubmissionRepository,
    )
  })

  describe("createModule", () => {
    it("should create a module when teacher owns the class", async () => {
      mockClassRepo.getClassById!.mockResolvedValue({
        id: classId,
        teacherId,
      } as any)
      const created = createMockModule()
      mockModuleRepo.createModule!.mockResolvedValue(created)

      const result = await moduleService.createModule({
        classId,
        teacherId,
        name: "Module 1",
      })

      expect(result.id).toBe(1)
      expect(result.name).toBe("Module 1")
      expect(result.assignments).toEqual([])
      expect(mockModuleRepo.createModule).toHaveBeenCalledWith({
        classId,
        name: "Module 1",
      })
    })

    it("should throw ClassNotFoundError when class does not exist", async () => {
      mockClassRepo.getClassById!.mockResolvedValue(null)

      await expect(
        moduleService.createModule({ classId: 999, teacherId, name: "X" }),
      ).rejects.toThrow(ClassNotFoundError)
    })

    it("should throw NotClassOwnerError when teacher does not own the class", async () => {
      mockClassRepo.getClassById!.mockResolvedValue({
        id: classId,
        teacherId: 999,
      } as any)

      await expect(
        moduleService.createModule({ classId, teacherId, name: "X" }),
      ).rejects.toThrow(NotClassOwnerError)
    })
  })

  describe("getModulesWithAssignments", () => {
    it("should return all modules with assignments for a teacher", async () => {
      const modules = [createMockModule()]
      mockModuleRepo.getModulesByClassId!.mockResolvedValue(modules)
      mockAssignmentRepo.getAssignmentsByClassId!.mockResolvedValue([])
      mockClassRepo.getStudentCount!.mockResolvedValue(5)
      mockSubmissionRepo.getLatestSubmissionCountsByAssignmentIds!.mockResolvedValue(
        new Map(),
      )

      const result = await moduleService.getModulesWithAssignments(classId, false)

      expect(result).toHaveLength(1)
      expect(mockModuleRepo.getModulesByClassId).toHaveBeenCalledWith(classId)
      expect(mockModuleRepo.getPublishedModulesByClassId).not.toHaveBeenCalled()
    })

    it("should return only published modules for a student", async () => {
      mockModuleRepo.getPublishedModulesByClassId!.mockResolvedValue([])
      mockAssignmentRepo.getAssignmentsByClassId!.mockResolvedValue([])
      mockClassRepo.getStudentCount!.mockResolvedValue(0)

      await moduleService.getModulesWithAssignments(classId, true)

      expect(mockModuleRepo.getPublishedModulesByClassId).toHaveBeenCalledWith(classId)
      expect(mockModuleRepo.getModulesByClassId).not.toHaveBeenCalled()
    })

    it("should group assignments under their respective modules", async () => {
      const module1 = createMockModule({ id: 1 })
      const module2 = createMockModule({ id: 2, name: "Module 2" })
      mockModuleRepo.getModulesByClassId!.mockResolvedValue([module1, module2])
      mockAssignmentRepo.getAssignmentsByClassId!.mockResolvedValue([
        { id: 10, moduleId: 1, title: "A1", classId } as any,
        { id: 11, moduleId: 2, title: "A2", classId } as any,
        { id: 12, moduleId: 1, title: "A3", classId } as any,
      ])
      mockClassRepo.getStudentCount!.mockResolvedValue(3)
      mockSubmissionRepo.getLatestSubmissionCountsByAssignmentIds!.mockResolvedValue(
        new Map([[10, 2], [11, 1], [12, 0]]),
      )

      const result = await moduleService.getModulesWithAssignments(classId, false)

      expect(result).toHaveLength(2)
      expect(result[0].assignments).toHaveLength(2)
      expect(result[1].assignments).toHaveLength(1)
    })

    it("should not fetch submission counts when no assignments exist", async () => {
      mockModuleRepo.getModulesByClassId!.mockResolvedValue([createMockModule()])
      mockAssignmentRepo.getAssignmentsByClassId!.mockResolvedValue([])
      mockClassRepo.getStudentCount!.mockResolvedValue(0)

      await moduleService.getModulesWithAssignments(classId, false)

      expect(
        mockSubmissionRepo.getLatestSubmissionCountsByAssignmentIds,
      ).not.toHaveBeenCalled()
    })

    it("should skip assignments with null moduleId", async () => {
      const module1 = createMockModule({ id: 1 })
      mockModuleRepo.getModulesByClassId!.mockResolvedValue([module1])
      mockAssignmentRepo.getAssignmentsByClassId!.mockResolvedValue([
        { id: 10, moduleId: null, title: "Unassigned", classId } as any,
      ])
      mockClassRepo.getStudentCount!.mockResolvedValue(1)
      mockSubmissionRepo.getLatestSubmissionCountsByAssignmentIds!.mockResolvedValue(
        new Map(),
      )

      const result = await moduleService.getModulesWithAssignments(classId, false)

      expect(result[0].assignments).toHaveLength(0)
    })
  })

  describe("renameModule", () => {
    it("should rename a module when teacher owns it", async () => {
      mockModuleRepo.getModuleById!.mockResolvedValue(createMockModule())
      mockClassRepo.getClassById!.mockResolvedValue({
        id: classId,
        teacherId,
      } as any)
      const updated = createMockModule({ name: "Updated" })
      mockModuleRepo.updateModule!.mockResolvedValue(updated)

      const result = await moduleService.renameModule({
        moduleId: 1,
        teacherId,
        name: "Updated",
      })

      expect(result.name).toBe("Updated")
      expect(mockModuleRepo.updateModule).toHaveBeenCalledWith(1, {
        name: "Updated",
      })
    })

    it("should throw NotFoundError when module does not exist", async () => {
      mockModuleRepo.getModuleById!.mockResolvedValue(null)

      await expect(
        moduleService.renameModule({
          moduleId: 999,
          teacherId,
          name: "X",
        }),
      ).rejects.toThrow(NotFoundError)
    })

    it("should throw NotFoundError when update returns null", async () => {
      mockModuleRepo.getModuleById!.mockResolvedValue(createMockModule())
      mockClassRepo.getClassById!.mockResolvedValue({
        id: classId,
        teacherId,
      } as any)
      mockModuleRepo.updateModule!.mockResolvedValue(null)

      await expect(
        moduleService.renameModule({
          moduleId: 1,
          teacherId,
          name: "X",
        }),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe("toggleModulePublish", () => {
    it("should toggle publish state", async () => {
      mockModuleRepo.getModuleById!.mockResolvedValue(createMockModule())
      mockClassRepo.getClassById!.mockResolvedValue({
        id: classId,
        teacherId,
      } as any)
      const updated = createMockModule({ isPublished: false })
      mockModuleRepo.updateModule!.mockResolvedValue(updated)

      const result = await moduleService.toggleModulePublish({
        moduleId: 1,
        teacherId,
        isPublished: false,
      })

      expect(result.isPublished).toBe(false)
      expect(mockModuleRepo.updateModule).toHaveBeenCalledWith(1, {
        isPublished: false,
      })
    })

    it("should throw NotFoundError when module does not exist", async () => {
      mockModuleRepo.getModuleById!.mockResolvedValue(null)

      await expect(
        moduleService.toggleModulePublish({
          moduleId: 999,
          teacherId,
          isPublished: true,
        }),
      ).rejects.toThrow(NotFoundError)
    })

    it("should throw NotFoundError when update returns null", async () => {
      mockModuleRepo.getModuleById!.mockResolvedValue(createMockModule())
      mockClassRepo.getClassById!.mockResolvedValue({
        id: classId,
        teacherId,
      } as any)
      mockModuleRepo.updateModule!.mockResolvedValue(null)

      await expect(
        moduleService.toggleModulePublish({
          moduleId: 1,
          teacherId,
          isPublished: true,
        }),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe("deleteModule", () => {
    it("should delete a module when teacher owns it", async () => {
      mockModuleRepo.getModuleById!.mockResolvedValue(createMockModule())
      mockClassRepo.getClassById!.mockResolvedValue({
        id: classId,
        teacherId,
      } as any)
      mockModuleRepo.deleteModule!.mockResolvedValue(true)

      await expect(
        moduleService.deleteModule({ moduleId: 1, teacherId }),
      ).resolves.toBeUndefined()

      expect(mockModuleRepo.deleteModule).toHaveBeenCalledWith(1)
    })

    it("should throw NotFoundError when module does not exist", async () => {
      mockModuleRepo.getModuleById!.mockResolvedValue(null)

      await expect(
        moduleService.deleteModule({ moduleId: 999, teacherId }),
      ).rejects.toThrow(NotFoundError)
    })

    it("should throw NotClassOwnerError when teacher does not own the class", async () => {
      mockModuleRepo.getModuleById!.mockResolvedValue(createMockModule())
      mockClassRepo.getClassById!.mockResolvedValue({
        id: classId,
        teacherId: 999,
      } as any)

      await expect(
        moduleService.deleteModule({ moduleId: 1, teacherId }),
      ).rejects.toThrow(NotClassOwnerError)
    })

    it("should throw NotFoundError when delete returns false", async () => {
      mockModuleRepo.getModuleById!.mockResolvedValue(createMockModule())
      mockClassRepo.getClassById!.mockResolvedValue({
        id: classId,
        teacherId,
      } as any)
      mockModuleRepo.deleteModule!.mockResolvedValue(false)

      await expect(
        moduleService.deleteModule({ moduleId: 1, teacherId }),
      ).rejects.toThrow(NotFoundError)
    })
  })
})
