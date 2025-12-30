/**
 * Business logic for teacher dashboard operations.
 */
export declare class TeacherDashboardService {
    private classRepo;
    private assignmentRepo;
    private submissionRepo;
    constructor();
    /** Get complete dashboard data for a teacher */
    getDashboardData(teacherId: number, recentClassesLimit?: number, pendingTasksLimit?: number): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    /** Get recent classes for a teacher */
    getRecentClasses(teacherId: number, limit?: number): Promise<{
        success: boolean;
        message: string;
        classes: any[];
    }>;
    /** Get pending tasks for a teacher (assignments needing review) */
    getPendingTasks(teacherId: number, limit?: number): Promise<{
        success: boolean;
        message: string;
        tasks: any[];
    }>;
}
//# sourceMappingURL=teacher-dashboard.service.d.ts.map