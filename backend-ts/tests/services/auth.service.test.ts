import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '../../src/services/auth.service.js';
import { UserRepository } from '../../src/repositories/user.repository.js';
import { SupabaseAuthAdapter } from '../../src/services/supabase-auth.adapter.js';
import { createMockUser, createMockTeacher } from '../utils/factories.js';
import {
    UserAlreadyExistsError,
    InvalidCredentialsError,
    UserNotFoundError,
    EmailNotVerifiedError,
} from '../../src/shared/errors.js';

// Mock the UserRepository
vi.mock('../../src/repositories/user.repository.js');
// Mock the SupabaseAuthAdapter
vi.mock('../../src/services/supabase-auth.adapter.js');
// Mock config
vi.mock('../../src/shared/config.js', () => ({
    settings: {
        frontendUrl: 'http://localhost:3000',
    },
}));

describe('AuthService', () => {
    let authService: AuthService;
    let mockUserRepo: any;
    let mockAuthAdapter: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockUserRepo = {
            checkEmailExists: vi.fn(),
            createUser: vi.fn(),
            getUserBySupabaseId: vi.fn(),
        };

        mockAuthAdapter = {
            signUp: vi.fn(),
            signInWithPassword: vi.fn(),
            getUser: vi.fn(),
            resetPasswordForEmail: vi.fn(),
            deleteUser: vi.fn(),
        };

        authService = new AuthService(
            mockUserRepo as UserRepository,
            mockAuthAdapter as SupabaseAuthAdapter
        );
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    // ============ registerUser Tests ============
    describe('registerUser', () => {
        const validRegistration = {
            email: 'new@example.com',
            password: 'password123',
            firstName: 'New',
            lastName: 'User',
            role: 'student',
        };

        it('should successfully register a new user', async () => {
            const mockUser = createMockUser({
                email: validRegistration.email,
            });
            const supabaseUserId = 'new-supabase-id';
            const accessToken = 'test-access-token';

            mockUserRepo.checkEmailExists.mockResolvedValue(false);
            mockUserRepo.createUser.mockResolvedValue(mockUser);

            mockAuthAdapter.signUp.mockResolvedValue({
                user: { id: supabaseUserId },
                token: accessToken
            });

            const result = await authService.registerUser(
                validRegistration.email,
                validRegistration.password,
                validRegistration.firstName,
                validRegistration.lastName,
                validRegistration.role
            );

            expect(result.userData.email).toBe(validRegistration.email);
            expect(result.token).toBe(accessToken);
            expect(mockUserRepo.createUser).toHaveBeenCalledWith({
                supabaseUserId,
                email: validRegistration.email,
                firstName: validRegistration.firstName,
                lastName: validRegistration.lastName,
                role: validRegistration.role,
            });
            expect(mockAuthAdapter.signUp).toHaveBeenCalledWith(
                validRegistration.email,
                validRegistration.password,
                {
                    first_name: validRegistration.firstName,
                    last_name: validRegistration.lastName,
                    role: validRegistration.role,
                }
            );
        });

        it('should throw UserAlreadyExistsError if email exists', async () => {
            mockUserRepo.checkEmailExists.mockResolvedValue(true);

            await expect(
                authService.registerUser(
                    'existing@example.com',
                    validRegistration.password,
                    validRegistration.firstName,
                    validRegistration.lastName,
                    validRegistration.role
                )
            ).rejects.toThrow(UserAlreadyExistsError);

            expect(mockAuthAdapter.signUp).not.toHaveBeenCalled();
        });

        it('should throw error when Supabase signup fails', async () => {
            mockUserRepo.checkEmailExists.mockResolvedValue(false);
            mockAuthAdapter.signUp.mockRejectedValue(new Error('Supabase error occurred'));

            await expect(
                authService.registerUser(
                    validRegistration.email,
                    validRegistration.password,
                    validRegistration.firstName,
                    validRegistration.lastName,
                    validRegistration.role
                )
            ).rejects.toThrow('Supabase error occurred');
        });

        it('should throw error when Supabase returns no user', async () => {
            mockUserRepo.checkEmailExists.mockResolvedValue(false);
            mockAuthAdapter.signUp.mockResolvedValue({ user: null, token: null });

            await expect(
                authService.registerUser(
                    validRegistration.email,
                    validRegistration.password,
                    validRegistration.firstName,
                    validRegistration.lastName,
                    validRegistration.role
                )
            ).rejects.toThrow('Failed to create Supabase user');
        });

        it('should rollback Supabase user when database insert fails', async () => {
            const supabaseUserId = 'temp-supabase-id';
            mockUserRepo.checkEmailExists.mockResolvedValue(false);
            mockUserRepo.createUser.mockRejectedValue(new Error('Database insert failed'));

            mockAuthAdapter.signUp.mockResolvedValue({
                user: { id: supabaseUserId },
                token: 'token'
            });

            await expect(
                authService.registerUser(
                    validRegistration.email,
                    validRegistration.password,
                    validRegistration.firstName,
                    validRegistration.lastName,
                    validRegistration.role
                )
            ).rejects.toThrow('Database insert failed');

            expect(mockAuthAdapter.deleteUser).toHaveBeenCalledWith(supabaseUserId);
        });

        it('should still throw original error even if rollback fails', async () => {
            const supabaseUserId = 'temp-supabase-id';
            mockUserRepo.checkEmailExists.mockResolvedValue(false);
            mockUserRepo.createUser.mockRejectedValue(new Error('Database insert failed'));
            mockAuthAdapter.deleteUser.mockRejectedValue(new Error('Rollback failed'));

            mockAuthAdapter.signUp.mockResolvedValue({
                user: { id: supabaseUserId },
                token: 'token'
            });

            await expect(
                authService.registerUser(
                    validRegistration.email,
                    validRegistration.password,
                    validRegistration.firstName,
                    validRegistration.lastName,
                    validRegistration.role
                )
            ).rejects.toThrow('Database insert failed');
        });

        it('should return null token when session is not provided', async () => {
            const mockUser = createMockUser();
            mockUserRepo.checkEmailExists.mockResolvedValue(false);
            mockUserRepo.createUser.mockResolvedValue(mockUser);

            mockAuthAdapter.signUp.mockResolvedValue({
                user: { id: 'supabase-id' },
                token: null
            });

            const result = await authService.registerUser(
                validRegistration.email,
                validRegistration.password,
                validRegistration.firstName,
                validRegistration.lastName,
                validRegistration.role
            );

            expect(result.token).toBeNull();
        });

        it('should work for teacher role', async () => {
            const mockTeacher = createMockTeacher();
            mockUserRepo.checkEmailExists.mockResolvedValue(false);
            mockUserRepo.createUser.mockResolvedValue(mockTeacher);

            mockAuthAdapter.signUp.mockResolvedValue({
                user: { id: 'teacher-supabase-id' },
                token: 'token'
            });

            const result = await authService.registerUser(
                'teacher@example.com',
                'password123',
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

            mockAuthAdapter.signInWithPassword.mockResolvedValue({
                accessToken,
                user: { id: supabaseUserId }
            });
            mockUserRepo.getUserBySupabaseId.mockResolvedValue(mockUser);

            const result = await authService.loginUser(
                validCredentials.email,
                validCredentials.password
            );

            expect(result.userData.email).toBe(mockUser.email);
            expect(result.token).toBe(accessToken);
            expect(mockAuthAdapter.signInWithPassword).toHaveBeenCalledWith(
                validCredentials.email,
                validCredentials.password
            );
        });

        it('should throw InvalidCredentialsError for wrong password', async () => {
            mockAuthAdapter.signInWithPassword.mockRejectedValue(new InvalidCredentialsError());

            await expect(
                authService.loginUser(validCredentials.email, 'wrongpassword')
            ).rejects.toThrow(InvalidCredentialsError);
        });

        it('should throw EmailNotVerifiedError when email is not confirmed', async () => {
            mockAuthAdapter.signInWithPassword.mockRejectedValue(new EmailNotVerifiedError());

            await expect(
                authService.loginUser(validCredentials.email, validCredentials.password)
            ).rejects.toThrow(EmailNotVerifiedError);
        });

        it('should throw InvalidCredentialsError when Supabase returns no user', async () => {
            mockAuthAdapter.signInWithPassword.mockResolvedValue({
                accessToken: 'token',
                user: null
            });

            await expect(
                authService.loginUser(validCredentials.email, validCredentials.password)
            ).rejects.toThrow(InvalidCredentialsError);
        });

        it('should throw UserNotFoundError when user not in local database', async () => {
            mockAuthAdapter.signInWithPassword.mockResolvedValue({
                accessToken: 'token',
                user: { id: 'orphan-supabase-id' }
            });
            mockUserRepo.getUserBySupabaseId.mockResolvedValue(undefined);

            await expect(
                authService.loginUser(validCredentials.email, validCredentials.password)
            ).rejects.toThrow(UserNotFoundError);
        });
    });

    // ============ verifyToken Tests ============
    describe('verifyToken', () => {
        it('should return user data for valid token', async () => {
            const mockUser = createMockUser();

            mockAuthAdapter.getUser.mockResolvedValue({ id: 'supabase-id' });
            mockUserRepo.getUserBySupabaseId.mockResolvedValue(mockUser);

            const result = await authService.verifyToken('valid-token');

            expect(result.id).toBe(mockUser.id);
            expect(result.email).toBe(mockUser.email);
            expect(mockAuthAdapter.getUser).toHaveBeenCalledWith('valid-token');
        });

        it('should throw InvalidCredentialsError for invalid token', async () => {
            mockAuthAdapter.getUser.mockResolvedValue(null);

            await expect(authService.verifyToken('invalid-token')).rejects.toThrow(
                InvalidCredentialsError
            );
        });

        it('should throw UserNotFoundError when user not in local database', async () => {
            mockAuthAdapter.getUser.mockResolvedValue({ id: 'orphan-supabase-id' });
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
            mockAuthAdapter.resetPasswordForEmail.mockResolvedValue(undefined);

            await authService.requestPasswordReset(email);

            expect(mockAuthAdapter.resetPasswordForEmail).toHaveBeenCalledWith(email, 'http://localhost:3000/reset-password');
        });

        it('should not throw error even if email does not exist (security)', async () => {
            const email = 'nonexistent@example.com';
            mockAuthAdapter.resetPasswordForEmail.mockResolvedValue(undefined);

            await expect(authService.requestPasswordReset(email)).resolves.not.toThrow();
        });

        it('should propagate Supabase errors', async () => {
            const email = 'error@example.com';
            mockAuthAdapter.resetPasswordForEmail.mockRejectedValue(new Error('Rate limit exceeded'));

            await expect(authService.requestPasswordReset(email)).rejects.toThrow(
                'Rate limit exceeded'
            );
        });
    });
});
