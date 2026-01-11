import { db } from '@/shared/database.js';
import { eq, and, desc, inArray, sql, or, gt, asc } from 'drizzle-orm';
import { assignments, classes, submissions, enrollments, type Assignment, type NewAssignment } from '@/models/index.js';
import { BaseRepository } from '@/repositories/base.repository.js';
import { injectable } from 'tsyringe';
/** Programming language type */
export type ProgrammingLanguage = 'python' | 'java' | 'c';

/**
 * Repository for assignment-related database operations.
 */
@injectable()
export class AssignmentRepository extends BaseRepository<typeof assignments, Assignment, NewAssignment> {
    constructor() {
        super(assignments);
    }

    /** Get an assignment by ID */
    async getAssignmentById(assignmentId: number): Promise<Assignment | undefined> {
        return await this.findById(assignmentId);
    }

    /** Get all assignments for a class */
    async getAssignmentsByClassId(
        classId: number,
        activeOnly: boolean = true
    ): Promise<Assignment[]> {
        if (activeOnly) {
            return await this.db
                .select()
                .from(assignments)
                .where(and(eq(assignments.classId, classId), eq(assignments.isActive, true)))
                .orderBy(desc(assignments.deadline));
        }

        return await this.db
            .select()
            .from(assignments)
            .where(eq(assignments.classId, classId))
            .orderBy(desc(assignments.deadline));
    }

    /** Get assignments for multiple classes */
    async getAssignmentsByClassIds(
        classIds: number[],
        activeOnly: boolean = true
    ): Promise<Assignment[]> {
        if (classIds.length === 0) {
            return [];
        }

        if (activeOnly) {
            return await this.db
                .select()
                .from(assignments)
                .where(and(inArray(assignments.classId, classIds), eq(assignments.isActive, true)))
                .orderBy(desc(assignments.deadline));
        }

        return await this.db
            .select()
            .from(assignments)
            .where(inArray(assignments.classId, classIds))
            .orderBy(desc(assignments.deadline));
    }

    /**
     * Get pending tasks for a teacher.
     * Combines logic to check for upcoming deadlines or ungraded submissions.
     * Optimized to avoid N+1 query problem.
     */
    async getPendingTasksForTeacher(
        teacherId: number,
        limit: number = 10
    ): Promise<Array<{
        id: number;
        assignmentName: string;
        deadline: Date | null;
        classId: number;
        className: string;
        studentCount: number;
        submissionCount: number;
    }>> {
        const now = new Date();

        // Subquery for student counts per class
        const classStudentCounts = this.db.select({
            classId: enrollments.classId,
            count: sql<number>`count(*)`.as('studentCount')
        }).from(enrollments).groupBy(enrollments.classId).as('csc');

        // Subquery for latest submission counts per assignment
        const assignmentSubmissionCounts = this.db.select({
            assignmentId: submissions.assignmentId,
            count: sql<number>`count(*)`.as('submissionCount')
        }).from(submissions).where(eq(submissions.isLatest, true)).groupBy(submissions.assignmentId).as('asc');

        const results = await this.db.select({
            id: assignments.id,
            assignmentName: assignments.assignmentName,
            deadline: assignments.deadline,
            classId: classes.id,
            className: classes.className,
            studentCount: sql<number>`COALESCE(${classStudentCounts.count}, 0)`,
            submissionCount: sql<number>`COALESCE(${assignmentSubmissionCounts.count}, 0)`
        })
            .from(assignments)
            .innerJoin(classes, eq(assignments.classId, classes.id))
            .leftJoin(classStudentCounts, eq(classes.id, classStudentCounts.classId))
            .leftJoin(assignmentSubmissionCounts, eq(assignments.id, assignmentSubmissionCounts.assignmentId))
            .where(
                and(
                    eq(classes.teacherId, teacherId),
                    eq(classes.isActive, true),
                    eq(assignments.isActive, true),
                    or(
                        gt(assignments.deadline, now),
                        gt(sql`COALESCE(${assignmentSubmissionCounts.count}, 0)`, 0)
                    )
                )
            )
            .orderBy(asc(assignments.deadline))
            .limit(limit);

        return results.map(r => ({
            ...r,
            studentCount: Number(r.studentCount),
            submissionCount: Number(r.submissionCount),
            deadline: r.deadline ? new Date(r.deadline) : null
        }));
    }

    /** Create a new assignment */
    async createAssignment(data: {
        classId: number;
        assignmentName: string;
        description: string;
        programmingLanguage: ProgrammingLanguage;
        deadline: Date;
        allowResubmission?: boolean;
        maxAttempts?: number | null;
        templateCode?: string | null;
    }): Promise<Assignment> {
        const results = await this.db
            .insert(assignments)
            .values({
                classId: data.classId,
                assignmentName: data.assignmentName,
                description: data.description,
                programmingLanguage: data.programmingLanguage,
                deadline: data.deadline,
                allowResubmission: data.allowResubmission ?? true,
                maxAttempts: data.maxAttempts ?? null,
                templateCode: data.templateCode ?? null,
                isActive: true,
            })
            .returning();

        return results[0];
    }

    /** Update an assignment */
    async updateAssignment(
        assignmentId: number,
        data: Partial<Pick<NewAssignment, 'assignmentName' | 'description' | 'programmingLanguage' | 'deadline' | 'allowResubmission' | 'maxAttempts' | 'isActive' | 'templateCode'>>
    ): Promise<Assignment | undefined> {
        const updateData = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== undefined)
        );

        if (Object.keys(updateData).length === 0) {
            return await this.getAssignmentById(assignmentId);
        }

        return await this.update(assignmentId, updateData);
    }

    /** Delete an assignment (hard delete) */
    async deleteAssignment(assignmentId: number): Promise<boolean> {
        return await this.delete(assignmentId);
    }

    /** Deactivate an assignment (soft delete) */
    async deactivateAssignment(assignmentId: number): Promise<Assignment | undefined> {
        return await this.update(assignmentId, { isActive: false });
    }
}
