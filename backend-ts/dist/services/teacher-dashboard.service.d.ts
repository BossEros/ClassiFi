import { ClassRepository } from '@/repositories/class.repository.js';
import { AssignmentRepository } from '@/repositories/assignment.repository.js';
import { SubmissionRepository } from '@/repositories/submission.repository.js';
import { type DashboardClassDTO, type PendingTaskDTO } from '@/shared/mappers.js';
/**
 * Business logic for teacher dashboard operations.
 * Uses domain errors for exceptional conditions.
 */
export declare class TeacherDashboardService {
    private classRepo;
    private assignmentRepo;
    private submissionRepo;
    constructor(classRepo: ClassRepository, assignmentRepo: AssignmentRepository, submissionRepo: SubmissionRepository);
    /** Get complete dashboard data for a teacher */
    getDashboardData(teacherId: number, recentClassesLimit?: number, pendingTasksLimit?: number): Promise<{
        recentClasses: DashboardClassDTO[];
        pendingTasks: PendingTaskDTO[];
    }>;
    /** Get recent classes for a teacher */
    getRecentClasses(teacherId: number, limit?: number): Promise<DashboardClassDTO[]>;
    /** Get pending tasks for a teacher (assignments needing review) */
    getPendingTasks(teacherId: number, limit?: number): Promise<PendingTaskDTO[]>;
}
//# sourceMappingURL=teacher-dashboard.service.d.ts.map