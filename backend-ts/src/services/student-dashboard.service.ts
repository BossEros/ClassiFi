import { ClassRepository, EnrollmentRepository, AssignmentRepository, SubmissionRepository, UserRepository } from '@/repositories/index.js';
/**
 * Business logic for student dashboard operations.
 */
export class StudentDashboardService {
    private classRepo: ClassRepository;
    private enrollmentRepo: EnrollmentRepository;
    private assignmentRepo: AssignmentRepository;
    private submissionRepo: SubmissionRepository;
    private userRepo: UserRepository;

    constructor() {
        this.classRepo = new ClassRepository();
        this.enrollmentRepo = new EnrollmentRepository();
        this.assignmentRepo = new AssignmentRepository();
        this.submissionRepo = new SubmissionRepository();
        this.userRepo = new UserRepository();
    }

    /** Get complete dashboard data for a student */
    async getDashboardData(
        studentId: number,
        enrolledClassesLimit: number = 12,
        pendingAssignmentsLimit: number = 10
    ): Promise<{ success: boolean; message: string; data: any }> {
        try {
            // Get enrolled classes
            const { classes } = await this.getEnrolledClasses(studentId, enrolledClassesLimit);

            // Get pending assignments
            const { assignments } = await this.getPendingAssignments(studentId, pendingAssignmentsLimit);

            return {
                success: true,
                message: 'Dashboard data retrieved successfully',
                data: {
                    enrolledClasses: classes,
                    pendingAssignments: assignments,
                },
            };
        } catch (error) {
            return { success: false, message: 'Failed to retrieve dashboard data', data: {} };
        }
    }

    /** Get enrolled classes for a student */
    async getEnrolledClasses(
        studentId: number,
        limit?: number
    ): Promise<{ success: boolean; message: string; classes: any[] }> {
        try {
            let classes = await this.classRepo.getClassesByStudent(studentId, true);

            if (limit) {
                classes = classes.slice(0, limit);
            }

            const classesWithDetails = await Promise.all(
                classes.map(async (c) => {
                    const studentCount = await this.classRepo.getStudentCount(c.id);
                    const teacher = await this.userRepo.getUserById(c.teacherId);

                    return {
                        id: c.id,
                        className: c.className,
                        classCode: c.classCode,
                        description: c.description,
                        studentCount,
                        teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : undefined,
                        createdAt: c.createdAt?.toISOString(),
                    };
                })
            );

            return {
                success: true,
                message: 'Enrolled classes retrieved successfully',
                classes: classesWithDetails,
            };
        } catch (error) {
            return { success: false, message: 'Failed to retrieve enrolled classes', classes: [] };
        }
    }

    /** Get pending assignments for a student */
    async getPendingAssignments(
        studentId: number,
        limit: number = 10
    ): Promise<{ success: boolean; message: string; assignments: any[] }> {
        try {
            // Get all classes student is enrolled in
            const enrolledClasses = await this.classRepo.getClassesByStudent(studentId, true);

            const now = new Date();
            const pendingAssignments: any[] = [];

            for (const classData of enrolledClasses) {
                const assignments = await this.assignmentRepo.getAssignmentsByClassId(classData.id, true);

                for (const assignment of assignments) {
                    // Check if deadline hasn't passed
                    if (assignment.deadline && assignment.deadline > now) {
                        // Check if student has submitted
                        const submission = await this.submissionRepo.getLatestSubmission(assignment.id, studentId);

                        if (!submission) {
                            pendingAssignments.push({
                                id: assignment.id,
                                assignmentName: assignment.assignmentName,
                                className: classData.className,
                                classId: classData.id,
                                deadline: assignment.deadline?.toISOString(),
                                hasSubmitted: false,
                                programmingLanguage: assignment.programmingLanguage,
                            });
                        }
                    }
                }
            }

            // Sort by deadline and limit
            pendingAssignments.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

            return {
                success: true,
                message: 'Pending assignments retrieved successfully',
                assignments: pendingAssignments.slice(0, limit),
            };
        } catch (error) {
            return { success: false, message: 'Failed to retrieve pending assignments', assignments: [] };
        }
    }

    /** Join a class using class code */
    async joinClass(
        studentId: number,
        classCode: string
    ): Promise<{ success: boolean; message: string; classData?: any }> {
        try {
            // Find class by code
            const classData = await this.classRepo.getClassByCode(classCode);

            if (!classData) {
                return { success: false, message: 'Class not found. Please check the class code.' };
            }

            if (!classData.isActive) {
                return { success: false, message: 'This class is no longer active.' };
            }

            // Check if already enrolled
            const isEnrolled = await this.enrollmentRepo.isEnrolled(studentId, classData.id);
            if (isEnrolled) {
                return { success: false, message: 'You are already enrolled in this class.' };
            }

            // Enroll student
            await this.enrollmentRepo.enrollStudent(studentId, classData.id);

            const studentCount = await this.classRepo.getStudentCount(classData.id);
            const teacher = await this.userRepo.getUserById(classData.teacherId);

            return {
                success: true,
                message: 'Successfully joined the class!',
                classData: {
                    id: classData.id,
                    className: classData.className,
                    classCode: classData.classCode,
                    description: classData.description,
                    studentCount,
                    teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : undefined,
                    createdAt: classData.createdAt?.toISOString(),
                },
            };
        } catch (error) {
            return { success: false, message: 'Failed to join class' };
        }
    }

    /** Leave a class */
    async leaveClass(
        studentId: number,
        classId: number
    ): Promise<{ success: boolean; message: string }> {
        try {
            const isEnrolled = await this.enrollmentRepo.isEnrolled(studentId, classId);

            if (!isEnrolled) {
                return { success: false, message: 'You are not enrolled in this class.' };
            }

            const success = await this.enrollmentRepo.unenrollStudent(studentId, classId);

            if (!success) {
                return { success: false, message: 'Failed to leave class' };
            }

            return { success: true, message: 'Successfully left the class.' };
        } catch (error) {
            return { success: false, message: 'Failed to leave class' };
        }
    }
}
