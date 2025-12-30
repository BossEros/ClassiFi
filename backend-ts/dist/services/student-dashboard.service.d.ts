/**
 * Business logic for student dashboard operations.
 */
export declare class StudentDashboardService {
    private classRepo;
    private enrollmentRepo;
    private assignmentRepo;
    private submissionRepo;
    private userRepo;
    constructor();
    /** Get complete dashboard data for a student */
    getDashboardData(studentId: number, enrolledClassesLimit?: number, pendingAssignmentsLimit?: number): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    /** Get enrolled classes for a student */
    getEnrolledClasses(studentId: number, limit?: number): Promise<{
        success: boolean;
        message: string;
        classes: any[];
    }>;
    /** Get pending assignments for a student */
    getPendingAssignments(studentId: number, limit?: number): Promise<{
        success: boolean;
        message: string;
        assignments: any[];
    }>;
    /** Join a class using class code */
    joinClass(studentId: number, classCode: string): Promise<{
        success: boolean;
        message: string;
        classData?: any;
    }>;
    /** Leave a class */
    leaveClass(studentId: number, classId: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=student-dashboard.service.d.ts.map