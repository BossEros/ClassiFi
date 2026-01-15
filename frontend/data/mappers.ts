import type {
  Submission,
  SubmissionWithAssignment,
  SubmissionWithStudent,
} from "../business/models/assignment/types";

export interface ApiSubmission {
  id: number;
  assignmentId: number;
  studentId: number;
  fileName: string;
  fileSize: number;
  submissionNumber: number;
  submittedAt: string | Date;
  isLatest: boolean;
  grade?: number | null;
  assignmentName?: string;
  studentName?: string;
}

export function mapSubmission(sub: ApiSubmission): Submission {
  return {
    id: sub.id,
    assignmentId: sub.assignmentId,
    studentId: sub.studentId,
    fileName: sub.fileName,
    fileSize: sub.fileSize,
    submissionNumber: sub.submissionNumber,
    submittedAt: new Date(sub.submittedAt),
    isLatest: sub.isLatest,
    grade: sub.grade ?? undefined,
  };
}

/**
 * Maps a raw submission with assignment name (used in student views).
 */
export function mapSubmissionWithAssignment(
  sub: ApiSubmission
): SubmissionWithAssignment {
  return {
    ...mapSubmission(sub),
    assignmentName: sub.assignmentName!,
  };
}

/**
 * Maps a raw submission with student name (used in teacher views).
 */
export function mapSubmissionWithStudent(
  sub: ApiSubmission
): SubmissionWithStudent {
  return {
    ...mapSubmission(sub),
    studentName: sub.studentName!,
  };
}
