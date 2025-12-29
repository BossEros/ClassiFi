import { ClassRepository, AssignmentRepository, SubmissionRepository } from '@/repositories/index.js';
/**
 * Business logic for teacher dashboard operations.
 */
export class TeacherDashboardService {
    private classRepo: ClassRepository;
    private assignmentRepo: AssignmentRepository;
    private submissionRepo: SubmissionRepository;

    constructor() {
        this.classRepo = new ClassRepository();
        this.assignmentRepo = new AssignmentRepository();
        this.submissionRepo = new SubmissionRepository();
    }

    /** Get complete dashboard data for a teacher */
    async getDashboardData(
        teacherId: number,
        recentClassesLimit: number = 12,
        pendingTasksLimit: number = 10
    ): Promise<{ success: boolean; message: string; data: any }> {
        try {
            // Get recent classes
            const { classes } = await this.getRecentClasses(teacherId, recentClassesLimit);

            // Get pending tasks
            const { tasks } = await this.getPendingTasks(teacherId, pendingTasksLimit);

            return {
                success: true,
                message: 'Dashboard data retrieved successfully',
                data: {
                    recentClasses: classes,
                    pendingTasks: tasks,
                },
            };
        } catch (error) {
            return { success: false, message: 'Failed to retrieve dashboard data', data: {} };
        }
    }

    /** Get recent classes for a teacher */
    async getRecentClasses(
        teacherId: number,
        limit: number = 5
    ): Promise<{ success: boolean; message: string; classes: any[] }> {
        try {
            const classes = await this.classRepo.getRecentClassesByTeacher(teacherId, limit);

            const classesWithDetails = await Promise.all(
                classes.map(async (c) => {
                    const studentCount = await this.classRepo.getStudentCount(c.id);
                    const assignments = await this.assignmentRepo.getAssignmentsByClassId(c.id, true);

                    return {
                        id: c.id,
                        className: c.className,
                        classCode: c.classCode,
                        description: c.description,
                        studentCount,
                        assignmentCount: assignments.length,
                        createdAt: c.createdAt?.toISOString(),
                    };
                })
            );

            return {
                success: true,
                message: 'Recent classes retrieved successfully',
                classes: classesWithDetails,
            };
        } catch (error) {
            return { success: false, message: 'Failed to retrieve recent classes', classes: [] };
        }
    }

    /** Get pending tasks for a teacher (assignments needing review) */
    async getPendingTasks(
        teacherId: number,
        limit: number = 10
    ): Promise<{ success: boolean; message: string; tasks: any[] }> {
        try {
            // Get all teacher's classes
            const classes = await this.classRepo.getClassesByTeacher(teacherId, true);

            const now = new Date();
            const tasks: any[] = [];

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
                            deadline: assignment.deadline?.toISOString(),
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

            return {
                success: true,
                message: 'Pending tasks retrieved successfully',
                tasks: tasks.slice(0, limit),
            };
        } catch (error) {
            return { success: false, message: 'Failed to retrieve pending tasks', tasks: [] };
        }
    }
}
