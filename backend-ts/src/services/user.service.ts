import { inject, injectable } from "tsyringe"
import { UserRepository } from "@/repositories/user.repository.js"
import { SubmissionRepository } from "@/repositories/submission.repository.js"
import { StorageService } from "@/services/storage.service.js"
import { SupabaseAuthAdapter } from "@/services/supabase-auth.adapter.js"
import { UserNotFoundError } from "@/shared/errors.js"
import { createLogger } from "@/shared/logger.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

const logger = createLogger("UserService")

@injectable()
export class UserService {
  constructor(
    @inject(DI_TOKENS.repositories.user) private userRepo: UserRepository,
    @inject(DI_TOKENS.repositories.submission)
    private submissionRepo: SubmissionRepository,
    @inject(DI_TOKENS.services.storage) private storageService: StorageService,
    @inject(DI_TOKENS.adapters.supabaseAuth) private authAdapter: SupabaseAuthAdapter,
  ) {}

  /**
   * Delete a user account.
   * Cleans up storage files, removes user from local database and Supabase Auth.
   * @throws {UserNotFoundError} If user not found
   */
  async deleteAccount(userId: number): Promise<void> {
    // Get user to retrieve Supabase ID and avatar URL
    const user = await this.userRepo.getUserById(userId)

    if (!user) {
      throw new UserNotFoundError(userId)
    }

    // Clean up avatar from Supabase Storage using StorageService
    if (user.avatarUrl) {
      await this.storageService.deleteAvatar(user.avatarUrl)
    }

    // Get all submissions to clean up files before cascade delete
    try {
      const submissions = await this.submissionRepo.getSubmissionsByStudent(
        userId,
        false,
      )

      if (submissions.length > 0) {
        const filePaths = submissions.map((s) => s.filePath)
        await this.storageService.deleteSubmissionFiles(filePaths)
      }
    } catch (error) {
      logger.error("Error cleaning up submission files:", error)
      // Continue with deletion anyway
    }

    // Delete from local database (cascades to enrollments and submissions)
    const deleted = await this.userRepo.deleteUser(userId)

    if (!deleted) {
      throw new Error("Failed to delete user from database")
    }

    // Delete from Supabase Auth if supabaseUserId exists
    if (user.supabaseUserId) {
      await this.authAdapter.deleteUser(user.supabaseUserId)
    }
  }

  /**
   * Update user avatar URL.
   * @throws {UserNotFoundError} If user not found
   */
  async updateAvatarUrl(userId: number, avatarUrl: string): Promise<void> {
    const user = await this.userRepo.getUserById(userId)

    if (!user) {
      throw new UserNotFoundError(userId)
    }

    await this.userRepo.updateUser(userId, { avatarUrl })
  }

  /**
   * Get user by ID.
   */
  async getUserById(userId: number) {
    return await this.userRepo.getUserById(userId)
  }
}




