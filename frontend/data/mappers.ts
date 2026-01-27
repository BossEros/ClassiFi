import type {
  Submission,
  SubmissionWithAssignment,
  SubmissionWithStudent,
} from "@/shared/types/submission";
import type { SubmissionDTO, AssignmentDetailDTO } from "@/data/api/types";

/**
 * Maps a raw submission DTO to a domain Submission model.
 */
export function mapSubmission(sub: SubmissionDTO): Submission {
  return {
    id: sub.id,
    assignmentId: sub.assignmentId,
    studentId: sub.studentId,
    fileName: sub.fileName,
    fileSize: sub.fileSize,
    submissionNumber: sub.submissionNumber,
    submittedAt:
      typeof sub.submittedAt === "string"
        ? sub.submittedAt
        : sub.submittedAt.toISOString(),
    isLatest: sub.isLatest,
    grade: sub.grade ?? undefined,
  };
}

/**
 * Maps a raw submission with assignment name (used in student views).
 * Throws an error if required assignmentName is missing.
 */
export function mapSubmissionWithAssignment(
  sub: SubmissionDTO,
): SubmissionWithAssignment {
  if (!sub.assignmentName) {
    throw new Error(
      `[mapSubmissionWithAssignment] Missing required property 'assignmentName' for submission ID ${sub.id}`,
    );
  }

  return {
    ...mapSubmission(sub),
    assignmentName: sub.assignmentName!,
  };
}

/**
 * Maps a raw submission with student name (used in teacher views).
 * Throws an error if required studentName is missing.
 */
export function mapSubmissionWithStudent(
  sub: SubmissionDTO,
): SubmissionWithStudent {
  if (!sub.studentName) {
    throw new Error(
      `[mapSubmissionWithStudent] Missing required property 'studentName' for submission ID ${sub.id}`,
    );
  }

  return {
    ...mapSubmission(sub),
    studentName: sub.studentName,
  };
}

/**
 * Maps assignment detail DTO to domain model with proper type casting and defaults.
 */
export function mapAssignmentDetail(dto: AssignmentDetailDTO) {
  return {
    ...dto,
    programmingLanguage: dto.programmingLanguage as "java" | "python" | "c",
    maxAttempts: dto.maxAttempts ?? null,
    templateCode: dto.templateCode ?? null,
    hasTemplateCode: dto.hasTemplateCode ?? false,
    scheduledDate: dto.scheduledDate ?? null,
    testCases: dto.testCases ?? [],
  };
}
