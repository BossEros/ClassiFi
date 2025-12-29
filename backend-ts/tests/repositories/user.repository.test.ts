/**
 * UserRepository Unit Tests
 * Tests for user database operations
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock database module before importing repository
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
}));

// Mock models
vi.mock('../../src/models/index.js', () => ({
    users: {
        id: 'id',
        supabaseUserId: 'supabaseUserId',
        username: 'username',
        email: 'email',
        firstName: 'firstName',
        lastName: 'lastName',
        role: 'role',
    },
}));

import { createMockUser, createMockTeacher } from '../utils/factories.js';

describe('UserRepository', () => {
    let mockDb: any;

    beforeEach(async () => {
        vi.clearAllMocks();

        // Get the mocked db
        const { db } = await import('../../src/shared/database.js');
        mockDb = db;
    });

    describe('checkUsernameExists', () => {
        it('should return true when username exists', async () => {
            // Setup chain: db.select().from().where().limit()
            const limitMock = vi.fn().mockResolvedValue([{ id: 1 }]);
            const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            // Import fresh instance to get mocked db
            const { UserRepository } = await import('../../src/repositories/user.repository.js');
            const userRepo = new UserRepository();

            const result = await userRepo.checkUsernameExists('existinguser');

            expect(result).toBe(true);
        });

        it('should return false when username does not exist', async () => {
            const limitMock = vi.fn().mockResolvedValue([]);
            const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { UserRepository } = await import('../../src/repositories/user.repository.js');
            const userRepo = new UserRepository();

            const result = await userRepo.checkUsernameExists('newuser');

            expect(result).toBe(false);
        });
    });

    describe('checkEmailExists', () => {
        it('should return true when email exists', async () => {
            const limitMock = vi.fn().mockResolvedValue([{ id: 1 }]);
            const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { UserRepository } = await import('../../src/repositories/user.repository.js');
            const userRepo = new UserRepository();

            const result = await userRepo.checkEmailExists('existing@example.com');

            expect(result).toBe(true);
        });

        it('should return false when email does not exist', async () => {
            const limitMock = vi.fn().mockResolvedValue([]);
            const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { UserRepository } = await import('../../src/repositories/user.repository.js');
            const userRepo = new UserRepository();

            const result = await userRepo.checkEmailExists('new@example.com');

            expect(result).toBe(false);
        });
    });

    describe('getUserBySupabaseId', () => {
        it('should return user when found', async () => {
            const mockUser = createMockUser();
            const limitMock = vi.fn().mockResolvedValue([mockUser]);
            const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { UserRepository } = await import('../../src/repositories/user.repository.js');
            const userRepo = new UserRepository();

            const result = await userRepo.getUserBySupabaseId('supabase-id');

            expect(result).toEqual(mockUser);
        });

        it('should return undefined when user not found', async () => {
            const limitMock = vi.fn().mockResolvedValue([]);
            const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { UserRepository } = await import('../../src/repositories/user.repository.js');
            const userRepo = new UserRepository();

            const result = await userRepo.getUserBySupabaseId('non-existent-id');

            expect(result).toBeUndefined();
        });
    });

    describe('getUserByEmail', () => {
        it('should return user when email found', async () => {
            const mockUser = createMockUser();
            const limitMock = vi.fn().mockResolvedValue([mockUser]);
            const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { UserRepository } = await import('../../src/repositories/user.repository.js');
            const userRepo = new UserRepository();

            const result = await userRepo.getUserByEmail('test@example.com');

            expect(result).toEqual(mockUser);
        });

        it('should return undefined when email not found', async () => {
            const limitMock = vi.fn().mockResolvedValue([]);
            const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { UserRepository } = await import('../../src/repositories/user.repository.js');
            const userRepo = new UserRepository();

            const result = await userRepo.getUserByEmail('nonexistent@example.com');

            expect(result).toBeUndefined();
        });
    });

    describe('getUserByUsername', () => {
        it('should return user when username found', async () => {
            const mockUser = createMockUser();
            const limitMock = vi.fn().mockResolvedValue([mockUser]);
            const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { UserRepository } = await import('../../src/repositories/user.repository.js');
            const userRepo = new UserRepository();

            const result = await userRepo.getUserByUsername('testuser');

            expect(result).toEqual(mockUser);
        });

        it('should return undefined when username not found', async () => {
            const limitMock = vi.fn().mockResolvedValue([]);
            const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            const selectMock = vi.fn().mockReturnValue({ from: fromMock });
            mockDb.select = selectMock;

            const { UserRepository } = await import('../../src/repositories/user.repository.js');
            const userRepo = new UserRepository();

            const result = await userRepo.getUserByUsername('nonexistentuser');

            expect(result).toBeUndefined();
        });
    });

    describe('createUser', () => {
        it('should create and return a new user', async () => {
            const mockUser = createMockUser();
            const returningMock = vi.fn().mockResolvedValue([mockUser]);
            const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
            const insertMock = vi.fn().mockReturnValue({ values: valuesMock });
            mockDb.insert = insertMock;

            const { UserRepository } = await import('../../src/repositories/user.repository.js');
            const userRepo = new UserRepository();

            const result = await userRepo.createUser({
                supabaseUserId: 'new-supabase-id',
                username: 'newuser',
                email: 'new@example.com',
                firstName: 'New',
                lastName: 'User',
                role: 'student',
            });

            expect(result).toEqual(mockUser);
        });

        it('should create teacher user correctly', async () => {
            const mockTeacher = createMockTeacher();
            const returningMock = vi.fn().mockResolvedValue([mockTeacher]);
            const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
            const insertMock = vi.fn().mockReturnValue({ values: valuesMock });
            mockDb.insert = insertMock;

            const { UserRepository } = await import('../../src/repositories/user.repository.js');
            const userRepo = new UserRepository();

            const result = await userRepo.createUser({
                supabaseUserId: 'teacher-supabase-id',
                username: 'teacher1',
                email: 'teacher@example.com',
                firstName: 'Test',
                lastName: 'Teacher',
                role: 'teacher',
            });

            expect(result.role).toBe('teacher');
        });
    });
});
