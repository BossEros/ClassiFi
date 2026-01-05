/**
 * BaseRepository Unit Tests
 * Tests for the abstract base repository with common CRUD operations
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock database module
vi.mock('../../src/shared/database.js', () => ({
    db: {
        insert: vi.fn(),
        select: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
    eq: vi.fn((field, value) => ({ field, value, type: 'eq' })),
    sql: vi.fn((strings, ...values) => ({ type: 'sql', strings, values })),
}));

// Mock table for testing
const mockTable = {
    id: 'id',
    name: 'name',
    createdAt: 'createdAt',
} as any;

describe('BaseRepository', () => {
    let mockDb: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        const { db } = await import('../../src/shared/database.js');
        mockDb = db;
    });

    // ============ Constructor Tests ============
    describe('constructor', () => {
        it('should initialize with table reference', async () => {
            const { BaseRepository } = await import('../../src/repositories/base.repository.js');
            const repo = new BaseRepository(mockTable);

            expect(repo).toBeDefined();
        });
    });

    // ============ findAll Tests ============
    describe('findAll', () => {
        it('should return all records', async () => {
            const records = [
                { id: 1, name: 'Test 1' },
                { id: 2, name: 'Test 2' },
            ];
            const fromMock = vi.fn().mockResolvedValue(records);
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { BaseRepository } = await import('../../src/repositories/base.repository.js');
            const repo = new BaseRepository(mockTable);

            const result = await repo.findAll();

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe(1);
        });

        it('should return empty array when no records', async () => {
            const fromMock = vi.fn().mockResolvedValue([]);
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { BaseRepository } = await import('../../src/repositories/base.repository.js');
            const repo = new BaseRepository(mockTable);

            const result = await repo.findAll();

            expect(result).toHaveLength(0);
        });
    });

    // ============ findById Tests ============
    describe('findById', () => {
        it('should return record when found', async () => {
            const record = { id: 1, name: 'Test' };
            const limitMock = vi.fn().mockResolvedValue([record]);
            const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { BaseRepository } = await import('../../src/repositories/base.repository.js');
            const repo = new BaseRepository(mockTable);

            const result = await repo.findById(1);

            expect(result?.id).toBe(1);
        });

        it('should return undefined when record not found', async () => {
            const limitMock = vi.fn().mockResolvedValue([]);
            const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { BaseRepository } = await import('../../src/repositories/base.repository.js');
            const repo = new BaseRepository(mockTable);

            const result = await repo.findById(999);

            expect(result).toBeUndefined();
        });

        it('should throw error when table has no id column', async () => {
            const tableWithoutId = { name: 'name' } as any;

            const { BaseRepository } = await import('../../src/repositories/base.repository.js');
            const repo = new BaseRepository(tableWithoutId);

            await expect(repo.findById(1)).rejects.toThrow('Table does not have an id column');
        });
    });

    // ============ create Tests ============
    describe('create', () => {
        it('should create and return new record', async () => {
            const newRecord = { id: 1, name: 'New Record' };
            const returningMock = vi.fn().mockResolvedValue([newRecord]);
            const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
            const insertMock = vi.fn().mockReturnValue({ values: valuesMock });
            mockDb.insert = insertMock;

            const { BaseRepository } = await import('../../src/repositories/base.repository.js');
            const repo = new BaseRepository(mockTable);

            const result = await repo.create({ name: 'New Record' } as any);

            expect(result.id).toBe(1);
            expect(result.name).toBe('New Record');
        });
    });

    // ============ update Tests ============
    describe('update', () => {
        it('should update and return record', async () => {
            const updatedRecord = { id: 1, name: 'Updated' };
            const returningMock = vi.fn().mockResolvedValue([updatedRecord]);
            const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
            const setMock = vi.fn().mockReturnValue({ where: whereMock });
            const updateMock = vi.fn().mockReturnValue({ set: setMock });
            mockDb.update = updateMock;

            const { BaseRepository } = await import('../../src/repositories/base.repository.js');
            const repo = new BaseRepository(mockTable);

            const result = await repo.update(1, { name: 'Updated' } as any);

            expect(result?.name).toBe('Updated');
        });

        it('should return undefined when record not found', async () => {
            const returningMock = vi.fn().mockResolvedValue([]);
            const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
            const setMock = vi.fn().mockReturnValue({ where: whereMock });
            const updateMock = vi.fn().mockReturnValue({ set: setMock });
            mockDb.update = updateMock;

            const { BaseRepository } = await import('../../src/repositories/base.repository.js');
            const repo = new BaseRepository(mockTable);

            const result = await repo.update(999, { name: 'Updated' } as any);

            expect(result).toBeUndefined();
        });

        it('should throw error when table has no id column', async () => {
            const tableWithoutId = { name: 'name' } as any;

            const { BaseRepository } = await import('../../src/repositories/base.repository.js');
            const repo = new BaseRepository(tableWithoutId);

            await expect(repo.update(1, { name: 'Test' })).rejects.toThrow('Table does not have an id column');
        });
    });

    // ============ delete Tests ============
    describe('delete', () => {
        it('should return true when record is deleted', async () => {
            const returningMock = vi.fn().mockResolvedValue([{ id: 1 }]);
            const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
            const deleteMock = vi.fn().mockReturnValue({ where: whereMock });
            mockDb.delete = deleteMock;

            const { BaseRepository } = await import('../../src/repositories/base.repository.js');
            const repo = new BaseRepository(mockTable);

            const result = await repo.delete(1);

            expect(result).toBe(true);
        });

        it('should return false when record not found', async () => {
            const returningMock = vi.fn().mockResolvedValue([]);
            const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
            const deleteMock = vi.fn().mockReturnValue({ where: whereMock });
            mockDb.delete = deleteMock;

            const { BaseRepository } = await import('../../src/repositories/base.repository.js');
            const repo = new BaseRepository(mockTable);

            const result = await repo.delete(999);

            expect(result).toBe(false);
        });

        it('should throw error when table has no id column', async () => {
            const tableWithoutId = { name: 'name' } as any;

            const { BaseRepository } = await import('../../src/repositories/base.repository.js');
            const repo = new BaseRepository(tableWithoutId);

            await expect(repo.delete(1)).rejects.toThrow('Table does not have an id column');
        });
    });

    // ============ count Tests ============
    describe('count', () => {
        it('should return count of records', async () => {
            const fromMock = vi.fn().mockResolvedValue([{ count: 42 }]);
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { BaseRepository } = await import('../../src/repositories/base.repository.js');
            const repo = new BaseRepository(mockTable);

            const result = await repo.count();

            expect(result).toBe(42);
        });

        it('should return 0 when no records', async () => {
            const fromMock = vi.fn().mockResolvedValue([{ count: 0 }]);
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { BaseRepository } = await import('../../src/repositories/base.repository.js');
            const repo = new BaseRepository(mockTable);

            const result = await repo.count();

            expect(result).toBe(0);
        });

        it('should return 0 when result is undefined', async () => {
            const fromMock = vi.fn().mockResolvedValue([]);
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { BaseRepository } = await import('../../src/repositories/base.repository.js');
            const repo = new BaseRepository(mockTable);

            const result = await repo.count();

            expect(result).toBe(0);
        });
    });

    // ============ withContext Tests ============
    describe('withContext', () => {
        it('should return a clone with different db context', async () => {
            const { BaseRepository } = await import('../../src/repositories/base.repository.js');
            const repo = new BaseRepository(mockTable);

            const mockContext = { query: vi.fn() } as any;
            const clonedRepo = repo.withContext(mockContext);

            expect(clonedRepo).not.toBe(repo);
            expect(clonedRepo).toBeDefined();
        });
    });
});
