import { classes, type Class, type NewClass, type ClassSchedule } from '../models/index.js';
import { BaseRepository } from './base.repository.js';
/**
 * Repository for class-related database operations.
 */
export declare class ClassRepository extends BaseRepository<typeof classes, Class, NewClass> {
    constructor();
    /** Get a class by ID */
    getClassById(classId: number): Promise<Class | undefined>;
    /** Get a class by class code */
    getClassByCode(classCode: string): Promise<Class | undefined>;
    /** Get all classes taught by a teacher */
    getClassesByTeacher(teacherId: number, activeOnly?: boolean): Promise<Class[]>;
    /** Get most recent classes taught by a teacher */
    getRecentClassesByTeacher(teacherId: number, limit?: number): Promise<Class[]>;
    /**
     * Get all classes by teacher WITH student counts in a single query.
     * Optimized to avoid N+1 query problem.
     */
    getClassesWithStudentCounts(teacherId: number, activeOnly?: boolean): Promise<(Class & {
        studentCount: number;
    })[]>;
    /** Create a new class */
    createClass(data: {
        teacherId: number;
        className: string;
        classCode: string;
        yearLevel: number;
        semester: number;
        academicYear: string;
        schedule: ClassSchedule;
        description?: string;
    }): Promise<Class>;
    /** Update a class */
    updateClass(classId: number, data: Partial<Pick<NewClass, 'className' | 'description' | 'isActive' | 'yearLevel' | 'semester' | 'academicYear' | 'schedule'>>): Promise<Class | undefined>;
    /** Delete a class (hard delete) */
    deleteClass(classId: number): Promise<boolean>;
    /** Get the number of students in a class */
    getStudentCount(classId: number): Promise<number>;
    /** Check if a class code already exists */
    checkClassCodeExists(classCode: string): Promise<boolean>;
    /** Get all students enrolled in a class */
    getEnrolledStudents(classId: number): Promise<Array<{
        id: number;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
    }>>;
    /** Get all classes a student is enrolled in */
    getClassesByStudent(studentId: number, activeOnly?: boolean): Promise<Class[]>;
    /** Remove a student from a class */
    removeStudent(classId: number, studentId: number): Promise<boolean>;
    /** Check if a student is enrolled in a class */
    isStudentEnrolled(classId: number, studentId: number): Promise<boolean>;
}
//# sourceMappingURL=class.repository.d.ts.map