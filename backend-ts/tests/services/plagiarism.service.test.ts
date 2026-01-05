/**
 * PlagiarismService Unit Tests
 * Comprehensive tests for plagiarism detection operations
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PlagiarismService, type AnalyzeRequest } from '../../src/services/plagiarism.service.js';
import { createMockAssignment, createMockSubmission } from '../utils/factories.js';
import {
    AssignmentNotFoundError,
    PlagiarismReportNotFoundError,
    PlagiarismResultNotFoundError,
    PlagiarismPairNotFoundError,
    InsufficientFilesError,
    UnsupportedLanguageError,
    LanguageRequiredError,
    InsufficientDownloadedFilesError,
} from '../../src/shared/errors.js';

// Mock repositories
vi.mock('../../src/repositories/submission.repository.js');
vi.mock('../../src/repositories/assignment.repository.js');
vi.mock('../../src/repositories/similarity.repository.js');

// Mock Supabase
vi.mock('../../src/shared/supabase.js', () => ({
    supabase: {
        storage: {
            from: vi.fn(() => ({
                download: vi.fn(),
            })),
        },
    },
}));

// Mock PlagiarismDetector
vi.mock('../../src/lib/plagiarism/index.js', () => ({
    PlagiarismDetector: vi.fn().mockImplementation(() => ({
        analyze: vi.fn().mockResolvedValue({
            getSummary: () => ({
                totalFiles: 2,
                totalPairs: 1,
                averageSimilarity: 0.5,
                maxSimilarity: 0.8,
                warnings: [],
            }),
            getPairs: () => [{
                id: 1,
                similarity: 0.8,
                overlap: 50,
                longest: 10,
                leftCovered: 40,
                rightCovered: 45,
                leftTotal: 80,
                rightTotal: 90,
                leftFile: {
                    path: 'file1.py',
                    filename: 'file1.py',
                    content: 'print("hello")',
                    lineCount: 1,
                    info: { studentId: '1', studentName: 'Student 1' },
                },
                rightFile: {
                    path: 'file2.py',
                    filename: 'file2.py',
                    content: 'print("hello")',
                    lineCount: 1,
                    info: { studentId: '2', studentName: 'Student 2' },
                },
                buildFragments: () => [],
            }],
            getFragments: () => [{
                leftSelection: { startRow: 1, startCol: 1, endRow: 1, endCol: 10 },
                rightSelection: { startRow: 1, startCol: 1, endRow: 1, endCol: 10 },
                length: 10,
            }],
            files: [{ path: 'file1.py' }, { path: 'file2.py' }],
        }),
    })),
    File: vi.fn().mockImplementation((path, content, info) => ({
        path,
        filename: path,
        content,
        info,
        lineCount: content.split('\n').length,
    })),
    Report: vi.fn(),
    Pair: vi.fn(),
    LanguageName: {
        Python: 'python',
        Java: 'java',
        C: 'c',
    },
}));

describe('PlagiarismService', () => {
    let plagiarismService: PlagiarismService;
    let mockSubmissionRepo: any;
    let mockAssignmentRepo: any;
    let mockSimilarityRepo: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockSubmissionRepo = {
            getSubmissionsWithStudentInfo: vi.fn(),
            getSubmissionWithStudent: vi.fn(),
        };

        mockAssignmentRepo = {
            getAssignmentById: vi.fn(),
        };

        mockSimilarityRepo = {
            getResultWithFragments: vi.fn(),
            createReport: vi.fn(),
            createResults: vi.fn(),
            createFragments: vi.fn(),
        };

        plagiarismService = new PlagiarismService(
            mockSubmissionRepo,
            mockAssignmentRepo,
            mockSimilarityRepo
        );
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    // ============ analyzeFiles Tests ============
    describe('analyzeFiles', () => {
        const validRequest: AnalyzeRequest = {
            files: [
                { path: 'file1.py', content: 'print("hello")', studentId: '1', studentName: 'Student 1' },
                { path: 'file2.py', content: 'print("world")', studentId: '2', studentName: 'Student 2' },
            ],
            language: 'python' as any,
        };

        it('should analyze files successfully', async () => {
            const result = await plagiarismService.analyzeFiles(validRequest);

            expect(result).toBeDefined();
            expect(result.reportId).toBeDefined();
            expect(result.summary).toBeDefined();
            expect(result.pairs).toBeDefined();
        });

        it('should throw InsufficientFilesError when less than 2 files', async () => {
            const invalidRequest: AnalyzeRequest = {
                files: [{ path: 'file1.py', content: 'print("hello")' }],
                language: 'python' as any,
            };

            await expect(
                plagiarismService.analyzeFiles(invalidRequest)
            ).rejects.toThrow(InsufficientFilesError);
        });

        it('should throw InsufficientFilesError when files is empty', async () => {
            const invalidRequest: AnalyzeRequest = {
                files: [],
                language: 'python' as any,
            };

            await expect(
                plagiarismService.analyzeFiles(invalidRequest)
            ).rejects.toThrow(InsufficientFilesError);
        });

        it('should throw LanguageRequiredError when language is not provided', async () => {
            const invalidRequest = {
                files: [
                    { path: 'file1.py', content: 'code' },
                    { path: 'file2.py', content: 'code' },
                ],
            } as AnalyzeRequest;

            await expect(
                plagiarismService.analyzeFiles(invalidRequest)
            ).rejects.toThrow(LanguageRequiredError);
        });

        it('should use custom kgramLength when provided', async () => {
            const requestWithKgram: AnalyzeRequest = {
                ...validRequest,
                kgramLength: 50,
            };

            const result = await plagiarismService.analyzeFiles(requestWithKgram);
            expect(result).toBeDefined();
        });

        it('should use custom threshold for suspicious pairs count', async () => {
            const requestWithThreshold: AnalyzeRequest = {
                ...validRequest,
                threshold: 0.9,
            };

            const result = await plagiarismService.analyzeFiles(requestWithThreshold);
            expect(result.summary).toBeDefined();
        });

        it('should handle template file when provided', async () => {
            const requestWithTemplate: AnalyzeRequest = {
                ...validRequest,
                templateFile: { path: 'template.py', content: 'template code' },
            };

            const result = await plagiarismService.analyzeFiles(requestWithTemplate);
            expect(result).toBeDefined();
        });
    });

    // ============ getPairDetails Tests ============
    describe('getPairDetails', () => {
        it('should throw PlagiarismReportNotFoundError for invalid report ID', async () => {
            await expect(
                plagiarismService.getPairDetails('invalid-report', 1)
            ).rejects.toThrow(PlagiarismReportNotFoundError);
        });

        it('should throw PlagiarismPairNotFoundError for invalid pair ID', async () => {
            // First create a report
            const validRequest: AnalyzeRequest = {
                files: [
                    { path: 'file1.py', content: 'code1' },
                    { path: 'file2.py', content: 'code2' },
                ],
                language: 'python' as any,
            };
            const result = await plagiarismService.analyzeFiles(validRequest);

            await expect(
                plagiarismService.getPairDetails(result.reportId, 999)
            ).rejects.toThrow(PlagiarismPairNotFoundError);
        });

        it('should return pair details for valid report and pair ID', async () => {
            const validRequest: AnalyzeRequest = {
                files: [
                    { path: 'file1.py', content: 'code1' },
                    { path: 'file2.py', content: 'code2' },
                ],
                language: 'python' as any,
            };
            const analyzeResult = await plagiarismService.analyzeFiles(validRequest);

            const result = await plagiarismService.getPairDetails(analyzeResult.reportId, 1);

            expect(result).toBeDefined();
            expect(result.pair).toBeDefined();
            expect(result.fragments).toBeDefined();
            expect(result.leftCode).toBeDefined();
            expect(result.rightCode).toBeDefined();
        });
    });

    // ============ getReport Tests ============
    describe('getReport', () => {
        it('should return null for non-existent report', async () => {
            const result = await plagiarismService.getReport('non-existent');
            expect(result).toBeNull();
        });

        it('should return report for existing report ID', async () => {
            const validRequest: AnalyzeRequest = {
                files: [
                    { path: 'file1.py', content: 'code1' },
                    { path: 'file2.py', content: 'code2' },
                ],
                language: 'python' as any,
            };
            const analyzeResult = await plagiarismService.analyzeFiles(validRequest);

            const result = await plagiarismService.getReport(analyzeResult.reportId);

            expect(result).not.toBeNull();
            expect(result?.reportId).toBe(analyzeResult.reportId);
        });
    });

    // ============ deleteReport Tests ============
    describe('deleteReport', () => {
        it('should return false for non-existent report', async () => {
            const result = await plagiarismService.deleteReport('non-existent');
            expect(result).toBe(false);
        });

        it('should return true and delete existing report', async () => {
            const validRequest: AnalyzeRequest = {
                files: [
                    { path: 'file1.py', content: 'code1' },
                    { path: 'file2.py', content: 'code2' },
                ],
                language: 'python' as any,
            };
            const analyzeResult = await plagiarismService.analyzeFiles(validRequest);

            const deleteResult = await plagiarismService.deleteReport(analyzeResult.reportId);
            expect(deleteResult).toBe(true);

            // Should not find report after deletion
            const getResult = await plagiarismService.getReport(analyzeResult.reportId);
            expect(getResult).toBeNull();
        });
    });

    // ============ getResultDetails Tests ============
    describe('getResultDetails', () => {
        it('should throw PlagiarismResultNotFoundError when result not found', async () => {
            mockSimilarityRepo.getResultWithFragments.mockResolvedValue(null);

            await expect(
                plagiarismService.getResultDetails(999)
            ).rejects.toThrow(PlagiarismResultNotFoundError);
        });

        it('should throw PlagiarismResultNotFoundError when submissions not found', async () => {
            mockSimilarityRepo.getResultWithFragments.mockResolvedValue({
                result: { id: 1, submission1Id: 1, submission2Id: 2 },
                fragments: [],
            });
            mockSubmissionRepo.getSubmissionWithStudent
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);

            await expect(
                plagiarismService.getResultDetails(1)
            ).rejects.toThrow(PlagiarismResultNotFoundError);
        });

        it('should return result details with file content', async () => {
            const mockResult = {
                result: {
                    id: 1,
                    submission1Id: 1,
                    submission2Id: 2,
                    structuralScore: '0.85',
                    overlap: 50,
                    longestFragment: 10,
                },
                fragments: [{
                    id: 1,
                    leftStartRow: 1,
                    leftStartCol: 1,
                    leftEndRow: 5,
                    leftEndCol: 10,
                    rightStartRow: 1,
                    rightStartCol: 1,
                    rightEndRow: 5,
                    rightEndCol: 10,
                    length: 100,
                }],
            };

            mockSimilarityRepo.getResultWithFragments.mockResolvedValue(mockResult);
            mockSubmissionRepo.getSubmissionWithStudent
                .mockResolvedValueOnce({
                    submission: { ...createMockSubmission(), filePath: 'path1' },
                    studentName: 'Student 1',
                })
                .mockResolvedValueOnce({
                    submission: { ...createMockSubmission(), filePath: 'path2' },
                    studentName: 'Student 2',
                });

            const mockBlob = { text: () => Promise.resolve('code content') };
            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.storage.from as any).mockReturnValue({
                download: vi.fn().mockResolvedValue({ data: mockBlob, error: null }),
            });

            const result = await plagiarismService.getResultDetails(1);

            expect(result).toBeDefined();
            expect(result.result.id).toBe(1);
            expect(result.fragments).toHaveLength(1);
            expect(result.leftFile).toBeDefined();
            expect(result.rightFile).toBeDefined();
        });
    });

    // ============ analyzeAssignmentSubmissions Tests ============
    describe('analyzeAssignmentSubmissions', () => {
        it('should throw AssignmentNotFoundError when assignment not found', async () => {
            mockAssignmentRepo.getAssignmentById.mockResolvedValue(undefined);

            await expect(
                plagiarismService.analyzeAssignmentSubmissions(999)
            ).rejects.toThrow(AssignmentNotFoundError);
        });

        it('should throw InsufficientFilesError when not enough submissions', async () => {
            const assignment = createMockAssignment({ programmingLanguage: 'python' });
            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);
            mockSubmissionRepo.getSubmissionsWithStudentInfo.mockResolvedValue([
                { submission: createMockSubmission(), studentName: 'Student 1' },
            ]);

            await expect(
                plagiarismService.analyzeAssignmentSubmissions(1)
            ).rejects.toThrow(InsufficientFilesError);
        });

        it('should throw UnsupportedLanguageError for unsupported language', async () => {
            const assignment = createMockAssignment({ programmingLanguage: 'rust' as any });
            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);

            await expect(
                plagiarismService.analyzeAssignmentSubmissions(1)
            ).rejects.toThrow(UnsupportedLanguageError);
        });

        it('should successfully analyze submissions and persist report', async () => {
            const assignment = createMockAssignment({ programmingLanguage: 'python' });
            const submissions = [
                {
                    submission: { ...createMockSubmission({ id: 1 }), filePath: 'path1' },
                    studentName: 'Student 1',
                    studentUsername: 'student1',
                },
                {
                    submission: { ...createMockSubmission({ id: 2 }), filePath: 'path2' },
                    studentName: 'Student 2',
                    studentUsername: 'student2',
                },
            ];

            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);
            mockSubmissionRepo.getSubmissionsWithStudentInfo.mockResolvedValue(submissions);
            mockSimilarityRepo.createReport.mockResolvedValue({ id: 1 });
            mockSimilarityRepo.createResults.mockResolvedValue([]);
            mockSimilarityRepo.createFragments.mockResolvedValue([]);

            const mockBlob = { text: () => Promise.resolve('code content') };
            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.storage.from as any).mockReturnValue({
                download: vi.fn().mockResolvedValue({ data: mockBlob, error: null }),
            });

            const result = await plagiarismService.analyzeAssignmentSubmissions(1, 1);

            expect(result).toBeDefined();
            expect(result.reportId).toBeDefined();
            expect(mockSimilarityRepo.createReport).toHaveBeenCalled();
        });

        it('should throw InsufficientDownloadedFilesError when file downloads fail', async () => {
            const assignment = createMockAssignment({ programmingLanguage: 'python' });
            const submissions = [
                {
                    submission: { ...createMockSubmission({ id: 1 }), filePath: 'path1' },
                    studentName: 'Student 1',
                },
                {
                    submission: { ...createMockSubmission({ id: 2 }), filePath: 'path2' },
                    studentName: 'Student 2',
                },
            ];

            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);
            mockSubmissionRepo.getSubmissionsWithStudentInfo.mockResolvedValue(submissions);

            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.storage.from as any).mockReturnValue({
                download: vi.fn().mockResolvedValue({ data: null, error: { message: 'Download failed' } }),
            });

            await expect(
                plagiarismService.analyzeAssignmentSubmissions(1)
            ).rejects.toThrow(InsufficientDownloadedFilesError);
        });
    });
});
