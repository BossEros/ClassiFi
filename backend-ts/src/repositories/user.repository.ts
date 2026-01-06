import { db } from '../shared/database.js';
import { eq } from 'drizzle-orm';
import { users, type User, type NewUser } from '../models/index.js';
import { BaseRepository } from './base.repository.js';
import { injectable } from 'tsyringe';

/** User role type */
export type UserRole = 'student' | 'teacher' | 'admin';

/**
 * Repository for user-related database operations.
 * Provides methods for user CRUD and lookups.
 */
@injectable()
export class UserRepository extends BaseRepository<typeof users, User, NewUser> {
    constructor() {
        super(users);
    }

    /** Create a new user */
    async createUser(data: {
        supabaseUserId: string;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
        role: UserRole;
    }): Promise<User> {
        const results = await this.db
            .insert(users)
            .values({
                supabaseUserId: data.supabaseUserId,
                username: data.username,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role,
            })
            .returning();

        return results[0];
    }

    /** Get user by internal database ID */
    async getUserById(userId: number): Promise<User | undefined> {
        return await this.findById(userId);
    }

    /** Get user by Supabase user ID */
    async getUserBySupabaseId(supabaseUserId: string): Promise<User | undefined> {
        const results = await this.db
            .select()
            .from(users)
            .where(eq(users.supabaseUserId, supabaseUserId))
            .limit(1);

        return results[0];
    }

    /** Get user by email address */
    async getUserByEmail(email: string): Promise<User | undefined> {
        const results = await this.db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        return results[0];
    }

    /** Get user by username */
    async getUserByUsername(username: string): Promise<User | undefined> {
        const results = await this.db
            .select()
            .from(users)
            .where(eq(users.username, username))
            .limit(1);

        return results[0];
    }

    /** Update user information */
    async updateUser(
        userId: number,
        data: Partial<Pick<NewUser, 'username' | 'email' | 'firstName' | 'lastName' | 'role' | 'avatarUrl'>>
    ): Promise<User | undefined> {
        // Filter out undefined values
        const updateData = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== undefined)
        );

        if (Object.keys(updateData).length === 0) {
            return await this.getUserById(userId);
        }

        return await this.update(userId, updateData);
    }

    /** Delete a user */
    async deleteUser(userId: number): Promise<boolean> {
        return await this.delete(userId);
    }

    /** Check if username already exists */
    async checkUsernameExists(username: string): Promise<boolean> {
        const results = await this.db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.username, username))
            .limit(1);

        return results.length > 0;
    }

    /** Check if email already exists */
    async checkEmailExists(email: string): Promise<boolean> {
        const results = await this.db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        return results.length > 0;
    }
}
