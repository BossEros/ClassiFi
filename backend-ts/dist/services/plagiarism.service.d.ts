import { LanguageName } from '../lib/plagiarism/index.js';
/**
 * Request body for analyzing files.
 */
export interface AnalyzeRequest {
    /** Array of files to analyze */
    files: Array<{
        id?: string;
        path: string;
        content: string;
        studentId?: string;
        studentName?: string;
    }>;
    /** Programming language (java, python, c) */
    language: LanguageName;
    /** Optional: Template/boilerplate file to ignore */
    templateFile?: {
        path: string;
        content: string;
    };
    /** Optional: Similarity threshold (0-1, default 0.5) */
    threshold?: number;
    /** Optional: k-gram length (default 23) */
    kgramLength?: number;
}
/**
 * Response for analyze endpoint.
 */
export interface AnalyzeResponse {
    /** Unique ID for this analysis */
    reportId: string;
    /** Summary statistics */
    summary: {
        totalFiles: number;
        totalPairs: number;
        suspiciousPairs: number;
        averageSimilarity: number;
        maxSimilarity: number;
    };
    /** All pairs sorted by similarity (descending) */
    pairs: PairResponse[];
    /** Any warnings during analysis */
    warnings: string[];
}
/**
 * A pair in the response.
 */
export interface PairResponse {
    id: number;
    leftFile: FileResponse;
    rightFile: FileResponse;
    similarity: number;
    overlap: number;
    longest: number;
}
/**
 * A file in the response.
 */
export interface FileResponse {
    id: number;
    path: string;
    filename: string;
    lineCount: number;
    studentId?: string;
    studentName?: string;
}
/**
 * Response with fragment details.
 */
export interface PairDetailsResponse {
    pair: PairResponse;
    fragments: FragmentResponse[];
    leftCode: string;
    rightCode: string;
}
/**
 * A fragment in the response.
 */
export interface FragmentResponse {
    id: number;
    leftSelection: {
        startRow: number;
        startCol: number;
        endRow: number;
        endCol: number;
    };
    rightSelection: {
        startRow: number;
        startCol: number;
        endRow: number;
        endCol: number;
    };
    length: number;
}
/**
 * Business logic for plagiarism detection operations.
 */
export declare class PlagiarismService {
    /** In-memory storage for reports (replace with database in production) */
    private reportsStore;
    /**
     * Analyze files for plagiarism.
     */
    analyzeFiles(request: AnalyzeRequest): Promise<AnalyzeResponse>;
    /**
     * Get pair details with fragments.
     */
    getPairDetails(reportId: string, pairId: number): Promise<PairDetailsResponse>;
    /**
     * Get report by ID.
     */
    getReport(reportId: string): Promise<AnalyzeResponse | null>;
    /**
     * Delete a report.
     */
    deleteReport(reportId: string): Promise<boolean>;
    /**
     * Convert a Pair to a response object.
     */
    private pairToResponse;
}
//# sourceMappingURL=plagiarism.service.d.ts.map