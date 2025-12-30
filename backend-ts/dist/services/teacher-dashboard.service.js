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
import { AssignmentRepository } from '@/repositories/assignment.repository.js';
import { SubmissionRepository } from '@/repositories/submission.repository.js';
import { toDashboardClassDTO } from '@/shared/mappers.js';
/**
 * Business logic for teacher dashboard operations.
 * Uses domain errors for exceptional conditions.
 */
let TeacherDashboardService = class TeacherDashboardService {
    classRepo;
    assignmentRepo;
    submissionRepo;
    constructor(classRepo, assignmentRepo, submissionRepo) {
        this.classRepo = classRepo;
        this.assignmentRepo = assignmentRepo;
        this.submissionRepo = submissionRepo;
    }
    /** Get complete dashboard data for a teacher */
    async getDashboardData(teacherId, recentClassesLimit = 12, pendingTasksLimit = 10) {
        const recentClasses = await this.getRecentClasses(teacherId, recentClassesLimit);
        const pendingTasks = await this.getPendingTasks(teacherId, pendingTasksLimit);
        return {
            recentClasses,
            pendingTasks,
        };
    }
    /** Get recent classes for a teacher */
    async getRecentClasses(teacherId, limit = 5) {
        const classes = await this.classRepo.getRecentClassesByTeacher(teacherId, limit);
        const classesWithDetails = await Promise.all(classes.map(async (c) => {
            const studentCount = await this.classRepo.getStudentCount(c.id);
            const assignments = await this.assignmentRepo.getAssignmentsByClassId(c.id, true);
            return toDashboardClassDTO(c, {
                studentCount,
                assignmentCount: assignments.length,
            });
        }));
        return classesWithDetails;
    }
    /** Get pending tasks for a teacher (assignments needing review) */
    async getPendingTasks(teacherId, limit = 10) {
        // Get all teacher's classes
        const classes = await this.classRepo.getClassesByTeacher(teacherId, true);
        const now = new Date();
        const tasks = [];
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
            if (!a.deadline)
                return 1;
            if (!b.deadline)
                return -1;
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
        return tasks.slice(0, limit);
    }
};
TeacherDashboardService = __decorate([
    injectable(),
    __param(0, inject('ClassRepository')),
    __param(1, inject('AssignmentRepository')),
    __param(2, inject('SubmissionRepository')),
    __metadata("design:paramtypes", [ClassRepository,
        AssignmentRepository,
        SubmissionRepository])
], TeacherDashboardService);
export { TeacherDashboardService };
//# sourceMappingURL=teacher-dashboard.service.js.map