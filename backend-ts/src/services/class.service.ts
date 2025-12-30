import { v4 as uuidv4 } from 'uuid';
import { inject, injectable } from 'tsyringe';
import { ClassRepository } from '../repositories/class.repository.js';
import { AssignmentRepository } from '../repositories/assignment.repository.js';
import { EnrollmentRepository } from '../repositories/enrollment.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import type { ClassSchedule } from '../models/index.js';
import { toClassDTO, toAssignmentDTO, type ClassDTO, type AssignmentDTO } from '../shared/mappers.js';
import {
    ClassNotFoundError,
    NotClassOwnerError,
    AssignmentNotFoundError,
    InvalidRoleError,
    StudentNotInClassError,
} from '../shared/errors.js';

/**
 * Business logic for class-related operations.
 * Uses domain errors for exceptional conditions.
 */
@injectable()
export class ClassService {
    constructor(
        @inject('ClassRepository') private classRepo: ClassRepository,
        @inject('AssignmentRepository') private assignmentRepo: AssignmentRepository,
        @inject('EnrollmentRepository') private enrollmentRepo: EnrollmentRepository,
        @inject('UserRepository') private userRepo: UserRepository
    ) { }

    /** Generate a unique class code */
    async generateClassCode(): Promise<string> {
        let code: string;
        let exists = true;

        while (exists) {
            code = uuidv4().substring(0, 8).toUpperCase();
            exists = await this.classRepo.checkClassCodeExists(code);
        }

        return code!;
    }

    /** Create a new class */
    async createClass(
        teacherId: number,
        className: string,
        classCode: string,
        yearLevel: number,
        semester: number,
        academicYear: string,
        schedule: ClassSchedule,
        description?: string
    ): Promise<ClassDTO> {
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
    async getClassById(classId: number, teacherId?: number): Promise<ClassDTO> {
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
    async getClassesByTeacher(teacherId: number, activeOnly: boolean = true): Promise<ClassDTO[]> {
        const classesWithCounts = await this.classRepo.getClassesWithStudentCounts(teacherId, activeOnly);
        return classesWithCounts.map((c) => toClassDTO(c, { studentCount: c.studentCount }));
    }

    /** Update a class */
    async updateClass(
        classId: number,
        teacherId: number,
        data: {
            className?: string;
            description?: string | null;
            isActive?: boolean;
            yearLevel?: number;
            semester?: number;
            academicYear?: string;
            schedule?: ClassSchedule;
        }
    ): Promise<ClassDTO> {
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
    async deleteClass(classId: number, teacherId: number): Promise<void> {
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
    async createAssignment(
        classId: number,
        teacherId: number,
        data: {
            assignmentName: string;
            description: string;
            programmingLanguage: 'python' | 'java';
            deadline: Date;
            allowResubmission?: boolean;
        }
    ): Promise<AssignmentDTO> {
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
        });

        return toAssignmentDTO(assignment);
    }

    /** Get all assignments for a class */
    async getClassAssignments(classId: number): Promise<AssignmentDTO[]> {
        const assignments = await this.assignmentRepo.getAssignmentsByClassId(classId);
        return assignments.map((a) => toAssignmentDTO(a));
    }

    /** Get all students enrolled in a class */
    async getClassStudents(classId: number): Promise<Array<{
        id: number;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
    }>> {
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
    async removeStudent(classId: number, studentId: number, teacherId: number): Promise<void> {
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
    async getAssignmentDetails(assignmentId: number, userId: number): Promise<AssignmentDTO> {
        const assignment = await this.assignmentRepo.getAssignmentById(assignmentId);

        if (!assignment) {
            throw new AssignmentNotFoundError(assignmentId);
        }

        const classData = await this.classRepo.getClassById(assignment.classId);

        return toAssignmentDTO(assignment, { className: classData?.className });
    }

    /** Update an assignment */
    async updateAssignment(
        assignmentId: number,
        teacherId: number,
        data: {
            assignmentName?: string;
            description?: string;
            programmingLanguage?: 'python' | 'java';
            deadline?: Date;
            allowResubmission?: boolean;
        }
    ): Promise<AssignmentDTO> {
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
    async deleteAssignment(assignmentId: number, teacherId: number): Promise<void> {
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
}
