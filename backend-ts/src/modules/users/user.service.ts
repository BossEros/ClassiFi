import { inject, injectable } from "tsyringe"
import { UserRepository } from "@/modules/users/user.repository.js"
import { SubmissionRepository } from "@/modules/submissions/submission.repository.js"
import { StorageService } from "@/services/storage.service.js"
import { SupabaseAuthAdapter } from "@/services/supabase-auth.adapter.js"
import {
  UserNotFoundError,
  TeacherSelfDeletionNotAllowedError,
} from "@/shared/errors.js"
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
    @inject(DI_TOKENS.adapters.supabaseAuth)
    private authAdapter: SupabaseAuthAdapter,
  ) {}

  /**
   * Delete a user account.
   * Cleans up storage files, removes user from local database and Supabase Auth.
   * @throws {UserNotFoundError} If user not found
   */
  async deleteAccount(userId: number): Promise<void> {
    // STEP 1: Load the user record and verify they exist
    const user = await this.userRepo.getUserById(userId)

    if (!user) {
      throw new UserNotFoundError(userId)
    }

    // STEP 2: Delete the avatar from storage (best-effort)
    if (user.avatarUrl) {
      await this.storageService.deleteAvatar(user.avatarUrl)
    }

    // STEP 3: Delete all submission files from storage before the database cascade removes the records
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

    // STEP 4: Delete the user from the local database (cascades to enrollments and submissions)
    const deleted = await this.userRepo.deleteUser(userId)

    if (!deleted) {
      throw new Error("Failed to delete user from database")
    }

    // STEP 5: Delete the user from Supabase Auth to revoke all login access
    if (user.supabaseUserId) {
      await this.authAdapter.deleteUser(user.supabaseUserId)
    }
  }

  /**
   * Delete the current user's own account.
   * Teacher self-deletion is blocked because class ownership must be reassigned first.
   *
   * @throws {UserNotFoundError} If user not found
   * @throws {TeacherSelfDeletionNotAllowedError} If the current user is a teacher
   */
  async deleteOwnAccount(userId: number): Promise<void> {
    const user = await this.userRepo.getUserById(userId)

    if (!user) {
      throw new UserNotFoundError(userId)
    }

    if (user.role === "teacher") {
      throw new TeacherSelfDeletionNotAllowedError()
    }

    await this.deleteAccount(userId)
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

  /**
   * Update user notification preferences.
   * @throws {UserNotFoundError} If user not found
   */
  async updateNotificationPreferences(
    userId: number,
    emailNotificationsEnabled: boolean,
    inAppNotificationsEnabled: boolean,
  ): Promise<{
    emailNotificationsEnabled: boolean
    inAppNotificationsEnabled: boolean
  }> {
    const user = await this.userRepo.getUserById(userId)

    if (!user) {
      throw new UserNotFoundError(userId)
    }

    await this.userRepo.updateUser(userId, {
      emailNotificationsEnabled,
      inAppNotificationsEnabled,
    })

    return { emailNotificationsEnabled, inAppNotificationsEnabled }
  }
}
