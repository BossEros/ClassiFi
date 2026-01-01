"use strict";
/**
 * Phase 1: API Route Handlers for Plagiarism Detection
 *
 * These are example handlers you can adapt to your ClassiFi backend.
 * They show how to integrate the plagiarism detection library with a REST API.
 *
 * Adapt these to your framework (Express, Fastify, etc.) and database.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAnalyze = handleAnalyze;
exports.handleGetPairDetails = handleGetPairDetails;
exports.handleGetReport = handleGetReport;
exports.handleDeleteReport = handleDeleteReport;
const index_js_1 = require("../index.js");
const reportsStore = new Map();
// ============================================================================
// Handler functions
// ============================================================================
/**
 * POST /api/plagiarism/analyze
 *
 * Analyze a set of files for plagiarism.
 */
async function handleAnalyze(request) {
    // Validate request
    if (!request.files || request.files.length < 2) {
        throw new Error('At least 2 files are required for analysis');
    }
    if (!request.language) {
        throw new Error('Language is required (java, python, or c)');
    }
    // Create detector
    const detector = new index_js_1.PlagiarismDetector({
        language: request.language,
        kgramLength: request.kgramLength ?? 25,
        kgramsInWindow: 40,
    });
    // Convert to File objects
    const files = request.files.map(f => new index_js_1.File(f.path, f.content, {
        studentId: f.studentId,
        studentName: f.studentName,
    }));
    // Optional template file
    let ignoredFile;
    if (request.templateFile) {
        ignoredFile = new index_js_1.File(request.templateFile.path, request.templateFile.content);
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
async function handleGetPairDetails(reportId, pairId) {
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
async function handleGetReport(reportId) {
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
async function handleDeleteReport(reportId) {
    return reportsStore.delete(reportId);
}
// ============================================================================
// Helper functions
// ============================================================================
function pairToResponse(pair) {
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
//# sourceMappingURL=handlers.js.map