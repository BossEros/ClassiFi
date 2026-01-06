import { ClassRepository } from '../repositories/class.repository.js';
import { AssignmentRepository } from '../repositories/assignment.repository.js';
import { EnrollmentRepository } from '../repositories/enrollment.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import type { ClassSchedule } from '../models/index.js';
import { type ClassDTO, type AssignmentDTO } from '../shared/mappers.js';
/**
 * Business logic for class-related operations.
 * Uses domain errors for exceptional conditions.
 */
export declare class ClassService {
    private classRepo;
    private assignmentRepo;
    private enrollmentRepo;
    private userRepo;
    constructor(classRepo: ClassRepository, assignmentRepo: AssignmentRepository, enrollmentRepo: EnrollmentRepository, userRepo: UserRepository);
    /** Generate a unique class code */
    generateClassCode(): Promise<string>;
    /** Create a new class */
    createClass(teacherId: number, className: string, classCode: string, yearLevel: number, semester: number, academicYear: string, schedule: ClassSchedule, description?: string): Promise<ClassDTO>;
    /** Get a class by ID */
    getClassById(classId: number, teacherId?: number): Promise<ClassDTO>;
    /**
     * Get all classes for a teacher.
     * Uses optimized single query to avoid N+1 problem.
     */
    getClassesByTeacher(teacherId: number, activeOnly?: boolean): Promise<ClassDTO[]>;
    /** Update a class */
    updateClass(classId: number, teacherId: number, data: {
        className?: string;
        description?: string | null;
        isActive?: boolean;
        yearLevel?: number;
        semester?: number;
        academicYear?: string;
        schedule?: ClassSchedule;
    }): Promise<ClassDTO>;
    /** Delete a class */
    deleteClass(classId: number, teacherId: number): Promise<void>;
    /** Create an assignment for a class */
    createAssignment(classId: number, teacherId: number, data: {
        assignmentName: string;
        description: string;
        programmingLanguage: 'python' | 'java' | 'c';
        deadline: Date;
        allowResubmission?: boolean;
        maxAttempts?: number | null;
    }): Promise<AssignmentDTO>;
    /** Get all assignments for a class */
    getClassAssignments(classId: number): Promise<AssignmentDTO[]>;
    /** Get all students enrolled in a class */
    getClassStudents(classId: number): Promise<Array<{
        id: number;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
    }>>;
    /** Remove a student from a class */
    removeStudent(classId: number, studentId: number, teacherId: number): Promise<void>;
    /** Get assignment details */
    getAssignmentDetails(assignmentId: number, userId: number): Promise<AssignmentDTO>;
    /** Update an assignment */
    updateAssignment(assignmentId: number, teacherId: number, data: {
        assignmentName?: string;
        description?: string;
        programmingLanguage?: 'python' | 'java' | 'c';
        deadline?: Date;
        allowResubmission?: boolean;
        maxAttempts?: number | null;
    }): Promise<AssignmentDTO>;
    /** Delete an assignment */
    deleteAssignment(assignmentId: number, teacherId: number): Promise<void>;
}
//# sourceMappingURL=class.service.d.ts.map