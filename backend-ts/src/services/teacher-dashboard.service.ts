import { inject, injectable } from 'tsyringe';
import { ClassRepository } from '@/repositories/class.repository.js';
import { AssignmentRepository } from '@/repositories/assignment.repository.js';
import { SubmissionRepository } from '@/repositories/submission.repository.js';
import { toDashboardClassDTO, type DashboardClassDTO, type PendingTaskDTO } from '@/shared/mappers.js';

/**
 * Business logic for teacher dashboard operations.
 * Uses domain errors for exceptional conditions.
 */
@injectable()
export class TeacherDashboardService {
    constructor(
        @inject('ClassRepository') private classRepo: ClassRepository,
        @inject('AssignmentRepository') private assignmentRepo: AssignmentRepository,
        @inject('SubmissionRepository') private submissionRepo: SubmissionRepository
    ) { }

    /** Get complete dashboard data for a teacher */
    async getDashboardData(
        teacherId: number,
        recentClassesLimit: number = 12,
        pendingTasksLimit: number = 10
    ): Promise<{ recentClasses: DashboardClassDTO[]; pendingTasks: PendingTaskDTO[] }> {
        const recentClasses = await this.getRecentClasses(teacherId, recentClassesLimit);
        const pendingTasks = await this.getPendingTasks(teacherId, pendingTasksLimit);

        return {
            recentClasses,
            pendingTasks,
        };
    }

    /** Get recent classes for a teacher */
    async getRecentClasses(teacherId: number, limit: number = 5): Promise<DashboardClassDTO[]> {
        const classes = await this.classRepo.getRecentClassesByTeacher(teacherId, limit);

        const classesWithDetails = await Promise.all(
            classes.map(async (c) => {
                const studentCount = await this.classRepo.getStudentCount(c.id);
                const assignments = await this.assignmentRepo.getAssignmentsByClassId(c.id, true);

                return toDashboardClassDTO(c, {
                    studentCount,
                    assignmentCount: assignments.length,
                });
            })
        );

        return classesWithDetails;
    }

    /** Get pending tasks for a teacher (assignments needing review) */
    async getPendingTasks(teacherId: number, limit: number = 10): Promise<PendingTaskDTO[]> {
        // Get all teacher's classes
        const classes = await this.classRepo.getClassesByTeacher(teacherId, true);

        const now = new Date();
        const tasks: PendingTaskDTO[] = [];

        for (const classData of classes) {
            const assignments = await this.assignmentRepo.getAssignmentsByClassId(classData.id, true);

            for (const assignment of assignments) {
                // Get submission count
                const submissions = await this.submissionRepo.getSubmissionsByAssignment(assignment.id, true);
                const studentCount = await this.classRepo.getStudentCount(classData.id);

                // Only include if there are submissions or deadline is upcoming
                if (submissions.length > 0 || (assignment.deadline && assignment.deadline > now)) {
                    tasks.push({
                        id: assignment.id,
                        assignmentName: assignment.assignmentName,
                        className: classData.className,
                        classId: classData.id,
                        deadline: assignment.deadline?.toISOString() ?? '',
                        submissionCount: submissions.length,
                        totalStudents: studentCount,
                    });
                }
            }
        }

        // Sort by deadline
        tasks.sort((a, b) => {
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });

        return tasks.slice(0, limit);
    }
}
