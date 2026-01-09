import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TeacherDashboardService } from '../../src/services/teacher-dashboard.service.js';
import { createMockClass, createMockAssignment } from '../utils/factories.js';

describe('TeacherDashboardService', () => {
    let dashboardService: TeacherDashboardService;
    let mockClassRepo: any;
    let mockAssignmentRepo: any;
    let mockSubmissionRepo: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockClassRepo = {
            getRecentClassesByTeacher: vi.fn(),
            getRecentClassesWithStudentCounts: vi.fn(),
            getClassesByTeacher: vi.fn(),
            getClassesWithStudentCounts: vi.fn(),
            getStudentCount: vi.fn(),
        };

        mockAssignmentRepo = {
            getAssignmentsByClassIds: vi.fn(),
            getPendingTasksForTeacher: vi.fn(),
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
            mockClassRepo.getRecentClassesWithStudentCounts.mockResolvedValue([]);
            mockAssignmentRepo.getAssignmentsByClassIds.mockResolvedValue([]);
            mockAssignmentRepo.getPendingTasksForTeacher.mockResolvedValue([]);

            const result = await dashboardService.getDashboardData(1);

            expect(result.recentClasses).toBeDefined();
            expect(result.pendingTasks).toBeDefined();
        });

        it('should respect limit parameters', async () => {
            mockClassRepo.getRecentClassesWithStudentCounts.mockResolvedValue([]);
            mockAssignmentRepo.getAssignmentsByClassIds.mockResolvedValue([]);
            mockAssignmentRepo.getPendingTasksForTeacher.mockResolvedValue([]);

            await dashboardService.getDashboardData(1, 5, 3);

            expect(mockClassRepo.getRecentClassesWithStudentCounts).toHaveBeenCalledWith(1, 5);
            expect(mockAssignmentRepo.getPendingTasksForTeacher).toHaveBeenCalledWith(1, 3);
        });
    });

    // ============ getRecentClasses Tests ============
    describe('getRecentClasses', () => {
        it('should return recent classes with student and assignment counts', async () => {
            const mockClassesWithCounts = [
                { ...createMockClass({ id: 1 }), studentCount: 15 },
                { ...createMockClass({ id: 2 }), studentCount: 15 },
            ];
            const assignments = [
                createMockAssignment({ id: 1, classId: 1 }),
                createMockAssignment({ id: 2, classId: 2 }),
                createMockAssignment({ id: 3, classId: 1 }),
            ];

            mockClassRepo.getRecentClassesWithStudentCounts.mockResolvedValue(mockClassesWithCounts);
            mockAssignmentRepo.getAssignmentsByClassIds.mockResolvedValue(assignments);

            const result = await dashboardService.getRecentClasses(1);

            expect(mockAssignmentRepo.getAssignmentsByClassIds).toHaveBeenCalledWith([1, 2], true);
            expect(result).toHaveLength(2);

            // Function groups assignments by classId
            const class1 = result.find(c => c.id === 1);
            expect(class1?.assignmentCount).toBe(2);

            const class2 = result.find(c => c.id === 2);
            expect(class2?.assignmentCount).toBe(1);
        });

        it('should use default limit of 5', async () => {
            mockClassRepo.getRecentClassesWithStudentCounts.mockResolvedValue([]);
            mockAssignmentRepo.getAssignmentsByClassIds.mockResolvedValue([]);

            await dashboardService.getRecentClasses(1);

            expect(mockClassRepo.getRecentClassesWithStudentCounts).toHaveBeenCalledWith(1, 5);
        });

        it('should return empty array when no classes', async () => {
            mockClassRepo.getRecentClassesWithStudentCounts.mockResolvedValue([]);

            const result = await dashboardService.getRecentClasses(1);

            expect(result).toHaveLength(0);
        });
    });

    // ============ getPendingTasks Tests ============
    describe('getPendingTasks', () => {
        it('should return pending tasks from repository', async () => {
            const mockTasks = [
                {
                    id: 1,
                    assignmentName: 'Task 1',
                    className: 'Class A',
                    classId: 101,
                    deadline: new Date('2023-12-31'),
                    submissionCount: 5,
                    studentCount: 20
                },
                {
                    id: 2,
                    assignmentName: 'Task 2',
                    className: 'Class B',
                    classId: 102,
                    deadline: new Date('2024-01-01'),
                    submissionCount: 0,
                    studentCount: 15
                }
            ];

            mockAssignmentRepo.getPendingTasksForTeacher.mockResolvedValue(mockTasks);

            const result = await dashboardService.getPendingTasks(1, 10);

            expect(mockAssignmentRepo.getPendingTasksForTeacher).toHaveBeenCalledWith(1, 10);
            expect(result).toHaveLength(2);
            expect(result[0].assignmentName).toBe('Task 1');
            expect(result[0].submissionCount).toBe(5);
            expect(result[0].totalStudents).toBe(20);
        });

        it('should map null deadline to empty string', async () => {
            const mockTasks = [
                {
                    id: 1,
                    assignmentName: 'Task 1',
                    className: 'Class A',
                    classId: 101,
                    deadline: null,
                    submissionCount: 5,
                    studentCount: 20
                }
            ];

            mockAssignmentRepo.getPendingTasksForTeacher.mockResolvedValue(mockTasks);

            const result = await dashboardService.getPendingTasks(1);

            expect(result[0].deadline).toBe('');
        });
    });
});
