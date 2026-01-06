var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { eq } from 'drizzle-orm';
import { users } from '../models/index.js';
import { BaseRepository } from './base.repository.js';
import { injectable } from 'tsyringe';
/**
 * Repository for user-related database operations.
 * Provides methods for user CRUD and lookups.
 */
let UserRepository = class UserRepository extends BaseRepository {
    constructor() {
        super(users);
    }
    /** Create a new user */
    async createUser(data) {
        const results = await this.db
            .insert(users)
            .values({
            supabaseUserId: data.supabaseUserId,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
        })
            .returning();
        return results[0];
    }
    /** Get user by internal database ID */
    async getUserById(userId) {
        return await this.findById(userId);
    }
    /** Get user by Supabase user ID */
    async getUserBySupabaseId(supabaseUserId) {
        const results = await this.db
            .select()
            .from(users)
            .where(eq(users.supabaseUserId, supabaseUserId))
            .limit(1);
        return results[0];
    }
    /** Get user by email address */
    async getUserByEmail(email) {
        const results = await this.db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        return results[0];
    }
    /** Update user information */
    async updateUser(userId, data) {
        // Filter out undefined values
        const updateData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
        if (Object.keys(updateData).length === 0) {
            return await this.getUserById(userId);
        }
        return await this.update(userId, updateData);
    }
    /** Delete a user */
    async deleteUser(userId) {
        return await this.delete(userId);
    }
    /** Check if email already exists */
    async checkEmailExists(email) {
        const results = await this.db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        return results.length > 0;
    }
};
UserRepository = __decorate([
    injectable(),
    __metadata("design:paramtypes", [])
], UserRepository);
export { UserRepository };
//# sourceMappingURL=user.repository.js.map