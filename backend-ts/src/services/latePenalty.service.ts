import { injectable, inject } from "tsyringe"
import { AssignmentRepository } from "@/repositories/assignment.repository.js"
import { type LatePenaltyConfig } from "@/models/index.js"

interface LegacyPenaltyTier {
  hoursLate?: number
  hoursAfterGrace?: number
  penaltyPercent: number
}

interface LegacyLatePenaltyConfig {
  tiers?: LegacyPenaltyTier[]
  rejectAfterHours?: number | null
}

type LatePenaltyConfigInput = LatePenaltyConfig | LegacyLatePenaltyConfig

/**
 * Result of a late penalty calculation.
 */
export interface PenaltyResult {
  isLate: boolean
  hoursLate: number
  penaltyPercent: number
  gradeMultiplier: number // e.g., 0.9 for 10% penalty
  tierLabel: string // e.g., "Up to 24 hours late (-10%)"
}

/**
 * Default late penalty configuration.
 * Used when an assignment doesn't have a specific config.
 */
export const DEFAULT_PENALTY_CONFIG: LatePenaltyConfig = {
  tiers: [
    { hoursLate: 24, penaltyPercent: 10 }, // Up to 24h late: -10%
    { hoursLate: 48, penaltyPercent: 25 }, // Up to 48h late: -25%
    { hoursLate: 72, penaltyPercent: 50 }, // Up to 72h late: -50%
  ],
  rejectAfterHours: 120, // 5 days late
}

/**
 * Late Penalty Service
 * Handles calculation and application of late submission penalties.
 */
@injectable()
export class LatePenaltyService {
  constructor(
    @inject(AssignmentRepository)
    private assignmentRepo: AssignmentRepository,
  ) {}

  /**
   * Calculate the penalty for a submission based on how late it was.
   */
  calculatePenalty(
    submissionDate: Date,
    deadline: Date,
    config: LatePenaltyConfig,
  ): PenaltyResult {
    const normalizedConfig = this.normalizeConfig(config)
    const hoursLate = this.getHoursLate(submissionDate, deadline)

    if (hoursLate <= 0) {
      return this.createOnTimeResult()
    }

    if (this.isRejected(hoursLate, normalizedConfig.rejectAfterHours)) {
      return this.createRejectedResult(hoursLate)
    }

    return this.calculateTierPenalty(hoursLate, normalizedConfig)
  }

  /**
   * Apply a penalty to a raw grade.
   */
  applyPenalty(rawGrade: number, penalty: PenaltyResult): number {
    const penalizedGrade = Math.round(rawGrade * penalty.gradeMultiplier)
    return Math.max(0, penalizedGrade) // Never go below 0
  }

  /**
   * Get the late penalty configuration for an assignment.
   * Returns the default config if none is set or late penalties are disabled.
   */
  async getAssignmentConfig(
    assignmentId: number,
  ): Promise<{ enabled: boolean; config: LatePenaltyConfig }> {
    const penaltyConfig =
      await this.assignmentRepo.getLatePenaltyConfig(assignmentId)

    if (!penaltyConfig) {
      return { enabled: false, config: DEFAULT_PENALTY_CONFIG }
    }

    return {
      enabled: penaltyConfig.enabled,
      config: this.normalizeConfig(
        penaltyConfig.config ?? DEFAULT_PENALTY_CONFIG,
      ),
    }
  }

  /**
   * Set the late penalty configuration for an assignment.
   * @throws Error if configuration is invalid
   * @returns true if successful (callers should rely on exceptions for error handling)
   */
  async setAssignmentConfig(
    assignmentId: number,
    enabled: boolean,
    config: LatePenaltyConfigInput,
  ): Promise<boolean> {
    const normalizedConfig = this.normalizeConfig(config)

    // Validate rejectAfterHours (use != null to catch both null and undefined)
    if (
      normalizedConfig.rejectAfterHours != null &&
      normalizedConfig.rejectAfterHours < 0
    ) {
      throw new Error(
        "Invalid late penalty configuration: rejectAfterHours must be non-negative",
      )
    }

    // Validate tiers array
    if (!Array.isArray(normalizedConfig.tiers)) {
      throw new Error(
        "Invalid late penalty configuration: tiers must be an array",
      )
    }

    // Validate individual tiers
    for (const tier of normalizedConfig.tiers) {
      if (tier.hoursLate < 0) {
        throw new Error(
          "Invalid late penalty configuration: tier hoursLate must be non-negative",
        )
      }
      if (tier.penaltyPercent < 0 || tier.penaltyPercent > 100) {
        throw new Error(
          "Invalid late penalty configuration: tier penaltyPercent must be between 0 and 100",
        )
      }
    }

    // Validate logical consistency: rejectAfterHours must be >= max tier hours
    if (
      normalizedConfig.rejectAfterHours != null &&
      normalizedConfig.tiers.length > 0
    ) {
      const maxTierHours = Math.max(
        ...normalizedConfig.tiers.map((tier) => tier.hoursLate),
      )

      if (normalizedConfig.rejectAfterHours < maxTierHours) {
        throw new Error(
          `Invalid late penalty configuration: rejectAfterHours (${normalizedConfig.rejectAfterHours}) must be >= max tier hours (${maxTierHours})`,
        )
      }
    }

    return await this.assignmentRepo.setLatePenaltyConfig(
      assignmentId,
      enabled,
      normalizedConfig,
    )
  }

