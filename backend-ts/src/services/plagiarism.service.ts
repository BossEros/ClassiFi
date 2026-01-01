import { injectable } from 'tsyringe';
import {
    PlagiarismDetector,
    File,
    Report,
    Pair,
    Fragment,
    LanguageName
} from '../lib/plagiarism/index.js';

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
 * Stored report for retrieval.
 */
interface StoredReport {
    id: string;
    createdAt: Date;
    report: Report;
}

/**
 * Business logic for plagiarism detection operations.
 */
@injectable()
export class PlagiarismService {
    /** In-memory storage for reports (replace with database in production) */
    private reportsStore = new Map<string, StoredReport>();

    /**
     * Analyze files for plagiarism.
     */
    async analyzeFiles(request: AnalyzeRequest): Promise<AnalyzeResponse> {
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
            kgramLength: request.kgramLength ?? 23,
            kgramsInWindow: 17,
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
        this.reportsStore.set(reportId, {
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
            pairs: pairs.map(pair => this.pairToResponse(pair)),
            warnings: summary.warnings,
        };
    }

    /**
     * Get pair details with fragments.
     */
    async getPairDetails(reportId: string, pairId: number): Promise<PairDetailsResponse> {
        // Get stored report
        const stored = this.reportsStore.get(reportId);
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
            pair: this.pairToResponse(pair),
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
     * Get report by ID.
     */
    async getReport(reportId: string): Promise<AnalyzeResponse | null> {
        const stored = this.reportsStore.get(reportId);
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
            pairs: pairs.map(pair => this.pairToResponse(pair)),
            warnings: summary.warnings,
        };
    }

    /**
     * Delete a report.
     */
    async deleteReport(reportId: string): Promise<boolean> {
        return this.reportsStore.delete(reportId);
    }

    /**
     * Convert a Pair to a response object.
     */
    private pairToResponse(pair: Pair): PairResponse {
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
}
