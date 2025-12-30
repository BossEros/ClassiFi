var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { eq, and, desc, sql } from 'drizzle-orm';
import { classes, enrollments, users } from '../models/index.js';
import { BaseRepository } from './base.repository.js';
import { injectable } from 'tsyringe';
/**
 * Repository for class-related database operations.
 */
let ClassRepository = class ClassRepository extends BaseRepository {
    constructor() {
        super(classes);
    }
    /** Get a class by ID */
    async getClassById(classId) {
        return await this.findById(classId);
    }
    /** Get a class by class code */
    async getClassByCode(classCode) {
        const results = await this.db
            .select()
            .from(classes)
            .where(eq(classes.classCode, classCode))
            .limit(1);
        return results[0];
    }
    /** Get all classes taught by a teacher */
    async getClassesByTeacher(teacherId, activeOnly = true) {
        if (activeOnly) {
            return await this.db
                .select()
                .from(classes)
                .where(and(eq(classes.teacherId, teacherId), eq(classes.isActive, true)))
                .orderBy(desc(classes.createdAt));
        }
        return await this.db
            .select()
            .from(classes)
            .where(eq(classes.teacherId, teacherId))
            .orderBy(desc(classes.createdAt));
    }
    /** Get most recent classes taught by a teacher */
    async getRecentClassesByTeacher(teacherId, limit = 5) {
        return await this.db
            .select()
            .from(classes)
            .where(and(eq(classes.teacherId, teacherId), eq(classes.isActive, true)))
            .orderBy(desc(classes.createdAt))
            .limit(limit);
    }
    /** Create a new class */
    async createClass(data) {
        const results = await this.db
            .insert(classes)
            .values({
            teacherId: data.teacherId,
            className: data.className,
            classCode: data.classCode,
            yearLevel: data.yearLevel,
            semester: data.semester,
            academicYear: data.academicYear,
            schedule: data.schedule,
            description: data.description ?? null,
            isActive: true,
        })
            .returning();
        return results[0];
    }
    /** Update a class */
    async updateClass(classId, data) {
        const updateData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
        if (Object.keys(updateData).length === 0) {
            return await this.getClassById(classId);
        }
        return await this.update(classId, updateData);
    }
    /** Delete a class (hard delete) */
    async deleteClass(classId) {
        return await this.delete(classId);
    }
    /** Get the number of students in a class */
    async getStudentCount(classId) {
        const result = await this.db
            .select({ count: sql `count(*)` })
            .from(enrollments)
            .where(eq(enrollments.classId, classId));
        return Number(result[0]?.count ?? 0);
    }
    /** Check if a class code already exists */
    async checkClassCodeExists(classCode) {
        const results = await this.db
            .select({ id: classes.id })
            .from(classes)
            .where(eq(classes.classCode, classCode))
            .limit(1);
        return results.length > 0;
    }
    /** Get all students enrolled in a class */
    async getEnrolledStudents(classId) {
        const results = await this.db
            .select({
            id: users.id,
            username: users.username,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
        })
            .from(enrollments)
            .innerJoin(users, eq(enrollments.studentId, users.id))
            .where(eq(enrollments.classId, classId));
        return results;
    }
    /** Get all classes a student is enrolled in */
    async getClassesByStudent(studentId, activeOnly = true) {
        const query = this.db
            .select({
            id: classes.id,
            teacherId: classes.teacherId,
            className: classes.className,
            classCode: classes.classCode,
            description: classes.description,
            yearLevel: classes.yearLevel,
            semester: classes.semester,
            academicYear: classes.academicYear,
            schedule: classes.schedule,
            createdAt: classes.createdAt,
            isActive: classes.isActive,
        })
            .from(enrollments)
            .innerJoin(classes, eq(enrollments.classId, classes.id))
            .where(activeOnly
            ? and(eq(enrollments.studentId, studentId), eq(classes.isActive, true))
            : eq(enrollments.studentId, studentId))
            .orderBy(desc(classes.createdAt));
        return await query;
    }
    /** Remove a student from a class */
    async removeStudent(classId, studentId) {
        const results = await this.db
            .delete(enrollments)
            .where(and(eq(enrollments.classId, classId), eq(enrollments.studentId, studentId)))
            .returning();
        return results.length > 0;
    }
    /** Check if a student is enrolled in a class */
    async isStudentEnrolled(classId, studentId) {
        const results = await this.db
            .select({ id: enrollments.id })
            .from(enrollments)
            .where(and(eq(enrollments.classId, classId), eq(enrollments.studentId, studentId)))
            .limit(1);
        return results.length > 0;
    }
};
ClassRepository = __decorate([
    injectable(),
    __metadata("design:paramtypes", [])
], ClassRepository);
export { ClassRepository };
//# sourceMappingURL=class.repository.js.map