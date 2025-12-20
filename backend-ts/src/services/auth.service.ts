import { inject, injectable } from 'tsyringe';
import { UserRepository, type UserRole } from '../repositories/user.repository.js';
import { supabase } from '../shared/supabase.js';
import { settings } from '../shared/config.js';
import { toUserDTO, type UserDTO } from '../shared/mappers.js';
import {
    UserAlreadyExistsError,
    InvalidCredentialsError,
    UserNotFoundError,
    EmailNotVerifiedError,
    InvalidRoleError,
} from '../shared/errors.js';

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
        @inject('UserRepository') private userRepo: UserRepository
    ) { }

    /**
     * Register a new user.
     * @throws {InvalidRoleError} If role is not 'student' or 'teacher'
     * @throws {UserAlreadyExistsError} If username or email exists
     */
    async registerUser(
        email: string,
        password: string,
        username: string,
        firstName: string,
        lastName: string,
        role: string
    ): Promise<AuthResult> {
        // Validate role
        if (role !== 'student' && role !== 'teacher') {
            throw new InvalidRoleError("student' or 'teacher");
        }

        // Check if username already exists
        if (await this.userRepo.checkUsernameExists(username)) {
            throw new UserAlreadyExistsError('username', username);
        }

        // Check if email already exists
        if (await this.userRepo.checkEmailExists(email)) {
            throw new UserAlreadyExistsError('email', email);
        }

        // Create Supabase auth user with metadata
        const { data: supabaseData, error: supabaseError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    first_name: firstName,
                    last_name: lastName,
                    role,
                },
            },
        });

        if (supabaseError || !supabaseData.user) {
            throw new Error(supabaseError?.message ?? 'Failed to create Supabase user');
        }

        // Create user in local database
        const user = await this.userRepo.createUser({
            supabaseUserId: supabaseData.user.id,
            username,
            email,
            firstName,
            lastName,
            role: role as UserRole,
        });

        return {
            userData: toUserDTO(user),
            token: supabaseData.session?.access_token ?? null,
        };
    }

    /**
     * Login a user
     * @throws {InvalidCredentialsError} If credentials are invalid
     * @throws {UserNotFoundError} If user not in local database
     */
    async loginUser(email: string, password: string): Promise<AuthResult> {
        const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (supabaseError) {
            if (supabaseError.message.toLowerCase().includes('email not confirmed')) {
                throw new EmailNotVerifiedError();
            }
            throw new InvalidCredentialsError();
        }

        if (!supabaseData.user) {
            throw new InvalidCredentialsError();
        }

        const user = await this.userRepo.getUserBySupabaseId(supabaseData.user.id);

        if (!user) {
            throw new UserNotFoundError(supabaseData.user.id);
        }

        return {
            userData: toUserDTO(user),
            token: supabaseData.session?.access_token ?? null,
        };
    }

    /**
     * Verify a token and return user data
     * @throws {InvalidCredentialsError} If token is invalid
     */
    async verifyToken(token: string): Promise<UserDTO> {
        const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

        if (error || !supabaseUser) {
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
        await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${settings.frontendUrl}/reset-password`,
        });
    }
}
