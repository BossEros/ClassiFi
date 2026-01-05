/**
 * EnrollmentRepository Unit Tests
 * Tests for enrollment-related database operations
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockClass } from '../utils/factories.js';

// Mock database module
vi.mock('../../src/shared/database.js', () => ({
    db: {
        insert: vi.fn(),
        select: vi.fn(),
        delete: vi.fn(),
    },
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
    eq: vi.fn((field, value) => ({ field, value, type: 'eq' })),
    and: vi.fn((...args) => ({ type: 'and', conditions: args })),
}));

// Mock models
vi.mock('../../src/models/index.js', () => ({
    enrollments: {
        id: 'id',
        studentId: 'studentId',
        classId: 'classId',
        enrolledAt: 'enrolledAt',
    },
    classes: {
        id: 'id',
        className: 'className',
    },
}));

describe('EnrollmentRepository', () => {
    let mockDb: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        const { db } = await import('../../src/shared/database.js');
        mockDb = db;
    });

    // ============ enrollStudent Tests ============
    describe('enrollStudent Logic', () => {
        it('should create enrollment record', async () => {
            const newEnrollment = { id: 1, studentId: 1, classId: 1, enrolledAt: new Date() };
            const returningMock = vi.fn().mockResolvedValue([newEnrollment]);
            const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
            const insertMock = vi.fn().mockReturnValue({ values: valuesMock });
            mockDb.insert = insertMock;

            const { EnrollmentRepository } = await import('../../src/repositories/enrollment.repository.js');
            const enrollmentRepo = new EnrollmentRepository();

            const result = await enrollmentRepo.enrollStudent(1, 1);

            expect(result.studentId).toBe(1);
            expect(result.classId).toBe(1);
        });
    });

    // ============ unenrollStudent Tests ============
    describe('unenrollStudent Logic', () => {
        it('should return true when student is unenrolled', async () => {
            const returningMock = vi.fn().mockResolvedValue([{ id: 1 }]);
            const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
            const deleteMock = vi.fn().mockReturnValue({ where: whereMock });
            mockDb.delete = deleteMock;

            const { EnrollmentRepository } = await import('../../src/repositories/enrollment.repository.js');
            const enrollmentRepo = new EnrollmentRepository();

            const result = await enrollmentRepo.unenrollStudent(1, 1);

            expect(result).toBe(true);
        });

        it('should return false when enrollment not found', async () => {
            const returningMock = vi.fn().mockResolvedValue([]);
            const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
            const deleteMock = vi.fn().mockReturnValue({ where: whereMock });
            mockDb.delete = deleteMock;

            const { EnrollmentRepository } = await import('../../src/repositories/enrollment.repository.js');
            const enrollmentRepo = new EnrollmentRepository();

            const result = await enrollmentRepo.unenrollStudent(999, 999);

            expect(result).toBe(false);
        });
    });

    // ============ isEnrolled Tests ============
    describe('isEnrolled Logic', () => {
        it('should return true when student is enrolled', async () => {
            const limitMock = vi.fn().mockResolvedValue([{ id: 1 }]);
            const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { EnrollmentRepository } = await import('../../src/repositories/enrollment.repository.js');
            const enrollmentRepo = new EnrollmentRepository();

            const result = await enrollmentRepo.isEnrolled(1, 1);

            expect(result).toBe(true);
        });

        it('should return false when student is not enrolled', async () => {
            const limitMock = vi.fn().mockResolvedValue([]);
            const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { EnrollmentRepository } = await import('../../src/repositories/enrollment.repository.js');
            const enrollmentRepo = new EnrollmentRepository();

            const result = await enrollmentRepo.isEnrolled(999, 999);

            expect(result).toBe(false);
        });
    });

    // ============ getEnrollmentsByStudent Tests ============
    describe('getEnrollmentsByStudent Logic', () => {
        it('should return all enrollments for a student', async () => {
            const enrollments = [
                { id: 1, studentId: 1, classId: 1 },
                { id: 2, studentId: 1, classId: 2 },
            ];
            const whereMock = vi.fn().mockResolvedValue(enrollments);
            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { EnrollmentRepository } = await import('../../src/repositories/enrollment.repository.js');
            const enrollmentRepo = new EnrollmentRepository();

            const result = await enrollmentRepo.getEnrollmentsByStudent(1);

            expect(result).toHaveLength(2);
        });

        it('should return empty array when student has no enrollments', async () => {
            const whereMock = vi.fn().mockResolvedValue([]);
            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { EnrollmentRepository } = await import('../../src/repositories/enrollment.repository.js');
            const enrollmentRepo = new EnrollmentRepository();

            const result = await enrollmentRepo.getEnrollmentsByStudent(999);

            expect(result).toHaveLength(0);
        });
    });

    // ============ getEnrollmentsByClass Tests ============
    describe('getEnrollmentsByClass Logic', () => {
        it('should return all enrollments for a class', async () => {
            const enrollments = [
                { id: 1, studentId: 1, classId: 1 },
                { id: 2, studentId: 2, classId: 1 },
                { id: 3, studentId: 3, classId: 1 },
            ];
            const whereMock = vi.fn().mockResolvedValue(enrollments);
            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { EnrollmentRepository } = await import('../../src/repositories/enrollment.repository.js');
            const enrollmentRepo = new EnrollmentRepository();

            const result = await enrollmentRepo.getEnrollmentsByClass(1);

            expect(result).toHaveLength(3);
        });
    });

    // ============ getEnrollmentWithClass Tests ============
    describe('getEnrollmentWithClass Logic', () => {
        it('should return enrollment with class details', async () => {
            const mockClass = createMockClass({ id: 1 });
            const enrollmentWithClass = {
                enrollment: { id: 1, studentId: 1, classId: 1 },
                class: mockClass,
            };
            const limitMock = vi.fn().mockResolvedValue([enrollmentWithClass]);
            const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
            const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
            const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { EnrollmentRepository } = await import('../../src/repositories/enrollment.repository.js');
            const enrollmentRepo = new EnrollmentRepository();

            const result = await enrollmentRepo.getEnrollmentWithClass(1);

            expect(result).toBeDefined();
            expect(result?.class.id).toBe(1);
        });

        it('should return undefined when enrollment not found', async () => {
            const limitMock = vi.fn().mockResolvedValue([]);
            const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
            const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
            const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { EnrollmentRepository } = await import('../../src/repositories/enrollment.repository.js');
            const enrollmentRepo = new EnrollmentRepository();

            const result = await enrollmentRepo.getEnrollmentWithClass(999);

            expect(result).toBeUndefined();
        });
    });
});
