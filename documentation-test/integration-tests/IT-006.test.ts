/**
 * IT-006: Module Created → Class Curriculum Available Flow
 *
 * Module: Module Management
 * Unit: View Modules with Assignments
 * Date Tested: 4/10/26
 * Description: Verify that after a teacher creates a module, it appears in the class curriculum
 *              when modules with assignments are requested.
 * Expected Result: Newly created module is returned in the class curriculum listing.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-006 Integration Test Pass - Created Module Appears in Curriculum Listing
 * Suggested Figure Title (System UI): Module Management UI - Class Curriculum with New Module
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { ModuleService } from "../../backend-ts/src/modules/modules/module.service.js"

vi.mock("../../backend-ts/src/shared/transaction.js", () => ({
  withTransaction: vi.fn(async (callback: (ctx: unknown) => Promise<unknown>) => callback({})),
}))

describe("IT-006: Module Created → Class Curriculum Available Flow", () => {
  let moduleService: ModuleService
  let mockModuleRepo: any
  let mockClassRepo: any
  let mockAssignmentRepo: any
  let mockSubmissionRepo: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockModuleRepo = {
      createModule: vi.fn(),
      getModulesByClassId: vi.fn(),
      getPublishedModulesByClassId: vi.fn(),
      getModuleById: vi.fn(),
      updateModule: vi.fn(),
      deleteModule: vi.fn(),
    }

    mockClassRepo = {
      getClassById: vi.fn().mockResolvedValue({ id: 1, teacherId: 10 }),
      getStudentCount: vi.fn().mockResolvedValue(20),
    }

    mockAssignmentRepo = {
      getAssignmentsByClassId: vi.fn().mockResolvedValue([]),
    }

    mockSubmissionRepo = {
      getLatestSubmissionCountsByAssignmentIds: vi.fn().mockResolvedValue(new Map()),
    }

    moduleService = new ModuleService(
      mockModuleRepo,
      mockClassRepo,
      mockAssignmentRepo,
      mockSubmissionRepo,
    )
  })

  afterEach(() => { vi.clearAllMocks() })

  it("should make the module available in the curriculum after creation", async () => {
    const newModule = {
      id: 1,
      classId: 1,
      name: "Functions and Loops",
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockModuleRepo.createModule.mockResolvedValue(newModule)
    mockModuleRepo.getModulesByClassId.mockResolvedValue([newModule])

    await moduleService.createModule({ classId: 1, teacherId: 10, name: "Functions and Loops" })

    const curriculum = await moduleService.getModulesWithAssignments(1, false)

    expect(curriculum).toHaveLength(1)
    expect(curriculum[0].name).toBe("Functions and Loops")
  })

  it("should hide unpublished modules from students", async () => {
    const unpublishedModule = {
      id: 2,
      classId: 1,
      name: "Draft Module",
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockModuleRepo.createModule.mockResolvedValue(unpublishedModule)
    mockModuleRepo.getPublishedModulesByClassId.mockResolvedValue([])

    await moduleService.createModule({ classId: 1, teacherId: 10, name: "Draft Module" })

    const studentCurriculum = await moduleService.getModulesWithAssignments(1, true)

    expect(studentCurriculum).toHaveLength(0)
  })
})
