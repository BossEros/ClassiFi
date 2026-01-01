var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable } from 'tsyringe';
import { PlagiarismDetector, File } from '../lib/plagiarism/index.js';
/**
 * Business logic for plagiarism detection operations.
 */
let PlagiarismService = class PlagiarismService {
    /** In-memory storage for reports (replace with database in production) */
    reportsStore = new Map();
    /**
     * Analyze files for plagiarism.
     */
    async analyzeFiles(request) {
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
        const files = request.files.map(f => new File(f.path, f.content, {
            studentId: f.studentId,
            studentName: f.studentName,
        }));
        // Optional template file
        let ignoredFile;
        if (request.templateFile) {
            ignoredFile = new File(request.templateFile.path, request.templateFile.content);
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
    async getPairDetails(reportId, pairId) {
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
    async getReport(reportId) {
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
    async deleteReport(reportId) {
        return this.reportsStore.delete(reportId);
    }
    /**
     * Convert a Pair to a response object.
     */
    pairToResponse(pair) {
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
};
PlagiarismService = __decorate([
    injectable()
], PlagiarismService);
export { PlagiarismService };
//# sourceMappingURL=plagiarism.service.js.map