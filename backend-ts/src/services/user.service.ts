import { inject, injectable } from 'tsyringe';
import { UserRepository } from '@/repositories/user.repository.js';
import { SubmissionRepository } from '@/repositories/submission.repository.js';
import { supabase } from '@/shared/supabase.js';
import { UserNotFoundError } from '@/shared/errors.js';

/**
 * Business logic for user account operations.
 */
@injectable()
export class UserService {
    constructor(
        @inject('UserRepository') private userRepo: UserRepository,
        @inject('SubmissionRepository') private submissionRepo: SubmissionRepository
    ) { }

    /**
     * Delete a user account.
     * Cleans up storage files, removes user from local database and Supabase Auth.
     * @throws {UserNotFoundError} If user not found
     */
    async deleteAccount(userId: number): Promise<void> {
        // Get user to retrieve Supabase ID and avatar URL
        const user = await this.userRepo.getUserById(userId);

        if (!user) {
            throw new UserNotFoundError(userId.toString());
        }

        // Clean up avatar from Supabase Storage
        if (user.avatarUrl && user.avatarUrl.includes('/avatars/')) {
            try {
                // Extract filename from URL (e.g., "123.jpg")
                const urlParts = user.avatarUrl.split('/avatars/');
                if (urlParts.length > 1) {
                    const fileName = urlParts[1].split('?')[0]; // Remove query params
                    await supabase.storage.from('avatars').remove([fileName]);
                    console.log(`Deleted avatar file: ${fileName}`);
                }
            } catch (error) {
                console.error('Failed to delete avatar from storage:', error);
                // Continue with deletion anyway
            }
        }

        // Get all submissions to clean up files before cascade delete
        try {
            const submissions = await this.submissionRepo.getSubmissionsByStudent(userId, false);
            if (submissions.length > 0) {
                // Extract file paths and delete from storage
                const filePaths = submissions.map(s => s.filePath);
                if (filePaths.length > 0) {
                    const { error } = await supabase.storage.from('submissions').remove(filePaths);
                    if (error) {
                        console.error('Failed to delete submission files:', error);
                    } else {
                        console.log(`Deleted ${filePaths.length} submission files`);
                    }
                }
            }
        } catch (error) {
            console.error('Error cleaning up submission files:', error);
            // Continue with deletion anyway
        }

        // Delete from local database (cascades to enrollments and submissions)
        const deleted = await this.userRepo.deleteUser(userId);

        if (!deleted) {
            throw new Error('Failed to delete user from database');
        }

        // Delete from Supabase Auth if supabaseUserId exists
        if (user.supabaseUserId) {
            try {
                const { error } = await supabase.auth.admin.deleteUser(user.supabaseUserId);
                if (error) {
                    console.error('Failed to delete user from Supabase Auth:', error);
                    // Don't throw - local DB is already deleted
                }
            } catch (error) {
                console.error('Error deleting from Supabase Auth:', error);
                // Don't throw - local DB is already deleted
            }
        }
    }

    /**
     * Update user avatar URL.
     * @throws {UserNotFoundError} If user not found
     */
    async updateAvatarUrl(userId: number, avatarUrl: string): Promise<void> {
        const user = await this.userRepo.getUserById(userId);

        if (!user) {
            throw new UserNotFoundError(userId.toString());
        }

        await this.userRepo.updateUser(userId, { avatarUrl });
    }

    /**
     * Get user by ID.
     */
    async getUserById(userId: number) {
        return await this.userRepo.getUserById(userId);
    }
}

