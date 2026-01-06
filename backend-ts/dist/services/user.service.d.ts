import { UserRepository } from '@/repositories/user.repository.js';
import { SubmissionRepository } from '@/repositories/submission.repository.js';
/**
 * Business logic for user account operations.
 */
export declare class UserService {
    private userRepo;
    private submissionRepo;
    constructor(userRepo: UserRepository, submissionRepo: SubmissionRepository);
    /**
     * Delete a user account.
     * Cleans up storage files, removes user from local database and Supabase Auth.
     * @throws {UserNotFoundError} If user not found
     */
    deleteAccount(userId: number): Promise<void>;
    /**
     * Update user avatar URL.
     * @throws {UserNotFoundError} If user not found
     */
    updateAvatarUrl(userId: number, avatarUrl: string): Promise<void>;
    /**
     * Get user by ID.
     */
    getUserById(userId: number): Promise<{
        id: number;
        supabaseUserId: string | null;
        email: string;
        firstName: string;
        lastName: string;
        role: "student" | "teacher" | "admin";
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date | null;
    } | undefined>;
}
//# sourceMappingURL=user.service.d.ts.map