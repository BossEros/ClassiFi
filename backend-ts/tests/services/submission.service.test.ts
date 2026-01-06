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

// Mock Supabase
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

    beforeEach(() => {
        vi.clearAllMocks();

        mockSubmissionRepo = {
            getLatestSubmission: vi.fn(),
            getSubmissionCount: vi.fn(),
            createSubmission: vi.fn(),
            getSubmissionHistory: vi.fn(),
            getSubmissionsWithStudentInfo: vi.fn(),
            getSubmissionsByStudent: vi.fn(),
        };

        mockAssignmentRepo = {
            getAssignmentById: vi.fn(),
        };

        mockEnrollmentRepo = {
            isEnrolled: vi.fn(),
        };

        mockClassRepo = {};

        submissionService = new SubmissionService(
            mockSubmissionRepo,
            mockAssignmentRepo,
            mockEnrollmentRepo,
            mockClassRepo
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
            mockSubmissionRepo.getLatestSubmission.mockResolvedValue(null);
            mockSubmissionRepo.getSubmissionCount.mockResolvedValue(0);
            mockSubmissionRepo.createSubmission.mockResolvedValue(mockSubmission);

            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.storage.from as any).mockReturnValue({
                upload: vi.fn().mockResolvedValue({ error: null }),
            });

            const result = await submissionService.submitAssignment(1, 1, validFile);

            expect(result).toBeDefined();
            expect(result.id).toBe(mockSubmission.id);
            expect(mockSubmissionRepo.createSubmission).toHaveBeenCalled();
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
            mockSubmissionRepo.getLatestSubmission.mockResolvedValue(null);
            mockSubmissionRepo.getSubmissionCount.mockResolvedValue(0);
            mockSubmissionRepo.createSubmission.mockResolvedValue(mockSubmission);

            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.storage.from as any).mockReturnValue({
                upload: vi.fn().mockResolvedValue({ error: null }),
            });

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
                isActive: true,
                deadline: futureDeadline,
                allowResubmission: false,
            });
            const existingSubmission = createMockSubmission();

            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);
            mockEnrollmentRepo.isEnrolled.mockResolvedValue(true);
            mockSubmissionRepo.getLatestSubmission.mockResolvedValue(existingSubmission);

            await expect(
                submissionService.submitAssignment(1, 1, validFile)
            ).rejects.toThrow(ResubmissionNotAllowedError);
        });

        it('should allow resubmission when allowResubmission is true', async () => {
            const assignment = createMockAssignment({
                isActive: true,
                deadline: futureDeadline,
                allowResubmission: true,
                programmingLanguage: 'python',
            });
            const existingSubmission = createMockSubmission({ submissionNumber: 1 });
            const newSubmission = createMockSubmission({ submissionNumber: 2 });

            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);
            mockEnrollmentRepo.isEnrolled.mockResolvedValue(true);
            mockSubmissionRepo.getLatestSubmission.mockResolvedValue(existingSubmission);
            mockSubmissionRepo.getSubmissionCount.mockResolvedValue(1);
            mockSubmissionRepo.createSubmission.mockResolvedValue(newSubmission);

            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.storage.from as any).mockReturnValue({
                upload: vi.fn().mockResolvedValue({ error: null }),
            });

            const result = await submissionService.submitAssignment(1, 1, validFile);
            expect(result).toBeDefined();
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
            mockSubmissionRepo.getLatestSubmission.mockResolvedValue(null);

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
            mockSubmissionRepo.getLatestSubmission.mockResolvedValue(null);

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
            mockSubmissionRepo.getLatestSubmission.mockResolvedValue(null);
            mockSubmissionRepo.getSubmissionCount.mockResolvedValue(0);
            mockSubmissionRepo.createSubmission.mockResolvedValue(mockSubmission);

            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.storage.from as any).mockReturnValue({
                upload: vi.fn().mockResolvedValue({ error: null }),
            });

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
            mockSubmissionRepo.getLatestSubmission.mockResolvedValue(null);

            await expect(
                submissionService.submitAssignment(1, 1, largeFile)
            ).rejects.toThrow(FileTooLargeError);
        });

        it('should throw UploadFailedError when Supabase upload fails', async () => {
            const assignment = createMockAssignment({
                isActive: true,
                deadline: futureDeadline,
                programmingLanguage: 'python',
            });

            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);
            mockEnrollmentRepo.isEnrolled.mockResolvedValue(true);
            mockSubmissionRepo.getLatestSubmission.mockResolvedValue(null);
            mockSubmissionRepo.getSubmissionCount.mockResolvedValue(0);

            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.storage.from as any).mockReturnValue({
                upload: vi.fn().mockResolvedValue({ error: { message: 'Upload failed' } }),
            });

            await expect(
                submissionService.submitAssignment(1, 1, validFile)
            ).rejects.toThrow(UploadFailedError);
        });

        it('should increment submission number correctly', async () => {
            const assignment = createMockAssignment({
                isActive: true,
                deadline: futureDeadline,
                programmingLanguage: 'python',
                allowResubmission: true,
            });
            const mockSubmission = createMockSubmission({ submissionNumber: 4 });

            mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment);
            mockEnrollmentRepo.isEnrolled.mockResolvedValue(true);
            mockSubmissionRepo.getLatestSubmission.mockResolvedValue(createMockSubmission());
            mockSubmissionRepo.getSubmissionCount.mockResolvedValue(3);
            mockSubmissionRepo.createSubmission.mockResolvedValue(mockSubmission);

            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.storage.from as any).mockReturnValue({
                upload: vi.fn().mockResolvedValue({ error: null }),
            });

            await submissionService.submitAssignment(1, 1, validFile);

            expect(mockSubmissionRepo.createSubmission).toHaveBeenCalledWith(
                expect.objectContaining({ submissionNumber: 4 })
            );
        });
    });

    // ============ getSubmissionHistory Tests ============
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
        it('should return signed URL from Supabase', async () => {
            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.storage.from as any).mockReturnValue({
                createSignedUrl: vi.fn().mockResolvedValue({
                    data: { signedUrl: 'https://example.com/signed-url' },
                }),
            });

            const result = await submissionService.getFileDownloadUrl('test/path');

            expect(result).toBe('https://example.com/signed-url');
        });

        it('should return empty string when signed URL is not available', async () => {
            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.storage.from as any).mockReturnValue({
                createSignedUrl: vi.fn().mockResolvedValue({ data: null }),
            });

            const result = await submissionService.getFileDownloadUrl('test/path');

            expect(result).toBe('');
        });

        it('should use custom expiresIn value', async () => {
            const createSignedUrlMock = vi.fn().mockResolvedValue({
                data: { signedUrl: 'https://example.com/url' },
            });
            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.storage.from as any).mockReturnValue({
                createSignedUrl: createSignedUrlMock,
            });

            await submissionService.getFileDownloadUrl('test/path', 7200);

            expect(createSignedUrlMock).toHaveBeenCalledWith('test/path', 7200);
        });

        it('should default expiresIn to 3600', async () => {
            const createSignedUrlMock = vi.fn().mockResolvedValue({
                data: { signedUrl: 'https://example.com/url' },
            });
            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.storage.from as any).mockReturnValue({
                createSignedUrl: createSignedUrlMock,
            });

            await submissionService.getFileDownloadUrl('test/path');

            expect(createSignedUrlMock).toHaveBeenCalledWith('test/path', 3600);
        });
    });
});
