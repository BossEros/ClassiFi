/**
 * AuthService Unit Tests
 * Comprehensive tests for registration, login, and forgot password functionality
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '../../src/services/auth.service.js';
import { UserRepository } from '../../src/repositories/user.repository.js';
import { createMockUser, createMockTeacher } from '../utils/factories.js';
import {
    UserAlreadyExistsError,
    InvalidCredentialsError,
    UserNotFoundError,
    EmailNotVerifiedError,
} from '../../src/shared/errors.js';

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
            admin: {
                deleteUser: vi.fn(),
            },
        },
    },
}));

// Mock config
vi.mock('../../src/shared/config.js', () => ({
    settings: {
        frontendUrl: 'http://localhost:3000',
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

    afterEach(() => {
        vi.resetAllMocks();
    });

    // ============ registerUser Tests ============
    describe('registerUser', () => {
        const validRegistration = {
            email: 'new@example.com',
            password: 'password123',
            username: 'newuser',
            firstName: 'New',
            lastName: 'User',
            role: 'student',
        };

        it('should successfully register a new user', async () => {
            const mockUser = createMockUser({
                email: validRegistration.email,
                username: validRegistration.username,
            });
            const supabaseUserId = 'new-supabase-id';
            const accessToken = 'test-access-token';

            mockUserRepo.checkUsernameExists.mockResolvedValue(false);
            mockUserRepo.checkEmailExists.mockResolvedValue(false);
            mockUserRepo.createUser.mockResolvedValue(mockUser);

            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.auth.signUp as any).mockResolvedValue({
                data: {
                    user: { id: supabaseUserId },
                    session: { access_token: accessToken },
                },
                error: null,
            });

            const result = await authService.registerUser(
                validRegistration.email,
                validRegistration.password,
                validRegistration.username,
                validRegistration.firstName,
                validRegistration.lastName,
                validRegistration.role
            );

            expect(result.userData.email).toBe(validRegistration.email);
            expect(result.token).toBe(accessToken);
            expect(mockUserRepo.createUser).toHaveBeenCalledWith({
                supabaseUserId,
                username: validRegistration.username,
                email: validRegistration.email,
                firstName: validRegistration.firstName,
                lastName: validRegistration.lastName,
                role: validRegistration.role,
            });
        });

        it('should throw UserAlreadyExistsError if username exists', async () => {
            mockUserRepo.checkUsernameExists.mockResolvedValue(true);

            await expect(
                authService.registerUser(
                    validRegistration.email,
                    validRegistration.password,
                    'existinguser',
                    validRegistration.firstName,
                    validRegistration.lastName,
                    validRegistration.role
                )
            ).rejects.toThrow(UserAlreadyExistsError);

            expect(mockUserRepo.checkEmailExists).not.toHaveBeenCalled();
        });

        it('should throw UserAlreadyExistsError if email exists', async () => {
            mockUserRepo.checkUsernameExists.mockResolvedValue(false);
            mockUserRepo.checkEmailExists.mockResolvedValue(true);

            await expect(
                authService.registerUser(
                    'existing@example.com',
                    validRegistration.password,
                    validRegistration.username,
                    validRegistration.firstName,
                    validRegistration.lastName,
                    validRegistration.role
                )
            ).rejects.toThrow(UserAlreadyExistsError);
        });

        it('should throw error when Supabase signup fails', async () => {
            mockUserRepo.checkUsernameExists.mockResolvedValue(false);
            mockUserRepo.checkEmailExists.mockResolvedValue(false);

            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.auth.signUp as any).mockResolvedValue({
                data: { user: null },
                error: { message: 'Supabase error occurred' },
            });

            await expect(
                authService.registerUser(
                    validRegistration.email,
                    validRegistration.password,
                    validRegistration.username,
                    validRegistration.firstName,
                    validRegistration.lastName,
                    validRegistration.role
                )
            ).rejects.toThrow('Supabase error occurred');
        });

        it('should throw error when Supabase returns no user', async () => {
            mockUserRepo.checkUsernameExists.mockResolvedValue(false);
            mockUserRepo.checkEmailExists.mockResolvedValue(false);

            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.auth.signUp as any).mockResolvedValue({
                data: { user: null, session: null },
                error: null,
            });

            await expect(
                authService.registerUser(
                    validRegistration.email,
                    validRegistration.password,
                    validRegistration.username,
                    validRegistration.firstName,
                    validRegistration.lastName,
                    validRegistration.role
                )
            ).rejects.toThrow('Failed to create Supabase user');
        });

        it('should rollback Supabase user when database insert fails', async () => {
            const supabaseUserId = 'temp-supabase-id';
            mockUserRepo.checkUsernameExists.mockResolvedValue(false);
            mockUserRepo.checkEmailExists.mockResolvedValue(false);
            mockUserRepo.createUser.mockRejectedValue(new Error('Database insert failed'));

            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.auth.signUp as any).mockResolvedValue({
                data: {
                    user: { id: supabaseUserId },
                    session: { access_token: 'token' },
                },
                error: null,
            });

            await expect(
                authService.registerUser(
                    validRegistration.email,
                    validRegistration.password,
                    validRegistration.username,
                    validRegistration.firstName,
                    validRegistration.lastName,
                    validRegistration.role
                )
            ).rejects.toThrow('Database insert failed');

            expect(supabase.auth.admin.deleteUser).toHaveBeenCalledWith(supabaseUserId);
        });

        it('should still throw original error even if rollback fails', async () => {
            const supabaseUserId = 'temp-supabase-id';
            mockUserRepo.checkUsernameExists.mockResolvedValue(false);
            mockUserRepo.checkEmailExists.mockResolvedValue(false);
            mockUserRepo.createUser.mockRejectedValue(new Error('Database insert failed'));

            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.auth.signUp as any).mockResolvedValue({
                data: {
                    user: { id: supabaseUserId },
                    session: { access_token: 'token' },
                },
                error: null,
            });
            (supabase.auth.admin.deleteUser as any).mockRejectedValue(
                new Error('Rollback failed')
            );

            await expect(
                authService.registerUser(
                    validRegistration.email,
                    validRegistration.password,
                    validRegistration.username,
                    validRegistration.firstName,
                    validRegistration.lastName,
                    validRegistration.role
                )
            ).rejects.toThrow('Database insert failed');
        });

        it('should return null token when session is not provided', async () => {
            const mockUser = createMockUser();
            mockUserRepo.checkUsernameExists.mockResolvedValue(false);
            mockUserRepo.checkEmailExists.mockResolvedValue(false);
            mockUserRepo.createUser.mockResolvedValue(mockUser);

            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.auth.signUp as any).mockResolvedValue({
                data: {
                    user: { id: 'supabase-id' },
                    session: null,
                },
                error: null,
            });

            const result = await authService.registerUser(
                validRegistration.email,
                validRegistration.password,
                validRegistration.username,
                validRegistration.firstName,
                validRegistration.lastName,
                validRegistration.role
            );

            expect(result.token).toBeNull();
        });

        it('should work for teacher role', async () => {
            const mockTeacher = createMockTeacher();
            mockUserRepo.checkUsernameExists.mockResolvedValue(false);
            mockUserRepo.checkEmailExists.mockResolvedValue(false);
            mockUserRepo.createUser.mockResolvedValue(mockTeacher);

            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.auth.signUp as any).mockResolvedValue({
                data: {
                    user: { id: 'teacher-supabase-id' },
                    session: { access_token: 'token' },
                },
                error: null,
            });

            const result = await authService.registerUser(
                'teacher@example.com',
                'password123',
                'teacher1',
                'Test',
                'Teacher',
                'teacher'
            );

            expect(result.userData.role).toBe('teacher');
        });
    });

    // ============ loginUser Tests ============
    describe('loginUser', () => {
        const validCredentials = {
            email: 'test@example.com',
            password: 'password123',
        };

        it('should successfully login a user', async () => {
            const mockUser = createMockUser();
            const supabaseUserId = 'supabase-id';
            const accessToken = 'test-access-token';

            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.auth.signInWithPassword as any).mockResolvedValue({
                data: {
                    user: { id: supabaseUserId },
                    session: { access_token: accessToken },
                },
                error: null,
            });
            mockUserRepo.getUserBySupabaseId.mockResolvedValue(mockUser);

            const result = await authService.loginUser(
                validCredentials.email,
                validCredentials.password
            );

            expect(result.userData.email).toBe(mockUser.email);
            expect(result.token).toBe(accessToken);
        });

        it('should throw InvalidCredentialsError for wrong password', async () => {
            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.auth.signInWithPassword as any).mockResolvedValue({
                data: { user: null, session: null },
                error: { message: 'Invalid login credentials' },
            });

            await expect(
                authService.loginUser(validCredentials.email, 'wrongpassword')
            ).rejects.toThrow(InvalidCredentialsError);
        });

        it('should throw EmailNotVerifiedError when email is not confirmed', async () => {
            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.auth.signInWithPassword as any).mockResolvedValue({
                data: { user: null, session: null },
                error: { message: 'Email not confirmed' },
            });

            await expect(
                authService.loginUser(validCredentials.email, validCredentials.password)
            ).rejects.toThrow(EmailNotVerifiedError);
        });

        it('should throw InvalidCredentialsError when Supabase returns no user', async () => {
            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.auth.signInWithPassword as any).mockResolvedValue({
                data: { user: null, session: { access_token: 'token' } },
                error: null,
            });

            await expect(
                authService.loginUser(validCredentials.email, validCredentials.password)
            ).rejects.toThrow(InvalidCredentialsError);
        });

        it('should throw UserNotFoundError when user not in local database', async () => {
            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.auth.signInWithPassword as any).mockResolvedValue({
                data: {
                    user: { id: 'orphan-supabase-id' },
                    session: { access_token: 'token' },
                },
                error: null,
            });
            mockUserRepo.getUserBySupabaseId.mockResolvedValue(undefined);

            await expect(
                authService.loginUser(validCredentials.email, validCredentials.password)
            ).rejects.toThrow(UserNotFoundError);
        });

        it('should return null token when session is not provided', async () => {
            const mockUser = createMockUser();
            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.auth.signInWithPassword as any).mockResolvedValue({
                data: {
                    user: { id: 'supabase-id' },
                    session: null,
                },
                error: null,
            });
            mockUserRepo.getUserBySupabaseId.mockResolvedValue(mockUser);

            const result = await authService.loginUser(
                validCredentials.email,
                validCredentials.password
            );

            expect(result.token).toBeNull();
        });
    });

    // ============ verifyToken Tests ============
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
            expect(result.email).toBe(mockUser.email);
        });

        it('should throw InvalidCredentialsError for invalid token', async () => {
            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.auth.getUser as any).mockResolvedValue({
                data: { user: null },
                error: { message: 'Invalid token' },
            });

            await expect(authService.verifyToken('invalid-token')).rejects.toThrow(
                InvalidCredentialsError
            );
        });

        it('should throw InvalidCredentialsError when Supabase returns no user', async () => {
            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.auth.getUser as any).mockResolvedValue({
                data: { user: null },
                error: null,
            });

            await expect(authService.verifyToken('token-with-no-user')).rejects.toThrow(
                InvalidCredentialsError
            );
        });

        it('should throw UserNotFoundError when user not in local database', async () => {
            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.auth.getUser as any).mockResolvedValue({
                data: { user: { id: 'orphan-supabase-id' } },
                error: null,
            });
            mockUserRepo.getUserBySupabaseId.mockResolvedValue(undefined);

            await expect(authService.verifyToken('valid-token-orphan-user')).rejects.toThrow(
                UserNotFoundError
            );
        });
    });

    // ============ requestPasswordReset Tests ============
    describe('requestPasswordReset', () => {
        it('should call Supabase resetPasswordForEmail with correct parameters', async () => {
            const email = 'reset@example.com';
            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.auth.resetPasswordForEmail as any).mockResolvedValue({});

            await authService.requestPasswordReset(email);

            expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(email, {
                redirectTo: 'http://localhost:3000/reset-password',
            });
        });

        it('should not throw error even if email does not exist (security)', async () => {
            const email = 'nonexistent@example.com';
            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.auth.resetPasswordForEmail as any).mockResolvedValue({});

            await expect(authService.requestPasswordReset(email)).resolves.not.toThrow();
        });

        it('should propagate Supabase errors', async () => {
            const email = 'error@example.com';
            const { supabase } = await import('../../src/shared/supabase.js');
            (supabase.auth.resetPasswordForEmail as any).mockRejectedValue(
                new Error('Rate limit exceeded')
            );

            await expect(authService.requestPasswordReset(email)).rejects.toThrow(
                'Rate limit exceeded'
            );
        });
    });
});
