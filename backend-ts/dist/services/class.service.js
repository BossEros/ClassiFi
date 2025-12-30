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
import { v4 as uuidv4 } from 'uuid';
import { inject, injectable } from 'tsyringe';
import { ClassRepository } from '../repositories/class.repository.js';
import { AssignmentRepository } from '../repositories/assignment.repository.js';
import { EnrollmentRepository } from '../repositories/enrollment.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { toClassDTO, toAssignmentDTO } from '../shared/mappers.js';
import { ClassNotFoundError, NotClassOwnerError, AssignmentNotFoundError, InvalidRoleError, StudentNotInClassError, } from '../shared/errors.js';
/**
 * Business logic for class-related operations.
 * Uses domain errors for exceptional conditions.
 */
let ClassService = class ClassService {
    classRepo;
    assignmentRepo;
    enrollmentRepo;
    userRepo;
    constructor(classRepo, assignmentRepo, enrollmentRepo, userRepo) {
        this.classRepo = classRepo;
        this.assignmentRepo = assignmentRepo;
        this.enrollmentRepo = enrollmentRepo;
        this.userRepo = userRepo;
    }
    /** Generate a unique class code */
    async generateClassCode() {
        let code;
        let exists = true;
        while (exists) {
            code = uuidv4().substring(0, 8).toUpperCase();
            exists = await this.classRepo.checkClassCodeExists(code);
        }
        return code;
    }
    /** Create a new class */
    async createClass(teacherId, className, classCode, yearLevel, semester, academicYear, schedule, description) {
        // Verify teacher exists
        const teacher = await this.userRepo.getUserById(teacherId);
        if (!teacher) {
            throw new InvalidRoleError('teacher');
        }
        if (teacher.role !== 'teacher') {
            throw new InvalidRoleError('teacher');
        }
        // Create the class
        const newClass = await this.classRepo.createClass({
            teacherId,
            className,
            classCode,
            yearLevel,
            semester,
            academicYear,
            schedule,
            description,
        });
        const studentCount = await this.classRepo.getStudentCount(newClass.id);
        return toClassDTO(newClass, { studentCount });
    }
    /** Get a class by ID */
    async getClassById(classId, teacherId) {
        const classData = await this.classRepo.getClassById(classId);
        if (!classData) {
            throw new ClassNotFoundError(classId);
        }
        // Optional authorization check
        if (teacherId && classData.teacherId !== teacherId) {
            throw new NotClassOwnerError();
        }
        const studentCount = await this.classRepo.getStudentCount(classId);
        return toClassDTO(classData, { studentCount });
    }
    /**
     * Get all classes for a teacher.
     * Uses optimized single query to avoid N+1 problem.
     */
    async getClassesByTeacher(teacherId, activeOnly = true) {
        const classesWithCounts = await this.classRepo.getClassesWithStudentCounts(teacherId, activeOnly);
        return classesWithCounts.map((c) => toClassDTO(c, { studentCount: c.studentCount }));
    }
    /** Update a class */
    async updateClass(classId, teacherId, data) {
        const existingClass = await this.classRepo.getClassById(classId);
        if (!existingClass) {
            throw new ClassNotFoundError(classId);
        }
        if (existingClass.teacherId !== teacherId) {
            throw new NotClassOwnerError();
        }
        const updatedClass = await this.classRepo.updateClass(classId, data);
        if (!updatedClass) {
            throw new ClassNotFoundError(classId);
        }
        const studentCount = await this.classRepo.getStudentCount(classId);
        return toClassDTO(updatedClass, { studentCount });
    }
    /** Delete a class */
    async deleteClass(classId, teacherId) {
        const existingClass = await this.classRepo.getClassById(classId);
        if (!existingClass) {
            throw new ClassNotFoundError(classId);
        }
        if (existingClass.teacherId !== teacherId) {
            throw new NotClassOwnerError();
        }
        await this.classRepo.deleteClass(classId);
    }
    /** Create an assignment for a class */
    async createAssignment(classId, teacherId, data) {
        const classData = await this.classRepo.getClassById(classId);
        if (!classData) {
            throw new ClassNotFoundError(classId);
        }
        if (classData.teacherId !== teacherId) {
            throw new NotClassOwnerError();
        }
        const assignment = await this.assignmentRepo.createAssignment({
            classId,
            assignmentName: data.assignmentName,
            description: data.description,
            programmingLanguage: data.programmingLanguage,
            deadline: data.deadline,
            allowResubmission: data.allowResubmission,
            maxAttempts: data.maxAttempts,
        });
        return toAssignmentDTO(assignment);
    }
    /** Get all assignments for a class */
    async getClassAssignments(classId) {
        const assignments = await this.assignmentRepo.getAssignmentsByClassId(classId);
        return assignments.map((a) => toAssignmentDTO(a));
    }
    /** Get all students enrolled in a class */
    async getClassStudents(classId) {
        const students = await this.classRepo.getEnrolledStudents(classId);
        return students.map((s) => ({
            id: s.id,
            username: s.username,
            email: s.email,
            firstName: s.firstName,
            lastName: s.lastName,
        }));
    }
    /** Remove a student from a class */
    async removeStudent(classId, studentId, teacherId) {
        const classData = await this.classRepo.getClassById(classId);
        if (!classData) {
            throw new ClassNotFoundError(classId);
        }
        if (classData.teacherId !== teacherId) {
            throw new NotClassOwnerError();
        }
        const removed = await this.classRepo.removeStudent(classId, studentId);
        if (!removed) {
            throw new StudentNotInClassError();
        }
    }
    /** Get assignment details */
    async getAssignmentDetails(assignmentId, userId) {
        const assignment = await this.assignmentRepo.getAssignmentById(assignmentId);
        if (!assignment) {
            throw new AssignmentNotFoundError(assignmentId);
        }
        const classData = await this.classRepo.getClassById(assignment.classId);
        return toAssignmentDTO(assignment, { className: classData?.className });
    }
    /** Update an assignment */
    async updateAssignment(assignmentId, teacherId, data) {
        const assignment = await this.assignmentRepo.getAssignmentById(assignmentId);
        if (!assignment) {
            throw new AssignmentNotFoundError(assignmentId);
        }
        const classData = await this.classRepo.getClassById(assignment.classId);
        if (!classData || classData.teacherId !== teacherId) {
            throw new NotClassOwnerError();
        }
        const updatedAssignment = await this.assignmentRepo.updateAssignment(assignmentId, data);
        if (!updatedAssignment) {
            throw new AssignmentNotFoundError(assignmentId);
        }
        return toAssignmentDTO(updatedAssignment);
    }
    /** Delete an assignment */
    async deleteAssignment(assignmentId, teacherId) {
        const assignment = await this.assignmentRepo.getAssignmentById(assignmentId);
        if (!assignment) {
            throw new AssignmentNotFoundError(assignmentId);
        }
        const classData = await this.classRepo.getClassById(assignment.classId);
        if (!classData || classData.teacherId !== teacherId) {
            throw new NotClassOwnerError();
        }
        await this.assignmentRepo.deleteAssignment(assignmentId);
    }
};
ClassService = __decorate([
    injectable(),
    __param(0, inject('ClassRepository')),
    __param(1, inject('AssignmentRepository')),
    __param(2, inject('EnrollmentRepository')),
    __param(3, inject('UserRepository')),
    __metadata("design:paramtypes", [ClassRepository,
        AssignmentRepository,
        EnrollmentRepository,
        UserRepository])
], ClassService);
export { ClassService };
//# sourceMappingURL=class.service.js.map