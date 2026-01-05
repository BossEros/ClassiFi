/**
 * TeacherDashboardService Unit Tests
 * Comprehensive tests for teacher dashboard operations
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TeacherDashboardService } from '../../src/services/teacher-dashboard.service.js';
import { createMockClass, createMockAssignment, createMockSubmission } from '../utils/factories.js';

describe('TeacherDashboardService', () => {
    let dashboardService: TeacherDashboardService;
    let mockClassRepo: any;
    let mockAssignmentRepo: any;
    let mockSubmissionRepo: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockClassRepo = {
            getRecentClassesByTeacher: vi.fn(),
            getClassesByTeacher: vi.fn(),
            getStudentCount: vi.fn(),
        };

        mockAssignmentRepo = {
            getAssignmentsByClassId: vi.fn(),
        };

        mockSubmissionRepo = {
            getSubmissionsByAssignment: vi.fn(),
        };

        dashboardService = new TeacherDashboardService(
            mockClassRepo,
            mockAssignmentRepo,
            mockSubmissionRepo
        );
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    // ============ getDashboardData Tests ============
    describe('getDashboardData', () => {
        it('should return combined dashboard data', async () => {
            mockClassRepo.getRecentClassesByTeacher.mockResolvedValue([]);
            mockClassRepo.getClassesByTeacher.mockResolvedValue([]);

            const result = await dashboardService.getDashboardData(1);

            expect(result.recentClasses).toBeDefined();
            expect(result.pendingTasks).toBeDefined();
        });

        it('should respect limit parameters', async () => {
            mockClassRepo.getRecentClassesByTeacher.mockResolvedValue([]);
            mockClassRepo.getClassesByTeacher.mockResolvedValue([]);

            await dashboardService.getDashboardData(1, 5, 3);

            expect(mockClassRepo.getRecentClassesByTeacher).toHaveBeenCalledWith(1, 5);
        });
    });

    // ============ getRecentClasses Tests ============
    describe('getRecentClasses', () => {
        it('should return recent classes with student and assignment counts', async () => {
            const mockClasses = [
                createMockClass({ id: 1 }),
                createMockClass({ id: 2 }),
            ];
            const assignments = [
                createMockAssignment({ id: 1 }),
                createMockAssignment({ id: 2 }),
            ];

            mockClassRepo.getRecentClassesByTeacher.mockResolvedValue(mockClasses);
            mockClassRepo.getStudentCount.mockResolvedValue(15);
            mockAssignmentRepo.getAssignmentsByClassId.mockResolvedValue(assignments);

            const result = await dashboardService.getRecentClasses(1);

            expect(result).toHaveLength(2);
            expect(result[0].studentCount).toBe(15);
            expect(result[0].assignmentCount).toBe(2);
        });

        it('should use default limit of 5', async () => {
            mockClassRepo.getRecentClassesByTeacher.mockResolvedValue([]);

            await dashboardService.getRecentClasses(1);

            expect(mockClassRepo.getRecentClassesByTeacher).toHaveBeenCalledWith(1, 5);
        });

        it('should return empty array when no classes', async () => {
            mockClassRepo.getRecentClassesByTeacher.mockResolvedValue([]);

            const result = await dashboardService.getRecentClasses(1);

            expect(result).toHaveLength(0);
        });
    });

    // ============ getPendingTasks Tests ============
    describe('getPendingTasks', () => {
        it('should return pending tasks sorted by deadline', async () => {
            const now = Date.now();
            const mockClasses = [createMockClass({ id: 1, className: 'Test Class' })];
            const assignments = [
                createMockAssignment({
                    id: 1,
                    deadline: new Date(now + 200000),
                    assignmentName: 'Assignment 1'
                }),
                createMockAssignment({
                    id: 2,
                    deadline: new Date(now + 100000),
                    assignmentName: 'Assignment 2'
                }),
            ];

            mockClassRepo.getClassesByTeacher.mockResolvedValue(mockClasses);
            mockAssignmentRepo.getAssignmentsByClassId.mockResolvedValue(assignments);
            mockSubmissionRepo.getSubmissionsByAssignment.mockResolvedValue([createMockSubmission()]);
            mockClassRepo.getStudentCount.mockResolvedValue(20);

            const result = await dashboardService.getPendingTasks(1);

            expect(result).toHaveLength(2);
            // Should be sorted by deadline ascending
            expect(new Date(result[0].deadline).getTime()).toBeLessThan(
                new Date(result[1].deadline).getTime()
            );
        });

        it('should include assignments with submissions', async () => {
            const pastDeadline = new Date(Date.now() - 10000);
            const mockClasses = [createMockClass({ id: 1 })];
            const assignments = [
                createMockAssignment({ id: 1, deadline: pastDeadline }),
            ];

            mockClassRepo.getClassesByTeacher.mockResolvedValue(mockClasses);
            mockAssignmentRepo.getAssignmentsByClassId.mockResolvedValue(assignments);
            mockSubmissionRepo.getSubmissionsByAssignment.mockResolvedValue([createMockSubmission()]);
            mockClassRepo.getStudentCount.mockResolvedValue(10);

            const result = await dashboardService.getPendingTasks(1);

            expect(result).toHaveLength(1);
        });

        it('should include assignments with upcoming deadlines', async () => {
            const futureDeadline = new Date(Date.now() + 100000);
            const mockClasses = [createMockClass({ id: 1 })];
            const assignments = [
                createMockAssignment({ id: 1, deadline: futureDeadline }),
            ];

            mockClassRepo.getClassesByTeacher.mockResolvedValue(mockClasses);
            mockAssignmentRepo.getAssignmentsByClassId.mockResolvedValue(assignments);
            mockSubmissionRepo.getSubmissionsByAssignment.mockResolvedValue([]);
            mockClassRepo.getStudentCount.mockResolvedValue(10);

            const result = await dashboardService.getPendingTasks(1);

            expect(result).toHaveLength(1);
        });

        it('should exclude assignments with no submissions and past deadlines', async () => {
            const pastDeadline = new Date(Date.now() - 10000);
            const mockClasses = [createMockClass({ id: 1 })];
            const assignments = [
                createMockAssignment({ id: 1, deadline: pastDeadline }),
            ];

            mockClassRepo.getClassesByTeacher.mockResolvedValue(mockClasses);
            mockAssignmentRepo.getAssignmentsByClassId.mockResolvedValue(assignments);
            mockSubmissionRepo.getSubmissionsByAssignment.mockResolvedValue([]);
            mockClassRepo.getStudentCount.mockResolvedValue(10);

            const result = await dashboardService.getPendingTasks(1);

            expect(result).toHaveLength(0);
        });

        it('should respect limit parameter', async () => {
            const futureDeadline = new Date(Date.now() + 100000);
            const mockClasses = [createMockClass({ id: 1 })];
            const assignments = [
                createMockAssignment({ id: 1, deadline: futureDeadline }),
                createMockAssignment({ id: 2, deadline: futureDeadline }),
                createMockAssignment({ id: 3, deadline: futureDeadline }),
            ];

            mockClassRepo.getClassesByTeacher.mockResolvedValue(mockClasses);
            mockAssignmentRepo.getAssignmentsByClassId.mockResolvedValue(assignments);
            mockSubmissionRepo.getSubmissionsByAssignment.mockResolvedValue([]);
            mockClassRepo.getStudentCount.mockResolvedValue(10);

            const result = await dashboardService.getPendingTasks(1, 2);

            expect(result).toHaveLength(2);
        });

        it('should handle null deadline correctly', async () => {
            const mockClasses = [createMockClass({ id: 1 })];
            const assignments = [
                createMockAssignment({ id: 1, deadline: null as any }),
                createMockAssignment({ id: 2, deadline: new Date(Date.now() + 100000) }),
            ];

            mockClassRepo.getClassesByTeacher.mockResolvedValue(mockClasses);
            mockAssignmentRepo.getAssignmentsByClassId.mockResolvedValue(assignments);
            mockSubmissionRepo.getSubmissionsByAssignment.mockResolvedValue([createMockSubmission()]);
            mockClassRepo.getStudentCount.mockResolvedValue(10);

            const result = await dashboardService.getPendingTasks(1);

            // Only the one with submission should be included (since null deadline isn't in future)
            expect(result.length).toBeGreaterThanOrEqual(1);
        });

        it('should include correct submission and student counts', async () => {
            const futureDeadline = new Date(Date.now() + 100000);
            const mockClasses = [createMockClass({ id: 1, className: 'Test Class' })];
            const assignments = [
                createMockAssignment({ id: 1, deadline: futureDeadline, assignmentName: 'Test' }),
            ];
            const submissions = [
                createMockSubmission({ id: 1 }),
                createMockSubmission({ id: 2 }),
            ];

            mockClassRepo.getClassesByTeacher.mockResolvedValue(mockClasses);
            mockAssignmentRepo.getAssignmentsByClassId.mockResolvedValue(assignments);
            mockSubmissionRepo.getSubmissionsByAssignment.mockResolvedValue(submissions);
            mockClassRepo.getStudentCount.mockResolvedValue(25);

            const result = await dashboardService.getPendingTasks(1);

            expect(result[0].submissionCount).toBe(2);
            expect(result[0].totalStudents).toBe(25);
        });
    });
});
