import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import { PlagiarismAutoAnalysisService } from "../../src/modules/plagiarism/plagiarism-auto-analysis.service.js"
import { settings } from "../../src/shared/config.js"

describe("PlagiarismAutoAnalysisService", () => {
  let service: PlagiarismAutoAnalysisService
  let mockAssignmentRepo: any
  let mockSubmissionRepo: any
  let mockSimilarityRepo: any
  let mockPlagiarismService: any
  let originalAutoSimilarityEnabled: boolean
  let originalAutoSimilarityDebounceMs: number
  let originalAutoSimilarityReconciliationIntervalMs: number
  let originalAutoSimilarityMinLatestSubmissions: number

  beforeEach(() => {
    vi.useFakeTimers()

    originalAutoSimilarityEnabled = settings.autoSimilarityEnabled
    originalAutoSimilarityDebounceMs = settings.autoSimilarityDebounceMs
    originalAutoSimilarityReconciliationIntervalMs =
      settings.autoSimilarityReconciliationIntervalMs
    originalAutoSimilarityMinLatestSubmissions =
      settings.autoSimilarityMinLatestSubmissions

    settings.autoSimilarityEnabled = true
    settings.autoSimilarityDebounceMs = 50
    settings.autoSimilarityReconciliationIntervalMs = 1000
    settings.autoSimilarityMinLatestSubmissions = 2

    mockAssignmentRepo = {
      getAssignmentById: vi.fn().mockResolvedValue({ id: 1, isActive: true }),
    }

    mockSubmissionRepo = {
      getLatestSubmissionSnapshots: vi.fn().mockResolvedValue([]),
      getSubmissionsByAssignment: vi.fn().mockResolvedValue([
        { submittedAt: new Date("2026-01-01T10:00:00.000Z") },
        { submittedAt: new Date("2026-01-01T10:01:00.000Z") },
      ]),
    }

    mockSimilarityRepo = {
      getLatestReportByAssignment: vi.fn().mockResolvedValue(undefined),
    }

    mockPlagiarismService = {
      analyzeAssignmentSubmissions: vi.fn().mockResolvedValue(undefined),
    }

    service = new PlagiarismAutoAnalysisService(
      mockAssignmentRepo,
      mockSubmissionRepo,
      mockSimilarityRepo,
      mockPlagiarismService,
    )
  })

  afterEach(() => {
    service.stop()

    settings.autoSimilarityEnabled = originalAutoSimilarityEnabled
    settings.autoSimilarityDebounceMs = originalAutoSimilarityDebounceMs
    settings.autoSimilarityReconciliationIntervalMs =
      originalAutoSimilarityReconciliationIntervalMs
    settings.autoSimilarityMinLatestSubmissions =
      originalAutoSimilarityMinLatestSubmissions

    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it("debounces submission-triggered scheduling per assignment", async () => {
    await service.scheduleFromSubmission(1)
    await service.scheduleFromSubmission(1)

    expect(
      mockPlagiarismService.analyzeAssignmentSubmissions,
    ).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(50)

    expect(
      mockPlagiarismService.analyzeAssignmentSubmissions,
    ).toHaveBeenCalledTimes(1)
    expect(mockPlagiarismService.analyzeAssignmentSubmissions).toHaveBeenCalledWith(1)
  })

  it("queues one rerun when a trigger happens while analysis is in progress", async () => {
    let resolveFirstRun: (() => void) | null = null
    mockPlagiarismService.analyzeAssignmentSubmissions.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirstRun = resolve
        }),
    )

    await service.scheduleFromSubmission(1)
    await vi.advanceTimersByTimeAsync(50)

    expect(
      mockPlagiarismService.analyzeAssignmentSubmissions,
    ).toHaveBeenCalledTimes(1)

    await service.scheduleFromSubmission(1)
    await vi.advanceTimersByTimeAsync(50)

    resolveFirstRun?.()
    await Promise.resolve()
    await vi.runAllTimersAsync()

    expect(
      mockPlagiarismService.analyzeAssignmentSubmissions,
    ).toHaveBeenCalledTimes(2)
  })

  it("schedules reconciliation analysis when report is missing or stale", async () => {
    mockSubmissionRepo.getLatestSubmissionSnapshots.mockResolvedValue([
      {
        assignmentId: 1,
        latestSubmissionCount: 2,
        latestSubmittedAt: new Date("2026-01-01T10:02:00.000Z"),
      },
    ])
    mockSimilarityRepo.getLatestReportByAssignment.mockResolvedValue(undefined)

    await service.runReconciliationNow()
    await vi.runAllTimersAsync()

    expect(mockSubmissionRepo.getLatestSubmissionSnapshots).toHaveBeenCalledWith(
      2,
    )
    expect(
      mockPlagiarismService.analyzeAssignmentSubmissions,
    ).toHaveBeenCalledWith(1)
  })

  it("skips reconciliation-triggered scheduling when latest report is current", async () => {
    mockSubmissionRepo.getLatestSubmissionSnapshots.mockResolvedValue([
      {
        assignmentId: 1,
        latestSubmissionCount: 2,
        latestSubmittedAt: new Date("2026-01-01T10:02:00.000Z"),
      },
    ])
    mockSimilarityRepo.getLatestReportByAssignment.mockResolvedValue({
      id: 99,
      totalSubmissions: 2,
      generatedAt: new Date("2026-01-01T10:05:00.000Z"),
    })

    await service.runReconciliationNow()
    await vi.runAllTimersAsync()

    expect(
      mockPlagiarismService.analyzeAssignmentSubmissions,
    ).not.toHaveBeenCalled()
  })
})
