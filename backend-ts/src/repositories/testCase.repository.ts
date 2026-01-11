import { injectable } from 'tsyringe';
import { db } from '@/shared/database.js';
import { testCases, type TestCase, type NewTestCase } from '@/models/index.js';
import { eq, and, asc } from 'drizzle-orm';

/**
 * Repository for test case database operations.
 */
@injectable()
export class TestCaseRepository {
    /**
     * Get all test cases for an assignment, ordered by sortOrder.
     */
    async getByAssignmentId(assignmentId: number): Promise<TestCase[]> {
        return db
            .select()
            .from(testCases)
            .where(eq(testCases.assignmentId, assignmentId))
            .orderBy(asc(testCases.sortOrder));
    }

    /**
     * Get a test case by ID.
     */
    async getById(id: number): Promise<TestCase | undefined> {
        const results = await db
            .select()
            .from(testCases)
            .where(eq(testCases.id, id));
        return results[0];
    }

    /**
     * Create a new test case.
     */
    async create(data: Omit<NewTestCase, 'id' | 'createdAt'>): Promise<TestCase> {
        const results = await db
            .insert(testCases)
            .values(data)
            .returning();
        return results[0];
    }

    /**
     * Create multiple test cases.
     */
    async createMany(data: Omit<NewTestCase, 'id' | 'createdAt'>[]): Promise<TestCase[]> {
        if (data.length === 0) return [];
        return db
            .insert(testCases)
            .values(data)
            .returning();
    }

    /**
     * Update a test case.
     */
    async update(
        id: number,
        data: Partial<Omit<NewTestCase, 'id' | 'createdAt' | 'assignmentId'>>
    ): Promise<TestCase | undefined> {
        const results = await db
            .update(testCases)
            .set(data)
            .where(eq(testCases.id, id))
            .returning();
        return results[0];
    }

    /**
     * Delete a test case.
     */
    async delete(id: number): Promise<boolean> {
        const result = await db
            .delete(testCases)
            .where(eq(testCases.id, id))
            .returning({ id: testCases.id });
        return result.length > 0;
    }

    /**
     * Delete all test cases for an assignment.
     */
    async deleteByAssignmentId(assignmentId: number): Promise<number> {
        const result = await db
            .delete(testCases)
            .where(eq(testCases.assignmentId, assignmentId))
            .returning({ id: testCases.id });
        return result.length;
    }

    /**
     * Update sort order for multiple test cases.
     */
    async updateSortOrder(updates: Array<{ id: number; sortOrder: number }>): Promise<void> {
        for (const { id, sortOrder } of updates) {
            await db
                .update(testCases)
                .set({ sortOrder })
                .where(eq(testCases.id, id));
        }
    }

    /**
     * Get the next sort order for a new test case.
     */
    async getNextSortOrder(assignmentId: number): Promise<number> {
        const existing = await this.getByAssignmentId(assignmentId);
        if (existing.length === 0) return 0;
        return Math.max(...existing.map(tc => tc.sortOrder)) + 1;
    }
}
