import { ClassRepository } from '@/repositories/class.repository.js';
import { EnrollmentRepository } from '@/repositories/enrollment.repository.js';
import { AssignmentRepository } from '@/repositories/assignment.repository.js';
import { SubmissionRepository } from '@/repositories/submission.repository.js';
import { UserRepository } from '@/repositories/user.repository.js';
import { type DashboardClassDTO, type PendingAssignmentDTO } from '@/shared/mappers.js';
/**
 * Business logic for student dashboard operations.
 * Uses domain errors for exceptional conditions.
 */
export declare class StudentDashboardService {
    private classRepo;
    private enrollmentRepo;
    private assignmentRepo;
    private submissionRepo;
    private userRepo;
    constructor(classRepo: ClassRepository, enrollmentRepo: EnrollmentRepository, assignmentRepo: AssignmentRepository, submissionRepo: SubmissionRepository, userRepo: UserRepository);
    /** Get complete dashboard data for a student */
    getDashboardData(studentId: number, enrolledClassesLimit?: number, pendingAssignmentsLimit?: number): Promise<{
        enrolledClasses: DashboardClassDTO[];
        pendingAssignments: PendingAssignmentDTO[];
    }>;
    /** Get enrolled classes for a student */
    getEnrolledClasses(studentId: number, limit?: number): Promise<DashboardClassDTO[]>;
    /** Get pending assignments for a student */
    getPendingAssignments(studentId: number, limit?: number): Promise<PendingAssignmentDTO[]>;
    /** Join a class using class code */
    joinClass(studentId: number, classCode: string): Promise<DashboardClassDTO>;
    /** Leave a class */
    leaveClass(studentId: number, classId: number): Promise<void>;
}
//# sourceMappingURL=student-dashboard.service.d.ts.map