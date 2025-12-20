import { db } from '../shared/database.js';
import { eq, and, desc } from 'drizzle-orm';
import { assignments, type Assignment, type NewAssignment } from '../models/index.js';
import { BaseRepository } from './base.repository.js';
import { injectable } from 'tsyringe';

/** Programming language type */
export type ProgrammingLanguage = 'python' | 'java';

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

    /** Create a new assignment */
    async createAssignment(data: {
        classId: number;
        assignmentName: string;
        description: string;
        programmingLanguage: ProgrammingLanguage;
        deadline: Date;
        allowResubmission?: boolean;
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
                isActive: true,
            })
            .returning();

        return results[0];
    }

    /** Update an assignment */
    async updateAssignment(
        assignmentId: number,
        data: Partial<Pick<NewAssignment, 'assignmentName' | 'description' | 'programmingLanguage' | 'deadline' | 'allowResubmission' | 'isActive'>>
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
