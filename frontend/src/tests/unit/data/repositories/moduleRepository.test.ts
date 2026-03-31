import { describe, it, expect, vi, beforeEach } from "vitest"

import * as moduleRepository from "@/data/repositories/moduleRepository"
import { apiClient } from "@/data/api/apiClient"
import type { ISODateString } from "@/shared/types/class"

vi.mock("@/data/api/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const toISO = (date: Date): ISODateString => date.toISOString() as ISODateString

describe("moduleRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockModule = {
    id: 1,
    classId: 10,
    name: "Module 1",
    isPublished: true,
    createdAt: toISO(new Date()),
    updatedAt: toISO(new Date()),
    assignments: [],
  }

  describe("getModulesByClassId", () => {
    it("should return modules on success", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, modules: [mockModule] },
        error: null,
      })

      const result = await moduleRepository.getModulesByClassId(10)

      expect(result).toEqual([mockModule])
      expect(apiClient.get).toHaveBeenCalledWith("/classes/10/modules")
    })

    it("should throw error on API failure", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: null,
        error: "Network error",
      })

      await expect(moduleRepository.getModulesByClassId(10)).rejects.toThrow(
        "Network error",
      )
    })

    it("should throw error when success is false", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: false, message: "Unauthorized" },
        error: null,
      })

      await expect(moduleRepository.getModulesByClassId(10)).rejects.toThrow(
        "Unauthorized",
      )
    })
  })

  describe("createModule", () => {
    it("should create and return module", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { success: true, module: mockModule },
        error: null,
      })

      const result = await moduleRepository.createModule(10, "Module 1")

      expect(result).toEqual(mockModule)
      expect(apiClient.post).toHaveBeenCalledWith("/classes/10/modules", {
        name: "Module 1",
      })
    })

    it("should throw error on failure", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: null,
        error: "Failed",
      })

      await expect(
        moduleRepository.createModule(10, "X"),
      ).rejects.toThrow("Failed")
    })
  })

  describe("renameModule", () => {
    it("should rename and return module", async () => {
      const renamed = { ...mockModule, name: "Renamed" }
      vi.mocked(apiClient.put).mockResolvedValue({
        data: { success: true, module: renamed },
        error: null,
      })

      const result = await moduleRepository.renameModule(1, "Renamed")

      expect(result.name).toBe("Renamed")
      expect(apiClient.put).toHaveBeenCalledWith("/modules/1", {
        name: "Renamed",
      })
    })

    it("should throw error on failure", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({
        data: null,
        error: "Not found",
      })

      await expect(
        moduleRepository.renameModule(999, "X"),
      ).rejects.toThrow("Not found")
    })
  })

  describe("toggleModulePublish", () => {
    it("should toggle publish state and return module", async () => {
      const toggled = { ...mockModule, isPublished: false }
      vi.mocked(apiClient.patch).mockResolvedValue({
        data: { success: true, module: toggled },
        error: null,
      })

      const result = await moduleRepository.toggleModulePublish(1, false)

      expect(result.isPublished).toBe(false)
      expect(apiClient.patch).toHaveBeenCalledWith("/modules/1/publish", {
        isPublished: false,
      })
    })
  })

  describe("deleteModule", () => {
    it("should delete module without error", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        data: { success: true },
        error: null,
      })

      await expect(moduleRepository.deleteModule(1)).resolves.toBeUndefined()
      expect(apiClient.delete).toHaveBeenCalledWith("/modules/1")
    })

    it("should throw error on failure", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        data: { success: false, message: "Cannot delete" },
        error: null,
      })

      await expect(moduleRepository.deleteModule(1)).rejects.toThrow(
        "Cannot delete",
      )
    })
  })
})
