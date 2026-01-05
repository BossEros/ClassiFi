var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { inject, injectable } from 'tsyringe';
import { ClassRepository } from '@/repositories/class.repository.js';
import { EnrollmentRepository } from '@/repositories/enrollment.repository.js';
import { AssignmentRepository } from '@/repositories/assignment.repository.js';
import { SubmissionRepository } from '@/repositories/submission.repository.js';
import { UserRepository } from '@/repositories/user.repository.js';
import { toDashboardClassDTO } from '@/shared/mappers.js';
import { ClassNotFoundError, ClassInactiveError, AlreadyEnrolledError, NotEnrolledError, } from '@/shared/errors.js';
/**
 * Business logic for student dashboard operations.
 * Uses domain errors for exceptional conditions.
 */
let StudentDashboardService = class StudentDashboardService {
    classRepo;
    enrollmentRepo;
    assignmentRepo;
    submissionRepo;
    userRepo;
    constructor(classRepo, enrollmentRepo, assignmentRepo, submissionRepo, userRepo) {
        this.classRepo = classRepo;
        this.enrollmentRepo = enrollmentRepo;
        this.assignmentRepo = assignmentRepo;
        this.submissionRepo = submissionRepo;
        this.userRepo = userRepo;
    }
    /** Get complete dashboard data for a student */
    async getDashboardData(studentId, enrolledClassesLimit = 12, pendingAssignmentsLimit = 10) {
        const enrolledClasses = await this.getEnrolledClasses(studentId, enrolledClassesLimit);
        const pendingAssignments = await this.getPendingAssignments(studentId, pendingAssignmentsLimit);
        return {
            enrolledClasses,
            pendingAssignments,
        };
    }
    /** Get enrolled classes for a student */
    async getEnrolledClasses(studentId, limit) {
        let classes = await this.classRepo.getClassesByStudent(studentId, true);
        if (limit) {
            classes = classes.slice(0, limit);
        }
        const classesWithDetails = await Promise.all(classes.map(async (c) => {
            const studentCount = await this.classRepo.getStudentCount(c.id);
            const teacher = await this.userRepo.getUserById(c.teacherId);
            return toDashboardClassDTO(c, {
                studentCount,
                teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : undefined,
            });
        }));
        return classesWithDetails;
    }
    /** Get pending assignments for a student */
    async getPendingAssignments(studentId, limit = 10) {
        const enrolledClasses = await this.classRepo.getClassesByStudent(studentId, true);
        const now = new Date();
        const pendingAssignments = [];
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
    async joinClass(studentId, classCode) {
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
    async leaveClass(studentId, classId) {
        const isEnrolled = await this.enrollmentRepo.isEnrolled(studentId, classId);
        if (!isEnrolled) {
            throw new NotEnrolledError();
        }
        await this.enrollmentRepo.unenrollStudent(studentId, classId);
    }
};
StudentDashboardService = __decorate([
    injectable(),
    __param(0, inject('ClassRepository')),
    __param(1, inject('EnrollmentRepository')),
    __param(2, inject('AssignmentRepository')),
    __param(3, inject('SubmissionRepository')),
    __param(4, inject('UserRepository')),
    __metadata("design:paramtypes", [ClassRepository,
        EnrollmentRepository,
        AssignmentRepository,
        SubmissionRepository,
        UserRepository])
], StudentDashboardService);
export { StudentDashboardService };
//# sourceMappingURL=student-dashboard.service.js.map