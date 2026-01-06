import { inject, injectable } from 'tsyringe';
import {
    PlagiarismDetector,
    File,
    Report,
    Pair,
    Fragment,
    LanguageName
} from '../lib/plagiarism/index.js';
import { SubmissionRepository } from '../repositories/submission.repository.js';
import { AssignmentRepository } from '../repositories/assignment.repository.js';
import { SimilarityRepository } from '../repositories/similarity.repository.js';
import { supabase } from '../shared/supabase.js';

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
    structuralScore: number;
    semanticScore: number;
    hybridScore: number;
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

    constructor(
        @inject('SubmissionRepository') private submissionRepo: SubmissionRepository,
        @inject('AssignmentRepository') private assignmentRepo: AssignmentRepository,
        @inject('SimilarityRepository') private similarityRepo: SimilarityRepository
    ) { }

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
     * Get result details from database with fragments and file content.
     * This is the database-backed version intended for production use.
     */
    async getResultDetails(resultId: number): Promise<{
        result: {
            id: number;
            submission1Id: number;
            submission2Id: number;
            structuralScore: string;
            overlap: number;
            longestFragment: number;
        };
        fragments: Array<{
            id: number;
            leftSelection: { startRow: number; startCol: number; endRow: number; endCol: number };
            rightSelection: { startRow: number; startCol: number; endRow: number; endCol: number };
            length: number;
        }>;
        leftFile: { filename: string; content: string; lineCount: number; studentName: string };
        rightFile: { filename: string; content: string; lineCount: number; studentName: string };
    }> {
        // Fetch result with fragments from database
        const data = await this.similarityRepo.getResultWithFragments(resultId);
        if (!data) {
            throw new Error('Result not found');
        }

        const { result, fragments } = data;

        // Fetch submission details
        const [submission1, submission2] = await Promise.all([
            this.submissionRepo.getSubmissionWithStudent(result.submission1Id),
            this.submissionRepo.getSubmissionWithStudent(result.submission2Id),
        ]);

        if (!submission1 || !submission2) {
            throw new Error('Submissions not found');
        }

        // Download file content from Supabase
        const [file1Data, file2Data] = await Promise.all([
            supabase.storage.from('submissions').download(submission1.submission.filePath),
            supabase.storage.from('submissions').download(submission2.submission.filePath),
        ]);

        if (file1Data.error || file2Data.error) {
            throw new Error('Failed to download file content');
        }

        const [leftContent, rightContent] = await Promise.all([
            file1Data.data.text(),
            file2Data.data.text(),
        ]);

        return {
            result: {
                id: result.id,
                submission1Id: result.submission1Id,
                submission2Id: result.submission2Id,
                structuralScore: result.structuralScore,
                overlap: result.overlap,
                longestFragment: result.longestFragment,
            },
            fragments: fragments.map(f => ({
                id: f.id,
                leftSelection: {
                    startRow: f.leftStartRow,
                    startCol: f.leftStartCol,
                    endRow: f.leftEndRow,
                    endCol: f.leftEndCol,
                },
                rightSelection: {
                    startRow: f.rightStartRow,
                    startCol: f.rightStartCol,
                    endRow: f.rightEndRow,
                    endCol: f.rightEndCol,
                },
                length: f.length,
            })),
            leftFile: {
                filename: submission1.submission.fileName,
                content: leftContent,
                lineCount: leftContent.split('\n').length,
                studentName: submission1.studentName || 'Unknown',
            },
            rightFile: {
                filename: submission2.submission.fileName,
                content: rightContent,
                lineCount: rightContent.split('\n').length,
                studentName: submission2.studentName || 'Unknown',
            },
        };
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
            structuralScore: pair.similarity,
            semanticScore: 0,
            hybridScore: 0,
            overlap: pair.overlap,
            longest: pair.longest,
        };
    }

    /**
     * Analyze all submissions for an assignment.
     * Fetches submissions, downloads file content from Supabase, and runs analysis.
     * Persists the report and results to the database.
     */
    async analyzeAssignmentSubmissions(assignmentId: number, teacherId?: number): Promise<AnalyzeResponse> {
        // Get the assignment to determine programming language
        const assignment = await this.assignmentRepo.getAssignmentById(assignmentId);
        if (!assignment) {
            throw new Error(`Assignment with ID ${assignmentId} not found`);
        }

        // Get all latest submissions for this assignment
        const submissionsWithInfo = await this.submissionRepo.getSubmissionsWithStudentInfo(
            assignmentId,
            true // latestOnly
        );

        if (submissionsWithInfo.length < 2) {
            throw new Error('At least 2 submissions are required for plagiarism analysis');
        }

        // Download file content for each submission from Supabase
        const files: Array<File> = [];

        for (const item of submissionsWithInfo) {
            const { submission, studentName } = item;

            // Download file content from Supabase storage
            const { data, error } = await supabase.storage
                .from('submissions')
                .download(submission.filePath);

            if (error) {
                console.warn(`Failed to download file for submission ${submission.id}: ${error.message}`);
                continue;
            }

            // Convert Blob to text
            const content = await data.text();

            // Create Dolos File object with metadata
            files.push(new File(
                submission.fileName,
                content,
                {
                    studentId: submission.studentId.toString(),
                    studentName: studentName,
                    submissionId: submission.id.toString(), // Important for mapping back
                }
            ));
        }

        if (files.length < 2) {
            throw new Error('Could not download enough files for analysis (need at least 2)');
        }

        // Map programming language to supported language name
        const languageMap: Record<string, LanguageName> = {
            python: 'python',
            java: 'java',
            c: 'c',
        };

        const language = languageMap[assignment.programmingLanguage.toLowerCase()];
        if (!language) {
            throw new Error(`Unsupported programming language: ${assignment.programmingLanguage}`);
        }

        // Initialize detector
        const detector = new PlagiarismDetector({
            language: language,
            kgramLength: 23,
            kgramsInWindow: 17,
        });

        // Run analysis
        const report = await detector.analyze(files);
        const pairs = report.getPairs();

        // Persist report to database
        const dbReport = await this.similarityRepo.createReport({
            assignmentId,
            teacherId: teacherId ?? null,
            totalSubmissions: report.files.length,
            totalComparisons: pairs.length,
            flaggedPairs: pairs.filter((p: Pair) => p.similarity >= 0.5).length,
            averageSimilarity: (pairs.reduce((sum: number, p: Pair) => sum + p.similarity, 0) / Math.max(1, pairs.length)).toFixed(4),
            highestSimilarity: (Math.max(...pairs.map((p: Pair) => p.similarity), 0)).toFixed(4),
        });

        const resultsToInsert: any[] = [];
        // Map from submission pair key to Dolos Pair for fragment processing later
        const pairMap = new Map<string, Pair>();
        // Track which pairs had their left/right swapped to maintain sub1 < sub2 ordering
        const swappedMap = new Map<string, boolean>();

        for (const pair of pairs) {
            const leftSubId = parseInt(pair.leftFile.info?.submissionId || '0');
            const rightSubId = parseInt(pair.rightFile.info?.submissionId || '0');

            if (!leftSubId || !rightSubId) continue;

            // Determine if we need to swap to ensure sub1 < sub2
            const needsSwap = leftSubId > rightSubId;
            const [sub1, sub2] = needsSwap
                ? [rightSubId, leftSubId]
                : [leftSubId, rightSubId];

            // Store pairing to find fragments later
            const key = `${sub1}-${sub2}`;
            pairMap.set(key, pair);
            swappedMap.set(key, needsSwap);

            resultsToInsert.push({
                reportId: dbReport.id,
                submission1Id: sub1,
                submission2Id: sub2,
                structuralScore: pair.similarity.toFixed(4),
                semanticScore: '0',
                hybridScore: '0',
                overlap: pair.overlap,
                longestFragment: pair.longest,
                leftCovered: pair.leftCovered,
                rightCovered: pair.rightCovered,
                leftTotal: pair.leftTotal,
                rightTotal: pair.rightTotal,
                isFlagged: pair.similarity >= 0.5,
            });
        }

        // Batch insert results
        const resultIdMap = new Map<string, number>();
        if (resultsToInsert.length > 0) {
            const insertedResults = await this.similarityRepo.createResults(resultsToInsert);

            // Build map from submission pair key to database result ID
            for (const result of insertedResults) {
                const key = `${result.submission1Id}-${result.submission2Id}`;
                resultIdMap.set(key, result.id);
            }

            // Prepare fragments for batch insertion
            const fragmentsToInsert: any[] = [];

            for (const result of insertedResults) {
                const key = `${result.submission1Id}-${result.submission2Id}`;
                const pair = pairMap.get(key);
                const swapped = swappedMap.get(key) || false;

                if (pair) {
                    const fragments = pair.buildFragments();

                    for (const frag of fragments) {
                        // If submissions were swapped, swap left/right coordinates too
                        if (swapped) {
                            fragmentsToInsert.push({
                                similarityResultId: result.id,
                                leftStartRow: frag.rightSelection.startRow,
                                leftStartCol: frag.rightSelection.startCol,
                                leftEndRow: frag.rightSelection.endRow,
                                leftEndCol: frag.rightSelection.endCol,
                                rightStartRow: frag.leftSelection.startRow,
                                rightStartCol: frag.leftSelection.startCol,
                                rightEndRow: frag.leftSelection.endRow,
                                rightEndCol: frag.leftSelection.endCol,
                                length: frag.length,
                            });
                        } else {
                            fragmentsToInsert.push({
                                similarityResultId: result.id,
                                leftStartRow: frag.leftSelection.startRow,
                                leftStartCol: frag.leftSelection.startCol,
                                leftEndRow: frag.leftSelection.endRow,
                                leftEndCol: frag.leftSelection.endCol,
                                rightStartRow: frag.rightSelection.startRow,
                                rightStartCol: frag.rightSelection.startCol,
                                rightEndRow: frag.rightSelection.endRow,
                                rightEndCol: frag.rightSelection.endCol,
                                length: frag.length,
                            });
                        }
                    }
                }
            }

            // Batch insert fragments
            if (fragmentsToInsert.length > 0) {
                await this.similarityRepo.createFragments(fragmentsToInsert);
            }
        }

        // Return simplified response with database result IDs
        return {
            reportId: dbReport.id.toString(),
            summary: {
                totalFiles: report.files.length,
                totalPairs: pairs.length,
                suspiciousPairs: pairs.filter((p: Pair) => p.similarity >= 0.5).length,
                averageSimilarity: parseFloat((pairs.reduce((sum: number, p: Pair) => sum + p.similarity, 0) / Math.max(1, pairs.length)).toFixed(4)),
                maxSimilarity: parseFloat((Math.max(...pairs.map((p: Pair) => p.similarity), 0)).toFixed(4)),
            },
            pairs: pairs.map((p: Pair) => {
                const leftSubId = parseInt(p.leftFile.info?.submissionId || '0');
                const rightSubId = parseInt(p.rightFile.info?.submissionId || '0');
                const [sub1, sub2] = leftSubId < rightSubId ? [leftSubId, rightSubId] : [rightSubId, leftSubId];
                const key = `${sub1}-${sub2}`;
                const resultId = resultIdMap.get(key) ?? 0;

                return {
                    id: resultId, // Database result ID for fetching details
                    leftFile: {
                        id: leftSubId,
                        path: p.leftFile.path,
                        filename: p.leftFile.filename,
                        lineCount: p.leftFile.lineCount,
                        studentId: p.leftFile.info?.studentId,
                        studentName: p.leftFile.info?.studentName,
                    },
                    rightFile: {
                        id: rightSubId,
                        path: p.rightFile.path,
                        filename: p.rightFile.filename,
                        lineCount: p.rightFile.lineCount,
                        studentId: p.rightFile.info?.studentId,
                        studentName: p.rightFile.info?.studentName,
                    },
                    structuralScore: p.similarity,
                    semanticScore: 0,
                    hybridScore: 0,
                    overlap: p.overlap,
                    longest: p.longest,
                };
            }),
            warnings: [],
        };
    }
}

