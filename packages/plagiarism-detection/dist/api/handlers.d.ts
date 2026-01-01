/**
 * Phase 1: API Route Handlers for Plagiarism Detection
 *
 * These are example handlers you can adapt to your ClassiFi backend.
 * They show how to integrate the plagiarism detection library with a REST API.
 *
 * Adapt these to your framework (Express, Fastify, etc.) and database.
 */
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
    language: 'java' | 'python' | 'c';
    /** Optional: Template/boilerplate file to ignore */
    templateFile?: {
        path: string;
        content: string;
    };
    /** Optional: Similarity threshold (0-1, default 0.5) */
    threshold?: number;
    /** Optional: k-gram length (default 25) */
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
 * Request for getting pair details (fragments).
 */
export interface GetPairDetailsRequest {
    pairId: number;
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
 * POST /api/plagiarism/analyze
 *
 * Analyze a set of files for plagiarism.
 */
export declare function handleAnalyze(request: AnalyzeRequest): Promise<AnalyzeResponse>;
/**
 * GET /api/plagiarism/reports/:reportId/pairs/:pairId
 *
 * Get details for a specific pair including fragments.
 */
export declare function handleGetPairDetails(reportId: string, pairId: number): Promise<PairDetailsResponse>;
/**
 * GET /api/plagiarism/reports/:reportId
 *
 * Get report by ID.
 */
export declare function handleGetReport(reportId: string): Promise<AnalyzeResponse | null>;
/**
 * DELETE /api/plagiarism/reports/:reportId
 *
 * Delete a report.
 */
export declare function handleDeleteReport(reportId: string): Promise<boolean>;
//# sourceMappingURL=handlers.d.ts.map