import { injectable, inject } from "tsyringe";
import { AssignmentRepository } from "@/repositories/assignment.repository.js";
import { type LatePenaltyConfig } from "@/models/index.js";

/**
 * Result of a late penalty calculation.
 */
export interface PenaltyResult {
  isLate: boolean;
  hoursLate: number;
  penaltyPercent: number;
  gradeMultiplier: number; // e.g., 0.9 for 10% penalty
  tierLabel: string; // e.g., "24-48 hours late"
}

/**
 * Default late penalty configuration.
 * Used when an assignment doesn't have a specific config.
 */
export const DEFAULT_PENALTY_CONFIG: LatePenaltyConfig = {
  gracePeriodHours: 24,
  tiers: [
    { hoursAfterGrace: 24, penaltyPercent: 10 }, // Up to 24h after grace: -10%
    { hoursAfterGrace: 48, penaltyPercent: 25 }, // Up to 48h after grace: -25%
    { hoursAfterGrace: 72, penaltyPercent: 50 }, // Up to 72h after grace: -50%
  ],
  rejectAfterHours: 120, // 5 days after grace
};

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
    const hoursLate = this.getHoursLate(submissionDate, deadline);

    // Not late
    if (hoursLate <= 0) {
      return {
        isLate: false,
        hoursLate: 0,
        penaltyPercent: 0,
        gradeMultiplier: 1.0,
        tierLabel: "On time",
      };
    }

    // Within grace period
    if (hoursLate <= config.gracePeriodHours) {
      return {
        isLate: true,
        hoursLate,
        penaltyPercent: 0,
        gradeMultiplier: 1.0,
        tierLabel: "Within grace period",
      };
    }

    // Beyond rejection threshold
    if (
      config.rejectAfterHours !== null &&
      hoursLate > config.rejectAfterHours
    ) {
      return {
        isLate: true,
        hoursLate,
        penaltyPercent: 100,
        gradeMultiplier: 0,
        tierLabel: "Submission rejected (too late)",
      };
    }

    // Find applicable tier
    const hoursAfterGrace = hoursLate - config.gracePeriodHours;

    // Sort tiers by hoursAfterGrace ascending
    const sortedTiers = [...config.tiers].sort(
      (a, b) => a.hoursAfterGrace - b.hoursAfterGrace,
    );

    // Find the tier that applies (the highest threshold that has been passed)
    let applicablePenalty = 0;
    let tierLabel = "Late submission";

    for (const tier of sortedTiers) {
      if (hoursAfterGrace >= tier.hoursAfterGrace) {
        applicablePenalty = tier.penaltyPercent;
        tierLabel = `${tier.hoursAfterGrace}+ hours late (-${tier.penaltyPercent}%)`;
      }
    }

    // If we're past grace but no tier applies yet, find the first tier
    if (applicablePenalty === 0 && sortedTiers.length > 0) {
      applicablePenalty = sortedTiers[0].penaltyPercent;
      tierLabel = `Late (-${applicablePenalty}%)`;
    }

    return {
      isLate: true,
      hoursLate,
      penaltyPercent: applicablePenalty,
      gradeMultiplier: (100 - applicablePenalty) / 100,
      tierLabel,
    };
  }

  /**
   * Apply a penalty to a raw grade.
   */
  applyPenalty(rawGrade: number, penalty: PenaltyResult): number {
    const penalizedGrade = Math.round(rawGrade * penalty.gradeMultiplier);
    return Math.max(0, penalizedGrade); // Never go below 0
  }

  /**
   * Get the late penalty configuration for an assignment.
   * Returns the default config if none is set or late penalties are disabled.
   */
  async getAssignmentConfig(
    assignmentId: number,
  ): Promise<{ enabled: boolean; config: LatePenaltyConfig }> {
    const penaltyConfig =
      await this.assignmentRepo.getLatePenaltyConfig(assignmentId);

    if (!penaltyConfig) {
      return { enabled: false, config: DEFAULT_PENALTY_CONFIG };
    }

    return {
      enabled: penaltyConfig.enabled,
      config: penaltyConfig.config ?? DEFAULT_PENALTY_CONFIG,
    };
  }

  /**
   * Set the late penalty configuration for an assignment.
   * @throws Error if configuration is invalid
   * @returns true if successful (callers should rely on exceptions for error handling)
   */
  async setAssignmentConfig(
    assignmentId: number,
    enabled: boolean,
    config: LatePenaltyConfig,
  ): Promise<boolean> {
    // Validate gracePeriodHours
    if (config.gracePeriodHours < 0) {
      throw new Error(
        "Invalid late penalty configuration: gracePeriodHours must be non-negative",
      );
    }

    // Validate rejectAfterHours (use != null to catch both null and undefined)
    if (config.rejectAfterHours != null && config.rejectAfterHours < 0) {
      throw new Error(
        "Invalid late penalty configuration: rejectAfterHours must be non-negative",
      );
    }

    // Validate tiers array
    if (!Array.isArray(config.tiers)) {
      throw new Error(
        "Invalid late penalty configuration: tiers must be an array",
      );
    }

    // Validate individual tiers
    for (const tier of config.tiers) {
      if (tier.hoursAfterGrace < 0) {
        throw new Error(
          "Invalid late penalty configuration: tier hoursAfterGrace must be non-negative",
        );
      }
      if (tier.penaltyPercent < 0 || tier.penaltyPercent > 100) {
        throw new Error(
          "Invalid late penalty configuration: tier penaltyPercent must be between 0 and 100",
        );
      }
    }

    // Validate logical consistency: rejectAfterHours must be >= gracePeriodHours + max tier hours
    if (config.rejectAfterHours != null && config.tiers.length > 0) {
      const maxTierHours = Math.max(
        ...config.tiers.map((tier) => tier.hoursAfterGrace),
      );
      const minimumRejectHours = config.gracePeriodHours + maxTierHours;

      if (config.rejectAfterHours < minimumRejectHours) {
        throw new Error(
          `Invalid late penalty configuration: rejectAfterHours (${config.rejectAfterHours}) must be >= gracePeriodHours (${config.gracePeriodHours}) + max tier hours (${maxTierHours}) = ${minimumRejectHours}`,
        );
      }
    }

    return await this.assignmentRepo.setLatePenaltyConfig(
      assignmentId,
      enabled,
      config,
    );
  }

  /**
   * Get the default penalty configuration.
   */
  getDefaultConfig(): LatePenaltyConfig {
    return structuredClone(DEFAULT_PENALTY_CONFIG);
  }

  /**
   * Calculate hours between submission and deadline.
   * Returns negative if before deadline.
   */
  private getHoursLate(submissionDate: Date, deadline: Date): number {
    const diffMs = submissionDate.getTime() - deadline.getTime();
    return diffMs / (1000 * 60 * 60); // Convert to hours
  }
}
