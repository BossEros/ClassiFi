import { inject, injectable } from 'tsyringe';
import { UserRepository, type UserRole } from '@/repositories/user.repository.js';
import { SupabaseAuthAdapter } from '@/services/supabase-auth.adapter.js';
import { settings } from '@/shared/config.js';
import { toUserDTO, type UserDTO } from '@/shared/mappers.js';
import {
    UserAlreadyExistsError,
    InvalidCredentialsError,
    UserNotFoundError,
    EmailNotVerifiedError,
    InvalidRoleError,
} from '@/shared/errors.js';

/** Auth result type */
interface AuthResult {
    userData: UserDTO;
    token: string | null;
}

/**
 * Business logic for authentication operations.
 * Coordinates between Supabase Auth and local users table.
 */
@injectable()
export class AuthService {
    constructor(
        @inject('UserRepository') private userRepo: UserRepository,
        @inject('SupabaseAuthAdapter') private authAdapter: SupabaseAuthAdapter
    ) { }

    /**
     * Register a new user.
     * @throws {UserAlreadyExistsError} If email exists
     */
    async registerUser(
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        role: string
    ): Promise<AuthResult> {

        // Check if email already exists
        if (await this.userRepo.checkEmailExists(email)) {
            throw new UserAlreadyExistsError(email);
        }

        // Create Supabase auth user with metadata
        const { user: supabaseUser, token } = await this.authAdapter.signUp(
            email,
            password,
            {
                first_name: firstName,
                last_name: lastName,
                role,
            }
        );

        if (!supabaseUser) {
            throw new Error('Failed to create Supabase user');
        }

        // Create user in local database with rollback on failure
        try {
            const user = await this.userRepo.createUser({
                supabaseUserId: supabaseUser.id,
                email,
                firstName,
                lastName,
                role: role as UserRole,
            });

            return {
                userData: toUserDTO(user),
                token: token ?? null,
            };
        } catch (error) {
            // Rollback: Delete the Supabase user to prevent orphaned records
            try {
                await this.authAdapter.deleteUser(supabaseUser.id);
            } catch (rollbackError) {
                // Log rollback failure but throw original error
                console.error('Failed to rollback Supabase user:', rollbackError);
            }
            throw error;
        }
    }

    /**
     * Login a user
     * @throws {InvalidCredentialsError} If credentials are invalid
     * @throws {UserNotFoundError} If user not in local database
     */
    async loginUser(email: string, password: string): Promise<AuthResult> {
        const { accessToken, user: supabaseUser } = await this.authAdapter.signInWithPassword(email, password);

        if (!supabaseUser) {
            throw new InvalidCredentialsError();
        }

        const user = await this.userRepo.getUserBySupabaseId(supabaseUser.id);

        if (!user) {
            throw new UserNotFoundError(supabaseUser.id);
        }

        return {
            userData: toUserDTO(user),
            token: accessToken,
        };
    }

    /**
     * Verify a token and return user data
     * @throws {InvalidCredentialsError} If token is invalid
     */
    async verifyToken(token: string): Promise<UserDTO> {
        const supabaseUser = await this.authAdapter.getUser(token);

        if (!supabaseUser) {
            throw new InvalidCredentialsError();
        }

        const user = await this.userRepo.getUserBySupabaseId(supabaseUser.id);

        if (!user) {
            throw new UserNotFoundError(supabaseUser.id);
        }

        return toUserDTO(user);
    }

    /** Request a password reset email */
    async requestPasswordReset(email: string): Promise<void> {
        await this.authAdapter.resetPasswordForEmail(email, `${settings.frontendUrl}/reset-password`);
    }
}
