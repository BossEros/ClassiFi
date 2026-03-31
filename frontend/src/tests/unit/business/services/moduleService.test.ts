import { describe, it, expect, vi, beforeEach } from "vitest"

import * as moduleService from "@/business/services/moduleService"
import * as moduleRepository from "@/data/repositories/moduleRepository"
import type { Module, ISODateString } from "@/shared/types/class"

vi.mock("@/data/repositories/moduleRepository")

const toISO = (date: Date): ISODateString => date.toISOString() as ISODateString

describe("moduleService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockModule: Module = {
    id: 1,
    classId: 10,
    name: "Module 1",
    isPublished: true,
    createdAt: toISO(new Date()),
    updatedAt: toISO(new Date()),
    assignments: [],
  }

  describe("getModulesByClassId", () => {
    it("should return modules from the repository", async () => {
      vi.mocked(moduleRepository.getModulesByClassId).mockResolvedValue([mockModule])

      const result = await moduleService.getModulesByClassId(10)

      expect(result).toEqual([mockModule])
      expect(moduleRepository.getModulesByClassId).toHaveBeenCalledWith(10)
    })

    it("should return empty array when no modules exist", async () => {
      vi.mocked(moduleRepository.getModulesByClassId).mockResolvedValue([])

      const result = await moduleService.getModulesByClassId(10)

      expect(result).toEqual([])
    })
  })

  describe("createModule", () => {
    it("should create module via repository", async () => {
      vi.mocked(moduleRepository.createModule).mockResolvedValue(mockModule)

      const result = await moduleService.createModule(10, "Module 1")

      expect(result).toEqual(mockModule)
      expect(moduleRepository.createModule).toHaveBeenCalledWith(10, "Module 1")
    })

    it("should propagate repository errors", async () => {
      vi.mocked(moduleRepository.createModule).mockRejectedValue(
        new Error("Failed to create module"),
      )

      await expect(moduleService.createModule(10, "X")).rejects.toThrow(
        "Failed to create module",
      )
    })
  })

  describe("renameModule", () => {
    it("should rename module via repository", async () => {
      const renamed = { ...mockModule, name: "Renamed" }
      vi.mocked(moduleRepository.renameModule).mockResolvedValue(renamed)

      const result = await moduleService.renameModule(1, "Renamed")

      expect(result.name).toBe("Renamed")
      expect(moduleRepository.renameModule).toHaveBeenCalledWith(1, "Renamed")
    })
  })

  describe("toggleModulePublish", () => {
    it("should toggle publish state via repository", async () => {
      const unpublished = { ...mockModule, isPublished: false }
      vi.mocked(moduleRepository.toggleModulePublish).mockResolvedValue(unpublished)

      const result = await moduleService.toggleModulePublish(1, false)

      expect(result.isPublished).toBe(false)
      expect(moduleRepository.toggleModulePublish).toHaveBeenCalledWith(1, false)
    })
  })

  describe("deleteModule", () => {
    it("should delete module via repository", async () => {
      vi.mocked(moduleRepository.deleteModule).mockResolvedValue(undefined)

      await moduleService.deleteModule(1)

      expect(moduleRepository.deleteModule).toHaveBeenCalledWith(1)
    })

    it("should propagate repository errors", async () => {
      vi.mocked(moduleRepository.deleteModule).mockRejectedValue(
        new Error("Failed to delete module"),
      )

      await expect(moduleService.deleteModule(1)).rejects.toThrow(
        "Failed to delete module",
      )
    })
  })
})
