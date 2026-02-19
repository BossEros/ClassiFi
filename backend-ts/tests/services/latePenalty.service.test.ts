import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  LatePenaltyService,
  DEFAULT_PENALTY_CONFIG,
} from "../../src/services/latePenalty.service.js"
import type { AssignmentRepository } from "../../src/modules/assignments/assignment.repository.js"
import type { LatePenaltyConfig } from "../../src/models/index.js"

describe("LatePenaltyService", () => {
  let latePenaltyService: LatePenaltyService
  let mockAssignmentRepo: {
    getLatePenaltyConfig: ReturnType<typeof vi.fn>
    setLatePenaltyConfig: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockAssignmentRepo = {
      getLatePenaltyConfig: vi.fn(),
      setLatePenaltyConfig: vi.fn(),
    }

    latePenaltyService = new LatePenaltyService(
      mockAssignmentRepo as unknown as AssignmentRepository,
    )
  })

  describe("calculatePenalty", () => {
    const testConfig: LatePenaltyConfig = {
      tiers: [
        { hoursLate: 24, penaltyPercent: 10 },
        { hoursLate: 48, penaltyPercent: 25 },
        { hoursLate: 96, penaltyPercent: 50 },
      ],
      rejectAfterHours: 120,
    }

    it("returns no penalty for on-time submission", () => {
      const deadline = new Date("2026-01-15T23:59:59")
      const submissionDate = new Date("2026-01-15T12:00:00")

      const result = latePenaltyService.calculatePenalty(
        submissionDate,
        deadline,
        testConfig,
      )

      expect(result.isLate).toBe(false)
      expect(result.hoursLate).toBe(0)
      expect(result.penaltyPercent).toBe(0)
      expect(result.gradeMultiplier).toBe(1.0)
      expect(result.tierLabel).toBe("On time")
    })

    it("applies first tier immediately after deadline", () => {
      const deadline = new Date("2026-01-15T00:00:00")
      const submissionDate = new Date("2026-01-15T12:00:00")

      const result = latePenaltyService.calculatePenalty(
        submissionDate,
        deadline,
        testConfig,
      )

      expect(result.isLate).toBe(true)
      expect(result.penaltyPercent).toBe(10)
      expect(result.gradeMultiplier).toBe(0.9)
    })

    it("applies 25% penalty up to 48 hours late", () => {
      const deadline = new Date("2026-01-15T00:00:00")
      const submissionDate = new Date("2026-01-16T16:00:00")

      const result = latePenaltyService.calculatePenalty(
        submissionDate,
        deadline,
        testConfig,
      )

      expect(result.isLate).toBe(true)
      expect(result.penaltyPercent).toBe(25)
      expect(result.gradeMultiplier).toBe(0.75)
    })

    it("applies last tier when late beyond all configured tiers", () => {
      const config50Test: LatePenaltyConfig = {
        tiers: [
          { hoursLate: 24, penaltyPercent: 10 },
          { hoursLate: 48, penaltyPercent: 25 },
          { hoursLate: 96, penaltyPercent: 50 },
        ],
        rejectAfterHours: 200,
      }

      const deadline = new Date("2026-01-15T00:00:00")
      const submissionDate = new Date("2026-01-20T01:00:00")

      const result = latePenaltyService.calculatePenalty(
        submissionDate,
        deadline,
        config50Test,
      )

      expect(result.isLate).toBe(true)
      expect(result.penaltyPercent).toBe(50)
      expect(result.gradeMultiplier).toBe(0.5)
    })

    it("rejects submission after rejectAfterHours", () => {
      const deadline = new Date("2026-01-15T00:00:00")
      const submissionDate = new Date("2026-01-20T10:00:00")

      const result = latePenaltyService.calculatePenalty(
        submissionDate,
        deadline,
        testConfig,
      )

      expect(result.isLate).toBe(true)
      expect(result.penaltyPercent).toBe(100)
      expect(result.gradeMultiplier).toBe(0)
      expect(result.tierLabel).toBe("Submission rejected (too late)")
    })

    it("handles null rejectAfterHours (no rejection)", () => {
      const configNoReject: LatePenaltyConfig = {
        ...testConfig,
        rejectAfterHours: null,
      }
      const deadline = new Date("2026-01-15T00:00:00")
      const submissionDate = new Date("2026-01-25T00:00:00")

      const result = latePenaltyService.calculatePenalty(
        submissionDate,
        deadline,
        configNoReject,
      )

      expect(result.isLate).toBe(true)
      expect(result.penaltyPercent).toBe(50)
      expect(result.gradeMultiplier).toBe(0.5)
    })

    it("handles config with no tiers", () => {
      const configNoTiers: LatePenaltyConfig = {
        tiers: [],
        rejectAfterHours: null,
      }
      const deadline = new Date("2026-01-15T00:00:00")
      const submissionDate = new Date("2026-01-20T00:00:00")

      const result = latePenaltyService.calculatePenalty(
        submissionDate,
        deadline,
        configNoTiers,
      )

      expect(result.isLate).toBe(true)
      expect(result.penaltyPercent).toBe(0)
      expect(result.gradeMultiplier).toBe(1.0)
    })
  })

  describe("applyPenalty", () => {
    it("returns full grade for on-time submission", () => {
      const penalty = {
        isLate: false,
        hoursLate: 0,
        penaltyPercent: 0,
        gradeMultiplier: 1.0,
        tierLabel: "On time",
      }

      const result = latePenaltyService.applyPenalty(100, penalty)
      expect(result).toBe(100)
    })

    it("applies 10% penalty correctly", () => {
      const penalty = {
        isLate: true,
        hoursLate: 48,
        penaltyPercent: 10,
        gradeMultiplier: 0.9,
        tierLabel: "Late",
      }

      const result = latePenaltyService.applyPenalty(100, penalty)
      expect(result).toBe(90)
    })

    it("applies 25% penalty correctly", () => {
      const penalty = {
        isLate: true,
        hoursLate: 72,
        penaltyPercent: 25,
        gradeMultiplier: 0.75,
        tierLabel: "Late",
      }

      const result = latePenaltyService.applyPenalty(80, penalty)
      expect(result).toBe(60)
    })

    it("returns 0 for rejected submission", () => {
      const penalty = {
        isLate: true,
        hoursLate: 200,
        penaltyPercent: 100,
        gradeMultiplier: 0,
        tierLabel: "Rejected",
      }

      const result = latePenaltyService.applyPenalty(100, penalty)
      expect(result).toBe(0)
    })

    it("never returns negative grades", () => {
      const penalty = {
        isLate: true,
        hoursLate: 100,
        penaltyPercent: 50,
        gradeMultiplier: 0.5,
        tierLabel: "Late",
      }

      const result = latePenaltyService.applyPenalty(0, penalty)
      expect(result).toBe(0)
      expect(result).toBeGreaterThanOrEqual(0)
    })

    it("rounds partial grades", () => {
      const penalty = {
        isLate: true,
        hoursLate: 48,
        penaltyPercent: 10,
        gradeMultiplier: 0.9,
        tierLabel: "Late",
      }

      const result = latePenaltyService.applyPenalty(85, penalty)
      expect(result).toBe(77)
    })
  })

  describe("getAssignmentConfig", () => {
    it("returns config when enabled", async () => {
      const mockConfig: LatePenaltyConfig = {
        tiers: [{ hoursLate: 24, penaltyPercent: 20 }],
        rejectAfterHours: 72,
      }

      mockAssignmentRepo.getLatePenaltyConfig.mockResolvedValue({
        enabled: true,
        config: mockConfig,
      })

      const result = await latePenaltyService.getAssignmentConfig(1)

      expect(result.enabled).toBe(true)
      expect(result.config).toEqual(mockConfig)
      expect(mockAssignmentRepo.getLatePenaltyConfig).toHaveBeenCalledWith(1)
    })

    it("returns default config when not found", async () => {
      mockAssignmentRepo.getLatePenaltyConfig.mockResolvedValue(null)

      const result = await latePenaltyService.getAssignmentConfig(1)

      expect(result.enabled).toBe(false)
      expect(result.config).toEqual(DEFAULT_PENALTY_CONFIG)
    })

    it("returns default config when config is null but enabled", async () => {
      mockAssignmentRepo.getLatePenaltyConfig.mockResolvedValue({
        enabled: true,
        config: null,
      })

      const result = await latePenaltyService.getAssignmentConfig(1)

      expect(result.enabled).toBe(true)
      expect(result.config).toEqual(DEFAULT_PENALTY_CONFIG)
    })
  })

  describe("setAssignmentConfig", () => {
    it("sets config correctly", async () => {
      const newConfig: LatePenaltyConfig = {
        tiers: [{ hoursLate: 24, penaltyPercent: 15 }],
        rejectAfterHours: null,
      }

      await latePenaltyService.setAssignmentConfig(1, true, newConfig)

      expect(mockAssignmentRepo.setLatePenaltyConfig).toHaveBeenCalledWith(
        1,
        true,
        newConfig,
      )
    })

    it("disables config correctly", async () => {
      await latePenaltyService.setAssignmentConfig(
        1,
        false,
        DEFAULT_PENALTY_CONFIG,
      )

      expect(mockAssignmentRepo.setLatePenaltyConfig).toHaveBeenCalledWith(
        1,
        false,
        DEFAULT_PENALTY_CONFIG,
      )
    })

    it("rejects legacy tiers that are missing hours fields", async () => {
      await expect(
        latePenaltyService.setAssignmentConfig(1, true, {
          tiers: [{ penaltyPercent: 10 }],
          rejectAfterHours: null,
        }),
      ).rejects.toThrow(
        "Invalid late penalty configuration: each tier must include hoursLate or hoursAfterGrace",
      )
    })
  })

  describe("getDefaultConfig", () => {
    it("returns a copy of default config", () => {
      const config1 = latePenaltyService.getDefaultConfig()
      const config2 = latePenaltyService.getDefaultConfig()

      expect(config1).toEqual(config2)
      expect(config1).not.toBe(config2)
    })

    it("has sensible defaults", () => {
      const config = latePenaltyService.getDefaultConfig()

      expect(config.tiers.length).toBeGreaterThan(0)
      expect(config.tiers[0].hoursLate).toBeGreaterThan(0)
      expect(config.tiers[0].penaltyPercent).toBeGreaterThan(0)
    })
  })
})
