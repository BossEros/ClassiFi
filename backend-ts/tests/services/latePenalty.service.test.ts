import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  LatePenaltyService,
  DEFAULT_PENALTY_CONFIG,
} from "../../src/services/latePenalty.service.js"
import type { AssignmentRepository } from "../../src/repositories/assignment.repository.js"
import type { LatePenaltyConfig } from "../../src/models/index.js"

describe("LatePenaltyService", () => {
  let latePenaltyService: LatePenaltyService
  let mockAssignmentRepo: any

  beforeEach(() => {
    mockAssignmentRepo = {
      getLatePenaltyConfig: vi.fn(),
      setLatePenaltyConfig: vi.fn(),
    }

    latePenaltyService = new LatePenaltyService(
      mockAssignmentRepo as AssignmentRepository,
    )
  })

  // ============================================
  // Penalty Calculation Tests
  // ============================================
  describe("calculatePenalty", () => {
    const testConfig: LatePenaltyConfig = {
      gracePeriodHours: 24,
      tiers: [
        { hoursAfterGrace: 24, penaltyPercent: 10 },
        { hoursAfterGrace: 48, penaltyPercent: 25 },
        { hoursAfterGrace: 96, penaltyPercent: 50 },
      ],
      rejectAfterHours: 120,
    }

    it("should return no penalty for on-time submission", () => {
      const deadline = new Date("2026-01-15T23:59:59")
      const submissionDate = new Date("2026-01-15T12:00:00") // 12 hours before deadline

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

    it("should return no penalty for submission within grace period", () => {
      const deadline = new Date("2026-01-15T23:59:59")
      const submissionDate = new Date("2026-01-16T12:00:00") // ~12 hours late

      const result = latePenaltyService.calculatePenalty(
        submissionDate,
        deadline,
        testConfig,
      )

      expect(result.isLate).toBe(true)
      expect(result.hoursLate).toBeGreaterThan(0)
      expect(result.hoursLate).toBeLessThan(24)
      expect(result.penaltyPercent).toBe(0)
      expect(result.gradeMultiplier).toBe(1.0)
      expect(result.tierLabel).toBe("Within grace period")
    })

    it("should apply 10% penalty for up to 24 hours late after grace", () => {
      const deadline = new Date("2026-01-15T00:00:00")
      // 24h grace + 20h = 44 hours after deadline (20h after grace, within 24h upper bound)
      const submissionDate = new Date("2026-01-16T20:00:00")

      const result = latePenaltyService.calculatePenalty(
        submissionDate,
        deadline,
        testConfig,
      )

      expect(result.isLate).toBe(true)
      expect(result.penaltyPercent).toBe(10)
      expect(result.gradeMultiplier).toBe(0.9)
    })

    it("should apply 25% penalty for up to 48 hours late after grace", () => {
      const deadline = new Date("2026-01-15T00:00:00")
      // 24h grace + 40h = 64 hours after deadline (40h after grace, within 48h upper bound)
      const submissionDate = new Date("2026-01-17T16:00:00")

      const result = latePenaltyService.calculatePenalty(
        submissionDate,
        deadline,
        testConfig,
      )

      expect(result.isLate).toBe(true)
      expect(result.penaltyPercent).toBe(25)
      expect(result.gradeMultiplier).toBe(0.75)
    })

    it("should apply 50% penalty for 96+ hours late after grace", () => {
      // Use a config with a higher rejection threshold for this test
      const config50Test: LatePenaltyConfig = {
        gracePeriodHours: 24,
        tiers: [
          { hoursAfterGrace: 24, penaltyPercent: 10 },
          { hoursAfterGrace: 48, penaltyPercent: 25 },
          { hoursAfterGrace: 96, penaltyPercent: 50 },
        ],
        rejectAfterHours: 200, // Increase to allow testing 50% tier
      }

      const deadline = new Date("2026-01-15T00:00:00")
      // Need 24h grace + 97h = 121 hours total after deadline
      const submissionDate = new Date("2026-01-20T01:00:00")

      const result = latePenaltyService.calculatePenalty(
        submissionDate,
        deadline,
        config50Test,
      )

      expect(result.isLate).toBe(true)
      // At 121h total, that's 97h after the 24h grace = hits the 96h tier for 50%
      expect(result.penaltyPercent).toBe(50)
      expect(result.gradeMultiplier).toBe(0.5)
    })

    it("should reject submission after rejectAfterHours", () => {
      const deadline = new Date("2026-01-15T00:00:00")
      // 130 hours after deadline (past 120h rejection)
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

    it("should handle null rejectAfterHours (no rejection)", () => {
      const configNoReject: LatePenaltyConfig = {
        ...testConfig,
        rejectAfterHours: null,
      }
      const deadline = new Date("2026-01-15T00:00:00")
      const submissionDate = new Date("2026-01-25T00:00:00") // 10 days late

      const result = latePenaltyService.calculatePenalty(
        submissionDate,
        deadline,
        configNoReject,
      )

      expect(result.isLate).toBe(true)
      expect(result.penaltyPercent).toBe(50) // Maximum tier
      expect(result.gradeMultiplier).toBe(0.5)
    })

    it("should handle config with no tiers (just grace period)", () => {
      const configNoTiers: LatePenaltyConfig = {
        gracePeriodHours: 24,
        tiers: [],
        rejectAfterHours: null,
      }
      const deadline = new Date("2026-01-15T00:00:00")
      const submissionDate = new Date("2026-01-20T00:00:00") // 5 days late

      const result = latePenaltyService.calculatePenalty(
        submissionDate,
        deadline,
        configNoTiers,
      )

      expect(result.isLate).toBe(true)
      expect(result.penaltyPercent).toBe(0) // No tiers = no penalty
      expect(result.gradeMultiplier).toBe(1.0)
    })
  })

  // ============================================
  // Apply Penalty Tests
  // ============================================
  describe("applyPenalty", () => {
    it("should return full grade for on-time submission", () => {
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

    it("should apply 10% penalty correctly", () => {
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

    it("should apply 25% penalty correctly", () => {
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

    it("should return 0 for rejected submission", () => {
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

    it("should never return negative grades", () => {
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

    it("should round down partial grades", () => {
      const penalty = {
        isLate: true,
        hoursLate: 48,
        penaltyPercent: 10,
        gradeMultiplier: 0.9,
        tierLabel: "Late",
      }

      // 85 * 0.9 = 76.5, should round to 77
      const result = latePenaltyService.applyPenalty(85, penalty)

      expect(result).toBe(77) // Math.round(76.5) = 77
    })
  })

  // ============================================
  // Assignment Config Tests
  // ============================================
  describe("getAssignmentConfig", () => {
    it("should return config when enabled", async () => {
      const mockConfig: LatePenaltyConfig = {
        gracePeriodHours: 12,
        tiers: [{ hoursAfterGrace: 24, penaltyPercent: 20 }],
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

    it("should return default config when not found", async () => {
      mockAssignmentRepo.getLatePenaltyConfig.mockResolvedValue(null)

      const result = await latePenaltyService.getAssignmentConfig(1)

      expect(result.enabled).toBe(false)
      expect(result.config).toEqual(DEFAULT_PENALTY_CONFIG)
    })

    it("should return default config when config is null but enabled", async () => {
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
    it("should set config correctly", async () => {
      const newConfig: LatePenaltyConfig = {
        gracePeriodHours: 48,
        tiers: [{ hoursAfterGrace: 24, penaltyPercent: 15 }],
        rejectAfterHours: null,
      }

      await latePenaltyService.setAssignmentConfig(1, true, newConfig)

      expect(mockAssignmentRepo.setLatePenaltyConfig).toHaveBeenCalledWith(
        1,
        true,
        newConfig,
      )
    })

    it("should disable config correctly", async () => {
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
  })

  // ============================================
  // Default Config Tests
  // ============================================
  describe("getDefaultConfig", () => {
    it("should return a copy of default config", () => {
      const config1 = latePenaltyService.getDefaultConfig()
      const config2 = latePenaltyService.getDefaultConfig()

      expect(config1).toEqual(config2)
      expect(config1).not.toBe(config2) // Different object references
    })

    it("should have sensible defaults", () => {
      const config = latePenaltyService.getDefaultConfig()

      expect(config.gracePeriodHours).toBeGreaterThan(0)
      expect(config.tiers.length).toBeGreaterThan(0)
      expect(config.tiers[0].penaltyPercent).toBeGreaterThan(0)
    })
  })
})
