/**
 * Phase 1: API Route Handlers for Plagiarism Detection
 * 
 * These are example handlers you can adapt to your ClassiFi backend.
 * They show how to integrate the plagiarism detection library with a REST API.
 * 
 * Adapt these to your framework (Express, Fastify, etc.) and database.
 */

import { PlagiarismDetector, File, Report, Pair, Fragment } from '../index.js';

// ============================================================================
// Types for API requests/responses
// ============================================================================

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

// ============================================================================
// In-memory storage (replace with database in production)
// ============================================================================

interface StoredReport {
    id: string;
    createdAt: Date;
    report: Report;
}

const reportsStore = new Map<string, StoredReport>();

// ============================================================================
// Handler functions
// ============================================================================

/**
 * POST /api/plagiarism/analyze
 * 
 * Analyze a set of files for plagiarism.
 */
export async function handleAnalyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    // Validate request
    if (!request.files || request.files.length < 2) {
        throw new Error('At least 2 files are required for analysis');
    }

    if (!request.language) {
        throw new Error('Language is required (java, python, or c)');
    }

    // Create detector
    const detector = new PlagiarismDetector({
        language: request.language,
        kgramLength: request.kgramLength ?? 25,
        kgramsInWindow: 40,
    });

    // Convert to File objects
    const files = request.files.map(f => new File(
        f.path,
        f.content,
        {
            studentId: f.studentId,
            studentName: f.studentName,
        }
    ));

    // Optional template file
    let ignoredFile: File | undefined;
    if (request.templateFile) {
        ignoredFile = new File(
            request.templateFile.path,
            request.templateFile.content
        );
    }

    // Run analysis
    const report = await detector.analyze(files, ignoredFile);

    // Generate report ID
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store report for later detail queries
    reportsStore.set(reportId, {
        id: reportId,
        createdAt: new Date(),
        report,
    });

    // Get summary
    const summary = report.getSummary();
    const threshold = request.threshold ?? 0.5;

    // Get pairs
    const pairs = report.getPairs();

    return {
        reportId,
        summary: {
            totalFiles: summary.totalFiles,
            totalPairs: summary.totalPairs,
            suspiciousPairs: pairs.filter(p => p.similarity >= threshold).length,
            averageSimilarity: summary.averageSimilarity,
            maxSimilarity: summary.maxSimilarity,
        },
        pairs: pairs.map(pair => pairToResponse(pair)),
        warnings: summary.warnings,
    };
}

/**
 * GET /api/plagiarism/reports/:reportId/pairs/:pairId
 * 
 * Get details for a specific pair including fragments.
 */
export async function handleGetPairDetails(
    reportId: string,
    pairId: number
): Promise<PairDetailsResponse> {
    // Get stored report
    const stored = reportsStore.get(reportId);
    if (!stored) {
        throw new Error('Report not found');
    }

    // Find the pair
    const pairs = stored.report.getPairs();
    const pair = pairs.find(p => p.id === pairId);
    if (!pair) {
        throw new Error('Pair not found');
    }

    // Get fragments
    const fragments = stored.report.getFragments(pair);

    return {
        pair: pairToResponse(pair),
        fragments: fragments.map((f, i) => ({
            id: i,
            leftSelection: {
                startRow: f.leftSelection.startRow,
                startCol: f.leftSelection.startCol,
                endRow: f.leftSelection.endRow,
                endCol: f.leftSelection.endCol,
            },
            rightSelection: {
                startRow: f.rightSelection.startRow,
                startCol: f.rightSelection.startCol,
                endRow: f.rightSelection.endRow,
                endCol: f.rightSelection.endCol,
            },
            length: f.length,
        })),
        leftCode: pair.leftFile.content,
        rightCode: pair.rightFile.content,
    };
}

/**
 * GET /api/plagiarism/reports/:reportId
 * 
 * Get report by ID.
 */
export async function handleGetReport(reportId: string): Promise<AnalyzeResponse | null> {
    const stored = reportsStore.get(reportId);
    if (!stored) {
        return null;
    }

    const summary = stored.report.getSummary();
    const pairs = stored.report.getPairs();

    return {
        reportId: stored.id,
        summary: {
            totalFiles: summary.totalFiles,
            totalPairs: summary.totalPairs,
            suspiciousPairs: pairs.filter(p => p.similarity >= 0.5).length,
            averageSimilarity: summary.averageSimilarity,
            maxSimilarity: summary.maxSimilarity,
        },
        pairs: pairs.map(pair => pairToResponse(pair)),
        warnings: summary.warnings,
    };
}

/**
 * DELETE /api/plagiarism/reports/:reportId
 * 
 * Delete a report.
 */
export async function handleDeleteReport(reportId: string): Promise<boolean> {
    return reportsStore.delete(reportId);
}

// ============================================================================
// Helper functions
// ============================================================================

function pairToResponse(pair: Pair): PairResponse {
    return {
        id: pair.id,
        leftFile: {
            id: pair.leftFile.id,
            path: pair.leftFile.path,
            filename: pair.leftFile.filename,
            lineCount: pair.leftFile.lineCount,
            studentId: pair.leftFile.info?.studentId,
            studentName: pair.leftFile.info?.studentName,
        },
        rightFile: {
            id: pair.rightFile.id,
            path: pair.rightFile.path,
            filename: pair.rightFile.filename,
            lineCount: pair.rightFile.lineCount,
            studentId: pair.rightFile.info?.studentId,
            studentName: pair.rightFile.info?.studentName,
        },
        similarity: pair.similarity,
        overlap: pair.overlap,
        longest: pair.longest,
    };
}
