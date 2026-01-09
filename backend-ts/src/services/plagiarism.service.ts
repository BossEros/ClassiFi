import { inject, injectable } from 'tsyringe';
import {
    PlagiarismDetector,
    File,
    Report,
    Pair,
    LanguageName
} from '../lib/plagiarism/index.js';
import { SubmissionRepository } from '../repositories/submission.repository.js';
import { AssignmentRepository } from '../repositories/assignment.repository.js';
import { SimilarityRepository } from '../repositories/similarity.repository.js';
import { StorageService } from './storage.service.js';
import {
    PLAGIARISM_CONFIG,
    PLAGIARISM_LANGUAGE_MAP,
    toPlagiarismPairDTO,
    toPlagiarismFragmentDTO,
    type PlagiarismPairDTO,
    type PlagiarismFragmentDTO,
    type PlagiarismSummaryDTO,
} from '../shared/mappers.js';
import {
    AssignmentNotFoundError,
    PlagiarismReportNotFoundError,
    PlagiarismResultNotFoundError,
    PlagiarismPairNotFoundError,
    InsufficientFilesError,
    UnsupportedLanguageError,
    LanguageRequiredError,
    FileDownloadError,
    InsufficientDownloadedFilesError,
} from '../shared/errors.js';

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

/** Stored report for retrieval (internal) */
interface StoredReport {
    id: string;
    createdAt: Date;
    report: Report;
}

/**
 * Business logic for plagiarism detection operations.
 * Uses domain errors for exceptional conditions.
 */
@injectable()
export class PlagiarismService {
    /** In-memory storage for reports (replace with database in production) */
    private reportsStore = new Map<string, StoredReport>();

    constructor(
        @inject('SubmissionRepository') private submissionRepo: SubmissionRepository,
        @inject('AssignmentRepository') private assignmentRepo: AssignmentRepository,
        @inject('SimilarityRepository') private similarityRepo: SimilarityRepository,
        @inject('StorageService') private storageService: StorageService
    ) { }

    // ========================================================================
    // Public Methods
    // ========================================================================

    /** Analyze files for plagiarism */
    async analyzeFiles(request: AnalyzeRequest): Promise<AnalyzeResponse> {
        // Validate request
        this.validateAnalyzeRequest(request);

        // Create detector
        const detector = new PlagiarismDetector({
            language: request.language,
            kgramLength: request.kgramLength ?? PLAGIARISM_CONFIG.DEFAULT_KGRAM_LENGTH,
            kgramsInWindow: PLAGIARISM_CONFIG.DEFAULT_KGRAMS_IN_WINDOW,
        });

        // Convert to File objects
        const files = request.files.map(f => new File(
            f.path,
            f.content,
            { studentId: f.studentId, studentName: f.studentName }
        ));

        // Optional template file
        const ignoredFile = request.templateFile
            ? new File(request.templateFile.path, request.templateFile.content)
            : undefined;

        // Run analysis
        const report = await detector.analyze(files, ignoredFile);

        // Generate and store report
        const reportId = this.generateReportId();
        this.reportsStore.set(reportId, { id: reportId, createdAt: new Date(), report });

        // Build response
        const threshold = request.threshold ?? PLAGIARISM_CONFIG.DEFAULT_THRESHOLD;
        return this.buildAnalyzeResponse(reportId, report, threshold);
    }

    /** Get pair details with fragments */
    async getPairDetails(reportId: string, pairId: number): Promise<PairDetailsResponse> {
        const stored = this.reportsStore.get(reportId);
        if (!stored) {
            throw new PlagiarismReportNotFoundError(reportId);
        }

        const pairs = stored.report.getPairs();
        const pair = pairs.find(p => p.id === pairId);
        if (!pair) {
            throw new PlagiarismPairNotFoundError(pairId);
        }

        const fragments = stored.report.getFragments(pair);

        return {
            pair: toPlagiarismPairDTO(pair),
            fragments: fragments.map((f, i) => toPlagiarismFragmentDTO(f, i)),
            leftCode: pair.leftFile.content,
            rightCode: pair.rightFile.content,
        };
    }

    /** Get report by ID - checks database first for numeric IDs, then in-memory */
    async getReport(reportId: string): Promise<AnalyzeResponse | null> {
        // Try to parse as numeric ID (database report)
        const numericId = parseInt(reportId, 10);
        if (!isNaN(numericId)) {
            return this.getReportFromDatabase(numericId);
        }

        // Fall back to in-memory for string-based ad-hoc reports
        const stored = this.reportsStore.get(reportId);
        if (!stored) {
            return null;
        }

        return this.buildAnalyzeResponse(
            stored.id,
            stored.report,
            PLAGIARISM_CONFIG.DEFAULT_THRESHOLD
        );
    }

