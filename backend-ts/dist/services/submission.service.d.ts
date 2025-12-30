/**
 * Business logic for submission-related operations.
 */
export declare class SubmissionService {
    private submissionRepo;
    private assignmentRepo;
    private enrollmentRepo;
    private classRepo;
    constructor();
    /** Submit an assignment */
    submitAssignment(assignmentId: number, studentId: number, file: {
        filename: string;
        data: Buffer;
        mimetype: string;
    }): Promise<{
        success: boolean;
        message: string;
        submission?: any;
    }>;
    /** Get submission history for a student-assignment pair */
    getSubmissionHistory(assignmentId: number, studentId: number): Promise<{
        success: boolean;
        message: string;
        submissions: any[];
    }>;
    /** Get all submissions for an assignment */
    getAssignmentSubmissions(assignmentId: number, latestOnly?: boolean): Promise<{
        success: boolean;
        message: string;
        submissions: any[];
    }>;
    /** Get all submissions by a student */
    getStudentSubmissions(studentId: number, latestOnly?: boolean): Promise<{
        success: boolean;
        message: string;
        submissions: any[];
    }>;
    /** Get file download URL */
    getFileDownloadUrl(filePath: string, expiresIn?: number): Promise<string>;
}
//# sourceMappingURL=submission.service.d.ts.map