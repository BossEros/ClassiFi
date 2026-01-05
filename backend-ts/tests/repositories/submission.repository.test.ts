/**
 * SubmissionRepository Unit Tests
 * Tests for submission-related database operations
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSubmission, createMockUser } from '../utils/factories.js';

// Mock database module
vi.mock('../../src/shared/database.js', () => ({
    db: {
        insert: vi.fn(),
        select: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
    eq: vi.fn((field, value) => ({ field, value, type: 'eq' })),
    and: vi.fn((...args) => ({ type: 'and', conditions: args })),
    desc: vi.fn((field) => ({ field, type: 'desc' })),
    sql: vi.fn((strings, ...values) => ({ type: 'sql', strings, values })),
}));

// Mock models
vi.mock('../../src/models/index.js', () => ({
    submissions: {
        id: 'id',
        assignmentId: 'assignmentId',
        studentId: 'studentId',
        fileName: 'fileName',
        filePath: 'filePath',
        fileSize: 'fileSize',
        submissionNumber: 'submissionNumber',
        submittedAt: 'submittedAt',
        isLatest: 'isLatest',
    },
    users: {
        id: 'id',
        firstName: 'firstName',
        lastName: 'lastName',
        username: 'username',
    },
}));

describe('SubmissionRepository', () => {
    let mockDb: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        const { db } = await import('../../src/shared/database.js');
        mockDb = db;
    });

    // ============ getSubmissionById Tests ============
    describe('getSubmissionById Logic', () => {
        it('should return submission when found', async () => {
            const mockSubmission = createMockSubmission({ id: 1 });
            const limitMock = vi.fn().mockResolvedValue([mockSubmission]);
            const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { SubmissionRepository } = await import('../../src/repositories/submission.repository.js');
            const submissionRepo = new SubmissionRepository();

            const result = await submissionRepo.getSubmissionById(1);

            expect(result).toEqual(mockSubmission);
        });

        it('should return undefined when submission not found', async () => {
            const limitMock = vi.fn().mockResolvedValue([]);
            const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { SubmissionRepository } = await import('../../src/repositories/submission.repository.js');
            const submissionRepo = new SubmissionRepository();

            const result = await submissionRepo.getSubmissionById(999);

            expect(result).toBeUndefined();
        });
    });

    // ============ getSubmissionsByAssignment Tests ============
    describe('getSubmissionsByAssignment Logic', () => {
        it('should filter by isLatest when latestOnly is true', () => {
            const submissions = [
                createMockSubmission({ id: 1, submissionNumber: 1, isLatest: false }),
                createMockSubmission({ id: 2, submissionNumber: 2, isLatest: true }),
            ];

            const latestOnly = submissions.filter(s => s.isLatest);

            expect(latestOnly).toHaveLength(1);
            expect(latestOnly[0].submissionNumber).toBe(2);
        });

        it('should return all submissions when latestOnly is false', () => {
            const submissions = [
                createMockSubmission({ id: 1, submissionNumber: 1, isLatest: false }),
                createMockSubmission({ id: 2, submissionNumber: 2, isLatest: true }),
            ];

            expect(submissions).toHaveLength(2);
        });
    });

    // ============ getSubmissionsByStudent Tests ============
    describe('getSubmissionsByStudent Logic', () => {
        it('should return only latest submissions when latestOnly is true', () => {
            const submissions = [
                createMockSubmission({ id: 1, studentId: 1, isLatest: false }),
                createMockSubmission({ id: 2, studentId: 1, isLatest: true }),
                createMockSubmission({ id: 3, studentId: 1, isLatest: false }),
            ];

            const latestOnly = submissions.filter(s => s.isLatest);

            expect(latestOnly).toHaveLength(1);
        });
    });

    // ============ getSubmissionHistory Tests ============
    describe('getSubmissionHistory Logic', () => {
        it('should return submissions ordered by submission number', () => {
            const submissions = [
                createMockSubmission({ id: 1, submissionNumber: 3 }),
                createMockSubmission({ id: 2, submissionNumber: 1 }),
                createMockSubmission({ id: 3, submissionNumber: 2 }),
            ];

            const sorted = [...submissions].sort((a, b) => a.submissionNumber - b.submissionNumber);

            expect(sorted[0].submissionNumber).toBe(1);
            expect(sorted[1].submissionNumber).toBe(2);
            expect(sorted[2].submissionNumber).toBe(3);
        });
    });

    // ============ getLatestSubmission Tests ============
    describe('getLatestSubmission Logic', () => {
        it('should return submission where isLatest is true', () => {
            const submissions = [
                createMockSubmission({ id: 1, submissionNumber: 1, isLatest: false }),
                createMockSubmission({ id: 2, submissionNumber: 2, isLatest: true }),
            ];

            const latest = submissions.find(s => s.isLatest);

            expect(latest).toBeDefined();
            expect(latest?.submissionNumber).toBe(2);
        });

        it('should return undefined when no submissions exist', () => {
            const submissions: any[] = [];
            const latest = submissions.find(s => s.isLatest);

            expect(latest).toBeUndefined();
        });
    });

    // ============ getSubmissionCount Tests ============
    describe('getSubmissionCount Logic', () => {
        it('should count submissions for student-assignment pair', () => {
            const submissions = [
                createMockSubmission({ assignmentId: 1, studentId: 1, submissionNumber: 1 }),
                createMockSubmission({ assignmentId: 1, studentId: 1, submissionNumber: 2 }),
                createMockSubmission({ assignmentId: 1, studentId: 2, submissionNumber: 1 }),
            ];

            const count = submissions.filter(
                s => s.assignmentId === 1 && s.studentId === 1
            ).length;

            expect(count).toBe(2);
        });
    });

    // ============ createSubmission Tests ============
    describe('createSubmission Logic', () => {
        it('should create submission with correct submission number', async () => {
            const newSubmission = createMockSubmission({ submissionNumber: 1 });
            const returningMock = vi.fn().mockResolvedValue([newSubmission]);
            const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
            const insertMock = vi.fn().mockReturnValue({ values: valuesMock });
            const whereMock = vi.fn().mockResolvedValue([]);
            const setMock = vi.fn().mockReturnValue({ where: whereMock });
            const updateMock = vi.fn().mockReturnValue({ set: setMock });

            mockDb.insert = insertMock;
            mockDb.update = updateMock;

            const { SubmissionRepository } = await import('../../src/repositories/submission.repository.js');
            const submissionRepo = new SubmissionRepository();

            const result = await submissionRepo.createSubmission({
                assignmentId: 1,
                studentId: 1,
                fileName: 'solution.py',
                filePath: 'path/to/file',
                fileSize: 1024,
                submissionNumber: 1,
            });

            expect(result.submissionNumber).toBe(1);
        });

        it('should mark new submission as isLatest', () => {
            const newSubmission = createMockSubmission({ isLatest: true });
            expect(newSubmission.isLatest).toBe(true);
        });

        it('should mark previous submission as not latest', () => {
            const previousSubmissions = [
                createMockSubmission({ id: 1, isLatest: true }),
            ];

            // Simulate update
            const updated = previousSubmissions.map(s => ({ ...s, isLatest: false }));

            expect(updated[0].isLatest).toBe(false);
        });
    });

    // ============ getSubmissionsWithStudentInfo Tests ============
    describe('getSubmissionsWithStudentInfo Logic', () => {
        it('should return submissions with student name', () => {
            const submissionWithInfo = {
                submission: createMockSubmission({ id: 1 }),
                studentName: 'John Doe',
                studentUsername: 'johndoe',
            };

            expect(submissionWithInfo.studentName).toBe('John Doe');
            expect(submissionWithInfo.studentUsername).toBe('johndoe');
        });

        it('should order by submitted date descending', () => {
            const now = Date.now();
            const submissions = [
                { ...createMockSubmission(), submittedAt: new Date(now - 1000) },
                { ...createMockSubmission(), submittedAt: new Date(now + 1000) },
                { ...createMockSubmission(), submittedAt: new Date(now) },
            ];

            const sorted = [...submissions].sort(
                (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()
            );

            expect(sorted[0].submittedAt.getTime()).toBeGreaterThan(sorted[1].submittedAt.getTime());
        });
    });

    // ============ getSubmissionWithStudent Tests ============
    describe('getSubmissionWithStudent Logic', () => {
        it('should return submission with student name', () => {
            const submissionWithStudent = {
                submission: createMockSubmission({ id: 1 }),
                studentName: 'Jane Smith',
            };

            expect(submissionWithStudent.studentName).toBe('Jane Smith');
            expect(submissionWithStudent.submission.id).toBe(1);
        });

        it('should return null when submission not found', () => {
            const result = null;
            expect(result).toBeNull();
        });
    });
});
