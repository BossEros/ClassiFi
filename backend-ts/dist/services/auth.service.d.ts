import { UserRepository } from '@/repositories/user.repository.js';
import { type UserDTO } from '@/shared/mappers.js';
interface AuthResult {
    userData: UserDTO;
    token: string | null;
}
/**
 * Business logic for authentication operations.
 * Coordinates between Supabase Auth and local users table.
 */
export declare class AuthService {
    private userRepo;
    constructor(userRepo: UserRepository);
    /**
     * Register a new user.
     * @throws {UserAlreadyExistsError} If username or email exists
     */
    registerUser(email: string, password: string, username: string, firstName: string, lastName: string, role: string): Promise<AuthResult>;
    /**
     * Login a user
     * @throws {InvalidCredentialsError} If credentials are invalid
     * @throws {UserNotFoundError} If user not in local database
     */
    loginUser(email: string, password: string): Promise<AuthResult>;
    /**
     * Verify a token and return user data
     * @throws {InvalidCredentialsError} If token is invalid
     */
    verifyToken(token: string): Promise<UserDTO>;
    /** Request a password reset email */
    requestPasswordReset(email: string): Promise<void>;
}
export {};
//# sourceMappingURL=auth.service.d.ts.map