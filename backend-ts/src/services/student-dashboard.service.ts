import { inject, injectable } from 'tsyringe';
import { ClassRepository } from '@/repositories/class.repository.js';
import { EnrollmentRepository } from '@/repositories/enrollment.repository.js';
import { AssignmentRepository } from '@/repositories/assignment.repository.js';
import { SubmissionRepository } from '@/repositories/submission.repository.js';
import { UserRepository } from '@/repositories/user.repository.js';
import { toDashboardClassDTO, type DashboardClassDTO, type PendingAssignmentDTO } from '@/shared/mappers.js';
import {
    ClassNotFoundError,
    ClassInactiveError,
    AlreadyEnrolledError,
    NotEnrolledError,
} from '@/shared/errors.js';

/**
 * Business logic for student dashboard operations.
 * Uses domain errors for exceptional conditions.
 */
@injectable()
export class StudentDashboardService {
    constructor(
        @inject('ClassRepository') private classRepo: ClassRepository,
        @inject('EnrollmentRepository') private enrollmentRepo: EnrollmentRepository,
        @inject('AssignmentRepository') private assignmentRepo: AssignmentRepository,
        @inject('SubmissionRepository') private submissionRepo: SubmissionRepository,
        @inject('UserRepository') private userRepo: UserRepository
    ) { }

    /** Get complete dashboard data for a student */
    async getDashboardData(
        studentId: number,
        enrolledClassesLimit: number = 12,
        pendingAssignmentsLimit: number = 10
    ): Promise<{ enrolledClasses: DashboardClassDTO[]; pendingAssignments: PendingAssignmentDTO[] }> {
        const enrolledClasses = await this.getEnrolledClasses(studentId, enrolledClassesLimit);
        const pendingAssignments = await this.getPendingAssignments(studentId, pendingAssignmentsLimit);

        return {
            enrolledClasses,
            pendingAssignments,
        };
    }

    /** Get enrolled classes for a student */
    async getEnrolledClasses(studentId: number, limit?: number): Promise<DashboardClassDTO[]> {
        let classes = await this.classRepo.getClassesByStudent(studentId, true);

        if (limit) {
            classes = classes.slice(0, limit);
        }

        const classesWithDetails = await Promise.all(
            classes.map(async (c) => {
                const studentCount = await this.classRepo.getStudentCount(c.id);
                const teacher = await this.userRepo.getUserById(c.teacherId);

                return toDashboardClassDTO(c, {
                    studentCount,
                    teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : undefined,
                });
            })
        );

        return classesWithDetails;
    }

    /** Get pending assignments for a student */
    async getPendingAssignments(studentId: number, limit: number = 10): Promise<PendingAssignmentDTO[]> {
        const enrolledClasses = await this.classRepo.getClassesByStudent(studentId, true);

        const now = new Date();
        const pendingAssignments: PendingAssignmentDTO[] = [];

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

        return pendingAssignments.slice(0, limit);
    }

    /** Join a class using class code */
    async joinClass(studentId: number, classCode: string): Promise<DashboardClassDTO> {
        // Find class by code
        const classData = await this.classRepo.getClassByCode(classCode);

        if (!classData) {
            throw new ClassNotFoundError(classCode);
        }

        if (!classData.isActive) {
            throw new ClassInactiveError();
        }

        // Check if already enrolled
        const isEnrolled = await this.enrollmentRepo.isEnrolled(studentId, classData.id);
        if (isEnrolled) {
            throw new AlreadyEnrolledError();
        }

        // Enroll student
        await this.enrollmentRepo.enrollStudent(studentId, classData.id);

        const studentCount = await this.classRepo.getStudentCount(classData.id);
        const teacher = await this.userRepo.getUserById(classData.teacherId);

        return toDashboardClassDTO(classData, {
            studentCount,
            teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : undefined,
        });
    }

    /** Leave a class */
    async leaveClass(studentId: number, classId: number): Promise<void> {
        const isEnrolled = await this.enrollmentRepo.isEnrolled(studentId, classId);

        if (!isEnrolled) {
            throw new NotEnrolledError();
        }

        await this.enrollmentRepo.unenrollStudent(studentId, classId);
    }
}