    /** Delete a report - checks database first for numeric IDs, then in-memory */
    async deleteReport(reportId: string): Promise<boolean> {
        // Try to parse as numeric ID (database report)
        const numericId = parseInt(reportId, 10);
        if (!isNaN(numericId)) {
            return this.similarityRepo.deleteReport(numericId);
        }

        // Fall back to in-memory for string-based ad-hoc reports
        return this.reportsStore.delete(reportId);
    }

    /** Get report from database and reconstruct response */
    private async getReportFromDatabase(reportId: number): Promise<AnalyzeResponse | null> {
        const report = await this.similarityRepo.getReportById(reportId);
        if (!report) {
            return null;
        }

        const results = await this.similarityRepo.getResultsByReport(reportId);

        // Build pairs from database results
        const pairs: PlagiarismPairDTO[] = await Promise.all(
            results.map(async (result) => {
                const submission1 = await this.submissionRepo.getSubmissionWithStudent(result.submission1Id);
                const submission2 = await this.submissionRepo.getSubmissionWithStudent(result.submission2Id);

                return {
                    id: result.id,
                    leftFile: {
                        id: result.submission1Id,
                        path: submission1?.submission.filePath || '',
                        filename: submission1?.submission.fileName || 'Unknown',
                        lineCount: 0,
                        studentId: submission1?.submission.studentId?.toString(),
                        studentName: submission1?.studentName || 'Unknown',
                    },
                    rightFile: {
                        id: result.submission2Id,
                        path: submission2?.submission.filePath || '',
                        filename: submission2?.submission.fileName || 'Unknown',
                        lineCount: 0,
                        studentId: submission2?.submission.studentId?.toString(),
                        studentName: submission2?.studentName || 'Unknown',
                    },
                    structuralScore: parseFloat(result.structuralScore),
                    semanticScore: parseFloat(result.semanticScore || '0'),
                    hybridScore: parseFloat(result.hybridScore || '0'),
                    overlap: result.overlap,
                    longest: result.longestFragment,
                };
            })
        );

        return {
            reportId: reportId.toString(),
            summary: {
                totalFiles: report.totalSubmissions,
                totalPairs: report.totalComparisons,
                suspiciousPairs: report.flaggedPairs,
                averageSimilarity: parseFloat(report.averageSimilarity || '0'),
                maxSimilarity: parseFloat(report.highestSimilarity || '0'),
            },
            pairs,
            warnings: [],
        };
    }

