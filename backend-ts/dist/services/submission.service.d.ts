import { SubmissionRepository } from '../repositories/submission.repository.js';
import { AssignmentRepository } from '../repositories/assignment.repository.js';
import { EnrollmentRepository } from '../repositories/enrollment.repository.js';
import { ClassRepository } from '../repositories/class.repository.js';
import { type SubmissionDTO } from '../shared/mappers.js';
/**
 * Business logic for submission-related operations.
 * Uses domain errors for exceptional conditions.
 */
export declare class SubmissionService {
    private submissionRepo;
    private assignmentRepo;
    private enrollmentRepo;
    private classRepo;
    constructor(submissionRepo: SubmissionRepository, assignmentRepo: AssignmentRepository, enrollmentRepo: EnrollmentRepository, classRepo: ClassRepository);
    /** Submit an assignment */
    submitAssignment(assignmentId: number, studentId: number, file: {
        filename: string;
        data: Buffer;
        mimetype: string;
    }): Promise<SubmissionDTO>;
    /** Get submission history for a student-assignment pair */
    getSubmissionHistory(assignmentId: number, studentId: number): Promise<SubmissionDTO[]>;
    /** Get all submissions for an assignment */
    getAssignmentSubmissions(assignmentId: number, latestOnly?: boolean): Promise<SubmissionDTO[]>;
    /** Get all submissions by a student */
    getStudentSubmissions(studentId: number, latestOnly?: boolean): Promise<SubmissionDTO[]>;
    /** Get file download URL */
    getFileDownloadUrl(filePath: string, expiresIn?: number): Promise<string>;
}
//# sourceMappingURL=submission.service.d.ts.map