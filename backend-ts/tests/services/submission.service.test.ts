/**
 * SubmissionService Unit Tests
 * Comprehensive tests for submission operations
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SubmissionService } from '../../src/services/submission.service.js';
import { createMockAssignment, createMockSubmission } from '../utils/factories.js';
import {
    AssignmentNotFoundError,
    AssignmentInactiveError,
    DeadlinePassedError,
    NotEnrolledError,
    ResubmissionNotAllowedError,
    InvalidFileTypeError,
    FileTooLargeError,
    UploadFailedError,
} from '../../src/shared/errors.js';

// Mock repositories
vi.mock('../../src/repositories/submission.repository.js');
vi.mock('../../src/repositories/assignment.repository.js');
vi.mock('../../src/repositories/enrollment.repository.js');
vi.mock('../../src/repositories/class.repository.js');
vi.mock('../../src/repositories/testResult.repository.js');
vi.mock('../../src/services/codeTest.service.js');

// Mock Supabase (for legacy tests that still use it)
vi.mock('../../src/shared/supabase.js', () => ({
    supabase: {
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn(),
                createSignedUrl: vi.fn(),
            })),
        },
    },
}));

describe('SubmissionService', () => {
    let submissionService: SubmissionService;
    let mockSubmissionRepo: any;
    let mockAssignmentRepo: any;
    let mockEnrollmentRepo: any;
    let mockClassRepo: any;
    let mockTestResultRepo: any;
    let mockStorageService: any;
    let mockCodeTestService: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockSubmissionRepo = {
            getLatestSubmission: vi.fn(),
            getSubmissionCount: vi.fn(),
            createSubmission: vi.fn(),
            getSubmissionHistory: vi.fn(),
            getSubmissionsWithStudentInfo: vi.fn(),
            getSubmissionsByStudent: vi.fn(),
            delete: vi.fn(),
        };

        mockAssignmentRepo = {
            getAssignmentById: vi.fn(),
        };

        mockEnrollmentRepo = {
            isEnrolled: vi.fn(),
        };

        mockClassRepo = {};

        mockTestResultRepo = {
            deleteBySubmissionId: vi.fn(),
        };

        mockStorageService = {
            upload: vi.fn().mockResolvedValue('path/to/file'),
            download: vi.fn(),
            deleteFiles: vi.fn(),
            getSignedUrl: vi.fn().mockResolvedValue('https://example.com/signed-url'),
            deleteSubmissionFiles: vi.fn(),
            deleteAvatar: vi.fn(),
        };

        mockCodeTestService = {
            runTestsForSubmission: vi.fn(),
        };

        submissionService = new SubmissionService(
            mockSubmissionRepo,
            mockAssignmentRepo,
            mockEnrollmentRepo,
            mockClassRepo,
            mockTestResultRepo,
            mockStorageService,
            mockCodeTestService
        );
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    // ============ submitAssignment Tests ============
    describe('submitAssignment', () => {
        const validFile = {
            filename: 'solution.py',
            data: Buffer.from('print("hello")'),
            mimetype: 'text/x-python',
        };

        const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        it('should submit assignment successfully', async () => {
            const assignment = createMockAssignment({
                id: 1,
                isActive: true,
                deadline: futureDeadline,
                programmingLanguage: 'python',
                allowResubmission: true,
            });
            const mockSubmission = createMockSubmission({ id: 1 });

            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);
            mockEnrollmentRepo.isEnrolled.mockResolvedValue(true);
            mockSubmissionRepo.getSubmissionHistory.mockResolvedValue([]);
            mockSubmissionRepo.createSubmission.mockResolvedValue(mockSubmission);

            const result = await submissionService.submitAssignment(1, 1, validFile);

            expect(result).toBeDefined();
            expect(result.id).toBe(mockSubmission.id);
            expect(mockSubmissionRepo.createSubmission).toHaveBeenCalled();
            expect(mockStorageService.upload).toHaveBeenCalled();
            expect(mockCodeTestService.runTestsForSubmission).toHaveBeenCalledWith(mockSubmission.id);
        });

        it('should throw AssignmentNotFoundError when assignment does not exist', async () => {
            mockAssignmentRepo.getAssignmentById.mockResolvedValue(undefined);

            await expect(
                submissionService.submitAssignment(999, 1, validFile)
            ).rejects.toThrow(AssignmentNotFoundError);
        });

        it('should throw AssignmentInactiveError when assignment is inactive', async () => {
            const inactiveAssignment = createMockAssignment({ isActive: false });
            mockAssignmentRepo.getAssignmentById.mockResolvedValue(inactiveAssignment);

            await expect(
                submissionService.submitAssignment(1, 1, validFile)
            ).rejects.toThrow(AssignmentInactiveError);
        });

        it('should throw DeadlinePassedError when deadline has passed', async () => {
            const pastDeadline = new Date(Date.now() - 1000);
            const assignment = createMockAssignment({
                isActive: true,
                deadline: pastDeadline,
            });
            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);

            await expect(
                submissionService.submitAssignment(1, 1, validFile)
            ).rejects.toThrow(DeadlinePassedError);
        });

        it('should allow submission when deadline is null', async () => {
            const assignment = createMockAssignment({
                isActive: true,
                deadline: null as any,
                programmingLanguage: 'python',
            });
            const mockSubmission = createMockSubmission();

            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);
            mockEnrollmentRepo.isEnrolled.mockResolvedValue(true);
            mockSubmissionRepo.getSubmissionHistory.mockResolvedValue([]);
            mockSubmissionRepo.createSubmission.mockResolvedValue(mockSubmission);

            const result = await submissionService.submitAssignment(1, 1, validFile);
            expect(result).toBeDefined();
        });

        it('should throw NotEnrolledError when student is not enrolled', async () => {
            const assignment = createMockAssignment({
                isActive: true,
                deadline: futureDeadline,
            });
            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);
            mockEnrollmentRepo.isEnrolled.mockResolvedValue(false);

            await expect(
                submissionService.submitAssignment(1, 1, validFile)
            ).rejects.toThrow(NotEnrolledError);
        });

        it('should throw ResubmissionNotAllowedError when resubmission is disabled', async () => {
            const assignment = createMockAssignment({
                id: 1,
                isActive: true,
                deadline: futureDeadline,
                allowResubmission: false,
            });
            const existingSubmission = createMockSubmission();

            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);
            mockEnrollmentRepo.isEnrolled.mockResolvedValue(true);
            mockSubmissionRepo.getSubmissionHistory.mockResolvedValue([existingSubmission]);

            await expect(
                submissionService.submitAssignment(1, 1, validFile)
            ).rejects.toThrow(ResubmissionNotAllowedError);
        });

        it('should allow resubmission when allowResubmission is true', async () => {
            // Note: Current logic deletes previous submission and creates a new one as "Submission 1".
            // So we mock history, assert delete called, and verify success.
            const assignment = createMockAssignment({
                id: 1,
                isActive: true,
                deadline: futureDeadline,
                allowResubmission: true,
                programmingLanguage: 'python',
            });
            const existingSubmission = createMockSubmission({ id: 99, submissionNumber: 1, filePath: 'old/file' });
            const newSubmission = createMockSubmission({ id: 100, submissionNumber: 1 });

            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);
            mockEnrollmentRepo.isEnrolled.mockResolvedValue(true);
            mockSubmissionRepo.getSubmissionHistory.mockResolvedValue([existingSubmission]);
            mockSubmissionRepo.createSubmission.mockResolvedValue(newSubmission);
            mockSubmissionRepo.delete.mockResolvedValue(true);

            const result = await submissionService.submitAssignment(1, 1, validFile);

            expect(result).toBeDefined();
            expect(result.id).toBe(100);
            expect(mockSubmissionRepo.delete).toHaveBeenCalledWith(99);
            expect(mockTestResultRepo.deleteBySubmissionId).toHaveBeenCalledWith(99);
            expect(mockStorageService.deleteFiles).toHaveBeenCalled();
        });

        it('should throw InvalidFileTypeError for wrong extension', async () => {
            const assignment = createMockAssignment({
                isActive: true,
                deadline: futureDeadline,
                programmingLanguage: 'python',
            });
            const wrongFile = { ...validFile, filename: 'solution.java' };

            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);
            mockEnrollmentRepo.isEnrolled.mockResolvedValue(true);
            mockSubmissionRepo.getSubmissionHistory.mockResolvedValue([]);

            await expect(
                submissionService.submitAssignment(1, 1, wrongFile)
            ).rejects.toThrow(InvalidFileTypeError);
        });

        it('should throw InvalidFileTypeError for file without extension', async () => {
            const assignment = createMockAssignment({
                isActive: true,
                deadline: futureDeadline,
                programmingLanguage: 'python',
            });
            const noExtFile = { ...validFile, filename: 'solution' };

            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);
            mockEnrollmentRepo.isEnrolled.mockResolvedValue(true);
            mockSubmissionRepo.getSubmissionHistory.mockResolvedValue([]);

            await expect(
                submissionService.submitAssignment(1, 1, noExtFile)
            ).rejects.toThrow(InvalidFileTypeError);
        });

        it('should accept .java files for java assignments', async () => {
            const assignment = createMockAssignment({
                isActive: true,
                deadline: futureDeadline,
                programmingLanguage: 'java',
            });
            const javaFile = {
                filename: 'Solution.java',
                data: Buffer.from('class Solution {}'),
                mimetype: 'text/x-java',
            };
            const mockSubmission = createMockSubmission();

            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);
            mockEnrollmentRepo.isEnrolled.mockResolvedValue(true);
            mockSubmissionRepo.getSubmissionHistory.mockResolvedValue([]);
            mockSubmissionRepo.createSubmission.mockResolvedValue(mockSubmission);

            const result = await submissionService.submitAssignment(1, 1, javaFile);
            expect(result).toBeDefined();
        });

        it('should throw FileTooLargeError when file exceeds 10MB', async () => {
            const assignment = createMockAssignment({
                isActive: true,
                deadline: futureDeadline,
                programmingLanguage: 'python',
            });
            const largeFile = {
                ...validFile,
                data: Buffer.alloc(11 * 1024 * 1024), // 11MB
            };

            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);
            mockEnrollmentRepo.isEnrolled.mockResolvedValue(true);
            mockSubmissionRepo.getSubmissionHistory.mockResolvedValue([]);

            await expect(
                submissionService.submitAssignment(1, 1, largeFile)
            ).rejects.toThrow(FileTooLargeError);
        });

        it('should throw UploadFailedError when StorageService upload fails', async () => {
            const assignment = createMockAssignment({
                isActive: true,
                deadline: futureDeadline,
                programmingLanguage: 'python',
            });

            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);
            mockEnrollmentRepo.isEnrolled.mockResolvedValue(true);
            mockSubmissionRepo.getSubmissionHistory.mockResolvedValue([]);
            mockStorageService.upload.mockRejectedValue(new Error('Upload failed'));

            await expect(
                submissionService.submitAssignment(1, 1, validFile)
            ).rejects.toThrow(UploadFailedError);
        });

        // "should increment submission number correctly" is invalid with current logic (it resets to 1) 
        // so I will verify that behaviour or remove the test.
        // Actually, logic is: `const submissionNumber = 1;` after cleanup.
        // So checking if it increments is checking for behavior that no longer exists (single active submission policy).
        // I will remove that specific test or replace it with "should reset submission number to 1".
        it('should reset submission number to 1 on resubmission', async () => {
            const assignment = createMockAssignment({
                isActive: true,
                deadline: futureDeadline,
                allowResubmission: true,
                programmingLanguage: 'python',
            });
            const existingSubmission = createMockSubmission({ submissionNumber: 5 });
            const newSubmission = createMockSubmission({ submissionNumber: 1 });

            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);
            mockEnrollmentRepo.isEnrolled.mockResolvedValue(true);
            mockSubmissionRepo.getSubmissionHistory.mockResolvedValue([existingSubmission]);
            mockSubmissionRepo.createSubmission.mockResolvedValue(newSubmission);
            mockSubmissionRepo.delete.mockResolvedValue(true);

            await submissionService.submitAssignment(1, 1, validFile);

            expect(mockSubmissionRepo.createSubmission).toHaveBeenCalledWith(
                expect.objectContaining({ submissionNumber: 1 })
            );
        });
    });

    // ============ getSubmissionHistory Tests ============
    // ... kept same as original file content ...
    describe('getSubmissionHistory', () => {
        it('should return submission history mapped to DTOs', async () => {
            const submissions = [
                createMockSubmission({ id: 1, submissionNumber: 1 }),
                createMockSubmission({ id: 2, submissionNumber: 2 }),
            ];
            mockSubmissionRepo.getSubmissionHistory.mockResolvedValue(submissions);

            const result = await submissionService.getSubmissionHistory(1, 1);

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe(1);
            expect(result[1].id).toBe(2);
        });

        it('should return empty array when no submissions exist', async () => {
            mockSubmissionRepo.getSubmissionHistory.mockResolvedValue([]);

            const result = await submissionService.getSubmissionHistory(1, 1);

            expect(result).toHaveLength(0);
        });
    });

    // ============ getAssignmentSubmissions Tests ============
    describe('getAssignmentSubmissions', () => {
        it('should return submissions with student info', async () => {
            const submissionsWithInfo = [
                {
                    submission: createMockSubmission({ id: 1 }),
                    studentName: 'John Doe',
                },
            ];
            mockSubmissionRepo.getSubmissionsWithStudentInfo.mockResolvedValue(submissionsWithInfo);

            const result = await submissionService.getAssignmentSubmissions(1);

            expect(result).toHaveLength(1);
            expect(result[0].studentName).toBe('John Doe');
        });

        it('should pass latestOnly parameter correctly', async () => {
            mockSubmissionRepo.getSubmissionsWithStudentInfo.mockResolvedValue([]);

            await submissionService.getAssignmentSubmissions(1, false);

            expect(mockSubmissionRepo.getSubmissionsWithStudentInfo).toHaveBeenCalledWith(1, false);
        });

        it('should default latestOnly to true', async () => {
            mockSubmissionRepo.getSubmissionsWithStudentInfo.mockResolvedValue([]);

            await submissionService.getAssignmentSubmissions(1);

            expect(mockSubmissionRepo.getSubmissionsWithStudentInfo).toHaveBeenCalledWith(1, true);
        });
    });

    // ============ getStudentSubmissions Tests ============
    describe('getStudentSubmissions', () => {
        it('should return student submissions mapped to DTOs', async () => {
            const submissions = [
                createMockSubmission({ id: 1 }),
                createMockSubmission({ id: 2 }),
            ];
            mockSubmissionRepo.getSubmissionsByStudent.mockResolvedValue(submissions);

            const result = await submissionService.getStudentSubmissions(1);

            expect(result).toHaveLength(2);
        });

        it('should pass latestOnly parameter correctly', async () => {
            mockSubmissionRepo.getSubmissionsByStudent.mockResolvedValue([]);

            await submissionService.getStudentSubmissions(1, false);

            expect(mockSubmissionRepo.getSubmissionsByStudent).toHaveBeenCalledWith(1, false);
        });
    });

    // ============ getFileDownloadUrl Tests ============
    describe('getFileDownloadUrl', () => {
        it('should return signed URL from StorageService', async () => {
            mockStorageService.getSignedUrl.mockResolvedValue('https://example.com/signed-url');

            const result = await submissionService.getFileDownloadUrl('test/path');

            expect(result).toBe('https://example.com/signed-url');
            expect(mockStorageService.getSignedUrl).toHaveBeenCalledWith('submissions', 'test/path', 3600);
        });

        it('should use custom expiresIn value', async () => {
            mockStorageService.getSignedUrl.mockResolvedValue('https://example.com/url');

            await submissionService.getFileDownloadUrl('test/path', 7200);

            expect(mockStorageService.getSignedUrl).toHaveBeenCalledWith('submissions', 'test/path', 7200);
        });

        it('should default expiresIn to 3600', async () => {
            mockStorageService.getSignedUrl.mockResolvedValue('https://example.com/url');

            await submissionService.getFileDownloadUrl('test/path');

            expect(mockStorageService.getSignedUrl).toHaveBeenCalledWith('submissions', 'test/path', 3600);
        });
    });
});