  /**
   * Get the default penalty configuration.
   */
  getDefaultConfig(): LatePenaltyConfig {
    return structuredClone(DEFAULT_PENALTY_CONFIG)
  }

  /**
   * Calculate hours between submission and deadline.
   * Returns negative if before deadline.
   */
  private getHoursLate(submissionDate: Date, deadline: Date): number {
    const diffMs = submissionDate.getTime() - deadline.getTime()
    return diffMs / (1000 * 60 * 60) // Convert to hours
  }

  /**
   * Create result for on-time submission.
   */
  private createOnTimeResult(): PenaltyResult {
    return {
      isLate: false,
      hoursLate: 0,
      penaltyPercent: 0,
      gradeMultiplier: 1.0,
      tierLabel: "On time",
    }
  }

  /**
   * Check if submission should be rejected due to being too late.
   */
  private isRejected(
    hoursLate: number,
    rejectAfterHours: number | null,
  ): boolean {
    return rejectAfterHours != null && hoursLate > rejectAfterHours
  }

  /**
   * Create result for rejected submission.
   */
  private createRejectedResult(hoursLate: number): PenaltyResult {
    return {
      isLate: true,
      hoursLate,
      penaltyPercent: 100,
      gradeMultiplier: 0,
      tierLabel: "Submission rejected (too late)",
    }
  }

  /**
   * Calculate penalty based on tier configuration.
   */
  private calculateTierPenalty(
    hoursLate: number,
    config: LatePenaltyConfig,
  ): PenaltyResult {
    const sortedTiers = this.sortTiersByHours(config.tiers)
    const { penaltyPercent, tierLabel } = this.findApplicableTier(
      hoursLate,
      sortedTiers,
    )

    return {
      isLate: true,
      hoursLate,
      penaltyPercent,
      gradeMultiplier: (100 - penaltyPercent) / 100,
      tierLabel,
    }
  }

  /**
   * Sort penalty tiers by hours in ascending order.
   */
  private sortTiersByHours(tiers: LatePenaltyConfig["tiers"]) {
    return [...tiers].sort((a, b) => a.hoursLate - b.hoursLate)
  }

  /**
   * Find the applicable penalty tier for the given hours late.
   * Tiers are treated as upper bounds: returns the first tier where hoursLate <= tier.hoursLate.
   * If hoursLate exceeds all tiers, returns the last tier's penalty.
   */
  private findApplicableTier(
    hoursLate: number,
    sortedTiers: LatePenaltyConfig["tiers"],
  ): { penaltyPercent: number; tierLabel: string } {
    // Handle empty tiers array
    if (sortedTiers.length === 0) {
      return {
        penaltyPercent: 0,
        tierLabel: "Late submission",
      }
    }

    // Find the first tier where hoursLate is within the upper bound
    for (const tier of sortedTiers) {
      if (hoursLate <= tier.hoursLate) {
        return {
          penaltyPercent: tier.penaltyPercent,
          tierLabel: `Up to ${tier.hoursLate} hours late (-${tier.penaltyPercent}%)`,
        }
      }
    }

    // If hoursLate exceeds all tier upper bounds, use the last tier
    const lastTier = sortedTiers[sortedTiers.length - 1]
    return {
      penaltyPercent: lastTier.penaltyPercent,
      tierLabel: `${lastTier.hoursLate}+ hours late (-${lastTier.penaltyPercent}%)`,
    }
  }

  /**
   * Normalize configuration for legacy payloads and ensure current shape.
   */
  private normalizeConfig(config: LatePenaltyConfigInput): LatePenaltyConfig {
    const legacyTiers = Array.isArray(config.tiers) ? config.tiers : []

    return {
      tiers: legacyTiers.map((tier) => {
        let hoursLate: number

        if (typeof tier.hoursLate === "number") {
          hoursLate = tier.hoursLate
        } else if (
          "hoursAfterGrace" in tier &&
          typeof tier.hoursAfterGrace === "number"
        ) {
          hoursLate = tier.hoursAfterGrace
        } else {
          throw new Error(
            "Invalid late penalty configuration: each tier must include hoursLate or hoursAfterGrace",
          )
        }

        return {
          hoursLate,
          penaltyPercent: tier.penaltyPercent,
        }
      }),
      rejectAfterHours: config.rejectAfterHours ?? null,
    }
  }
}
