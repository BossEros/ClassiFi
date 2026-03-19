import { beforeEach, describe, expect, it, vi } from "vitest"
import { PlagiarismPersistenceService } from "../../src/modules/plagiarism/plagiarism-persistence.service.js"
import { SimilarityRepository } from "../../src/modules/plagiarism/similarity.repository.js"
import { SubmissionRepository } from "../../src/modules/submissions/submission.repository.js"

interface SimilarityRepositoryMock {
  getReportById: ReturnType<typeof vi.fn>
  getResultsByReport: ReturnType<typeof vi.fn>
  getResultWithFragments: ReturnType<typeof vi.fn>
  deleteReportsByAssignmentExcept: ReturnType<typeof vi.fn>
}

interface SubmissionRepositoryMock {
  getBatchSubmissionsWithStudents: ReturnType<typeof vi.fn>
  getSubmissionsWithStudentInfo: ReturnType<typeof vi.fn>
  getSubmissionWithStudent: ReturnType<typeof vi.fn>
  getSubmissionsByAssignment: ReturnType<typeof vi.fn>
}

describe("PlagiarismPersistenceService", () => {
  let plagiarismPersistenceService: PlagiarismPersistenceService
  let mockSimilarityRepository: SimilarityRepositoryMock
  let mockSubmissionRepository: SubmissionRepositoryMock

  beforeEach(() => {
    mockSimilarityRepository = {
      getReportById: vi.fn(),
      getResultsByReport: vi.fn(),
      getResultWithFragments: vi.fn(),
      deleteReportsByAssignmentExcept: vi.fn(),
    }

    mockSubmissionRepository = {
      getBatchSubmissionsWithStudents: vi.fn(),
      getSubmissionsWithStudentInfo: vi.fn(),
      getSubmissionWithStudent: vi.fn(),
      getSubmissionsByAssignment: vi.fn(),
    }

    plagiarismPersistenceService = new PlagiarismPersistenceService(
      mockSimilarityRepository as SimilarityRepository,
      mockSubmissionRepository as SubmissionRepository,
    )
  })

  describe("getReport", () => {
    it("preserves persisted zero hybrid scores instead of falling back to structural score", async () => {
      mockSimilarityRepository.getReportById.mockResolvedValue({
        id: 1,
        assignmentId: 100,
        teacherId: 200,
        totalSubmissions: 2,
        totalComparisons: 1,
        flaggedPairs: 0,
        averageSimilarity: "0.0000",
        highestSimilarity: "0.0000",
        generatedAt: new Date("2026-03-20T08:00:00.000Z"),
      })

      mockSimilarityRepository.getResultsByReport.mockResolvedValue([
        {
          id: 10,
          reportId: 1,
          submission1Id: 11,
          submission2Id: 12,
          structuralScore: "0.600000",
          semanticScore: "0.000000",
          hybridScore: "0.000000",
          overlap: 18,
          longestFragment: 6,
          leftCovered: 25,
          rightCovered: 22,
          leftTotal: 40,
          rightTotal: 42,
          isFlagged: false,
          analyzedAt: new Date("2026-03-20T08:00:00.000Z"),
        },
      ])

      mockSubmissionRepository.getBatchSubmissionsWithStudents.mockResolvedValue(
        [
          {
            submission: {
              id: 11,
              filePath: "left.py",
              fileName: "left.py",
              studentId: 1001,
            },
            studentName: "Left Student",
          },
          {
            submission: {
              id: 12,
              filePath: "right.py",
              fileName: "right.py",
              studentId: 1002,
            },
            studentName: "Right Student",
          },
        ],
      )

      mockSubmissionRepository.getSubmissionsWithStudentInfo.mockResolvedValue([
        {
          submission: {
            id: 11,
            filePath: "left.py",
            fileName: "left.py",
            studentId: 1001,
          },
          studentName: "Left Student",
        },
        {
          submission: {
            id: 12,
            filePath: "right.py",
            fileName: "right.py",
            studentId: 1002,
          },
          studentName: "Right Student",
        },
      ])

      const report = await plagiarismPersistenceService.getReport(1)

      expect(report).not.toBeNull()
      expect(report?.summary.averageSimilarity).toBe(0)
      expect(report?.summary.maxSimilarity).toBe(0)
      expect(report?.pairs).toHaveLength(1)
      expect(report?.pairs[0].structuralScore).toBe(0.6)
      expect(report?.pairs[0].semanticScore).toBe(0)
      expect(report?.pairs[0].hybridScore).toBe(0)
    })

    it("recomputes stale persisted hybrid scores using the current structural and semantic weights", async () => {
      mockSimilarityRepository.getReportById.mockResolvedValue({
        id: 1,
        assignmentId: 100,
        teacherId: 200,
        totalSubmissions: 3,
        totalComparisons: 2,
        flaggedPairs: 2,
        averageSimilarity: "0.5600",
        highestSimilarity: "0.5600",
        generatedAt: new Date("2026-03-20T08:00:00.000Z"),
      })

      mockSimilarityRepository.getResultsByReport.mockResolvedValue([
        {
          id: 10,
          reportId: 1,
          submission1Id: 11,
          submission2Id: 12,
          structuralScore: "0.230000",
          semanticScore: "0.890000",
          hybridScore: "0.560000",
          overlap: 18,
          longestFragment: 6,
          leftCovered: 25,
          rightCovered: 22,
          leftTotal: 40,
          rightTotal: 42,
          isFlagged: true,
          analyzedAt: new Date("2026-03-20T08:00:00.000Z"),
        },
        {
          id: 11,
          reportId: 1,
          submission1Id: 12,
          submission2Id: 13,
          structuralScore: "0.800000",
          semanticScore: "0.000000",
          hybridScore: "0.400000",
          overlap: 25,
          longestFragment: 10,
          leftCovered: 30,
          rightCovered: 28,
          leftTotal: 45,
          rightTotal: 44,
          isFlagged: false,
          analyzedAt: new Date("2026-03-20T08:00:00.000Z"),
        },
      ])

      mockSubmissionRepository.getBatchSubmissionsWithStudents.mockResolvedValue([
        {
          submission: {
            id: 11,
            filePath: "left.py",
            fileName: "left.py",
            studentId: 1001,
          },
          studentName: "Left Student",
        },
        {
          submission: {
            id: 12,
            filePath: "middle.py",
            fileName: "middle.py",
            studentId: 1002,
          },
          studentName: "Middle Student",
        },
        {
          submission: {
            id: 13,
            filePath: "right.py",
            fileName: "right.py",
            studentId: 1003,
          },
          studentName: "Right Student",
        },
      ])

      mockSubmissionRepository.getSubmissionsWithStudentInfo.mockResolvedValue([
        {
          submission: {
            id: 11,
            filePath: "left.py",
            fileName: "left.py",
            studentId: 1001,
          },
          studentName: "Left Student",
        },
        {
          submission: {
            id: 12,
            filePath: "middle.py",
            fileName: "middle.py",
            studentId: 1002,
          },
          studentName: "Middle Student",
        },
        {
          submission: {
            id: 13,
            filePath: "right.py",
            fileName: "right.py",
            studentId: 1003,
          },
          studentName: "Right Student",
        },
      ])

      const report = await plagiarismPersistenceService.getReport(1)

      expect(report).not.toBeNull()
      expect(report?.pairs).toHaveLength(2)
      expect(report?.pairs[0].structuralScore).toBe(0.23)
      expect(report?.pairs[0].semanticScore).toBe(0.89)
      expect(report?.pairs[0].hybridScore).toBe(0.428)
      expect(report?.pairs[1].hybridScore).toBe(0.56)
      expect(report?.summary.suspiciousPairs).toBe(1)
      expect(report?.summary.averageSimilarity).toBe(0.494)
      expect(report?.summary.maxSimilarity).toBe(0.56)
    })
  })
})
