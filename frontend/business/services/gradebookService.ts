import * as gradebookRepository from "@/data/repositories/gradebookRepository";
import { validateId } from "@/shared/utils/validators";
import type { LatePenaltyConfig } from "@/data/api/types";
import type {
  ClassGradebook,
  ClassStatistics,
  StudentClassGrades,
  StudentRank,
} from "@/shared/types/gradebook";

// Re-export types for presentation layer
export type {
  ClassGradebook,
  ClassStatistics,
  StudentClassGrades,
  StudentRank,
};

// ============================================================================
// Class Gradebook Functions
// ============================================================================

/**
 * Fetches the complete gradebook for a class
 */
export async function getClassGradebook(
  classId: number,
): Promise<ClassGradebook> {
  validateId(classId, "class");
  return gradebookRepository.getClassGradebook(classId);
}

/**
 * Fetches class statistics
 */
export async function getClassStatistics(
  classId: number,
): Promise<ClassStatistics> {
  validateId(classId, "class");
  return gradebookRepository.getClassStatistics(classId);
}

/**
 * Downloads the gradebook as a CSV file
 */
export async function downloadGradebookCSV(
  classId: number,
  filename?: string,
): Promise<void> {
  validateId(classId, "class");
  return gradebookRepository.downloadGradebookCSV(classId, filename);
}

// ============================================================================
// Student Grades Functions
// ============================================================================

/**
 * Fetches all grades for a student across all classes
 */
export async function getStudentGrades(
  studentId: number,
): Promise<StudentClassGrades[]> {
  validateId(studentId, "student");
  return gradebookRepository.getStudentGrades(studentId);
}

/**
 * Fetches grades for a student in a specific class
 */
export async function getStudentClassGrades(
  studentId: number,
  classId: number,
): Promise<StudentClassGrades | null> {
  validateId(studentId, "student");
  validateId(classId, "class");
  return gradebookRepository.getStudentClassGrades(studentId, classId);
}

/**
 * Fetches student's rank in a class
 */
export async function getStudentRank(
  studentId: number,
  classId: number,
): Promise<StudentRank> {
  validateId(studentId, "student");
  validateId(classId, "class");
  return gradebookRepository.getStudentRank(studentId, classId);
}

// ============================================================================
// Grade Override Functions
// ============================================================================

/**
 * Overrides a grade for a submission
 */
export async function overrideGrade(
  submissionId: number,
  grade: number,
  feedback?: string | null,
): Promise<void> {
  validateId(submissionId, "submission");

  if (!Number.isFinite(grade) || grade < 0 || grade > 100) {
    throw new Error("Grade must be between 0 and 100");
  }
  return gradebookRepository.overrideGrade(submissionId, grade, feedback);
}

/**
 * Removes a grade override
 */
export async function removeGradeOverride(
  submissionId: number,
): Promise<void> {
  validateId(submissionId, "submission");
  return gradebookRepository.removeGradeOverride(submissionId);
}

// ============================================================================
// Late Penalty Configuration Functions
// ============================================================================

/**
 * Fetches late penalty configuration for an assignment
 */
export async function getLatePenaltyConfig(
  assignmentId: number,
): Promise<{ enabled: boolean; config: LatePenaltyConfig | null }> {
  validateId(assignmentId, "assignment");
  return gradebookRepository.getLatePenaltyConfig(assignmentId);
}

/**
 * Updates late penalty configuration for an assignment
 */
export async function updateLatePenaltyConfig(
  assignmentId: number,
  enabled: boolean,
  config?: LatePenaltyConfig,
): Promise<void> {
  validateId(assignmentId, "assignment");

  if (enabled && !config) {
    throw new Error("Late penalty config is required when enabled");
  }

  if (config) {
    if (config.gracePeriodHours < 0) {
      throw new Error("Grace period must be non-negative");
    }
    if (config.tiers && config.tiers.length > 0) {
      for (const tier of config.tiers) {
        if (tier.penaltyPercent < 0 || tier.penaltyPercent > 100) {
          throw new Error("Penalty percentage must be between 0 and 100");
        }
        if (tier.hoursAfterGrace < 0) {
          throw new Error("Hours after grace must be non-negative");
        }
      }
    }
    if (config.rejectAfterHours !== null && config.rejectAfterHours < 0) {
      throw new Error("Reject after hours must be non-negative");
    }
  }

  return gradebookRepository.updateLatePenaltyConfig(
    assignmentId,
    enabled,
    config,
  );
}
