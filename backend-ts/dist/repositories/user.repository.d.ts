import { users, type User, type NewUser } from '../models/index.js';
import { BaseRepository } from './base.repository.js';
/** User role type */
export type UserRole = 'student' | 'teacher' | 'admin';
/**
 * Repository for user-related database operations.
 * Provides methods for user CRUD and lookups.
 */
export declare class UserRepository extends BaseRepository<typeof users, User, NewUser> {
    constructor();
    /** Create a new user */
    createUser(data: {
        supabaseUserId: string;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
        role: UserRole;
    }): Promise<User>;
    /** Get user by internal database ID */
    getUserById(userId: number): Promise<User | undefined>;
    /** Get user by Supabase user ID */
    getUserBySupabaseId(supabaseUserId: string): Promise<User | undefined>;
    /** Get user by email address */
    getUserByEmail(email: string): Promise<User | undefined>;
    /** Get user by username */
    getUserByUsername(username: string): Promise<User | undefined>;
    /** Update user information */
    updateUser(userId: number, data: Partial<Pick<NewUser, 'username' | 'email' | 'firstName' | 'lastName' | 'role'>>): Promise<User | undefined>;
    /** Delete a user */
    deleteUser(userId: number): Promise<boolean>;
    /** Check if username already exists */
    checkUsernameExists(username: string): Promise<boolean>;
    /** Check if email already exists */
    checkEmailExists(email: string): Promise<boolean>;
}
//# sourceMappingURL=user.repository.d.ts.map