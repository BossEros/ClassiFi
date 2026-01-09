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

// Mock PlagiarismDetector
vi.mock('../../src/lib/plagiarism/index.js', () => {
    const mockReport = {
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
    };

    class MockPlagiarismDetector {
        analyze = vi.fn().mockResolvedValue(mockReport);
    }

    return {
        PlagiarismDetector: vi.fn().mockImplementation(() => new MockPlagiarismDetector()),
        File: vi.fn().mockImplementation((path: string, content: string, info?: any) => ({
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
    };
});

describe('PlagiarismService', () => {
    let plagiarismService: PlagiarismService;
    let mockSubmissionRepo: any;
    let mockAssignmentRepo: any;
    let mockSimilarityRepo: any;
    let mockStorageService: any;

    beforeEach(() => {
        mockSubmissionRepo = {
            getSubmissionsWithStudentInfo: vi.fn(),
            getSubmissionWithStudent: vi.fn(),
        };
        mockAssignmentRepo = {
            getAssignmentById: vi.fn(),
        };
        mockSimilarityRepo = {
            createReport: vi.fn(),
            createResults: vi.fn(),
            createFragments: vi.fn(),
            getResultWithFragments: vi.fn(),
        };
        mockStorageService = {
            upload: vi.fn().mockResolvedValue('path/to/file'),
            download: vi.fn().mockResolvedValue('code content'),
            deleteFiles: vi.fn(),
            getSignedUrl: vi.fn().mockResolvedValue('https://example.com/signed-url'),
            deleteSubmissionFiles: vi.fn(),
            deleteAvatar: vi.fn(),
        };

        // Reset Factory Mocks
        (PlagiarismService as any).prototype.reportsStore = new Map();

        plagiarismService = new PlagiarismService(
            mockSubmissionRepo,
            mockAssignmentRepo,
            mockSimilarityRepo,
            mockStorageService
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('analyzeFiles', () => {
        it('should successfully analyze files', async () => {
            const request: AnalyzeRequest = {
                files: [
                    { path: 'file1.py', content: 'print("hello")' },
                    { path: 'file2.py', content: 'print("hello")' },
                ],
                language: 'python',
            };

            const result = await plagiarismService.analyzeFiles(request);

            expect(result).toBeDefined();
            expect(result.reportId).toBeDefined();
            expect(result.summary).toBeDefined();
            expect(result.pairs).toHaveLength(1);
        });

        it('should throw InsufficientFilesError when less than 2 files', async () => {
            const request: AnalyzeRequest = {
                files: [
                    { path: 'file1.py', content: 'print("hello")' },
                ],
                language: 'python',
            };

            await expect(plagiarismService.analyzeFiles(request))
                .rejects.toThrow(InsufficientFilesError);
        });

        it('should throw InsufficientFilesError when files is empty', async () => {
            const request: AnalyzeRequest = {
                files: [],
                language: 'python',
            };

            await expect(plagiarismService.analyzeFiles(request))
                .rejects.toThrow(InsufficientFilesError);
        });

        it('should throw LanguageRequiredError when language is missing', async () => {
            const request: AnalyzeRequest = {
                files: [
                    { path: 'file1.py', content: 'print("hello")' },
                    { path: 'file2.py', content: 'print("hello")' },
                ],
                language: '' as any,
            };

            await expect(plagiarismService.analyzeFiles(request))
                .rejects.toThrow(LanguageRequiredError);
        });
    });

    describe('analyzeAssignmentSubmissions', () => {
        it('should throw AssignmentNotFoundError when assignment not found', async () => {
            mockAssignmentRepo.getAssignmentById.mockResolvedValue(null);

            await expect(
                plagiarismService.analyzeAssignmentSubmissions(1)
            ).rejects.toThrow(AssignmentNotFoundError);
        });

        it('should throw InsufficientFilesError when submissions not found', async () => {
            const assignment = createMockAssignment({ programmingLanguage: 'python' });
            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);
            mockSubmissionRepo.getSubmissionsWithStudentInfo.mockResolvedValue([]);

            await expect(
                plagiarismService.analyzeAssignmentSubmissions(1)
            ).rejects.toThrow(InsufficientFilesError);
        });

        it('should throw InsufficientFilesError when less than 2 submissions', async () => {
            const assignment = createMockAssignment({ programmingLanguage: 'python' });
            const submissions = [
                {
                    submission: createMockSubmission({ id: 1 }),
                    studentName: 'Student 1',
                },
            ];

            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);
            mockSubmissionRepo.getSubmissionsWithStudentInfo.mockResolvedValue(submissions);

            await expect(
                plagiarismService.analyzeAssignmentSubmissions(1)
            ).rejects.toThrow(InsufficientFilesError);
        });

        it('should throw UnsupportedLanguageError for unsupported language', async () => {
            const assignment = createMockAssignment({ programmingLanguage: 'rust' as any });
            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);

            // Use raw objects to ensure structure is correct and avoid factory issues
            mockSubmissionRepo.getSubmissionsWithStudentInfo.mockResolvedValue([
                { submission: { filePath: 'path1' } as any, studentName: 'S1' },
                { submission: { filePath: 'path2' } as any, studentName: 'S2' }
            ]);

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
                },
                {
                    submission: { ...createMockSubmission({ id: 2 }), filePath: 'path2' },
                    studentName: 'Student 2',
                },
            ];

            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);
            mockSubmissionRepo.getSubmissionsWithStudentInfo.mockResolvedValue(submissions);
            mockSimilarityRepo.createReport.mockResolvedValue({ id: 1 });
            mockSimilarityRepo.createResults.mockResolvedValue([]);
            mockSimilarityRepo.createFragments.mockResolvedValue([]);
            // StorageService.download is already mocked in beforeEach

            const result = await plagiarismService.analyzeAssignmentSubmissions(1, 1);

            expect(result).toBeDefined();
            expect(result.reportId).toBeDefined();
            expect(mockSimilarityRepo.createReport).toHaveBeenCalled();
            expect(mockStorageService.download).toHaveBeenCalled();
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
            // Setup failed download by throwing error
            mockStorageService.download.mockRejectedValue(new Error('Download failed'));

            await expect(
                plagiarismService.analyzeAssignmentSubmissions(1)
            ).rejects.toThrow(InsufficientDownloadedFilesError);
        });
    });
});
