import { submissions, type Submission, type NewSubmission } from '@/models/index.js';
import { BaseRepository } from '@/repositories/base.repository.js';
/**
 * Repository for submission-related database operations.
 */
export declare class SubmissionRepository extends BaseRepository<typeof submissions, Submission, NewSubmission> {
    constructor();
    /** Get a submission by ID */
    getSubmissionById(submissionId: number): Promise<Submission | undefined>;
    /** Get all submissions for an assignment */
    getSubmissionsByAssignment(assignmentId: number, latestOnly?: boolean): Promise<Submission[]>;
    /** Get all submissions by a student */
    getSubmissionsByStudent(studentId: number, latestOnly?: boolean): Promise<Submission[]>;
    /** Get submission history for a student-assignment pair */
    getSubmissionHistory(assignmentId: number, studentId: number): Promise<Submission[]>;
    /** Get the latest submission for a student-assignment pair */
    getLatestSubmission(assignmentId: number, studentId: number): Promise<Submission | undefined>;
    /** Get submission count for a student-assignment pair */
    getSubmissionCount(assignmentId: number, studentId: number): Promise<number>;
    /** Create a new submission */
    createSubmission(data: {
        assignmentId: number;
        studentId: number;
        fileName: string;
        filePath: string;
        fileSize: number;
        submissionNumber: number;
    }): Promise<Submission>;
    /** Get submissions with student info for an assignment */
    getSubmissionsWithStudentInfo(assignmentId: number, latestOnly?: boolean): Promise<Array<{
        submission: Submission;
        studentName: string;
    }>>;
    /** Get a single submission with student name */
    getSubmissionWithStudent(submissionId: number): Promise<{
        submission: Submission;
        studentName: string;
    } | null>;
}
//# sourceMappingURL=submission.repository.d.ts.map