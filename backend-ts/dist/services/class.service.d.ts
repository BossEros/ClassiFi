import type { ClassSchedule } from '../models/index.js';
/**
 * Business logic for class-related operations.
 */
export declare class ClassService {
    private classRepo;
    private assignmentRepo;
    private enrollmentRepo;
    private userRepo;
    constructor();
    /** Generate a unique class code */
    generateClassCode(): Promise<string>;
    /** Create a new class */
    createClass(teacherId: number, className: string, classCode: string, yearLevel: number, semester: number, academicYear: string, schedule: ClassSchedule, description?: string): Promise<{
        success: boolean;
        message: string;
        classData?: any;
    }>;
    /** Get a class by ID */
    getClassById(classId: number, teacherId?: number): Promise<{
        success: boolean;
        message: string;
        classData?: any;
    }>;
    /** Get all classes for a teacher */
    getClassesByTeacher(teacherId: number, activeOnly?: boolean): Promise<{
        success: boolean;
        message: string;
        classes: any[];
    }>;
    /** Update a class */
    updateClass(classId: number, teacherId: number, data: {
        className?: string;
        description?: string | null;
        isActive?: boolean;
        yearLevel?: number;
        semester?: number;
        academicYear?: string;
        schedule?: ClassSchedule;
    }): Promise<{
        success: boolean;
        message: string;
        classData?: any;
    }>;
    /** Delete a class */
    deleteClass(classId: number, teacherId: number): Promise<{
        success: boolean;
        message: string;
    }>;
    /** Create an assignment for a class */
    createAssignment(classId: number, teacherId: number, data: {
        assignmentName: string;
        description: string;
        programmingLanguage: 'python' | 'java';
        deadline: Date;
        allowResubmission?: boolean;
    }): Promise<{
        success: boolean;
        message: string;
        assignment?: any;
    }>;
    /** Get all assignments for a class */
    getClassAssignments(classId: number): Promise<{
        success: boolean;
        message: string;
        assignments: any[];
    }>;
    /** Get all students enrolled in a class */
    getClassStudents(classId: number): Promise<{
        success: boolean;
        message: string;
        students: any[];
    }>;
    /** Remove a student from a class */
    removeStudent(classId: number, studentId: number, teacherId: number): Promise<{
        success: boolean;
        message: string;
    }>;
    /** Get assignment details */
    getAssignmentDetails(assignmentId: number, userId: number): Promise<{
        success: boolean;
        message: string;
        assignment?: any;
    }>;
    /** Update an assignment */
    updateAssignment(assignmentId: number, teacherId: number, data: {
        assignmentName?: string;
        description?: string;
        programmingLanguage?: 'python' | 'java';
        deadline?: Date;
        allowResubmission?: boolean;
    }): Promise<{
        success: boolean;
        message: string;
        assignment?: any;
    }>;
    /** Delete an assignment */
    deleteAssignment(assignmentId: number, teacherId: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=class.service.d.ts.map