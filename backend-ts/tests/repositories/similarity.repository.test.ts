/**
 * SimilarityRepository Unit Tests
 * Tests for plagiarism similarity report and result operations
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock database module
vi.mock("../../src/shared/database.js", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock drizzle-orm
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field, value) => ({ field, value, type: "eq" })),
  desc: vi.fn((field) => ({ field, type: "desc" })),
  sql: vi.fn((strings, ...values) => ({ type: "sql", strings, values })),
}))

// Mock models
vi.mock("../../src/modules/plagiarism/similarity-report.model.js", () => ({
  similarityReports: {
    id: "id",
    assignmentId: "assignmentId",
    generatedAt: "generatedAt",
  },
}))

vi.mock("../../src/modules/plagiarism/similarity-result.model.js", () => ({
  similarityResults: {
    id: "id",
    reportId: "reportId",
    structuralScore: "structuralScore",
  },
}))

vi.mock("../../src/modules/plagiarism/match-fragment.model.js", () => ({
  matchFragments: {
    id: "id",
    similarityResultId: "similarityResultId",
  },
}))

describe("SimilarityRepository", () => {
  let mockDb: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const { db } = await import("../../src/shared/database.js")
    mockDb = db
  })

  // ============ createReport Tests ============
  describe("createReport Logic", () => {
    it("should create a new similarity report", async () => {
      const newReport = {
        id: 1,
        assignmentId: 1,
        teacherId: 1,
        totalSubmissions: 10,
        totalComparisons: 45,
        flaggedPairs: 3,
        averageSimilarity: "0.35",
        highestSimilarity: "0.85",
        generatedAt: new Date(),
      }
      const returningMock = vi.fn().mockResolvedValue([newReport])
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock })
      const insertMock = vi.fn().mockReturnValue({ values: valuesMock })
      mockDb.insert = insertMock

      const { SimilarityRepository } =
        await import("../../src/modules/plagiarism/similarity.repository.js")
      const similarityRepo = new SimilarityRepository()

      const result = await similarityRepo.createReport({
        assignmentId: 1,
        teacherId: 1,
        totalSubmissions: 10,
        totalComparisons: 45,
        flaggedPairs: 3,
        averageSimilarity: "0.35",
        highestSimilarity: "0.85",
      })

      expect(result.id).toBe(1)
      expect(result.assignmentId).toBe(1)
    })
  })

  // ============ getReportById Tests ============
  describe("getReportById Logic", () => {
    it("should return report when found", async () => {
      const mockReport = { id: 1, assignmentId: 1 }
      const limitMock = vi.fn().mockResolvedValue([mockReport])
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { SimilarityRepository } =
        await import("../../src/modules/plagiarism/similarity.repository.js")
      const similarityRepo = new SimilarityRepository()

      const result = await similarityRepo.getReportById(1)

      expect(result?.id).toBe(1)
    })

    it("should return undefined when report not found", async () => {
      const limitMock = vi.fn().mockResolvedValue([])
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { SimilarityRepository } =
        await import("../../src/modules/plagiarism/similarity.repository.js")
      const similarityRepo = new SimilarityRepository()

      const result = await similarityRepo.getReportById(999)

      expect(result).toBeUndefined()
    })
  })

  // ============ getReportsByAssignment Tests ============
  describe("getReportsByAssignment Logic", () => {
    it("should return reports ordered by generatedAt descending", async () => {
      const reports = [
        { id: 2, assignmentId: 1, generatedAt: new Date("2024-06-15") },
        { id: 1, assignmentId: 1, generatedAt: new Date("2024-06-10") },
      ]
      const orderByMock = vi.fn().mockResolvedValue(reports)
      const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { SimilarityRepository } =
        await import("../../src/modules/plagiarism/similarity.repository.js")
      const similarityRepo = new SimilarityRepository()

      const result = await similarityRepo.getReportsByAssignment(1)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe(2) // Most recent first
    })

    it("should return empty array when no reports", async () => {
      const orderByMock = vi.fn().mockResolvedValue([])
      const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { SimilarityRepository } =
        await import("../../src/modules/plagiarism/similarity.repository.js")
      const similarityRepo = new SimilarityRepository()

      const result = await similarityRepo.getReportsByAssignment(999)

      expect(result).toHaveLength(0)
    })
  })

  // ============ createResults Tests ============
  describe("createResults Logic", () => {
    it("should batch insert results", async () => {
      const results = [
        { id: 1, reportId: 1, submission1Id: 1, submission2Id: 2 },
        { id: 2, reportId: 1, submission1Id: 1, submission2Id: 3 },
      ]
      const returningMock = vi.fn().mockResolvedValue(results)
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock })
      const insertMock = vi.fn().mockReturnValue({ values: valuesMock })
      mockDb.insert = insertMock

      const { SimilarityRepository } =
        await import("../../src/modules/plagiarism/similarity.repository.js")
      const similarityRepo = new SimilarityRepository()

      const result = await similarityRepo.createResults([
        {
          reportId: 1,
          submission1Id: 1,
          submission2Id: 2,
          structuralScore: "0.5",
        } as any,
        {
          reportId: 1,
          submission1Id: 1,
          submission2Id: 3,
          structuralScore: "0.7",
        } as any,
      ])

      expect(result).toHaveLength(2)
    })

    it("should return empty array when no results to insert", async () => {
      const { SimilarityRepository } =
        await import("../../src/modules/plagiarism/similarity.repository.js")
      const similarityRepo = new SimilarityRepository()

      const result = await similarityRepo.createResults([])

      expect(result).toHaveLength(0)
    })
  })

  // ============ getResultsByReport Tests ============
  describe("getResultsByReport Logic", () => {
    it("should return results ordered by structural score", async () => {
      const results = [
        { id: 1, reportId: 1, structuralScore: "0.9" },
        { id: 2, reportId: 1, structuralScore: "0.5" },
      ]
      const orderByMock = vi.fn().mockResolvedValue(results)
      const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { SimilarityRepository } =
        await import("../../src/modules/plagiarism/similarity.repository.js")
      const similarityRepo = new SimilarityRepository()

      const result = await similarityRepo.getResultsByReport(1)

      expect(result).toHaveLength(2)
    })
  })

  // ============ createFragments Tests ============
  describe("createFragments Logic", () => {
    it("should batch insert fragments", async () => {
      const fragments = [
        { id: 1, similarityResultId: 1, leftStartRow: 1, rightStartRow: 1 },
        { id: 2, similarityResultId: 1, leftStartRow: 5, rightStartRow: 8 },
      ]
      const returningMock = vi.fn().mockResolvedValue(fragments)
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock })
      const insertMock = vi.fn().mockReturnValue({ values: valuesMock })
      mockDb.insert = insertMock

      const { SimilarityRepository } =
        await import("../../src/modules/plagiarism/similarity.repository.js")
      const similarityRepo = new SimilarityRepository()

      const result = await similarityRepo.createFragments([
        { similarityResultId: 1, leftStartRow: 1 } as any,
        { similarityResultId: 1, leftStartRow: 5 } as any,
      ])

      expect(result).toHaveLength(2)
    })

    it("should return empty array when no fragments to insert", async () => {
      const { SimilarityRepository } =
        await import("../../src/modules/plagiarism/similarity.repository.js")
      const similarityRepo = new SimilarityRepository()

      const result = await similarityRepo.createFragments([])

      expect(result).toHaveLength(0)
    })
  })

  // ============ getResultById Tests ============
  describe("getResultById Logic", () => {
    it("should return result when found", async () => {
      const mockResult = { id: 1, reportId: 1 }
      const limitMock = vi.fn().mockResolvedValue([mockResult])
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { SimilarityRepository } =
        await import("../../src/modules/plagiarism/similarity.repository.js")
      const similarityRepo = new SimilarityRepository()

      const result = await similarityRepo.getResultById(1)

      expect(result?.id).toBe(1)
    })
  })

  // ============ getFragmentsByResult Tests ============
  describe("getFragmentsByResult Logic", () => {
    it("should return fragments for a result", async () => {
      const fragments = [
        { id: 1, similarityResultId: 1 },
        { id: 2, similarityResultId: 1 },
      ]
      const whereMock = vi.fn().mockResolvedValue(fragments)
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { SimilarityRepository } =
        await import("../../src/modules/plagiarism/similarity.repository.js")
      const similarityRepo = new SimilarityRepository()

      const result = await similarityRepo.getFragmentsByResult(1)

      expect(result).toHaveLength(2)
    })
  })

  // ============ getResultWithFragments Tests ============
  describe("getResultWithFragments Logic", () => {
    it("should return null when result not found", async () => {
      const limitMock = vi.fn().mockResolvedValue([])
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { SimilarityRepository } =
        await import("../../src/modules/plagiarism/similarity.repository.js")
      const similarityRepo = new SimilarityRepository()

      const result = await similarityRepo.getResultWithFragments(999)

      expect(result).toBeNull()
    })
  })

  // ============ deleteReport Tests ============
  describe("deleteReport Logic", () => {
    it("should return true when report is deleted", async () => {
      const returningMock = vi.fn().mockResolvedValue([{ id: 1 }])
      const whereMock = vi.fn().mockReturnValue({ returning: returningMock })
      const deleteMock = vi.fn().mockReturnValue({ where: whereMock })
      mockDb.delete = deleteMock

      const { SimilarityRepository } =
        await import("../../src/modules/plagiarism/similarity.repository.js")
      const similarityRepo = new SimilarityRepository()

      const result = await similarityRepo.deleteReport(1)

      expect(result).toBe(true)
    })

    it("should return false when report not found", async () => {
      const returningMock = vi.fn().mockResolvedValue([])
      const whereMock = vi.fn().mockReturnValue({ returning: returningMock })
      const deleteMock = vi.fn().mockReturnValue({ where: whereMock })
      mockDb.delete = deleteMock

      const { SimilarityRepository } =
        await import("../../src/modules/plagiarism/similarity.repository.js")
      const similarityRepo = new SimilarityRepository()

      const result = await similarityRepo.deleteReport(999)

      expect(result).toBe(false)
    })
  })
})
