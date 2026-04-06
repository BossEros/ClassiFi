import * as gradebookRepository from "@/data/repositories/gradebookRepository"
import { validateId } from "@/shared/utils/idUtils"
import type {
  ClassGradebook,
  StudentClassGrades,
  StudentRank,
  LatePenaltyConfig,
} from "@/data/api/gradebook.types"

// Re-export types for presentation layer
export type { ClassGradebook, StudentClassGrades, StudentRank }
export type { LatePenaltyConfig, PenaltyTier, SimilarityPenaltyConfig, SimilarityPenaltyBand, GradeBreakdown, GradebookAssignment, GradebookStudent, GradeEntry, StudentGradeEntry } from "@/data/api/gradebook.types"

// ============================================================================
// Class Gradebook Functions
// ============================================================================

/**
 * Fetches the complete gradebook for a given class, including all students,
 * their individual assignment scores, and computed final grades.
 * Used by teachers on the Gradebook page to review the overall class performance.
 *
 * @param classId - The unique identifier of the class.
 * @returns A ClassGradebook object containing all student grade records and assignment metadata.
 * @throws Error if the class ID is invalid or the gradebook cannot be retrieved.
 */
export async function getClassGradebook(
  classId: number,
): Promise<ClassGradebook> {
  validateId(classId, "class")
  return gradebookRepository.getCompleteGradebookForClassId(classId)
}

/**
 * Triggers a CSV export of the class gradebook and prompts the browser to download it.
 * The exported file includes all enrolled students and their scores for each assignment,
 * which is useful for offline reporting or sharing with administrators.
 *
 * @param classId - The unique identifier of the class.
 * @param filename - Optional custom filename for the downloaded CSV (defaults to a generated name).
 * @returns A promise that resolves when the browser download has been triggered.
 * @throws Error if the class ID is invalid or the export fails.
 */
export async function downloadGradebookCSV(
  classId: number,
  filename?: string,
): Promise<void> {
  validateId(classId, "class")
  return gradebookRepository.downloadGradebookCSVFileForClassId(
    classId,
    filename,
  )
}

// ============================================================================
// Student Grades Functions
// ============================================================================

/**
 * Fetches all grade records for a student across every class they are enrolled in.
 * Used on the student's Grades overview page to display their full academic history.
 *
 * @param studentId - The unique identifier of the student.
 * @returns An array of StudentClassGrades, one entry per enrolled class.
 * @throws Error if the student ID is invalid or the data cannot be retrieved.
 */
export async function getStudentGrades(
  studentId: number,
): Promise<StudentClassGrades[]> {
  validateId(studentId, "student")
  return gradebookRepository.getAllGradesForStudentId(studentId)
}

/**
 * Fetches the grade records for a specific student within a specific class.
 * Returns null if the student has no grades recorded for the class yet.
 * Used on class-specific grade drill-down views.
 *
 * @param studentId - The unique identifier of the student.
 * @param classId - The unique identifier of the class.
 * @returns The student's grade data for the class, or null if not yet available.
 * @throws Error if either ID is invalid or the data cannot be retrieved.
 */
export async function getStudentClassGrades(
  studentId: number,
  classId: number,
): Promise<StudentClassGrades | null> {
  validateId(studentId, "student")
  validateId(classId, "class")
  return gradebookRepository.getGradesForStudentInSpecificClass(
    studentId,
    classId,
  )
}

/**
 * Fetches a student's rank within their class based on overall grade performance.
 * Rank is calculated by the backend relative to all enrolled students.
 * Used to display relative performance on the student grades page.
 *
 * @param studentId - The unique identifier of the student.
 * @param classId - The unique identifier of the class.
 * @returns A StudentRank object containing the rank position and total student count.
 * @throws Error if either ID is invalid or the rank cannot be determined.
 */
export async function getStudentRank(
  studentId: number,
  classId: number,
): Promise<StudentRank> {
  validateId(studentId, "student")
  validateId(classId, "class")
  return gradebookRepository.getClassRankForStudentById(studentId, classId)
}

