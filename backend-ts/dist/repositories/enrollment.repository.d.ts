import { enrollments, type Enrollment, type NewEnrollment, type Class } from '../models/index.js';
import { BaseRepository } from './base.repository.js';
/**
 * Repository for enrollment-related database operations.
 */
export declare class EnrollmentRepository extends BaseRepository<typeof enrollments, Enrollment, NewEnrollment> {
    constructor();
    /** Enroll a student in a class */
    enrollStudent(studentId: number, classId: number): Promise<Enrollment>;
    /** Unenroll a student from a class */
    unenrollStudent(studentId: number, classId: number): Promise<boolean>;
    /** Check if a student is enrolled in a class */
    isEnrolled(studentId: number, classId: number): Promise<boolean>;
    /** Get all enrollments for a student */
    getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]>;
    /** Get all enrollments for a class */
    getEnrollmentsByClass(classId: number): Promise<Enrollment[]>;
    /** Get enrollment with class details */
    getEnrollmentWithClass(enrollmentId: number): Promise<{
        enrollment: Enrollment;
        class: Class;
    } | undefined>;
}
//# sourceMappingURL=enrollment.repository.d.ts.map