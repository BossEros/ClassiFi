/**
 * AuthService Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../src/services/auth.service.js';
import { UserRepository } from '../../src/repositories/user.repository.js';
import { createMockUser } from '../utils/factories.js';
import { UserAlreadyExistsError, InvalidRoleError } from '../../src/shared/errors.js';

// Mock the UserRepository
vi.mock('../../src/repositories/user.repository.js');

// Mock Supabase
vi.mock('../../src/shared/supabase.js', () => ({
    supabase: {
        auth: {
            signUp: vi.fn(),
            signInWithPassword: vi.fn(),
            getUser: vi.fn(),
            resetPasswordForEmail: vi.fn(),
        },
    },
}));

describe('AuthService', () => {
    let authService: AuthService;
    let mockUserRepo: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockUserRepo = {
            checkUsernameExists: vi.fn(),
            checkEmailExists: vi.fn(),
            createUser: vi.fn(),
            getUserBySupabaseId: vi.fn(),
        };

        authService = new AuthService(mockUserRepo as UserRepository);
    });

    describe('registerUser', () => {
        it('should throw InvalidRoleError for invalid role', async () => {
            await expect(
                authService.registerUser(
                    'test@example.com',
                    'password123',
                    'testuser',
                    'Test',
                    'User',
                    'invalid-role'
                )
            ).rejects.toThrow(InvalidRoleError);
        });

        it('should throw UserAlreadyExistsError if username exists', async () => {
            mockUserRepo.checkUsernameExists.mockResolvedValue(true);

            await expect(
                authService.registerUser(
                    'test@example.com',
                    'password123',
                    'existinguser',
                    'Test',
                    'User',
                    'student'
                )
            ).rejects.toThrow(UserAlreadyExistsError);
        });

        it('should throw UserAlreadyExistsError if email exists', async () => {
            mockUserRepo.checkUsernameExists.mockResolvedValue(false);
            mockUserRepo.checkEmailExists.mockResolvedValue(true);

            await expect(
                authService.registerUser(
                    'existing@example.com',
                    'password123',
                    'testuser',
                    'Test',
                    'User',
                    'student'
                )
            ).rejects.toThrow(UserAlreadyExistsError);
        });
    });

    describe('verifyToken', () => {
        it('should return user data for valid token', async () => {
            const mockUser = createMockUser();
            const { supabase } = await import('../../src/shared/supabase.js');

            (supabase.auth.getUser as any).mockResolvedValue({
                data: { user: { id: 'supabase-id' } },
                error: null,
            });
            mockUserRepo.getUserBySupabaseId.mockResolvedValue(mockUser);

            const result = await authService.verifyToken('valid-token');

            expect(result.id).toBe(mockUser.id);
            expect(result.username).toBe(mockUser.username);
        });
    });
});
