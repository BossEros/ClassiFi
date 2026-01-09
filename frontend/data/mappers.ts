import type { Submission, SubmissionWithAssignment, SubmissionWithStudent } from '../business/models/assignment/types';

export function mapSubmission(sub: any): Submission {
    return {
        id: sub.id,
        assignmentId: sub.assignmentId,
        studentId: sub.studentId,
        fileName: sub.fileName,
        fileSize: sub.fileSize,
        submissionNumber: sub.submissionNumber,
        submittedAt: new Date(sub.submittedAt),
        isLatest: sub.isLatest
    };
}

/**
 * Maps a raw submission with assignment name (used in student views).
 */
export function mapSubmissionWithAssignment(sub: any): SubmissionWithAssignment {
    return {
        ...mapSubmission(sub),
        assignmentName: sub.assignmentName
    };
}

/**
 * Maps a raw submission with student name (used in teacher views).
 */
export function mapSubmissionWithStudent(sub: any): SubmissionWithStudent {
    return {
        ...mapSubmission(sub),
        studentName: sub.studentName
    };
}
