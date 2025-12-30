var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { eq, and } from 'drizzle-orm';
import { enrollments, classes } from '../models/index.js';
import { BaseRepository } from './base.repository.js';
import { injectable } from 'tsyringe';
/**
 * Repository for enrollment-related database operations.
 */
let EnrollmentRepository = class EnrollmentRepository extends BaseRepository {
    constructor() {
        super(enrollments);
    }
    /** Enroll a student in a class */
    async enrollStudent(studentId, classId) {
        const results = await this.db
            .insert(enrollments)
            .values({
            studentId,
            classId,
        })
            .returning();
        return results[0];
    }
    /** Unenroll a student from a class */
    async unenrollStudent(studentId, classId) {
        const results = await this.db
            .delete(enrollments)
            .where(and(eq(enrollments.studentId, studentId), eq(enrollments.classId, classId)))
            .returning();
        return results.length > 0;
    }
    /** Check if a student is enrolled in a class */
    async isEnrolled(studentId, classId) {
        const results = await this.db
            .select({ id: enrollments.id })
            .from(enrollments)
            .where(and(eq(enrollments.studentId, studentId), eq(enrollments.classId, classId)))
            .limit(1);
        return results.length > 0;
    }
    /** Get all enrollments for a student */
    async getEnrollmentsByStudent(studentId) {
        return await this.db
            .select()
            .from(enrollments)
            .where(eq(enrollments.studentId, studentId));
    }
    /** Get all enrollments for a class */
    async getEnrollmentsByClass(classId) {
        return await this.db
            .select()
            .from(enrollments)
            .where(eq(enrollments.classId, classId));
    }
    /** Get enrollment with class details */
    async getEnrollmentWithClass(enrollmentId) {
        const results = await this.db
            .select({
            enrollment: enrollments,
            class: classes,
        })
            .from(enrollments)
            .innerJoin(classes, eq(enrollments.classId, classes.id))
            .where(eq(enrollments.id, enrollmentId))
            .limit(1);
        return results[0];
    }
};
EnrollmentRepository = __decorate([
    injectable(),
    __metadata("design:paramtypes", [])
], EnrollmentRepository);
export { EnrollmentRepository };
//# sourceMappingURL=enrollment.repository.js.map