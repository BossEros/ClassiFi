import { LanguageName } from '../lib/plagiarism/index.js';
import { SubmissionRepository } from '../repositories/submission.repository.js';
import { AssignmentRepository } from '../repositories/assignment.repository.js';
import { SimilarityRepository } from '../repositories/similarity.repository.js';
import { type PlagiarismPairDTO, type PlagiarismFragmentDTO, type PlagiarismSummaryDTO } from '../shared/mappers.js';
/** Request body for analyzing files */
export interface AnalyzeRequest {
    files: Array<{
        id?: string;
        path: string;
        content: string;
        studentId?: string;
        studentName?: string;
    }>;
    language: LanguageName;
    templateFile?: {
        path: string;
        content: string;
    };
    threshold?: number;
    kgramLength?: number;
}
/** Response for analyze endpoint */
export interface AnalyzeResponse {
    reportId: string;
    summary: PlagiarismSummaryDTO;
    pairs: PlagiarismPairDTO[];
    warnings: string[];
}
/** Response with pair details and fragments */
export interface PairDetailsResponse {
    pair: PlagiarismPairDTO;
    fragments: PlagiarismFragmentDTO[];
    leftCode: string;
    rightCode: string;
}
/**
 * Business logic for plagiarism detection operations.
 * Uses domain errors for exceptional conditions.
 */
export declare class PlagiarismService {
    private submissionRepo;
    private assignmentRepo;
    private similarityRepo;
    /** In-memory storage for reports (replace with database in production) */
    private reportsStore;
    constructor(submissionRepo: SubmissionRepository, assignmentRepo: AssignmentRepository, similarityRepo: SimilarityRepository);
    /** Analyze files for plagiarism */
    analyzeFiles(request: AnalyzeRequest): Promise<AnalyzeResponse>;
    /** Get pair details with fragments */
    getPairDetails(reportId: string, pairId: number): Promise<PairDetailsResponse>;
    /** Get report by ID */
    getReport(reportId: string): Promise<AnalyzeResponse | null>;
    /** Delete a report */
    deleteReport(reportId: string): Promise<boolean>;
    /** Get result details from database with fragments and file content */
    getResultDetails(resultId: number): Promise<{
        result: {
            id: number;
            submission1Id: number;
            submission2Id: number;
            structuralScore: string;
            overlap: number;
            longestFragment: number;
        };
        fragments: PlagiarismFragmentDTO[];
        leftFile: {
            filename: string;
            content: string;
            lineCount: number;
            studentName: string;
        };
        rightFile: {
            filename: string;
            content: string;
            lineCount: number;
            studentName: string;
        };
    }>;
    /**
     * Analyze all submissions for an assignment.
     * Fetches submissions, downloads file content from Supabase, and runs analysis.
     * Persists the report and results to the database.
     */
    analyzeAssignmentSubmissions(assignmentId: number, teacherId?: number): Promise<AnalyzeResponse>;
    /** Validate analyze request */
    private validateAnalyzeRequest;
    /** Generate a unique report ID */
    private generateReportId;
    /** Build analyze response from report */
    private buildAnalyzeResponse;
    /** Validate assignment exists and return it */
    private validateAndFetchAssignment;
    /** Get validated language name */
    private getLanguage;
    /** Fetch and download all submission files for an assignment */
    private fetchSubmissionFiles;
    /** Download two submission files and return their content */
    private downloadSubmissionFiles;
    /** Run plagiarism detection on files */
    private runPlagiarismAnalysis;
    /** Persist report, results, and fragments to database */
    private persistReportToDatabase;
    /** Prepare results for database insertion */
    private prepareResultsForInsert;
    /** Prepare fragments for database insertion */
    private prepareFragmentsForInsert;
    /** Build response for assignment analysis */
    private buildAssignmentAnalysisResponse;
}
//# sourceMappingURL=plagiarism.service.d.ts.map