    /** Get result details from database with fragments and file content */
    async getResultDetails(resultId: number): Promise<{
        result: {
            id: number;
            submission1Id: number;
            submission2Id: number;
            structuralScore: string;
            overlap: number;
            longestFragment: number;
        };
        fragments: PlagiarismFragmentDTO[];
        leftFile: { filename: string; content: string; lineCount: number; studentName: string };
        rightFile: { filename: string; content: string; lineCount: number; studentName: string };
    }> {
        // Fetch result with fragments from database
        const data = await this.similarityRepo.getResultWithFragments(resultId);
        if (!data) {
            throw new PlagiarismResultNotFoundError(resultId);
        }

        const { result, fragments } = data;

        // Fetch submission details
        const [submission1, submission2] = await Promise.all([
            this.submissionRepo.getSubmissionWithStudent(result.submission1Id),
            this.submissionRepo.getSubmissionWithStudent(result.submission2Id),
        ]);

        if (!submission1 || !submission2) {
            throw new PlagiarismResultNotFoundError(resultId);
        }

        // Download file content from Supabase
        const [leftContent, rightContent] = await this.downloadSubmissionFiles(
            submission1.submission.filePath,
            submission2.submission.filePath
        );

        return {
            result: {
                id: result.id,
                submission1Id: result.submission1Id,
                submission2Id: result.submission2Id,
                structuralScore: result.structuralScore,
                overlap: result.overlap,
                longestFragment: result.longestFragment,
            },
            fragments: fragments.map((f, i) => ({
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
     * Analyze all submissions for an assignment.
     * Fetches submissions, downloads file content from Supabase, and runs analysis.
     * Persists the report and results to the database.
     */
    async analyzeAssignmentSubmissions(assignmentId: number, teacherId?: number): Promise<AnalyzeResponse> {
        // Step 1: Validate and fetch assignment
        const assignment = await this.validateAndFetchAssignment(assignmentId);

        // Step 2: Fetch and download submission files
        const files = await this.fetchSubmissionFiles(assignmentId);

        // Step 3: Run plagiarism analysis
        const language = this.getLanguage(assignment.programmingLanguage);
        const { report, pairs } = await this.runPlagiarismAnalysis(files, language);

        // Step 4: Persist report to database
        const { dbReport, resultIdMap } = await this.persistReportToDatabase(
            assignmentId,
            teacherId,
            report,
            pairs
        );

        // Step 5: Build and return response
        return this.buildAssignmentAnalysisResponse(dbReport.id, report, pairs, resultIdMap);
    }

    // ========================================================================
    // Private Helper Methods
    // ========================================================================

    /** Validate analyze request */
    private validateAnalyzeRequest(request: AnalyzeRequest): void {
        if (!request.files || request.files.length < PLAGIARISM_CONFIG.MINIMUM_FILES_REQUIRED) {
            throw new InsufficientFilesError(
                PLAGIARISM_CONFIG.MINIMUM_FILES_REQUIRED,
                request.files?.length ?? 0
            );
        }

        if (!request.language) {
            throw new LanguageRequiredError();
        }
    }

    /** Generate a unique report ID */
    private generateReportId(): string {
        return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /** Build analyze response from report */
    private buildAnalyzeResponse(
        reportId: string,
        report: Report,
        threshold: number
    ): AnalyzeResponse {
        const summary = report.getSummary();
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
            pairs: pairs.map(pair => toPlagiarismPairDTO(pair)),
            warnings: summary.warnings,
        };
    }

    /** Validate assignment exists and return it */
    private async validateAndFetchAssignment(assignmentId: number) {
        const assignment = await this.assignmentRepo.getAssignmentById(assignmentId);
        if (!assignment) {
            throw new AssignmentNotFoundError(assignmentId);
        }
        return assignment;
    }

    /** Get validated language name */
    private getLanguage(programmingLanguage: string): LanguageName {
        const language = PLAGIARISM_LANGUAGE_MAP[programmingLanguage.toLowerCase()];
        if (!language) {
            throw new UnsupportedLanguageError(programmingLanguage);
        }
        return language;
    }

    /** Fetch and download all submission files for an assignment using StorageService */
    private async fetchSubmissionFiles(assignmentId: number): Promise<File[]> {
        const submissionsWithInfo = await this.submissionRepo.getSubmissionsWithStudentInfo(
            assignmentId,
            true // latestOnly
        );

        if (submissionsWithInfo.length < PLAGIARISM_CONFIG.MINIMUM_FILES_REQUIRED) {
            throw new InsufficientFilesError(
                PLAGIARISM_CONFIG.MINIMUM_FILES_REQUIRED,
                submissionsWithInfo.length
            );
        }

        const files: File[] = [];

        for (const item of submissionsWithInfo) {
            const { submission, studentName } = item;

            try {
                const content = await this.storageService.download('submissions', submission.filePath);

                files.push(new File(
                    submission.fileName,
                    content,
                    {
                        studentId: submission.studentId.toString(),
                        studentName: studentName,
                        submissionId: submission.id.toString(),
                    }
                ));
            } catch (error) {
                console.warn(`Failed to download file for submission ${submission.id}:`, error);
                continue;
            }
        }

        if (files.length < PLAGIARISM_CONFIG.MINIMUM_FILES_REQUIRED) {
            throw new InsufficientDownloadedFilesError(
                PLAGIARISM_CONFIG.MINIMUM_FILES_REQUIRED,
                files.length
            );
        }

        return files;
    }

    /** Download two submission files and return their content using StorageService */
    private async downloadSubmissionFiles(
        filePath1: string,
        filePath2: string
    ): Promise<[string, string]> {
        try {
            const [leftContent, rightContent] = await Promise.all([
                this.storageService.download('submissions', filePath1),
                this.storageService.download('submissions', filePath2),
            ]);

            return [leftContent, rightContent];
        } catch (error) {
            throw new FileDownloadError(0, 'Failed to download file content');
        }
    }

    /** Run plagiarism detection on files */
    private async runPlagiarismAnalysis(
        files: File[],
        language: LanguageName
    ): Promise<{ report: Report; pairs: Pair[] }> {
        const detector = new PlagiarismDetector({
            language,
            kgramLength: PLAGIARISM_CONFIG.DEFAULT_KGRAM_LENGTH,
            kgramsInWindow: PLAGIARISM_CONFIG.DEFAULT_KGRAMS_IN_WINDOW,
        });

        const report = await detector.analyze(files);
        const pairs = report.getPairs();

        return { report, pairs };
    }

    /** Persist report, results, and fragments to database */
    private async persistReportToDatabase(
        assignmentId: number,
        teacherId: number | undefined,
        report: Report,
        pairs: Pair[]
    ): Promise<{ dbReport: { id: number }; resultIdMap: Map<string, number> }> {
        // Create report
        const dbReport = await this.similarityRepo.createReport({
            assignmentId,
            teacherId: teacherId ?? null,
            totalSubmissions: report.files.length,
            totalComparisons: pairs.length,
            flaggedPairs: pairs.filter(p => p.similarity >= PLAGIARISM_CONFIG.DEFAULT_THRESHOLD).length,
            averageSimilarity: (pairs.reduce((sum, p) => sum + p.similarity, 0) / Math.max(1, pairs.length)).toFixed(4),
            highestSimilarity: (Math.max(...pairs.map(p => p.similarity), 0)).toFixed(4),
        });

        // Prepare results for batch insert
        const { resultsToInsert, pairMap, swappedMap } = this.prepareResultsForInsert(dbReport.id, pairs);

        // Batch insert results and fragments
        const resultIdMap = new Map<string, number>();

        if (resultsToInsert.length > 0) {
            const insertedResults = await this.similarityRepo.createResults(resultsToInsert);

            // Build result ID map and insert fragments
            for (const result of insertedResults) {
                const key = `${result.submission1Id}-${result.submission2Id}`;
                resultIdMap.set(key, result.id);
            }

            // Prepare and insert fragments
            const fragmentsToInsert = this.prepareFragmentsForInsert(insertedResults, pairMap, swappedMap);
            if (fragmentsToInsert.length > 0) {
                await this.similarityRepo.createFragments(fragmentsToInsert);
            }
        }

        return { dbReport, resultIdMap };
    }

    /** Prepare results for database insertion */
    private prepareResultsForInsert(
        reportId: number,
        pairs: Pair[]
    ): {
        resultsToInsert: any[];
        pairMap: Map<string, Pair>;
        swappedMap: Map<string, boolean>;
    } {
        const resultsToInsert: any[] = [];
        const pairMap = new Map<string, Pair>();
        const swappedMap = new Map<string, boolean>();

        for (const pair of pairs) {
            const leftSubId = parseInt(pair.leftFile.info?.submissionId || '0');
            const rightSubId = parseInt(pair.rightFile.info?.submissionId || '0');

            if (!leftSubId || !rightSubId) continue;

            const needsSwap = leftSubId > rightSubId;
            const [sub1, sub2] = needsSwap ? [rightSubId, leftSubId] : [leftSubId, rightSubId];

            const key = `${sub1}-${sub2}`;
            pairMap.set(key, pair);
            swappedMap.set(key, needsSwap);

            resultsToInsert.push({
                reportId,
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
                isFlagged: pair.similarity >= PLAGIARISM_CONFIG.DEFAULT_THRESHOLD,
            });
        }

        return { resultsToInsert, pairMap, swappedMap };
    }

    /** Prepare fragments for database insertion */
    private prepareFragmentsForInsert(
        insertedResults: any[],
        pairMap: Map<string, Pair>,
        swappedMap: Map<string, boolean>
    ): any[] {
        const fragmentsToInsert: any[] = [];

        for (const result of insertedResults) {
            const key = `${result.submission1Id}-${result.submission2Id}`;
            const pair = pairMap.get(key);
            const swapped = swappedMap.get(key) || false;

            if (pair) {
                const fragments = pair.buildFragments();

                for (const frag of fragments) {
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

        return fragmentsToInsert;
    }

    /** Build response for assignment analysis */
    private buildAssignmentAnalysisResponse(
        reportId: number,
        report: Report,
        pairs: Pair[],
        resultIdMap: Map<string, number>
    ): AnalyzeResponse {
        return {
            reportId: reportId.toString(),
            summary: {
                totalFiles: report.files.length,
                totalPairs: pairs.length,
                suspiciousPairs: pairs.filter(p => p.similarity >= PLAGIARISM_CONFIG.DEFAULT_THRESHOLD).length,
                averageSimilarity: parseFloat((pairs.reduce((sum, p) => sum + p.similarity, 0) / Math.max(1, pairs.length)).toFixed(4)),
                maxSimilarity: parseFloat((Math.max(...pairs.map(p => p.similarity), 0)).toFixed(4)),
            },
            pairs: pairs.map(p => {
                const leftSubId = parseInt(p.leftFile.info?.submissionId || '0');
                const rightSubId = parseInt(p.rightFile.info?.submissionId || '0');
                const [sub1, sub2] = leftSubId < rightSubId ? [leftSubId, rightSubId] : [rightSubId, leftSubId];
                const key = `${sub1}-${sub2}`;
                const resultId = resultIdMap.get(key) ?? 0;

                return {
                    id: resultId,
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

