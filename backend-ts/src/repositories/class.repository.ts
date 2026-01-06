import { db } from '../shared/database.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { classes, enrollments, users, type Class, type NewClass, type ClassSchedule } from '../models/index.js';
import { BaseRepository } from './base.repository.js';
import { injectable } from 'tsyringe';

/**
 * Repository for class-related database operations.
 */
@injectable()
export class ClassRepository extends BaseRepository<typeof classes, Class, NewClass> {
    constructor() {
        super(classes);
    }

    /** Get a class by ID */
    async getClassById(classId: number): Promise<Class | undefined> {
        return await this.findById(classId);
    }

    /** Get a class by class code */
    async getClassByCode(classCode: string): Promise<Class | undefined> {
        const results = await this.db
            .select()
            .from(classes)
            .where(eq(classes.classCode, classCode))
            .limit(1);

        return results[0];
    }

    /** Get all classes taught by a teacher */
    async getClassesByTeacher(
        teacherId: number,
        activeOnly: boolean = true
    ): Promise<Class[]> {
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
    async getRecentClassesByTeacher(
        teacherId: number,
        limit: number = 5
    ): Promise<Class[]> {
        return await this.db
            .select()
            .from(classes)
            .where(and(eq(classes.teacherId, teacherId), eq(classes.isActive, true)))
            .orderBy(desc(classes.createdAt))
            .limit(limit);
    }

    /**
     * Get all classes by teacher WITH student counts in a single query.
     * Optimized to avoid N+1 query problem.
     */
    async getClassesWithStudentCounts(
        teacherId: number,
        activeOnly: boolean = true
    ): Promise<(Class & { studentCount: number })[]> {
        const studentCountSubquery = this.db
            .select({
                classId: enrollments.classId,
                count: sql<number>`count(*)`.as('count'),
            })
            .from(enrollments)
            .groupBy(enrollments.classId)
            .as('student_counts');

        const condition = activeOnly
            ? and(eq(classes.teacherId, teacherId), eq(classes.isActive, true))
            : eq(classes.teacherId, teacherId);

        const results = await this.db
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
                studentCount: sql<number>`COALESCE(${studentCountSubquery.count}, 0)`,
            })
            .from(classes)
            .leftJoin(studentCountSubquery, eq(classes.id, studentCountSubquery.classId))
            .where(condition)
            .orderBy(desc(classes.createdAt));

        return results.map((r) => ({
            ...r,
            studentCount: Number(r.studentCount),
        }));
    }

    /** Create a new class */
    async createClass(data: {
        teacherId: number;
        className: string;
        classCode: string;
        yearLevel: number;
        semester: number;
        academicYear: string;
        schedule: ClassSchedule;
        description?: string;
    }): Promise<Class> {
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
    async updateClass(
        classId: number,
        data: Partial<Pick<NewClass, 'className' | 'description' | 'isActive' | 'yearLevel' | 'semester' | 'academicYear' | 'schedule'>>
    ): Promise<Class | undefined> {
        const updateData = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== undefined)
        );

        if (Object.keys(updateData).length === 0) {
            return await this.getClassById(classId);
        }

        return await this.update(classId, updateData);
    }

    /** Delete a class (hard delete) */
    async deleteClass(classId: number): Promise<boolean> {
        return await this.delete(classId);
    }

    /** Get the number of students in a class */
    async getStudentCount(classId: number): Promise<number> {
        const result = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(enrollments)
            .where(eq(enrollments.classId, classId));

        return Number(result[0]?.count ?? 0);
    }

    /** Check if a class code already exists */
    async checkClassCodeExists(classCode: string): Promise<boolean> {
        const results = await this.db
            .select({ id: classes.id })
            .from(classes)
            .where(eq(classes.classCode, classCode))
            .limit(1);

        return results.length > 0;
    }

    /** Get all students enrolled in a class */
    async getEnrolledStudents(classId: number): Promise<Array<{
        id: number;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
    }>> {
        const results = await this.db
            .select({
                id: users.id,
                username: users.username,
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName,
                avatarUrl: users.avatarUrl,
            })
            .from(enrollments)
            .innerJoin(users, eq(enrollments.studentId, users.id))
            .where(eq(enrollments.classId, classId));

        return results;
    }

    /** Get all classes a student is enrolled in */
    async getClassesByStudent(
        studentId: number,
        activeOnly: boolean = true
    ): Promise<Class[]> {
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
            .where(
                activeOnly
                    ? and(eq(enrollments.studentId, studentId), eq(classes.isActive, true))
                    : eq(enrollments.studentId, studentId)
            )
            .orderBy(desc(classes.createdAt));

        return await query;
    }

    /** Remove a student from a class */
    async removeStudent(classId: number, studentId: number): Promise<boolean> {
        const results = await this.db
            .delete(enrollments)
            .where(and(eq(enrollments.classId, classId), eq(enrollments.studentId, studentId)))
            .returning();

        return results.length > 0;
    }

    /** Check if a student is enrolled in a class */
    async isStudentEnrolled(classId: number, studentId: number): Promise<boolean> {
        const results = await this.db
            .select({ id: enrollments.id })
            .from(enrollments)
            .where(and(eq(enrollments.classId, classId), eq(enrollments.studentId, studentId)))
            .limit(1);

        return results.length > 0;
    }
}