// ============================================================================
// Grade Override Functions
// ============================================================================

/**
 * Manually overrides the computed grade for a student's submission.
 * Teachers use this to correct scores when automated grading was inaccurate
 * or to award discretionary points. An optional feedback note can accompany the override.
 *
 * @param submissionId - The unique identifier of the submission to override.
 * @param grade - The new grade value (must be between 0 and 100 inclusive).
 * @param feedback - Optional written justification for the grade change.
 * @returns A promise that resolves when the override is saved.
 * @throws Error if the grade is out of range or the update fails.
 */
export async function overrideGrade(
  submissionId: number,
  grade: number,
  feedback?: string | null,
): Promise<void> {
  validateId(submissionId, "submission")

  if (!Number.isFinite(grade) || grade < 0 || grade > 100) {
    throw new Error("Grade must be between 0 and 100")
  }
  return gradebookRepository.setGradeOverrideForSubmissionById(
    submissionId,
    grade,
    feedback,
  )
}

/**
 * Removes a teacher's manual grade override from a submission,
 * restoring the original automatically computed score.
 * Useful when an override was applied by mistake or is no longer needed.
 *
 * @param submissionId - The unique identifier of the submission.
 * @returns A promise that resolves when the override has been removed.
 * @throws Error if the submission ID is invalid or the removal fails.
 */
export async function removeGradeOverride(submissionId: number): Promise<void> {
  validateId(submissionId, "submission")
  return gradebookRepository.removeGradeOverrideForSubmissionById(submissionId)
}

// ============================================================================
// Late Penalty Configuration Functions
// ============================================================================

/**
 * Fetches the late submission penalty configuration for a specific assignment.
 * The configuration defines penalty tiers — how much the grade is deducted
 * based on how many hours late the submission is.
 *
 * @param assignmentId - The unique identifier of the assignment.
 * @returns An object indicating whether late penalties are enabled and the detailed config.
 * @throws Error if the assignment ID is invalid or the config cannot be fetched.
 */
export async function getLatePenaltyConfig(
  assignmentId: number,
): Promise<{ enabled: boolean; config: LatePenaltyConfig | null }> {
  validateId(assignmentId, "assignment")
  return gradebookRepository.getLatePenaltyConfigurationForAssignmentId(
    assignmentId,
  )
}

/**
 * Updates the late submission penalty configuration for an assignment.
 * Validates that each penalty tier has a valid percentage (0–100) and non-negative hours,
 * and that the optional rejection cutoff is non-negative before persisting.
 * Used in the teacher's assignment form to configure grading rules for late work.
 *
 * @param assignmentId - The unique identifier of the assignment.
 * @param enabled - Whether late penalties should be applied to this assignment.
 * @param config - The penalty configuration object (required when enabled is true).
 * @returns A promise that resolves when the configuration is saved.
 * @throws Error if validation fails, required config is missing, or the update cannot be persisted.
 */
export async function updateLatePenaltyConfig(
  assignmentId: number,
  enabled: boolean,
  config?: LatePenaltyConfig,
): Promise<void> {
  validateId(assignmentId, "assignment")

  if (enabled && !config) {
    throw new Error("Late penalty config is required when enabled")
  }

  if (config) {
    if (config.tiers && config.tiers.length > 0) {
      for (const tier of config.tiers) {
        if (tier.penaltyPercent < 0 || tier.penaltyPercent > 100) {
          throw new Error("Penalty percentage must be between 0 and 100")
        }
        if (tier.hoursLate < 0) {
          throw new Error("Tier hours late must be non-negative")
        }
      }
    }
    if (config.rejectAfterHours !== null && config.rejectAfterHours < 0) {
      throw new Error("Reject after hours must be non-negative")
    }
  }

  return gradebookRepository.updateLatePenaltyConfigurationForAssignmentId(
    assignmentId,
    enabled,
    config,
  )
}
