var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { inject, injectable } from 'tsyringe';
import { PlagiarismDetector, File } from '../lib/plagiarism/index.js';
import { SubmissionRepository } from '../repositories/submission.repository.js';
import { AssignmentRepository } from '../repositories/assignment.repository.js';
import { SimilarityRepository } from '../repositories/similarity.repository.js';
import { supabase } from '../shared/supabase.js';
import { PLAGIARISM_CONFIG, PLAGIARISM_LANGUAGE_MAP, toPlagiarismPairDTO, toPlagiarismFragmentDTO, } from '../shared/mappers.js';
import { AssignmentNotFoundError, PlagiarismReportNotFoundError, PlagiarismResultNotFoundError, PlagiarismPairNotFoundError, InsufficientFilesError, UnsupportedLanguageError, LanguageRequiredError, FileDownloadError, InsufficientDownloadedFilesError, } from '../shared/errors.js';
/**
 * Business logic for plagiarism detection operations.
 * Uses domain errors for exceptional conditions.
 */
let PlagiarismService = class PlagiarismService {
    submissionRepo;
    assignmentRepo;
    similarityRepo;
    /** In-memory storage for reports (replace with database in production) */
    reportsStore = new Map();
    constructor(submissionRepo, assignmentRepo, similarityRepo) {
        this.submissionRepo = submissionRepo;
        this.assignmentRepo = assignmentRepo;
        this.similarityRepo = similarityRepo;
    }
    // ========================================================================
    // Public Methods
    // ========================================================================
    /** Analyze files for plagiarism */
    async analyzeFiles(request) {
        // Validate request
        this.validateAnalyzeRequest(request);
        // Create detector
        const detector = new PlagiarismDetector({
            language: request.language,
            kgramLength: request.kgramLength ?? PLAGIARISM_CONFIG.DEFAULT_KGRAM_LENGTH,
            kgramsInWindow: PLAGIARISM_CONFIG.DEFAULT_KGRAMS_IN_WINDOW,
        });
        // Convert to File objects
        const files = request.files.map(f => new File(f.path, f.content, { studentId: f.studentId, studentName: f.studentName }));
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
    async getPairDetails(reportId, pairId) {
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
    /** Get report by ID */
    async getReport(reportId) {
        const stored = this.reportsStore.get(reportId);
        if (!stored) {
            return null;
        }
        return this.buildAnalyzeResponse(stored.id, stored.report, PLAGIARISM_CONFIG.DEFAULT_THRESHOLD);
    }
    /** Delete a report */
    async deleteReport(reportId) {
        return this.reportsStore.delete(reportId);
    }
    /** Get result details from database with fragments and file content */
    async getResultDetails(resultId) {
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
        const [leftContent, rightContent] = await this.downloadSubmissionFiles(submission1.submission.filePath, submission2.submission.filePath);
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
    async analyzeAssignmentSubmissions(assignmentId, teacherId) {
        // Step 1: Validate and fetch assignment
        const assignment = await this.validateAndFetchAssignment(assignmentId);
        // Step 2: Fetch and download submission files
        const files = await this.fetchSubmissionFiles(assignmentId);
        // Step 3: Run plagiarism analysis
        const language = this.getLanguage(assignment.programmingLanguage);
        const { report, pairs } = await this.runPlagiarismAnalysis(files, language);
        // Step 4: Persist report to database
        const { dbReport, resultIdMap } = await this.persistReportToDatabase(assignmentId, teacherId, report, pairs);
        // Step 5: Build and return response
        return this.buildAssignmentAnalysisResponse(dbReport.id, report, pairs, resultIdMap);
    }
    // ========================================================================
    // Private Helper Methods
    // ========================================================================
    /** Validate analyze request */
    validateAnalyzeRequest(request) {
        if (!request.files || request.files.length < PLAGIARISM_CONFIG.MINIMUM_FILES_REQUIRED) {
            throw new InsufficientFilesError(PLAGIARISM_CONFIG.MINIMUM_FILES_REQUIRED, request.files?.length ?? 0);
        }
        if (!request.language) {
            throw new LanguageRequiredError();
        }
    }
    /** Generate a unique report ID */
    generateReportId() {
        return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /** Build analyze response from report */
    buildAnalyzeResponse(reportId, report, threshold) {
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
    async validateAndFetchAssignment(assignmentId) {
        const assignment = await this.assignmentRepo.getAssignmentById(assignmentId);
        if (!assignment) {
            throw new AssignmentNotFoundError(assignmentId);
        }
        return assignment;
    }
    /** Get validated language name */
    getLanguage(programmingLanguage) {
        const language = PLAGIARISM_LANGUAGE_MAP[programmingLanguage.toLowerCase()];
        if (!language) {
            throw new UnsupportedLanguageError(programmingLanguage);
        }
        return language;
    }
    /** Fetch and download all submission files for an assignment */
    async fetchSubmissionFiles(assignmentId) {
        const submissionsWithInfo = await this.submissionRepo.getSubmissionsWithStudentInfo(assignmentId, true // latestOnly
        );
        if (submissionsWithInfo.length < PLAGIARISM_CONFIG.MINIMUM_FILES_REQUIRED) {
            throw new InsufficientFilesError(PLAGIARISM_CONFIG.MINIMUM_FILES_REQUIRED, submissionsWithInfo.length);
        }
        const files = [];
        for (const item of submissionsWithInfo) {
            const { submission, studentName } = item;
            const { data, error } = await supabase.storage
                .from('submissions')
                .download(submission.filePath);
            if (error) {
                console.warn(`Failed to download file for submission ${submission.id}: ${error.message}`);
                continue;
            }
            const content = await data.text();
            files.push(new File(submission.fileName, content, {
                studentId: submission.studentId.toString(),
                studentName: studentName,
                submissionId: submission.id.toString(),
            }));
        }
        if (files.length < PLAGIARISM_CONFIG.MINIMUM_FILES_REQUIRED) {
            throw new InsufficientDownloadedFilesError(PLAGIARISM_CONFIG.MINIMUM_FILES_REQUIRED, files.length);
        }
        return files;
    }
    /** Download two submission files and return their content */
    async downloadSubmissionFiles(filePath1, filePath2) {
        const [file1Data, file2Data] = await Promise.all([
            supabase.storage.from('submissions').download(filePath1),
            supabase.storage.from('submissions').download(filePath2),
        ]);
        if (file1Data.error || file2Data.error) {
            throw new FileDownloadError(0, 'Failed to download file content');
        }
        const [leftContent, rightContent] = await Promise.all([
            file1Data.data.text(),
            file2Data.data.text(),
        ]);
        return [leftContent, rightContent];
    }
    /** Run plagiarism detection on files */
    async runPlagiarismAnalysis(files, language) {
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
    async persistReportToDatabase(assignmentId, teacherId, report, pairs) {
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
        const resultIdMap = new Map();
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
    prepareResultsForInsert(reportId, pairs) {
        const resultsToInsert = [];
        const pairMap = new Map();
        const swappedMap = new Map();
        for (const pair of pairs) {
            const leftSubId = parseInt(pair.leftFile.info?.submissionId || '0');
            const rightSubId = parseInt(pair.rightFile.info?.submissionId || '0');
            if (!leftSubId || !rightSubId)
                continue;
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
    prepareFragmentsForInsert(insertedResults, pairMap, swappedMap) {
        const fragmentsToInsert = [];
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
                    }
                    else {
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
    buildAssignmentAnalysisResponse(reportId, report, pairs, resultIdMap) {
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
};
PlagiarismService = __decorate([
    injectable(),
    __param(0, inject('SubmissionRepository')),
    __param(1, inject('AssignmentRepository')),
    __param(2, inject('SimilarityRepository')),
    __metadata("design:paramtypes", [SubmissionRepository,
        AssignmentRepository,
        SimilarityRepository])
], PlagiarismService);
export { PlagiarismService };
//# sourceMappingURL=plagiarism.service.js.map